# 数字比较运算符 (v1.1.2+)

**版本**: v1.1.2+  
**适用类型**: `number`, `integer`

## 📋 快速概览

| 运算符 | 语法 | JSON Schema | 说明 | 示例 |
|-------|------|------------|------|------|
| `>` | `number:>0` | `{ exclusiveMinimum: 0 }` | 大于（不包括边界） | 正数 |
| `>=` | `number:>=18` | `{ minimum: 18 }` | 大于等于 | 年龄限制 |
| `<` | `number:<100` | `{ exclusiveMaximum: 100 }` | 小于（不包括边界） | 温度上限 |
| `<=` | `number:<=100` | `{ maximum: 100 }` | 小于等于 | 评分上限 |
| `=` | `number:=100` | `{ enum: [100] }` | 等于 | 固定值 |

---

## ✨ 特性

- ✅ 支持 5 种比较运算符
- ✅ 支持小数（如 `number:>0.5`）
- ✅ 支持负数（如 `number:>-10`）
- ✅ 支持必填标记（如 `number:>=18!`）
- ✅ 适用于 `number` 和 `integer` 类型
- ✅ 完全向后兼容原有范围语法

---

## 🚀 基础用法

### 大于 (>)

**语法**: `number:>value`

**JSON Schema**: `{ exclusiveMinimum: value }`

**说明**: 值必须大于指定值（不包括边界值本身）

```javascript
const { dsl, validate } = require('schema-dsl');

// 基础用法
const schema = dsl({ value: 'number:>0' });

validate(schema, { value: 1 });    // ✅ true
validate(schema, { value: 0.1 });  // ✅ true
validate(schema, { value: 0 });    // ❌ false (0 不满足 >0)
validate(schema, { value: -1 });   // ❌ false

// 支持小数
const schema2 = dsl({ value: 'number:>0.5' });
validate(schema2, { value: 0.6 }); // ✅ true
validate(schema2, { value: 0.5 }); // ❌ false (0.5 不满足 >0.5)

// 支持负数
const schema3 = dsl({ value: 'number:>-10' });
validate(schema3, { value: -9 });  // ✅ true
validate(schema3, { value: -10 }); // ❌ false

// 配合必填
const schema4 = dsl({ value: 'number:>0!' });
validate(schema4, { value: 1 });   // ✅ true
validate(schema4, {});             // ❌ false (必填)
```

---

### 大于等于 (>=)

**语法**: `number:>=value`

**JSON Schema**: `{ minimum: value }`

**说明**: 值必须大于等于指定值（包括边界值）

```javascript
// 基础用法
const schema = dsl({ age: 'number:>=18' });

validate(schema, { age: 18 });  // ✅ true (包括18)
validate(schema, { age: 19 });  // ✅ true
validate(schema, { age: 17 });  // ❌ false

// 实际应用：年龄验证
const schema2 = dsl({ age: 'number:>=18!' });

validate(schema2, { age: 20 }); // ✅ true
validate(schema2, { age: 17 }); // ❌ false
validate(schema2, {});          // ❌ false (必填)
```

---

### 小于 (<)

**语法**: `number:<value`

**JSON Schema**: `{ exclusiveMaximum: value }`

**说明**: 值必须小于指定值（不包括边界值）

```javascript
// 基础用法
const schema = dsl({ value: 'number:<100' });

validate(schema, { value: 99 });   // ✅ true
validate(schema, { value: 99.9 }); // ✅ true
validate(schema, { value: 100 });  // ❌ false (100 不满足 <100)
validate(schema, { value: 101 });  // ❌ false

// 实际应用：温度上限
const schema2 = dsl({ temperature: 'number:<100' });

validate(schema2, { temperature: 99.9 }); // ✅ true
validate(schema2, { temperature: 100 });  // ❌ false
```

---

### 小于等于 (<=)

**语法**: `number:<=value`

**JSON Schema**: `{ maximum: value }`

**说明**: 值必须小于等于指定值（包括边界值）

