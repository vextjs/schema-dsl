/**
 * schemoio - 现代风格的Schema定义库
 * 提供更符合现代JavaScript风格的Schema定义方式
 */

// 导入基础类型
const { processSchema } = require('./dsl');

// ===== 1. 标签对象风格 =====
// 使用ES6+的标签对象和计算属性名，更简洁直观
const t = {
  // 基本类型
  string: (min, max) => ({ type: 'string', min, max }),
  number: (min, max) => ({ type: 'number', min, max }),
  boolean: () => ({ type: 'boolean' }),
  date: () => ({ type: 'date' }),

  // 复合类型
  array: (items) => ({ type: 'array', items }),
  object: (properties) => ({ type: 'object', properties }),

  // 修饰符 - 使用Symbol作为唯一键
  required: Symbol('required'),
  optional: Symbol('optional'),

  // 辅助方法
  schema: (obj) => processSchema(obj)
};

// 添加Proxy处理，支持t.string.required(3, 32)语法
const handler = {
  get(target, prop) {
    if (prop === 'required' || prop === 'optional') {
      return (...args) => {
        const result = target(...args);
        result.required = prop === 'required';
        return result;
      };
    }
    return target[prop];
  }
};

// 为每个类型创建Proxy
Object.keys(t).forEach(key => {
  if (typeof t[key] === 'function') {
    t[key] = new Proxy(t[key], handler);
  }
});

// ===== 2. 函数式管道风格 =====
// 使用函数组合和管道操作，更函数式的风格
const pipe = (...fns) => x => fns.reduce((v, f) => f(v), x);

const f = {
  // 基本类型构造器
  string: () => ({ type: 'string' }),
  number: () => ({ type: 'number' }),
  boolean: () => ({ type: 'boolean' }),
  date: () => ({ type: 'date' }),
  array: () => ({ type: 'array' }),
  object: (properties) => ({ type: 'object', properties }),

  // 修饰符
  required: (schema) => ({ ...schema, required: true }),
  optional: (schema) => ({ ...schema, required: false }),
  min: (value) => (schema) => ({ ...schema, min: value }),
  max: (value) => (schema) => ({ ...schema, max: value }),
  of: (itemSchema) => (schema) => ({ ...schema, items: itemSchema }),

  // 辅助方法
  schema: (obj) => processSchema(obj)
};

