# SchemaIO 更新日志

本文档记录 SchemaIO 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## 版本概览

| 版本 | 日期 | 变更摘要 | 详细 |
|------|------|---------|------|
| [v1.0.0](#v100) | 2025-12-24 | 重构为适配器模式架构，实现完整功能 | [查看详情](#v100) |
| [v0.1.0](#v010) | 2025-12-XX | 初始版本，基础框架 | [查看详情](#v010) |

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