```javascript
// 基础用法
const schema = dsl({ score: 'number:<=100' });

validate(schema, { score: 100 }); // ✅ true (包括100)
validate(schema, { score: 99 });  // ✅ true
validate(schema, { score: 101 }); // ❌ false

// 实际应用：评分系统
const schema2 = dsl({ score: 'number:<=100!' });

validate(schema2, { score: 100 }); // ✅ true
validate(schema2, { score: 101 }); // ❌ false
```

---

### 等于 (=)

**语法**: `number:=value`

**JSON Schema**: `{ enum: [value] }`

**说明**: 值必须等于指定值

```javascript
// 基础用法
const schema = dsl({ level: 'number:=5' });

validate(schema, { level: 5 });  // ✅ true
validate(schema, { level: 4 });  // ❌ false
validate(schema, { level: 6 });  // ❌ false

// 支持小数精确匹配
const schema2 = dsl({ price: 'number:=99.99' });

validate(schema2, { price: 99.99 }); // ✅ true
validate(schema2, { price: 99.98 }); // ❌ false
validate(schema2, { price: 100 });   // ❌ false
```

---

## 📊 对比：比较运算符 vs 范围语法

| 需求 | 范围语法 | 比较运算符 | 推荐 |
|------|---------|-----------|------|
| 18 ≤ x ≤ 120 | `number:18-120` | `number:>=18` + `number:<=120` | 范围语法（更简洁） |
| x ≥ 18 | `number:18-` | `number:>=18` | **比较运算符**（语义更清晰） |
| x ≤ 100 | `number:-100` | `number:<=100` | **比较运算符**（语义更清晰） |
| x > 0（不包括0） | ❌ 无法表达 | `number:>0` | **比较运算符**（唯一方法） |
| x < 100（不包括100） | ❌ 无法表达 | `number:<100` | **比较运算符**（唯一方法） |
| x = 100 | `number:100`（实际是≤100） | `number:=100` | **比较运算符**（精确匹配） |

---

## 🎯 实际应用场景

### 场景 1：用户注册 - 年龄限制

```javascript
const schema = dsl({
  username: 'string:3-32!',
  email: 'email!',
  age: 'number:>=18!',  // 必须年满18岁
  password: 'string:8-!'
});

// 测试
validate(schema, {
  username: 'john',
  email: 'john@example.com',
  age: 20,
  password: '12345678'
}); // ✅ 通过

validate(schema, {
  username: 'tom',
  email: 'tom@example.com',
  age: 17,  // ❌ 未满18岁
  password: '12345678'
}); // ❌ 失败
```

---

### 场景 2：电商系统 - 价格验证

```javascript
const schema = dsl({
  productName: 'string:1-100!',
  price: 'number:>0!',      // 价格必须大于0
  discount: 'number:0-100'  // 折扣 0-100
});

// 测试
validate(schema, {
  productName: 'iPhone 16',
  price: 999.99,  // ✅ 大于0
  discount: 10
}); // ✅ 通过

validate(schema, {
  productName: 'iPad',
  price: 0,  // ❌ 不能为0
  discount: 50
}); // ❌ 失败
```

---

### 场景 3：考试系统 - 评分

```javascript
const schema = dsl({
  studentId: 'string!',
  score: 'number:>=0!',       // 分数 ≥ 0
  bonus: 'number:<=20'        // 额外加分 ≤ 20
});

// 测试
validate(schema, {
  studentId: 'S001',
  score: 85,
  bonus: 10
}); // ✅ 通过

validate(schema, {
  studentId: 'S002',
  score: -5  // ❌ 不能为负数
}); // ❌ 失败
```

---

### 场景 4：温度监控 - 范围限制

```javascript
const schema = dsl({
  deviceId: 'string!',
  temperature: 'number:>0',   // 温度 > 0
  humidity: 'number:<=100'    // 湿度 ≤ 100
});

// 测试
validate(schema, {
  deviceId: 'TEMP-001',
  temperature: 25.5,
  humidity: 60
}); // ✅ 通过

validate(schema, {
  deviceId: 'TEMP-002',
  temperature: 0,  // ❌ 不能为0
  humidity: 60
}); // ❌ 失败
```

