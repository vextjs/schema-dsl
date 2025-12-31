# schema-dsl 更新日志

本文档记录 schema-dsl 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## 版本概览

| 版本 | 日期 | 变更摘要 | 详细 |
|------|------|---------|------|
| [v1.0.1](#v101) | 2025-12-31 | 枚举功能、自动类型识别、统一错误消息 | [查看详情](#v101) |
| [v1.0.0](#v100) | 2025-12-29 | 初始发布版本 | [查看详情](#v100) |

---

## [v1.0.1] - 2025-12-31

### 🎉 新增功能 (Added)

#### 枚举功能
- ✅ **字符串枚举**: `'active|inactive|pending'` 简写语法
- ✅ **布尔值枚举**: `'true|false'` 自动识别为布尔值
- ✅ **数字枚举**: `'1|2|3'` 自动识别为数字
- ✅ **整数枚举**: `'enum:integer:1|2|3'` 显式指定整数类型
- ✅ **小数枚举**: `'1.0|1.5|2.0'` 支持小数值
- ✅ **必填枚举**: `'active|inactive!'` 支持必填标记
- ✅ **显式类型**: `'enum:type:values'` 显式指定枚举类型

**使用示例**:
```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  // 字符串枚举（自动识别）
  status: 'active|inactive|pending',
  
  // 布尔值枚举（自动识别）
  isPublic: 'true|false',
  
  // 数字枚举（自动识别）
  priority: '1|2|3',
  
  // 整数枚举（显式指定）
  level: 'enum:integer:1|2|3',
  
  // 必填枚举
  role: 'admin|user|guest!'
});

// 验证
const result = validate(schema, {
  status: 'active',
  isPublic: true,
  priority: 1,
  level: 2,
  role: 'admin'
});
```

#### 统一错误消息
- ✅ **统一 'enum' 键**: 所有枚举类型统一使用 `'enum'` 定义错误消息
- ✅ **简化配置**: 不需要记忆不同类型的错误消息键名
- ✅ **高级用法**: 支持 `'type.enum'` 格式按类型定制消息（可选）

**使用示例**:
```javascript
const schema = dsl({
  status: dsl('active|inactive').messages({
    'enum': '状态必须是 active 或 inactive'  // 统一使用 enum
  })
});
```

### 📝 文档 (Documentation)

- ✅ **新增 docs/enum.md**: 完整的枚举功能文档（476行）
- ✅ **更新 README.md**: 添加枚举语法说明
- ✅ **新增示例**: examples/enum.examples.js（325行，10个示例）

### ✅ 测试 (Tests)

- ✅ **新增 test/unit/enum.test.js**: 30个枚举测试用例
- ✅ **测试覆盖**: 字符串/布尔值/数字/整数枚举全覆盖
- ✅ **错误处理测试**: 无效枚举值、类型不匹配测试

### 📊 变更统计

- **新增代码**: ~500 行
- **新增测试**: 30 个
- **新增文档**: 476 行
- **新增示例**: 325 行

---

## [v1.0.0] - 2025-12-29

### 🎉 初始发布

#### 核心功能
- ✅ **DSL 语法**: 简洁的字符串 DSL 定义 Schema
  - `'string:3-32!'` - 字符串长度 3-32，必填
  - `'number:0-100'` - 数字范围 0-100
  - `'email!'` - 邮箱格式，必填
  
- ✅ **基础类型**: string, number, integer, boolean, object, array, null

- ✅ **格式类型**: email, url, uuid, date, datetime, time, ipv4, ipv6, binary

- ✅ **模式类型**: 
  - objectId - MongoDB ObjectId
  - hexColor - 十六进制颜色
  - macAddress - MAC 地址
  - cron - Cron 表达式
  - phone - 手机号（支持多国）
  - idCard - 身份证号
  - creditCard - 信用卡号
  - licensePlate - 车牌号
  - postalCode - 邮政编码
  - passport - 护照号

- ✅ **验证功能**: 
  - `validate(schema, data)` - 同步验证
  - `validateAsync(schema, data)` - 异步验证

- ✅ **错误格式化**: 友好的错误消息

- ✅ **多语言支持**: zh-CN, en-US

- ✅ **链式 API**: String 扩展，支持 `.label()`, `.messages()`, `.pattern()` 等

- ✅ **SchemaUtils**: omit, pick, partial, extend 工具方法

#### 文档和测试
- ✅ **完整文档**: README, API 文档, 示例代码
- ✅ **测试覆盖**: 447+ 测试用例，覆盖率 >90%

---

**更多历史版本信息请参考 Git 提交记录**
