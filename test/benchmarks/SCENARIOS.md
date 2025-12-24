# 性能基准测试场景定义

> **文件**: test/benchmarks/scenarios.js  
> **目标**: 定义具体的性能测试场景和目标值  

---

## 测试场景分类

### 1. 简单类型验证（高性能场景）

#### 1.1 单个字符串验证
```javascript
{
  name: 'simple-string-validation',
  description: '验证单个字符串（min/max约束）',
  schema: schema.string().min(3).max(32),
  data: 'test_user_123',
  target: 500000, // ops/sec
  category: 'simple'
}
```

#### 1.2 单个数字验证
```javascript
{
  name: 'simple-number-validation',
  description: '验证单个数字（范围约束）',
  schema: schema.number().min(0).max(100),
  data: 42,
  target: 600000, // ops/sec
  category: 'simple'
}
```

#### 1.3 布尔值验证
```javascript
{
  name: 'simple-boolean-validation',
  description: '验证布尔值',
  schema: schema.boolean(),
  data: true,
  target: 800000, // ops/sec
  category: 'simple'
}
```

---

### 2. 复杂类型验证（中性能场景）

#### 2.1 扁平对象验证（5个字段）
```javascript
{
  name: 'flat-object-5-fields',
  description: '验证扁平对象（5个字段，无嵌套）',
  schema: schema.object({
    id: schema.string().required(),
    username: schema.string().min(3).max(32).required(),
    email: schema.string().email().required(),
    age: schema.number().min(18).max(120),
    isActive: schema.boolean().default(true)
  }),
  data: {
    id: 'user_123',
    username: 'john_doe',
    email: 'john@example.com',
    age: 25,
    isActive: true
  },
  target: 100000, // ops/sec
  category: 'complex'
}
```

#### 2.2 扁平对象验证（10个字段）
```javascript
{
  name: 'flat-object-10-fields',
  description: '验证扁平对象（10个字段）',
  schema: schema.object({
    id: schema.string().required(),
    username: schema.string().min(3).max(32).required(),
    email: schema.string().email().required(),
    firstName: schema.string().required(),
    lastName: schema.string().required(),
    age: schema.number().min(18).max(120),
    phone: schema.string().pattern(/^\d{11}$/),
    country: schema.string().length(2),
    isActive: schema.boolean().default(true),
    createdAt: schema.date()
  }),
  data: { /* 10个字段的数据 */ },
  target: 50000, // ops/sec
  category: 'complex'
}
```

#### 2.3 正则表达式验证
```javascript
{
  name: 'regex-validation',
  description: '正则表达式验证（email格式）',
  schema: schema.string().email(),
  data: 'user@example.com',
  target: 200000, // ops/sec
  category: 'complex'
}
```

---

### 3. 嵌套结构验证（低性能场景）

#### 3.1 两层嵌套对象
```javascript
{
  name: 'nested-object-2-levels',
  description: '验证2层嵌套对象',
  schema: schema.object({
    user: schema.object({
      id: schema.string().required(),
      profile: schema.object({
        firstName: schema.string().required(),
        lastName: schema.string().required(),
        age: schema.number()
      })
    })
  }),
  data: {
    user: {
      id: 'user_123',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        age: 25
      }
    }
  },
  target: 50000, // ops/sec
  category: 'nested'
}
```

#### 3.2 三层嵌套对象
```javascript
{
  name: 'nested-object-3-levels',
  description: '验证3层嵌套对象',
  schema: schema.object({
    company: schema.object({
      department: schema.object({
        employee: schema.object({
          id: schema.string().required(),
          name: schema.string().required(),
          position: schema.string()
        })
      })
    })
  }),
  data: { /* 3层嵌套数据 */ },
  target: 30000, // ops/sec
  category: 'nested'
}
```

#### 3.3 五层嵌套对象（极限测试）
```javascript
{
  name: 'nested-object-5-levels',
  description: '验证5层嵌套对象（极限场景）',
  schema: { /* 5层嵌套Schema */ },
  data: { /* 5层嵌套数据 */ },
  target: 10000, // ops/sec
  category: 'nested'
}
```

---

### 4. 数组验证（批量场景）

#### 4.1 小数组（10个元素）
```javascript
{
  name: 'array-10-items',
  description: '验证10个元素的数组',
  schema: schema.array().items(schema.number().min(0).max(100)),
  data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  target: 50000, // ops/sec
  category: 'array'
}
```

