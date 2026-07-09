---
pageType: home

hero:
  name: schema-dsl
  text: 渐进式 TypeScript Schema DSL
  tagline: 简洁字段规则 · 渐进式 s API · 验证 · Schema 复用 · 导出 · 国际化
  image:
    src: /favicon.svg
    alt: schema-dsl logo
  actions:
    - theme: brand
      text: 快速上手
      link: /zh/quick-start
    - theme: alt
      text: 文档索引
      link: /zh/doc-index
    - theme: alt
      text: GitHub
      link: https://github.com/vextjs/schema-dsl

features:
  - title: 渐进式 Schema 编写
    details: 用 DSL 字符串、s('...') 种子构建器或可发现的 s.xxx() 工厂编写简洁字段规则。
  - title: 验证运行时
    details: 支持同步、异步和批量验证，并通过 AJV fallback 与缓存感知运行时保持可靠行为。
  - title: 多格式导出
    details: 同一份 schema 可导出到 MongoDB、MySQL、PostgreSQL 和 Markdown 文档。
  - title: 国际化
    details: 内置多语言错误消息与动态 locale 切换，适合服务端和前端共享校验规则。
  - title: 扩展与插件
    details: 支持自定义 DSL 类型、格式、验证器和插件封装，并覆盖纯 DSL、种子构建器与命名空间工厂入口。
  - title: TypeScript 友好
    details: 提供 TypeScript 类型声明与可发现的命名空间工厂，便于在现代 Node.js 与 TypeScript 项目中集成。
---

## 入口导航

- 在线文档: [中文首页](/schema-dsl/zh/)
- 本地文档索引: [doc-index.md](./doc-index.md)
- 快速开始: [quick-start.md](./quick-start.md)
- 功能索引: [FEATURE-INDEX.md](./FEATURE-INDEX.md)

---

## 对应示例文件

**示例入口**: [home.ts](https://github.com/vextjs/schema-dsl/blob/main/examples/docs/home.ts)  
**说明**: 覆盖首页展示的 DSL 定义、便捷验证与编译复用路径，可作为 Batch 1 的总入口样板。


