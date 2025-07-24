/**
 * SchemoIO - 简洁优雅的Schema定义库
 * 支持多种风格的Schema定义，并可转换为各种数据库格式
 */

const { DSL, s, $, _, processSchema } = require('./lib/dsl');

// 数据验证函数
function validate(schema, data) {
  // 这里只是一个简单的实现，实际应用中需要更复杂的验证逻辑
  const errors = [];
  const isValid = validateObject(schema, data, '', errors);

  return {
    isValid,
    errors
  };
}

// 递归验证对象
function validateObject(schema, data, path, errors) {
  let isValid = true;

  // 检查每个字段
  for (const [key, schemaValue] of Object.entries(schema)) {
    const currentPath = path ? `${path}.${key}` : key;
    const dataValue = data[key];

    // 检查必填字段
    if (schemaValue.required && (dataValue === undefined || dataValue === null)) {
      errors.push({
        path: currentPath,
        message: `字段是必填的`
      });
      isValid = false;
      continue;
    }

    // 如果值不存在且不是必填，则跳过
    if (dataValue === undefined || dataValue === null) {
      continue;
    }

    // 根据类型验证
    switch (schemaValue.type) {
      case 'string':
        if (typeof dataValue !== 'string') {
          errors.push({
            path: currentPath,
            message: `应该是字符串类型，但得到了 ${typeof dataValue}`
          });
          isValid = false;
        } else {
          // 验证长度
          if (schemaValue.min !== undefined && dataValue.length < schemaValue.min) {
            errors.push({
              path: currentPath,
              message: `长度应该至少为 ${schemaValue.min}，但得到了 ${dataValue.length}`
            });
            isValid = false;
          }
          if (schemaValue.max !== undefined && dataValue.length > schemaValue.max) {
            errors.push({
              path: currentPath,
              message: `长度应该最多为 ${schemaValue.max}，但得到了 ${dataValue.length}`
            });
            isValid = false;
          }
        }
        break;

      case 'number':
        if (typeof dataValue !== 'number') {
          errors.push({
            path: currentPath,
            message: `应该是数字类型，但得到了 ${typeof dataValue}`
          });
          isValid = false;
        } else {
          // 验证范围
          if (schemaValue.min !== undefined && dataValue < schemaValue.min) {
            errors.push({
              path: currentPath,
              message: `值应该至少为 ${schemaValue.min}，但得到了 ${dataValue}`
            });
            isValid = false;
          }
          if (schemaValue.max !== undefined && dataValue > schemaValue.max) {
            errors.push({
              path: currentPath,
              message: `值应该最多为 ${schemaValue.max}，但得到了 ${dataValue}`
            });
            isValid = false;
          }
        }
        break;

      case 'boolean':
        if (typeof dataValue !== 'boolean') {
          errors.push({
            path: currentPath,
            message: `应该是布尔类型，但得到了 ${typeof dataValue}`
          });
          isValid = false;
        }
        break;

      case 'date':
        if (!(dataValue instanceof Date) && !(typeof dataValue === 'string' && !isNaN(Date.parse(dataValue)))) {
          errors.push({
            path: currentPath,
            message: `应该是日期类型，但得到了 ${typeof dataValue}`
          });
          isValid = false;
        }
        break;

      case 'array':
        if (!Array.isArray(dataValue)) {
          errors.push({
            path: currentPath,
            message: `应该是数组类型，但得到了 ${typeof dataValue}`
          });
          isValid = false;
        } else if (schemaValue.items) {
          // 验证数组中的每个元素
          for (let i = 0; i < dataValue.length; i++) {
            const itemPath = `${currentPath}[${i}]`;
            const itemValid = validateValue(schemaValue.items, dataValue[i], itemPath, errors);
            isValid = isValid && itemValid;
          }
        }
        break;

      case 'object':
        if (typeof dataValue !== 'object' || dataValue === null || Array.isArray(dataValue)) {
          errors.push({
            path: currentPath,
            message: `应该是对象类型，但得到了 ${typeof dataValue}`
          });
          isValid = false;
        } else if (schemaValue.properties) {
          // 递归验证嵌套对象
          const objectValid = validateObject(schemaValue.properties, dataValue, currentPath, errors);
          isValid = isValid && objectValid;
        }
        break;
    }
  }

  return isValid;
}

// 验证单个值
function validateValue(schema, value, path, errors) {
  // 创建一个临时对象来复用validateObject
  const tempSchema = { value: schema };
  const tempData = { value };
  return validateObject(tempSchema, tempData, '', errors);
}

// 转换为MongoDB Schema
function toMongoDB(schema) {
  const result = {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: [],
        properties: {}
      }
    },
    indexes: []
  };

  // 处理每个字段
  for (const [key, value] of Object.entries(schema)) {
    // 如果是必填字段，添加到required数组
    if (value.required) {
      result.validator.$jsonSchema.required.push(key);
    }

    // 根据类型转换
    const property = {};

    switch (value.type) {
      case 'string':
        property.bsonType = 'string';
        if (value.min !== undefined) property.minLength = value.min;
        if (value.max !== undefined) property.maxLength = value.max;
        break;

      case 'number':
        property.bsonType = 'number';
        if (value.min !== undefined) property.minimum = value.min;
        if (value.max !== undefined) property.maximum = value.max;
        break;

      case 'boolean':
        property.bsonType = 'bool';
        break;

      case 'date':
        property.bsonType = 'date';
        break;

      case 'array':
        property.bsonType = 'array';
        if (value.items) {
          property.items = toMongoDBProperty(value.items);
        }
        break;

      case 'object':
        property.bsonType = 'object';
        if (value.properties) {
          property.properties = {};
          for (const [propKey, propValue] of Object.entries(value.properties)) {
            property.properties[propKey] = toMongoDBProperty(propValue);
          }
        }
        break;
    }

    result.validator.$jsonSchema.properties[key] = property;
  }

  return result;
}

