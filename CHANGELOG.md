# 变更日志 (CHANGELOG)

> **说明**: 版本概览摘要，详细变更见 [changelogs/](./changelogs/) 目录  
> **最后更新**: 2026-02-06

---

## 版本概览

| 版本 | 日期 | 变更摘要 | 详细 |
|------|------|---------|------|
| [v1.2.2](./changelogs/v1.2.2.md) | 2026-02-06 | 🚀 重大功能：智能类型转换 - 字符串数字自动转换，完美支持 Web API | [查看](./changelogs/v1.2.2.md) |
| [v1.1.8](./changelogs/v1.1.8.md) | 2026-01-30 | 🚀 新功能：智能参数识别 - 支持简化语法 `dsl.error.throw('key', 'locale')` | [查看](./changelogs/v1.1.8.md) |
| [v1.1.7](./changelogs/v1.1.7.md) | 2026-01-27 | 🐛 Bug修复：错误消息路径显示优化 - 所有错误类型的 message 只显示字段名 | [查看](./changelogs/v1.1.7.md) |
| [v1.1.6](./changelogs/v1.1.6.md) | 2026-01-23 | 🐛 Bug修复：enum和additionalProperties错误消息模板变量未替换 | [查看](./changelogs/v1.1.6.md) |
| [v1.1.5](./changelogs/v1.1.5.md) | 2026-01-17 | 🚀 新功能：错误配置对象格式支持 - 语言包支持 `{ code, message }` 对象格式 | [查看](./changelogs/v1.1.5.md) |
| [v1.1.4](./changelogs/v1.1.4.md) | 2026-01-13 | 🔧 TypeScript类型修复：移除重复函数签名 + 多语言文档完善 | [查看](./changelogs/v1.1.4.md) |
| [v1.1.3](./changelogs/v1.1.3.md) | 2026-01-09 | 🐛 Bug修复：类型错误消息模板变量未替换 | [查看](./changelogs/v1.1.3.md) |
| [v1.1.2](./changelogs/v1.1.2.md) | 2026-01-06 | 🎉 新功能：数字比较运算符 + Bug修复 | [查看](./changelogs/v1.1.2.md) |
| [v1.1.1](./changelogs/v1.1.1.md) | 2026-01-06 | 🎉 新功能：ConditionalBuilder 独立消息支持 | [查看](./changelogs/v1.1.1.md) |
| [v1.1.0](./changelogs/v1.1.0.md) | 2026-01-05 | 🎉 重大功能：跨类型联合验证 + 插件系统增强 | [查看](./changelogs/v1.1.0.md) |
| [v1.0.9](./changelogs/v1.0.9.md) | 2026-01-04 | 🎉 重大改进：多语言支持完善 + TypeScript 类型完整 | [查看](./changelogs/v1.0.9.md) |
| v1.0.8 | 2026-01-04 | 优化：错误消息过滤增强 | - |
| v1.0.7 | 2026-01-04 | 修复：dsl.match/dsl.if 嵌套支持 dsl() 包裹 | - |
| v1.0.6 | 2026-01-04 | 🚨 紧急修复：TypeScript 类型污染 | - |
| v1.0.5 | 2026-01-04 | 测试覆盖率提升至 97% | - |
| v1.0.4 | 2025-12-31 | TypeScript 完整支持、validateAsync、ValidationError | - |
| v1.0.3 | 2025-12-31 | ⚠️ 破坏性变更：单值语法修复 | - |
| v1.0.2 | 2025-12-31 | 15个新增验证器、完整文档、75个测试 | - |
| v1.0.1 | 2025-12-31 | 枚举功能、自动类型识别、统一错误消息 | - |
| [v1.0.0](./changelogs/v1.0.0.md) | 2025-12-29 | 初始发布版本 | [查看](./changelogs/v1.0.0.md) |

> 💡 **提示**: 重要版本的详细变更记录在 [changelogs/](./changelogs/) 目录中。  
> 当前已有详细文档的版本：v1.2.2, v1.1.8, v1.1.7, v1.1.6, v1.1.5, v1.1.4, v1.1.3, v1.1.2, v1.1.1, v1.1.0, v1.0.9, v1.0.0  
> 其他版本的详细变更信息请参考项目提交历史或联系维护者。

---

## 变更统计

| 版本系列 | 版本数 | 主要改进方向 |
|---------|-------|------------|
| v1.2.x | 1 | 智能类型转换、Web API 完美支持 |
| v1.1.x | 9 | 智能参数识别、Bug修复、错误消息优化、错误配置增强、TypeScript类型完善、多语言支持、数字运算符、联合类型 |
| v1.0.x | 10 | 核心功能、验证器、测试覆盖、文档完善 |

---

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

