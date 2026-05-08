# 多语言支持

多语言能力由 `Locale`、`dsl.config({ i18n })` 和验证选项 `locale` 提供。

常见入口：

- 运行时切换默认语言：`Locale.setLocale('en-US')`
- 运行时补充语言包：`Locale.addLocale('en-US', messages)`
- 从目录扫描语言包：`dsl.config({ i18n: '/path/to/locales' })`
- 单次验证覆盖语言：`validator.validate(schema, data, { locale: 'en-US' })`

当前 i18n 目录扫描支持这些语言包文件：`.js`、`.cjs`、`.json`、`.jsonc`、`.json5`。

更多内容请见：

- [i18n.md](./i18n.md)
- [i18n-user-guide.md](./i18n-user-guide.md)
- [dynamic-locale.md](./dynamic-locale.md)

---

## 对应示例文件

**示例入口**: [multi-language.ts](https://github.com/vextjs/schema-dsl/blob/v2/examples/docs/multi-language.ts)  
**说明**: 展示默认语言、按次覆盖 `locale` 以及可用语言列表的最小运行时示例。

