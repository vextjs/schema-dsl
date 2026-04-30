# 变更日志 (CHANGELOG)

> **最后更新**: 2026-04-12

---

## v2.0.0 — TypeScript 全量重写（2026-04-12）

### 🚀 重大变更

| 项目 | v1 | v2 |
|------|----|----|
| **语言** | JavaScript (CJS) | TypeScript (ESM + CJS 双格式) |
| **源码目录** | `lib/` | `src/` |
| **构建产物** | 直接发布源码 | `dist/`（tsup 构建） |
| **测试框架** | Mocha + Chai | Vitest |
| **测试路径** | `test/unit/` | `test/`（unit/integration/regression）|
| **入口文件** | `index.js` | `dist/index.cjs`（CJS）/ `dist/index.js`（ESM）|
| **Node.js** | `>=12.0.0` | `>=18.0.0` |
| **缓存后端** | 内置 LRUCache | `cache-hub` MemoryCache |

### ✅ 向后兼容性

- 当前版本在 **`Node.js >=18.0.0`** 基线下保留 v1 主要公共 API 兼容入口
- `require('schema-dsl')` 仍然有效（main 字段指向 `dist/index.cjs`）
- `import dsl from 'schema-dsl'` 与 `import { dsl } from 'schema-dsl'` 均有效（ESM default + named exports）
- 恢复 `dsl._if` 兼容别名（运行时 + TypeScript 类型）
- 顶层 `validate()` / `validateAsync()` 现支持直接传入 DSL 对象（内部自动归一化为 JSON Schema）
- `new Validator({ cache: true/false })` 布尔简写现与文档口径保持一致
- 当前验证基线：`1026` 个测试用例通过
- `ValidationErrorItem` 新增 `type` 和 `expected` 字段（向后兼容追加，不破坏现有代码）
- 下游项目使用前提：运行时需满足 `Node.js >=18.0.0`

### 🔧 新增特性

- 完整 TypeScript 类型系统（`src/types/`）
- `ValidationErrorItem.type` — 错误类型标识（`"required"` | `"type"` | ...）
- `ValidationErrorItem.expected` — 期望类型描述（如 `"string"`）
- tsup 构建系统，自动生成 ESM/CJS/类型声明 4 个文件

### ℹ️ v1 历史记录

> v1 完整代码参考：`E:\MySelf\schema-dsl-v1.1.0`（v1.2.5 克隆，只读）

---

## v1.x 版本概览

| 版本 | 日期 | 变更摘要 |
|------|------|---------|
| v1.2.5 | 2026-03-09 | 🚀 `DslBuilder.toJsonSchema()` — 输出纯净 JSON Schema |
| v1.2.4 | 2026-03-09 | 🐛 `enum:a,b,c` 逗号分隔格式解析修复 |
| v1.2.3 | 2026-03-03 | 🚀 i18n 子目录合并 |
| v1.2.2 | 2026-02-06 | 🚀 智能类型转换 |
| v1.1.8 | 2026-01-30 | 🚀 智能参数识别 |
| v1.1.7 | 2026-01-27 | 🐛 错误消息路径显示优化 |
| v1.1.6 | 2026-01-23 | 🐛 enum/additionalProperties 错误消息模板修复 |
| v1.1.5 | 2026-01-17 | 🚀 错误配置对象格式支持 |
| v1.1.4 | 2026-01-13 | 🔧 TypeScript 类型修复 |
| v1.1.3 | 2026-01-09 | 🐛 类型错误消息模板修复 |
| v1.1.2 | 2026-01-06 | 🎉 数字比较运算符 |
| v1.1.1 | 2026-01-06 | 🎉 ConditionalBuilder 独立消息支持 |
| v1.1.0 | 2026-01-05 | 🎉 跨类型联合验证 + 插件系统增强 |
| v1.0.9 | 2026-01-04 | 🎉 多语言支持完善 + TypeScript 类型完整 |
| v1.0.4 | 2025-12-31 | TypeScript 完整支持、validateAsync、ValidationError |
| v1.0.3 | 2025-12-31 | ⚠️ 破坏性变更：单值语法修复 |
| v1.0.0 | 2025-12-29 | 初始发布版本 |

## 里程碑版本

### v1.2.2 - 智能类型转换 🚀

**发布日期**: 2026-02-06  
**重要性**: ⭐⭐⭐⭐⭐

**主要改进**:
- 🚀 新增智能类型转换功能，自动将字符串数字转换为 number 类型
- ✅ 默认启用，零配置，开箱即用
- ✅ 完美支持 Web API 项目（Express、Koa 等）
- ✅ 保持类型安全（枚举字段不转换）
- ✅ 支持禁用选项 `validate(schema, data, { coerce: false })`
- ✅ 新增 23 个测试用例，100% 通过率

**核心特性**:
- 智能判断：只转换字符串→数字（且必须是有效数字）
- 类型安全：string 字段保持字符串，boolean 被正确拒绝
- 枚举保护：数字枚举 `1|2|3` 不接受字符串 `"1"`
- 边界处理：支持小数、负数、零、trim 等

**使用示例**:
```javascript
const { dsl, validate } = require('schema-dsl');

const schema = dsl({
  userId: 'number!',
  page: 'number?',
  email: 'email!'
});

// ✅ 字符串自动转换为数字
const result = validate(schema, {
  userId: '123',  // → 123 (number)
  page: '2',      // → 2 (number)
  email: 'test@example.com'
});

console.log(result.valid);       // true
console.log(typeof result.data.userId); // 'number'
```