---

### 场景 5：游戏系统 - 等级验证

```javascript
const schema = dsl({
  playerId: 'string!',
  level: 'number:=5!',        // 必须是5级
  experience: 'number:>=1000' // 经验 >= 1000
});

// 测试
validate(schema, {
  playerId: 'P001',
  level: 5,
  experience: 1500
}); // ✅ 通过

validate(schema, {
  playerId: 'P002',
  level: 4,  // ❌ 必须是5级
  experience: 1500
}); // ❌ 失败
```

---

## ⚙️ 技术细节

### JSON Schema 映射

```javascript
// DSL → JSON Schema
dsl({ value: 'number:>0' })
// 生成:
{
  type: 'object',
  properties: {
    value: {
      type: 'number',
      exclusiveMinimum: 0  // JSON Schema draft-07
    }
  }
}

// DSL → JSON Schema
dsl({ age: 'number:>=18' })
// 生成:
{
  type: 'object',
  properties: {
    age: {
      type: 'number',
      minimum: 18
    }
  }
}
```

---

### integer 类型支持

所有比较运算符同样适用于 `integer` 类型：

```javascript
const schema = dsl({
  count: 'integer:>0',      // 整数且大于0
  level: 'integer:>=1',     // 整数且大于等于1
  maxValue: 'integer:<=100' // 整数且小于等于100
});

validate(schema, {
  count: 5,
  level: 1,
  maxValue: 100
}); // ✅ 通过

validate(schema, {
  count: 1.5,  // ❌ 不是整数
  level: 1,
  maxValue: 100
}); // ❌ 失败
```

---

## 🔄 向后兼容性

所有原有语法保持不变，无破坏性变更：

```javascript
// ✅ 原有语法继续有效
dsl({ age: 'number:18-120' })  // 范围
dsl({ age: 'number:18-' })     // 最小值
dsl({ score: 'number:-100' })  // 最大值
dsl({ count: 'number:100' })   // 最大值

// ✅ 新增语法
dsl({ age: 'number:>=18' })    // 大于等于
dsl({ value: 'number:>0' })    // 大于
dsl({ score: 'number:<=100' }) // 小于等于
dsl({ temp: 'number:<100' })   // 小于
dsl({ level: 'number:=5' })    // 等于
```

---

## ❓ 常见问题

### Q1: 为什么需要比较运算符？范围语法不够用吗？

**A**: 范围语法无法表达"不包括边界值"的需求：
- `number:>0` 表示大于0（不包括0）
- `number:<100` 表示小于100（不包括100）
- 这些用范围语法无法表达

---

### Q2: `number:=100` 和 `number:100` 有什么区别？

**A**: 
- `number:=100` → `{ enum: [100] }`，精确等于100
- `number:100` → `{ maximum: 100 }`，小于等于100

---

### Q3: 能否组合多个比较运算符？

**A**: 当前版本不支持直接组合（如 `number:>0<100`）。建议：
- 使用范围语法：`number:0-100`（包括边界）
- 或分别验证两个字段

---

### Q4: 支持哪些数值？

**A**: 
- ✅ 正整数：`number:>0`, `number:>=1`
- ✅ 负整数：`number:>-10`, `number:<-5`
- ✅ 小数：`number:>0.5`, `number:<=99.99`
- ✅ 零：`number:>=0`, `number:<=0`

---

## 📚 相关文档

- [DSL 语法速查](../README.md#-dsl-语法速查)
- [完整示例](https://github.com/vextjs/schema-dsl/blob/v2/examples/docs/number-operators.ts)
- [测试用例](../test/unit/number-operators.test.ts)
- [CHANGELOG](../CHANGELOG.md)

---

## 对应示例文件

**示例入口**: [number-operators.ts](https://github.com/vextjs/schema-dsl/blob/v2/examples/docs/number-operators.ts)  
**说明**: 覆盖 `>=`、`<`、`<=`、`=` 和整数比较运算符的成功/失败路径，便于直接观察边界行为。

---

**版本**: v1.1.2+  
**更新时间**: 2026-05-08