// 辅助函数：转换单个属性为MongoDB格式
function toMongoDBProperty(value) {
  const property = {};

  switch (value.type) {
    case 'string':
      property.bsonType = 'string';
      if (value.min !== undefined) property.minLength = value.min;
      if (value.max !== undefined) property.maxLength = value.max;
      break;

    case 'number':
      property.bsonType = 'number';
      if (value.min !== undefined) property.minimum = value.min;
      if (value.max !== undefined) property.maximum = value.max;
      break;

    case 'boolean':
      property.bsonType = 'bool';
      break;

    case 'date':
      property.bsonType = 'date';
      break;

    case 'array':
      property.bsonType = 'array';
      if (value.items) {
        property.items = toMongoDBProperty(value.items);
      }
      break;

    case 'object':
      property.bsonType = 'object';
      if (value.properties) {
        property.properties = {};
        for (const [propKey, propValue] of Object.entries(value.properties)) {
          property.properties[propKey] = toMongoDBProperty(propValue);
        }
      }
      break;
  }

  return property;
}

// 转换为MySQL Schema
function toMySQL(schema) {
  let sql = '';
  const columns = [];

  // 处理每个字段
  for (const [key, value] of Object.entries(schema)) {
    let column = `\`${key}\` `;

    // 根据类型转换
    switch (value.type) {
      case 'string':
        const maxLength = value.max || 255;
        column += `VARCHAR(${maxLength})`;
        break;

      case 'number':
        if (Number.isInteger(value.min) && Number.isInteger(value.max)) {
          column += 'INT';
        } else {
          column += 'FLOAT';
        }
        break;

      case 'boolean':
        column += 'BOOLEAN';
        break;

      case 'date':
        column += 'DATETIME';
        break;

      case 'array':
      case 'object':
        column += 'JSON';
        break;
    }

    // 添加约束
    if (value.required) {
      column += ' NOT NULL';
    }

    // 添加范围约束
    if (value.type === 'number' && (value.min !== undefined || value.max !== undefined)) {
      const checks = [];
      if (value.min !== undefined) {
        checks.push(`\`${key}\` >= ${value.min}`);
      }
      if (value.max !== undefined) {
        checks.push(`\`${key}\` <= ${value.max}`);
      }
      if (checks.length > 0) {
        column += ` CHECK (${checks.join(' AND ')})`;
      }
    }

    columns.push(column);
  }

  // 生成CREATE TABLE语句
  sql = `CREATE TABLE \`table_name\` (\n  ${columns.join(',\n  ')}\n);`;

  return sql;
}

// 转换为PostgreSQL Schema
function toPostgreSQL(schema) {
  let sql = '';
  const columns = [];

  // 处理每个字段
  for (const [key, value] of Object.entries(schema)) {
    let column = `"${key}" `;

    // 根据类型转换
    switch (value.type) {
      case 'string':
        const maxLength = value.max || 255;
        column += `VARCHAR(${maxLength})`;
        break;

      case 'number':
        if (Number.isInteger(value.min) && Number.isInteger(value.max)) {
          column += 'INTEGER';
        } else {
          column += 'FLOAT';
        }
        break;

      case 'boolean':
        column += 'BOOLEAN';
        break;

      case 'date':
        column += 'TIMESTAMP';
        break;

      case 'array':
        if (value.items && value.items.type === 'string') {
          column += 'TEXT[]';
        } else {
          column += 'JSONB';
        }
        break;

      case 'object':
        column += 'JSONB';
        break;
    }

    // 添加约束
    if (value.required) {
      column += ' NOT NULL';
    }

    // 添加范围约束
    if (value.type === 'number' && (value.min !== undefined || value.max !== undefined)) {
      const checks = [];
      if (value.min !== undefined) {
        checks.push(`"${key}" >= ${value.min}`);
      }
      if (value.max !== undefined) {
        checks.push(`"${key}" <= ${value.max}`);
      }
      if (checks.length > 0) {
        column += ` CHECK (${checks.join(' AND ')})`;
      }
    }

    columns.push(column);
  }

  // 生成CREATE TABLE语句
  sql = `CREATE TABLE "table_name" (\n  ${columns.join(',\n  ')}\n);`;

  return sql;
}

// 导出所有功能
module.exports = {
  // 传统DSL风格
  DSL,
  s,
  $,
  _,

  // Schema处理
  processSchema,

  // 验证
  validate,

  // 数据库转换
  toMongoDB,
  toMySQL,
  toPostgreSQL
};

// 导出现代风格API
module.exports.modern = require('./lib/modern');