**技术细节**:
- 新增 `smartCoerceTypes()` 函数（约 60 行）
- 修改文件：`index.js`
- 测试文件：`test/unit/smart-coerce.test.js`（23 个测试）
- 零性能损失，运行时开销可忽略不计

**详细信息**: [查看 changelogs/v1.2.2.md](./changelogs/v1.2.2.md)

---

### v1.1.8 - 智能参数识别 🚀

**发布日期**: 2026-01-30  
**重要性**: ⭐⭐⭐⭐⭐

**主要改进**:
- 🚀 新增智能参数识别功能，支持简化语法 `dsl.error.throw('key', 'locale')`
- ✅ 从4个参数减少到2个参数（不需要参数对象时）
- ✅ 智能识别第2个参数类型：字符串→语言参数，对象→参数对象
- ✅ 所有方法都支持：create、throw、assert
- ✅ 完全向后兼容，现有代码无需修改
- ✅ 新增 17 个测试用例，100%通过率

**技术细节**:
- 新增 `normalizeParams()` 工具函数
- 修改文件：`lib/errors/I18nError.js`、`index.js`
- 参数识别逻辑：typeof 检查 + Array.isArray 排除
- 零性能损失，运行时开销可忽略不计

**使用示例**:
```javascript
// 之前：必须传递空对象
dsl.error.throw('account.notFound', {}, 404, 'zh-CN');

// 现在：直接传语言参数
dsl.error.throw('account.notFound', 'zh-CN', 404);
```

### v1.1.7 - 错误消息路径显示优化 🐛

**发布日期**: 2026-01-27  
**重要性**: ⭐⭐⭐⭐

### v1.1.6 - ErrorFormatter Bug修复 🐛

**发布日期**: 2026-01-23  
**重要性**: ⭐⭐⭐⭐

**主要改进**:
- 🐛 修复 enum 错误消息模板变量 `{{#valids}}` 未替换问题
- 🐛 修复 additionalProperties 错误消息缺少属性名问题
- ✅ 新增完整的错误消息插值测试（14个测试用例）
- ✅ 确保所有 ajv 错误参数正确映射到模板变量

### v1.1.5 - 错误配置对象格式支持 🚀

**发布日期**: 2026-01-17  
**重要性**: ⭐⭐⭐⭐

**核心改进**:
- ✨ 语言包支持对象格式 `{ code, message }`，统一错误代码管理
- ✨ I18nError 新增 `originalKey` 字段，保留原始 key
- ✨ 多语言共享相同的 `code`，便于前端统一处理
- ✅ 完全向后兼容，字符串格式自动转换为对象
- ✅ `error.is()` 同时支持 code 和 originalKey 判断

**测试覆盖**: 942 个测试通过 (98.6%)

### v1.1.4 - TypeScript类型修复与文档完善 🔧

**发布日期**: 2026-01-13  
**重要性**: ⭐⭐⭐

**核心改进**:
- ✅ 修复 index.d.ts 中2处重复函数签名（46个类型错误→0个错误）
- ✅ 修复 `dsl.error.assert` 重复签名（L1336-1343）
- ✅ 修复 `I18nError.assert` 重复签名（L1805-1821）
- ✅ 完善多语言运行时支持文档（docs/runtime-locale-support.md）
- ✅ README.md 添加运行时语言指定示例
- ✅ 验证 string? 可选语法完整支持

**详细信息**: [查看 changelogs/v1.1.4.md](./changelogs/v1.1.4.md)

---

### v1.1.3 - 类型错误消息模板修复 🐛

**发布日期**: 2026-01-09  
**重要性**: ⭐⭐⭐

**核心改进**:
- ✅ 修复类型错误消息中 `{{#actual}}` 模板变量未替换问题
- ✅ 错误消息正确显示实际数据类型
- ✅ 向后兼容，无破坏性变更

**详细信息**: [查看 changelogs/v1.1.3.md](./changelogs/v1.1.3.md)

---

### v1.1.0 - 跨类型联合验证 🎉

**发布日期**: 2026-01-05  
**重要性**: ⭐⭐⭐⭐⭐

**核心特性**:
- ✅ 跨类型联合验证（email|phone 可以混合不同类型）
- ✅ 运行时多语言支持（dsl.error.create 可指定 locale 参数）
- ✅ 插件系统增强

**详细信息**: [查看 changelogs/v1.1.0.md](./changelogs/v1.1.0.md)

---

### v1.0.9 - 多语言支持完善 🌍

**发布日期**: 2026-01-04  
**重要性**: ⭐⭐⭐⭐

**核心特性**:
- ✅ 完整的多语言支持（5种语言）
- ✅ TypeScript 类型定义完整
- ✅ I18nError 多语言错误类

**详细信息**: [查看 changelogs/v1.0.9.md](./changelogs/v1.0.9.md)

---

### v1.0.0 - 正式发布 🎉

**发布日期**: 2025-12-29  
**重要性**: ⭐⭐⭐⭐⭐

**核心成就**:
- ✅ 初始发布
- ✅ 简洁的DSL语法
- ✅ 完整的验证功能

**详细信息**: [查看 changelogs/v1.0.0.md](./changelogs/v1.0.0.md)

---

**完整文档**: [docs/INDEX.md](./docs/INDEX.md)  
**GitHub**: [https://github.com/vextjs/schema-dsl](https://github.com/vextjs/schema-dsl)  
**npm**: [https://www.npmjs.com/package/schema-dsl](https://www.npmjs.com/package/schema-dsl)

