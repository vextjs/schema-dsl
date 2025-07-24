/**
 * schemoio - 简洁优雅的Schema定义库
 * 提供多种风格的Schema定义方式
 */

// 解析表达式
function parseExpression(expression) {
  // 基本类型正则表达式
  const typeRegex = /^(string|number|boolean|date|object|array)(?:\(([^)]*)\))?(!)?/;
  const arrayTypeRegex = /^array<(.+)>(!)?/;
  
  // 解析数组类型
  if (arrayTypeRegex.test(expression)) {
    const [, itemType, required] = expression.match(arrayTypeRegex);
    return {
      type: 'array',
      required: !!required,
      items: parseExpression(itemType)
    };
  }
  
  // 解析基本类型
  if (typeRegex.test(expression)) {
    const [, type, params, required] = expression.match(typeRegex);
    const result = {
      type,
      required: !!required
    };
    
    // 解析参数
    if (params) {
      const paramArray = params.split(',').map(p => p.trim());
      
      switch (type) {
        case 'string':
          if (paramArray.length >= 1) result.min = parseInt(paramArray[0]);
          if (paramArray.length >= 2) result.max = parseInt(paramArray[1]);
          break;
        case 'number':
          if (paramArray.length >= 1) result.min = parseFloat(paramArray[0]);
          if (paramArray.length >= 2) result.max = parseFloat(paramArray[1]);
          break;
      }
    }
    
    return result;
  }
  
  throw new Error(`无法解析表达式: ${expression}`);
}

// 解析超简洁表达式
function parseShortExpression(expr) {
  // s:3-32! => string, min:3, max:32, required:true
  // n:18-120 => number, min:18, max:120
  // a<s:1-10> => array of strings with length 1-10
  // b! => required boolean
  // d => date
  // o{...} => object with nested schema
  
  const typeMap = {
    s: 'string',
    n: 'number',
    b: 'boolean',
    d: 'date',
    o: 'object',
    a: 'array'
  };
  
  const result = {};
  
  // 检查是否是数组
  if (expr.startsWith('a<') && expr.includes('>')) {
    const itemTypeExpr = expr.substring(2, expr.lastIndexOf('>'));
    result.type = 'array';
    result.items = parseShortExpression(itemTypeExpr);
    result.required = expr.endsWith('!');
    return result;
  }
  
  // 解析基本类型
  const typeChar = expr.charAt(0);
  if (typeMap[typeChar]) {
    result.type = typeMap[typeChar];
    result.required = expr.endsWith('!');
    
    // 解析范围
    const rangeMatch = expr.match(/:(\d+)-(\d+)/);
    if (rangeMatch) {
      result.min = parseInt(rangeMatch[1]);
      result.max = parseInt(rangeMatch[2]);
    }
    
    return result;
  }
  
  throw new Error(`无法解析简洁表达式: ${expr}`);
}

// 类型定义
const types = {
  string: { type: 'string' },
  number: { type: 'number' },
  boolean: { type: 'boolean' },
  date: { type: 'date' },
  object: { type: 'object' },
  array: { type: 'array' }
};

// 创建类型处理器
function createTypeHandler(type) {
  const handler = {
    __type: type,
    __constraints: {},
    
    // 添加约束
    min(value) {
      this.__constraints.min = value;
      return this;
    },
    
    max(value) {
      this.__constraints.max = value;
      return this;
    },
    
    // 获取结果
    get required() {
      this.__constraints.required = true;
      return this.toJSON();
    },
    
    // 转换为JSON
    toJSON() {
      return {
        type: this.__type,
        ...this.__constraints
      };
    }
  };
  
  // 添加数组索引访问语法糖
  return new Proxy(handler, {
    get(target, prop) {
      // 处理 $.string[3-32] 语法
      if (prop.toString().includes('-')) {
        const [min, max] = prop.toString().split('-').map(Number);
        target.min(min);
        target.max(max);
        return target;
      }
      
      // 处理 $.string! 语法
      if (prop === '!') {
        target.__constraints.required = true;
        return target.toJSON();
      }
      
      return target[prop];
    }
  });
}

// 方法1: 使用模板字符串标签函数
function s(strings, ...values) {
  // 这是一个模板字符串标签函数
  // 例如: s`string(3,32)!` 或 s`number(18,120)`
  const expression = strings.join('');
  return parseExpression(expression);
}

// 方法2: 使用Proxy对象创建超简洁API
const $ = new Proxy({}, {
  get(target, prop) {
    // 例如: $.string.min(3).max(32).required
    // 或简写为: $.string[3-32]!
    if (prop in types) {
      return createTypeHandler(prop);
    }
    return undefined;
  }
});

// 方法3: 超简洁符号系统
function _(expr) {
  if (typeof expr === 'string') {
    return parseShortExpression(expr);
  }
  return expr;
}

// 添加辅助方法
_.string = (min, max, required = false) => {
  const result = { type: 'string' };
  if (min !== undefined) result.min = min;
  if (max !== undefined) result.max = max;
  if (required) result.required = true;
  return result;
};

_.number = (min, max, required = false) => {
  const result = { type: 'number' };
  if (min !== undefined) result.min = min;
  if (max !== undefined) result.max = max;
  if (required) result.required = true;
  return result;
};

_.boolean = (required = false) => {
  return { type: 'boolean', required };
};

_.date = (required = false) => {
  return { type: 'date', required };
};

_.array = (items, required = false) => {
  return { type: 'array', items, required };
};

_.object = (properties, required = false) => {
  return { type: 'object', properties, required };
};

// 处理完整schema对象
function processSchema(schema) {
  const result = {};
  
  for (const [key, value] of Object.entries(schema)) {
    if (value && typeof value === 'object' && ('type' in value || '_dslExpression' in value)) {
      // 已经是处理过的schema对象或DSL对象
      result[key] = value._dslExpression ? parseExpression(value._dslExpression) : value;
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // 递归处理嵌套对象
      result[key] = processSchema(value);
    } else {
      // 保留其他值
      result[key] = value;
    }
  }
  
  return result;
}

// 导出多种风格的API
module.exports = {
  // 原始DSL函数，向后兼容
  DSL: function(expression) {
    return {
      _dslExpression: expression,
      _parsedSchema: parseExpression(expression)
    };
  },
  
  // 模板字符串风格
  s,
  
  // Proxy对象风格
  $,
  
  // 超简洁符号风格
  _,
  
  // 处理完整schema对象
  processSchema
};