// ===== 3. 对象解构风格 =====
// 使用ES6+的对象解构和简写语法，更简洁
const schema = (def) => {
  // 处理对象定义
  const process = (obj) => {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        if ('type' in value) {
          // 已经是schema对象
          result[key] = value;
        } else if ('$example' in value) {
          // 元数据对象
          const exampleType = typeof value.$example;
          let schemaObj = {};

          // 根据示例值类型设置基本类型
          if (exampleType === 'string') {
            schemaObj = processStringValue(value.$example);
          } else if (exampleType === 'number') {
            schemaObj = { type: 'number' };
          } else if (exampleType === 'boolean') {
            schemaObj = { type: 'boolean' };
          } else if (Array.isArray(value.$example)) {
            schemaObj = { 
              type: 'array', 
              items: value.$example.length > 0 ? inferType(value.$example[0]) : { type: 'any' } 
            };
          } else if (value.$example instanceof RegExp) {
            schemaObj = { type: 'string', pattern: value.$example };
          } else if (exampleType === 'object' && value.$example !== null) {
            schemaObj = { type: 'object', properties: process(value.$example) };
          } else {
            schemaObj = { type: 'any' };
          }

          // 处理元数据属性
          if (value.$required) schemaObj.required = true;
          if (value.$min !== undefined) schemaObj.min = value.$min;
          if (value.$max !== undefined) schemaObj.max = value.$max;
          if (value.$default !== undefined) schemaObj.default = value.$default;
          if (value.$pattern) schemaObj.pattern = value.$pattern;

          result[key] = schemaObj;
        } else {
          // 嵌套对象
          result[key] = { type: 'object', properties: process(value) };
        }
      } else if (Array.isArray(value)) {
        // 数组类型
        if (value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
          // 范围约束 [min, max]
          result[key] = { type: 'number', min: value[0], max: value[1] };
        } else if (value.length > 0 && value.every(item => typeof item === 'string')) {
          // 检查是否所有项都是Email格式
          if (value.every(item => isEmail(item))) {
            result[key] = { 
              type: 'array', 
              items: { type: 'string', format: 'email' } 
            };
          } else {
            // 枚举值
            result[key] = { type: 'string', enum: value };
          }
        } else {
          // 普通数组
          result[key] = { 
            type: 'array', 
            items: value.length > 0 ? inferType(value[0]) : { type: 'any' } 
          };
        }
      } else if (typeof value === 'string') {
        // 处理字符串类型
        result[key] = processStringValue(value);
      } else if (typeof value === 'number') {
        // 数字类型简写
        result[key] = { type: 'number' };
      } else if (typeof value === 'boolean') {
        // 布尔类型简写
        result[key] = { type: 'boolean' };
      } else if (value instanceof RegExp) {
        // 正则表达式类型
        result[key] = { type: 'string', pattern: value.toString() };
      }
    }
    return result;
  };

  // 处理字符串值，支持特殊格式
  const processStringValue = (value) => {
    // 基本结果
    const result = { type: 'string' };

    // 检查是否是必填字段（前缀!）
    if (value.startsWith('!')) {
      result.required = true;
      value = value.substring(1);
    }

    // 检查是否有长度约束（格式：字符串(min-max)）
    const lengthMatch = value.match(/^.+\((\d+)-(\d+)\)$/);
    if (lengthMatch) {
      result.min = parseInt(lengthMatch[1]);
      result.max = parseInt(lengthMatch[2]);
      value = value.substring(0, value.indexOf('('));
    }

    // 检查是否是正则表达式模式（格式：pattern:/正则表达式/）
    if (value.startsWith('pattern:')) {
      const patternStr = value.substring(8);
      result.pattern = patternStr;
      return result;
    }

    // 检查是否有类型前缀（如email:、url:）
    if (value.includes(':')) {
      const [type, example] = value.split(':');
      if (type === 'email') {
        result.format = 'email';
      } else if (type === 'url') {
        result.format = 'url';
      } else if (type === 'date') {
        result.type = 'date';
      }
    } else {
      // 自动类型推断
      if (isEmail(value)) {
        result.format = 'email';
      } else if (isUrl(value)) {
        result.format = 'url';
      } else if (isDate(value)) {
        result.type = 'date';
      }
    }

    return result;
  };

  // 推断值的类型
  const inferType = (value) => {
    if (typeof value === 'string') {
      return processStringValue(value);
    } else if (typeof value === 'number') {
      return { type: 'number' };
    } else if (typeof value === 'boolean') {
      return { type: 'boolean' };
    } else if (Array.isArray(value)) {
      return { 
        type: 'array', 
        items: value.length > 0 ? inferType(value[0]) : { type: 'any' } 
      };
    } else if (typeof value === 'object' && value !== null) {
      if (value instanceof RegExp) {
        return { type: 'string', pattern: value };
      }
      return { type: 'object', properties: process(value) };
    }
    return { type: 'any' };
  };

  // 简单的Email格式检查
  const isEmail = (value) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  // 简单的URL格式检查
  const isUrl = (value) => {
    return /^https?:\/\/\S+$/.test(value);
  };

  // 简单的日期格式检查
  const isDate = (value) => {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
  };

  return process(def);
};

// ===== 4. 链式API风格（改进版）=====
// 使用更现代的链式API设计
const createType = (type) => {
  const chain = {
    _schema: { type },

    // 基本约束
    min(value) {
      this._schema.min = value;
      return this;
    },

    max(value) {
      this._schema.max = value;
      return this;
    },

    // 数组特有方法
    of(itemType) {
      if (this._schema.type === 'array') {
        this._schema.items = itemType._schema || itemType;
      }
      return this;
    },

    // 对象特有方法
    props(properties) {
      if (this._schema.type === 'object') {
        this._schema.properties = properties;
      }
      return this;
    },

    // 终结方法
    required() {
      this._schema.required = true;
      return this._schema;
    },

    optional() {
      this._schema.required = false;
      return this._schema;
    },

    // 默认返回可选
    end() {
      return this._schema;
    }
  };

  // 添加范围简写
  return new Proxy(chain, {
    get(target, prop) {
      // 处理范围简写，如 .range(3, 32)
      if (prop === 'range') {
        return (min, max) => {
          target._schema.min = min;
          target._schema.max = max;
          return target;
        };
      }

      return target[prop];
    }
  });
};

const c = {
  string: createType('string'),
  number: createType('number'),
  boolean: createType('boolean'),
  date: createType('date'),
  array: createType('array'),
  object: createType('object'),

  // 辅助方法
  schema: (obj) => processSchema(obj)
};

// 导出所有现代风格
module.exports = {
  // 标签对象风格
  t,

  // 函数式管道风格
  f,
  pipe,

  // 对象解构风格
  schema,

  // 链式API风格（改进版）
  c
};
