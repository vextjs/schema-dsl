# Changelog

All notable changes to this project will be documented in this file.

> 📂 **详细变更**: 重要版本的完整说明见 [`changelogs/`](./changelogs/) 目录。

---

## Version History

| Version | Date | Type | Key Theme |
|---------|------|------|-----------|
| [Unreleased] | 2026-05-08 | Docs | 文档示例体系收敛：58 篇文档示例对齐、旧顶层 examples 收口、API 参考高级能力覆盖补齐 |
| [2.0.0-beta.2] | 2026-04-12 | Major | TypeScript 全量重写：ESM+CJS 双格式、AJV 8、tsup 构建、1052 项测试通过 [查看](./changelogs/v2.0.0-beta.2.md) |
| [v1.2.5] | 2026-03-09 | Patch | 新功能：`DslBuilder.toJsonSchema()` — 输出纯净 JSON Schema，自动清理内部标记 |
| [v1.2.4] | 2026-03-09 | Patch | P1 Bug修复：`enum:a,b,c` 逗号分隔格式解析完全失效 |
| [v1.2.3] | 2026-03-03 | Patch | 新功能：i18n 子目录合并，多人协作独立维护语言文件，自动递归合并 + 冲突检测 [查看](./changelogs/v1.2.3.md) |
| [v1.2.2] | 2026-02-06 | Minor | 重大功能：智能类型转换，字符串数字自动转换，完美支持 Web API [查看](./changelogs/v1.2.2.md) |
| [v1.1.8] | 2026-01-30 | Patch | 新功能：智能参数识别，简化语法 `dsl.error.throw('key', 'locale')` [查看](./changelogs/v1.1.8.md) |
| [v1.1.7] | 2026-01-27 | Patch | Bug修复：错误消息路径显示优化，所有错误类型的 message 只显示字段名 |
| [v1.1.6] | 2026-01-23 | Patch | Bug修复：enum 和 additionalProperties 错误消息模板变量未替换 [查看](./changelogs/v1.1.6.md) |
| [v1.1.5] | 2026-01-17 | Patch | 新功能：错误配置对象格式支持，语言包支持 `{ code, message }` 对象格式 [查看](./changelogs/v1.1.5.md) |
| [v1.1.4] | 2026-01-13 | Patch | TypeScript 类型修复：移除重复函数签名 + 多语言文档完善 [查看](./changelogs/v1.1.4.md) |
| [v1.1.3] | 2026-01-09 | Patch | Bug修复：类型错误消息模板变量未替换 [查看](./changelogs/v1.1.3.md) |
| [v1.1.2] | 2026-01-06 | Patch | 新功能：数字比较运算符 + Bug修复 [查看](./changelogs/v1.1.2.md) |
| [v1.1.1] | 2026-01-06 | Patch | 新功能：ConditionalBuilder 独立消息支持 [查看](./changelogs/v1.1.1.md) |
| [v1.1.0] | 2026-01-05 | Minor | 重大功能：跨类型联合验证 + 插件系统增强 [查看](./changelogs/v1.1.0.md) |
| [v1.0.9] | 2026-01-04 | Patch | 重大改进：多语言支持完善 + TypeScript 类型完整 [查看](./changelogs/v1.0.9.md) |
| v1.0.8 | 2026-01-04 | Patch | 优化：错误消息过滤增强 |
| v1.0.7 | 2026-01-04 | Patch | 修复：dsl.match/dsl.if 嵌套支持 dsl() 包裹 |
| v1.0.6 | 2026-01-04 | Patch | 🚨 紧急修复：TypeScript 类型污染 |
| v1.0.5 | 2026-01-04 | Patch | 测试覆盖率提升至 97% |
| v1.0.4 | 2025-12-31 | Patch | TypeScript 完整支持、validateAsync、ValidationError |
| v1.0.3 | 2025-12-31 | Patch | ⚠️ 破坏性变更：单值语法修复 |
| v1.0.2 | 2025-12-31 | Patch | 15 个新增验证器、完整文档、75 个测试 |
| v1.0.1 | 2025-12-31 | Patch | 枚举功能、自动类型识别、统一错误消息 |
| [v1.0.0] | 2025-12-29 | Pre-release | 初始发布版本 [查看](./changelogs/v1.0.0.md) |

---

## [Unreleased]

- docs: 完成 `docs/*.md` 与 `examples/docs/*.ts` 的 58 对 58 对齐，并统一切换到稳定示例入口链接
- docs: 收口 `api-reference` 的高级 API 可运行覆盖，补齐 `ErrorFormatter` API 参考并修正 `FEATURE-INDEX` 方法口径
- chore: 清理旧顶层 `examples/*` 主链路，统一示例入口与 `.tmp` 工作区可见性设置

---

## Links

- [GitHub Repository](https://github.com/vextjs/schema-dsl)
- [在线文档站](https://vextjs.github.io/schema-dsl)
- [Detailed Changelogs](./changelogs/)
- [Contributing Guide](./CONTRIBUTING.md)

[Unreleased]: https://github.com/vextjs/schema-dsl/compare/v2.0.0-beta.2...HEAD
[2.0.0-beta.2]: https://github.com/vextjs/schema-dsl/releases/tag/v2.0.0-beta.2
[v1.2.5]: https://github.com/vextjs/schema-dsl/compare/v1.2.4...v1.2.5
[v1.2.4]: https://github.com/vextjs/schema-dsl/compare/v1.2.3...v1.2.4
[v1.2.3]: https://github.com/vextjs/schema-dsl/compare/v1.2.2...v1.2.3
[v1.2.2]: https://github.com/vextjs/schema-dsl/compare/v1.1.8...v1.2.2
[v1.1.8]: https://github.com/vextjs/schema-dsl/compare/v1.1.7...v1.1.8
[v1.1.7]: https://github.com/vextjs/schema-dsl/compare/v1.1.6...v1.1.7
[v1.1.6]: https://github.com/vextjs/schema-dsl/compare/v1.1.5...v1.1.6
[v1.1.5]: https://github.com/vextjs/schema-dsl/compare/v1.1.4...v1.1.5
[v1.1.4]: https://github.com/vextjs/schema-dsl/compare/v1.1.3...v1.1.4
[v1.1.3]: https://github.com/vextjs/schema-dsl/compare/v1.1.2...v1.1.3
[v1.1.2]: https://github.com/vextjs/schema-dsl/compare/v1.1.1...v1.1.2
[v1.1.1]: https://github.com/vextjs/schema-dsl/compare/v1.1.0...v1.1.1
[v1.1.0]: https://github.com/vextjs/schema-dsl/compare/v1.0.9...v1.1.0
[v1.0.9]: https://github.com/vextjs/schema-dsl/compare/v1.0.8...v1.0.9
[v1.0.0]: https://github.com/vextjs/schema-dsl/releases/tag/v1.0.0

