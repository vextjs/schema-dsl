# Unreleased

## 2026-06-10
- **[Docs Site]** Added Rspress i18n structure with English as the default documentation language, moved existing Chinese docs under `/zh/`, and completed full 58-page English/Chinese documentation parity.
- **[Docs Site]** Reworked the English documentation from summary-style pages into content-level parity with the Chinese source docs, including matching sections, code blocks, tables, examples, and internal anchors across all 58 pages.
- **[Docs Site]** Tightened bilingual documentation link/reference parity by fixing README anchors, page TOCs, English home routing, issue links, and external tool references, then verified Markdown, built HTML, and external URLs across three zero-issue review rounds.
- **[Docs/Profile]** 修复提交前复审发现的文档/Profile 残留：同步测试基线为 75 files / 1105 tests，修正 String 扩展相关目录锚点、文档版本/更新时间与重复步骤/编号。

## 2026-06-09
- **[Runtime]** 恢复 root entry 默认安装 String 扩展，兼容 v1.1.x 直接字符串链式调用；安装器改为不可枚举 descriptor、同名冲突检测与可卸载恢复。
- **[Runtime]** 收窄 legacy `_dslExtensionsInstalled` 接管条件，避免外部同名 `String.prototype` 方法因遗留 marker 被静默覆盖。
- **[Tests]** 补充 root entry 默认安装、String 扩展不可枚举、外部冲突保护与 legacy marker 冲突回归用例。
- **[Docs]** 统一 String 扩展文档口径：JavaScript 默认可直接字符串链式调用，介意全局原型扩展时可主动卸载后使用 `dsl()` 包裹，并补充导入阶段同名冲突排障。
- **[Docs]** 同步文档站许可证页脚、文档索引统计与故障排查导航，并修正 API 参考标题 typo。
- **[Profile]** 同步 schema-dsl Profile 中的版本、文档数量、`ValidationErrorItem` 返回结构、v1 参考路径与 String 扩展默认安装约束。