#### 4.2 中数组（100个元素）
```javascript
{
  name: 'array-100-items',
  description: '验证100个元素的数组',
  schema: schema.array().items(schema.number()),
  data: Array(100).fill(0).map((_, i) => i),
  target: 10000, // ops/sec
  category: 'array'
}
```

#### 4.3 大数组（1000个元素）
```javascript
{
  name: 'array-1000-items',
  description: '验证1000个元素的数组',
  schema: schema.array().items(schema.number()),
  data: Array(1000).fill(0).map((_, i) => i),
  target: 1000, // ops/sec
  category: 'array'
}
```

#### 4.4 对象数组（100个对象）
```javascript
{
  name: 'array-100-objects',
  description: '验证100个对象的数组',
  schema: schema.array().items(
    schema.object({
      id: schema.string().required(),
      name: schema.string().required(),
      value: schema.number()
    })
  ),
  data: Array(100).fill(0).map((_, i) => ({
    id: `item_${i}`,
    name: `Item ${i}`,
    value: i
  })),
  target: 5000, // ops/sec
  category: 'array'
}
```

---

### 5. 自定义验证（灵活场景）

#### 5.1 同步自定义验证
```javascript
{
  name: 'custom-sync-validation',
  description: '同步自定义验证函数',
  schema: schema.string().custom((value) => {
    return value.includes('test');
  }),
  data: 'test_value',
  target: 100000, // ops/sec
  category: 'custom'
}
```

#### 5.2 异步自定义验证
```javascript
{
  name: 'custom-async-validation',
  description: '异步自定义验证函数',
  schema: schema.string().custom(async (value) => {
    await new Promise(resolve => setTimeout(resolve, 1));
    return value.length > 3;
  }),
  data: 'test_value',
  target: 500, // ops/sec（异步操作较慢）
  category: 'custom'
}
```

---

### 6. Schema编译（初始化场景）

#### 6.1 简单Schema编译
```javascript
{
  name: 'schema-compilation-simple',
  description: '编译简单Schema',
  operation: () => {
    schema.string().min(3).max(32).build();
  },
  target: 10000, // ops/sec
  category: 'compilation',
  metric: 'time', // 测量时间而非吞吐量
  maxTime: 0.1 // 最大0.1ms
}
```

#### 6.2 复杂Schema编译
```javascript
{
  name: 'schema-compilation-complex',
  description: '编译复杂Schema（10个字段）',
  operation: () => {
    schema.object({
      // 10个字段定义
    }).build();
  },
  target: 5000, // ops/sec
  category: 'compilation',
  metric: 'time',
  maxTime: 0.2 // 最大0.2ms
}
```

---

### 7. 缓存性能（优化场景）

#### 7.1 缓存命中
```javascript
{
  name: 'cache-hit',
  description: '缓存命中情况下的验证性能',
  setup: () => {
    const validator = createValidator({ cache: true });
    const schema = schema.string().min(3).max(32);
    // 预热缓存
    validator.validate(schema, 'test');
  },
  operation: () => {
    validator.validate(schema, 'test');
  },
  target: 1000000, // ops/sec（应该比非缓存快10倍）
  category: 'cache'
}
```

#### 7.2 缓存未命中
```javascript
{
  name: 'cache-miss',
  description: '缓存未命中情况下的验证性能',
  operation: () => {
    const validator = createValidator({ cache: true });
    const schema = schema.string().min(3).max(32);
    validator.validate(schema, `test_${Math.random()}`);
  },
  target: 500000, // ops/sec
  category: 'cache'
}
```

---

### 8. 错误场景（失败路径）

#### 8.1 单个错误
```javascript
{
  name: 'single-error',
  description: '验证失败，返回1个错误',
  schema: schema.string().min(10),
  data: 'short',
  target: 400000, // ops/sec
  category: 'error',
  expectError: true
}
```

#### 8.2 多个错误（abortEarly=false）
```javascript
{
  name: 'multiple-errors',
  description: '验证失败，返回多个错误',
  schema: schema.object({
    username: schema.string().min(10).required(),
    email: schema.string().email().required(),
    age: schema.number().min(18).required()
  }),
  data: {
    username: 'ab',    // 错误1: 太短
    email: 'invalid',  // 错误2: 格式错误
    age: 10            // 错误3: 小于18
  },
  options: { abortEarly: false },
  target: 50000, // ops/sec
  category: 'error',
  expectError: true,
  expectedErrorCount: 3
}
```

