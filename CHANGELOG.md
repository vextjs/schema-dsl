# SchemaIO 更新日志

本文档记录 SchemaIO 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## 版本概览

| 版本 | 日期 | 变更摘要 | 详细 |
|------|------|---------|------|
| [v2.1.2](#v212) | 2025-12-26 | 代码清理、错误消息优化、min/max简写 | [查看详情](#v212) |
| [v2.1.1](#v211) | 2025-12-25 | 修复错误键名、清理遗留代码 | [查看详情](#v211) |
| [v2.1.0](#v210) | 2025-12-25 | 号码验证重构、新类型扩展、全局配置 | [查看详情](#v210) |
| [v2.0.1](#v201) | 2025-12-25 | 移除简写、补充类型、数组DSL、文档重写 | [查看详情](#v201) |
| [v1.0.0](#v100) | 2025-12-24 | 重构为适配器模式架构，实现完整功能 | [查看详情](#v100) |
| [v0.1.0](#v010) | 2025-12-XX | 初始版本，基础框架 | [查看详情](#v010) |

---

## [v2.1.2] - 2025-12-26

### 🐛 修复
- ✅ 移除 `lib/adapters/DslAdapter.js` 中的调试 `console.error` 语句。
- ✅ 移除 `lib/core/ErrorFormatter.js` 中的调试 `console.error` 语句。
- ✅ 清理所有注释的调试代码。

### ✨ 改进
- ✅ **错误消息键名优化**: 支持 `min`/`max` 作为 `minLength`/`maxLength` 的简写。
  ```javascript
  // 推荐写法（更简洁）
  .messages({ 'min': '至少3个字符', 'max': '最多32个字符' })
  
  // 旧写法（仍然支持，向后兼容）
  .messages({ 'minLength': '至少3个字符', 'maxLength': '最多32个字符' })
  ```
- ✅ 优化 `ErrorFormatter` 错误消息查找优先级，支持数组约束 (`minItems`/`maxItems`)。
- ✅ 统一所有语言包中的占位符为 `{{#limit}}`。

### 📚 文档
- ✅ 更新 `docs/quick-start.md` 示例使用 `min`/`max` 简写。
- ✅ 更新 `README.md` 示例使用 `min`/`max` 简写。
- ✅ 明确简写API的优势和兼容性说明。
- ✅ 修复 `docs/dsl-syntax.md` 和 `docs/string-extensions.md` 缺失的类型和方法说明。

### 🧪 测试
- ✅ 所有 318 个测试通过。
- ✅ 验证向后兼容性。

### 📦 其他
- ✅ 生成 `FIXES_SUMMARY.md` 详细修复总结文档。

---

## [v2.1.1] - 2025-12-25

### 🐛 修复
- ✅ 修复 `examples/user-registration/schema.js` 中 `any.only` 错误键名。
- ✅ 修复 `ErrorCodes.js` 中遗留的 `string.*` 错误码，统一为 `format.*`。
- ✅ 修复 `Locale.test.js` 测试用例，适配新的错误码标准。

### ♻️ 重构
- ✅ **多语言架构重构**: `Locale.js` 自动加载默认语言包，`ErrorCodes.js` 移除硬编码的 `zhCN` 字段，实现真正的多语言解耦。
- ✅ 清理 `ErrorCodes.js`，移除不推荐使用的 `string.email` 等遗留键名。
- ✅ 新增 `type` 错误码，完善类型错误定义。

---

## [v2.1.0] - 2025-12-25

### 🔴 破坏性变更
- ❌ 移除 `JoiAdapter` 及相关 API。
- ❌ Patterns 错误消息改为 Key，需配合 Locale 使用。

### ✨ 新增功能
- ✅ 多语言支持增强：`dsl.config({ locales: ... })`。
- ✅ ESM 支持：添加 `exports` 和 `index.mjs`。

#### 扩展新类型
- ✅ `objectId` - MongoDB ObjectId (24位十六进制)
- ✅ `hexColor` - CSS 16进制颜色 (#fff 或 #ffffff)
- ✅ `macAddress` - MAC 地址
- ✅ `cron` - Cron 表达式

#### 全局配置 API
- ✅ `dsl.config(options)` - 支持运行时修改配置
- ✅ 支持自定义手机号验证规则

### ♻️ 重构

#### 号码验证逻辑
- ✅ 提取手机号正则到 `lib/config/phonePatterns.js`
- ✅ 实现配置与逻辑分离

### 📝 文档更新

#### 移除 Joi 对比
- ✅ `docs/type-reference.md` 移除 Joi 列，专注自身功能

---

## [v2.0.1] - 2025-12-25

### 🔴 破坏性变更

#### 移除简写功能
- ❌ **不再支持类型简写** - `s/n/i/b/o/a` 等简写已移除
- ✅ **使用完整类型名** - `string/number/integer/boolean/object/array`
- **原因**: 降低学习成本，减少歧义，提升代码可读性

**迁移指南**:
```javascript
// ❌ v2.0.0 及之前
dsl({ name: 's:3-32!' })

// ✅ v2.0.1
dsl({ name: 'string:3-32!' })
```

### ✨ 新增功能

#### 补充类型（与 joi 对比）
- ✅ `time` - 时间格式 (HH:mm:ss)
- ✅ `ipv4` - IPv4 地址
- ✅ `ipv6` - IPv6 地址
- ✅ `binary` - 二进制数据 (Base64)
- ✅ `any` - 任意类型
- ✅ `null` - 空值类型

#### 数组 DSL 语法增强
- ✅ `array!1-10` - 必填，1-10 个元素
- ✅ `array:1-10` - 可选，1-10 个元素
- ✅ `array!1-` - 必填，至少 1 个元素
- ✅ `array!-10` - 必填，最多 10 个元素
- ✅ `array!1-10<string:1-20>` - 完整约束（长度+元素）

**示例**:
```javascript
const schema = dsl({
  tags: 'array!1-10<string:1-20>',  // 1-10个标签，每个1-20字符
  items: 'array:1-<number:0-100>'   // 至少1个，每个0-100
});
```

#### 对象必填优化
- ✅ **key! 语法** - 字段名带 `!` 表示该字段本身必填

**示例**:
```javascript
// ✅ 优雅方式
const schema = dsl({
  'user!': {          // user 本身必填
    name: 'string',    // name 可选
    email: 'email'     // email 可选
  }
});

// 对比旧方式
const schema = dsl({
  user: {
    name: 'string!',   // name 必填（但 user 可选）
    email: 'email!'
  }
});
```

### 📝 文档更新

#### 完全重写 DSL 语法文档
- ✅ **行数减少 80%** - 从 2857 行精简到 567 行
- ✅ **移除所有简写** - 只使用完整类型名
- ✅ **简化示例** - 使用最简单的方式
- ✅ **实现方案对比** - "不能这样 vs 只能这样"

#### 新增完整类型文档
- ✅ `docs/type-reference.md` - 完整类型列表
- ✅ 与 joi 对比表
- ✅ 所有类型使用示例

### 🐛 Bug 修复

#### ErrorFormatter 多错误处理
- ✅ 修复 `format()` 方法只处理单个错误的问题
- ✅ 支持 ajv 返回的多个错误
- ✅ `formatDetailed()` 正确处理 ajv 错误格式
- ✅ `_interpolate()` 处理 undefined template

#### 嵌套深度计算修复
- ✅ 修复深度计算包含根节点的问题
- ✅ 从 properties 内部开始计数
- ✅ 支持 `isRoot` 参数跳过根节点

#### 数组 DSL 解析修复
- ✅ 修复 `array!1-10` 被解析为 string 的问题
- ✅ DslBuilder 构造函数支持 `array!数字` 格式
- ✅ DslAdapter 和 DslBuilder 同步支持数组约束

### 🧪 测试改进

#### 测试通过率 100%
- ✅ **215 个测试全部通过** (之前 211/215)
- ✅ 数组 DSL 语法测试 5/5 通过
- ✅ 删除简写测试 (已移除功能)
- ✅ 修复 date 格式测试

### 📦 其他改进

#### 代码质量
- ✅ 统一类型定义（移除简写）
- ✅ 优化解析逻辑
- ✅ 清理临时文件

---

## [v2.0.0] - 2025-12-25 (内部版本)

### ✨ 新增功能

#### String 扩展（核心特性）
- ✅ **字符串直接链式调用** - 无需 `dsl()` 包裹即可链式调用
  ```javascript
  // v1.0: dsl('email!').pattern(/custom/).label('邮箱')
  // v2.0.1: 'email!'.pattern(/custom/).label('邮箱')
  ```
- ✅ **自动安装机制** - 启动时自动安装，支持手动卸载
- ✅ **完整方法支持** - pattern(), label(), messages(), description(), custom(), when(), default()

#### Schema 复用工具
- ✅ `SchemaUtils.reusable()` - 创建可复用Schema片段
- ✅ `SchemaUtils.createLibrary()` - 创建Schema片段库
- ✅ `SchemaUtils.merge()` - 合并多个Schema
- ✅ `SchemaUtils.extend()` - 扩展Schema（类似继承）
- ✅ `SchemaUtils.pick()` - 筛选字段
- ✅ `SchemaUtils.omit()` - 排除字段

#### 批量验证与性能监控
- ✅ `Validator.validateBatch()` - 批量验证数据
- ✅ 性能统计 - 验证结果包含性能信息

#### Schema 工具方法
- ✅ `SchemaUtils.toMarkdown()` - 导出为Markdown文档
- ✅ `SchemaUtils.toHTML()` - 导出为HTML文档
- ✅ `SchemaUtils.clone()` - 深度克隆Schema
- ✅ `DslBuilder.validateNestingDepth()` - 检测嵌套深度

### 📝 文档更新
- ✅ 新增 `docs/string-extensions.md` - String扩展详细文档
- ✅ 更新 `README.md` - 添加v2.0.1新特性说明
- ✅ 新增 `examples/string-extensions.js` - String扩展示例
- ✅ 新增 `examples/v2.0.1-features.js` - 完整新功能示例

### 🐛 已知限制
- ⚠️ 数组DSL语法 `array!1-10` 尚未实现（计划中）
- ⚠️ 快捷验证方法（phoneNumber/idCard等）计划作为插件提供

### 📦 依赖更新
- 无变更

---

## [v1.0.0] - 2025-12-24

### 🎉 重大变更

#### 架构重构
- **适配器模式**: 完全重构为适配器模式架构
- **核心统一**: 使用JSON Schema Draft 7作为统一内部表示
- **API解耦**: Joi风格和DSL风格通过适配器转换

#### 性能提升
- **高性能验证**: 集成ajv验证器（业界最快）
- **编译缓存**: 实现Schema编译结果缓存
- **批量验证**: 支持批量数据验证

### ✨ 新增功能

#### 核心层
- ✅ `JSONSchemaCore` - JSON Schema核心类
  - 完整支持JSON Schema Draft 7标准
  - 链式API设计
  - Schema克隆、合并、验证

- ✅ `Validator` - ajv验证器集成
  - Schema编译缓存
  - 自定义关键字支持
  - 自定义格式支持
  - 批量验证
  - 错误格式化

#### 适配器层
- ✅ **Joi风格适配器**
  - 完整的Joi风格链式API
  - 支持所有基本类型（string/number/boolean/object/array）
  - 支持约束方法（min/max/required/pattern等）
  - 自动转换为JSON Schema

- ✅ **DSL风格适配器**
  - 简洁的DSL语法设计
  - 支持类型定义（`string:3-32`）
  - 支持必填标记（`!`）
  - 支持枚举值（`active|inactive`）
  - 支持数组类型（`array<string>`）
  - 支持嵌套对象
  - 支持格式类型（email/url/uuid/date）

#### 导出器层
- ✅ **MongoDB导出器**
  - 转换为MongoDB $jsonSchema格式
  - 生成createCollection命令
  - 支持验证级别配置

- ✅ **MySQL导出器**
  - 生成CREATE TABLE DDL
  - 智能类型映射（根据约束条件）
  - 支持约束（NOT NULL/DEFAULT/COMMENT）
  - 支持索引生成

- ✅ **PostgreSQL导出器**
  - 生成CREATE TABLE DDL
  - 智能类型映射（JSONB/UUID/TIMESTAMP等）
  - 支持CHECK约束
  - 支持列注释和表注释

#### 验证器扩展
- ✅ **自定义关键字**
  - regex关键字（正则验证）
  - validate关键字（函数验证）
  - range关键字（数值范围）

#### 工具函数
- ✅ `TypeConverter` - 类型转换工具
  - JSON Schema ↔ MongoDB BSON类型
  - JSON Schema ↔ MySQL数据类型
  - JSON Schema ↔ PostgreSQL数据类型
  - 格式验证函数转正则表达式

- ✅ `SchemaHelper` - Schema辅助函数
  - Schema验证和分析
  - 字段路径提取
  - 扁平化和克隆
  - 复杂度评估

### 📝 文档和示例

- ✅ **README.md** - 完整项目文档
  - 快速开始指南
  - DSL语法指南
  - API文档
  - 完整示例

- ✅ **示例文件**
  - `joi-style.js` - Joi风格完整示例
  - `dsl-style.js` - DSL风格完整示例

### 🔧 改进

#### 代码质量
- ✅ 完整的JSDoc注释
- ✅ 清晰的命名规范（camelCase/PascalCase）
- ✅ 模块化设计（高内聚低耦合）
- ✅ 错误处理完善

#### 开发体验
- ✅ package.json脚本完善
- ✅ 依赖管理优化
- ✅ 示例代码丰富

### 🐛 修复

- ✅ 修复DSL适配器的_required标记清理问题
- ✅ 修复DSL枚举值解析问题
- ✅ 修复数组类型DSL解析问题
- ✅ 优化JoiAdapter的compile方法

### 📦 依赖变更

#### 新增依赖
```json
{
  "ajv": "^8.17.1",
  "ajv-formats": "^2.1.1"
}
```

#### 新增开发依赖
```json
{
  "mocha": "^10.8.2",
  "chai": "^4.5.0",
  "sinon": "^17.0.1",
  "nyc": "^15.1.0",
  "eslint": "^8.57.1",
  "monsqlize": "^1.0.1"
}
```

### 📊 统计信息

- **代码行数**: ~3200行
- **文件数**: 17个核心文件
- **功能完成度**: 98%
- **测试覆盖率**: 0%（待补充）

---

## [v0.1.0] - 2025-12-XX

### ✨ 初始版本

- 基础框架搭建
- 类型系统设计
- SchemaBuilder原型
- 目录结构规划

---

## 待发布

### v1.1.0（计划中）

#### 计划新增
- [ ] ChainAdapter - 链式风格适配器
- [ ] 完整测试套件（覆盖率80%+）
- [ ] TypeScript类型定义
- [ ] 性能基准测试

#### 计划改进
- [ ] JoiAdapter required处理优化
- [ ] 错误提示优化
- [ ] 文档补充（API详细文档）

---

## 变更类型说明

- `✨ 新增`: 新功能
- `🔧 改进`: 功能改进或优化
- `🐛 修复`: Bug修复
- `📝 文档`: 文档更新
- `🎨 样式`: 代码格式调整
- `♻️ 重构`: 代码重构
- `⚡ 性能`: 性能优化
- `🔒 安全`: 安全问题修复
- `📦 依赖`: 依赖更新
- `🎉 重大`: 重大变更

---

**维护说明**: 请在每次发布新版本时更新此文档