---

### 9. 真实场景（实际应用）

#### 9.1 用户注册表单
```javascript
{
  name: 'real-user-registration',
  description: '真实场景：用户注册表单验证',
  schema: schema.object({
    username: schema.string().min(3).max(32).pattern(/^[a-zA-Z0-9_]+$/).required(),
    email: schema.string().email().required(),
    password: schema.string().min(8).custom((value) => {
      return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value);
    }).required(),
    confirmPassword: schema.string().required(),
    age: schema.number().min(18).max(120).optional(),
    terms: schema.boolean().valid(true).required()
  }),
  data: {
    username: 'john_doe',
    email: 'john@example.com',
    password: 'SecurePass123',
    confirmPassword: 'SecurePass123',
    age: 25,
    terms: true
  },
  target: 20000, // ops/sec
  category: 'real-world'
}
```

#### 9.2 API请求验证
```javascript
{
  name: 'real-api-request',
  description: '真实场景：API请求参数验证',
  schema: schema.object({
    method: schema.string().valid('GET', 'POST', 'PUT', 'DELETE').required(),
    path: schema.string().pattern(/^\//).required(),
    query: schema.object().optional(),
    body: schema.any().optional(),
    headers: schema.object({
      'content-type': schema.string().required(),
      'authorization': schema.string().optional()
    })
  }),
  data: {
    method: 'POST',
    path: '/api/users',
    body: { username: 'john' },
    headers: {
      'content-type': 'application/json',
      'authorization': 'Bearer token123'
    }
  },
  target: 30000, // ops/sec
  category: 'real-world'
}
```

---

## 性能目标总结

| 类别 | 场景数 | 最低目标 | 平均目标 | 最高目标 |
|------|--------|---------|---------|---------|
| 简单类型 | 3 | 500k ops/s | 633k ops/s | 800k ops/s |
| 复杂类型 | 3 | 50k ops/s | 117k ops/s | 200k ops/s |
| 嵌套结构 | 3 | 10k ops/s | 30k ops/s | 50k ops/s |
| 数组验证 | 4 | 1k ops/s | 16k ops/s | 50k ops/s |
| 自定义验证 | 2 | 500 ops/s | 50k ops/s | 100k ops/s |
| Schema编译 | 2 | 5k ops/s | 7.5k ops/s | 10k ops/s |
| 缓存优化 | 2 | 500k ops/s | 750k ops/s | 1M ops/s |
| 错误场景 | 2 | 50k ops/s | 225k ops/s | 400k ops/s |
| 真实场景 | 2 | 20k ops/s | 25k ops/s | 30k ops/s |

---

## 测试执行计划

### 环境要求
- Node.js: v14/v16/v18/v20
- 内存: 至少2GB
- CPU: 至少2核

### 执行命令
```bash
# 运行所有基准测试
npm run benchmark

# 运行特定类别
npm run benchmark:simple
npm run benchmark:complex
npm run benchmark:nested
npm run benchmark:array
npm run benchmark:real-world

# 生成性能报告
npm run benchmark:report
```

### 报告格式
```
┌──────────────────────────────────────────────────────────┐
│ SchemaIO v2.0 性能基准测试报告                            │
├──────────────────────────────────────────────────────────┤
│ 测试环境: Node.js v18.0.0, Ubuntu 20.04                   │
│ 测试时间: 2025-12-24 10:00:00                             │
│ 总测试数: 26个场景                                        │
├──────────────────────────────────────────────────────────┤
│ 场景名称                    实际性能      目标     状态   │
│ simple-string-validation   523,456 ops/s  500k    ✅     │
│ simple-number-validation   612,789 ops/s  600k    ✅     │
│ flat-object-5-fields       102,345 ops/s  100k    ✅     │
│ nested-object-3-levels      28,901 ops/s   30k    ⚠️      │
│ ...                                                       │
├──────────────────────────────────────────────────────────┤
│ 总体通过率: 23/26 (88.5%)                                 │
│ 性能等级: A (优秀)                                        │
└──────────────────────────────────────────────────────────┘
```

---

## 性能回归检测

每次发布前必须运行性能测试，确保：
1. 所有场景达到目标性能（≥95%）
2. 相比上一版本无明显退化（<10%）
3. 关键场景性能提升（≥5%）

如果性能退化超过10%，需要：
1. 分析退化原因
2. 提供优化方案
3. 重新测试验证

