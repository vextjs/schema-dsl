import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginSitemap } from '@rspress/plugin-sitemap';

export default defineConfig({
  // Keep the repository-root docs directory as the single source of truth.
  // Many docs link back to ../README.md, ../examples/, ../CHANGELOG.md, etc.,
  // so mirroring them under website/docs would create a second drifting source.
  root: path.join(__dirname, '..', 'docs'),
  base: '/',
  title: 'schema-dsl',
  icon: '/favicon.svg',
  description: '简洁强大的 JSON Schema 验证库，提供 DSL 语法、链式 API、多格式导出与完整 TypeScript 支持。',
  outDir: 'dist',
  plugins: [
    pluginSitemap({
      siteUrl: 'https://schema-dsl.github.io'
    })
  ],
  markdown: {
    link: {
      checkDeadLinks: false
    }
  },
  search: {
    codeBlocks: true
  },
  themeConfig: {
    nav: [
      {
        text: '指南',
        link: '/quick-start'
      },
      {
        text: '导出器',
        link: '/export-guide'
      },
      {
        text: '工具类',
        link: '/schema-utils'
      },
      {
        text: 'API 参考',
        link: '/api-reference'
      },
      {
        text: 'v2.0.0-beta.1',
        items: [
          {
            text: '更新日志',
            link: 'https://github.com/vextjs/schema-dsl/blob/main/CHANGELOG.md'
          },
          {
            text: '贡献指南',
            link: 'https://github.com/vextjs/schema-dsl/blob/main/CONTRIBUTING.md'
          }
        ]
      }
    ],
    sidebar: {
      '/': [
        {
          text: '开始',
          items: [
            { text: '快速上手', link: '/quick-start' },
            { text: '设计理念', link: '/design-philosophy' },
            { text: '文档索引', link: '/doc-index' },
            { text: '功能索引', link: '/FEATURE-INDEX' }
          ]
        },
        {
          text: '核心语法',
          items: [
            { text: 'DSL 语法', link: '/dsl-syntax' },
            { text: '类型参考', link: '/type-reference' },
            { text: '可选标记 ?', link: '/optional-marker-guide' },
            { text: '多类型支持', link: '/multi-type-support' },
            { text: '联合类型', link: '/union-types' },
            { text: '联合类型指南', link: '/union-type-guide' },
            { text: '数字比较运算符', link: '/number-operators' },
            { text: '枚举', link: '/enum' }
          ]
        },
        {
          text: '验证',
          items: [
            { text: 'validate()', link: '/validate' },
            { text: 'validateAsync()', link: '/validate-async' },
            { text: '批量验证', link: '/validate-batch' },
            { text: 'DSL 对象支持', link: '/validate-dsl-object-support' },
            { text: '验证指南', link: '/validation-guide' },
            { text: 'Validator', link: '/validator' },
            { text: '条件 API', link: '/conditional-api' },
            { text: '错误处理', link: '/error-handling' },
            { text: 'String 扩展', link: '/string-extensions' }
          ]
        },
        {
          text: '国际化',
          items: [
            { text: 'i18n 概览', link: '/i18n' },
            { text: '多语言支持', link: '/multi-language' },
            { text: 'i18n 用户指南', link: '/i18n-user-guide' },
            { text: '前端 i18n 指南', link: '/frontend-i18n-guide' },
            { text: '添加自定义语言包', link: '/add-custom-locale' },
            { text: '动态语言切换', link: '/dynamic-locale' },
            { text: '运行时 locale 支持', link: '/runtime-locale-support' }
          ]
        },
        {
          text: '导出器',
          items: [
            { text: '导出指南', link: '/export-guide' },
            { text: 'MongoDB 导出', link: '/mongodb-exporter' },
            { text: 'MySQL 导出', link: '/mysql-exporter' },
            { text: 'PostgreSQL 导出', link: '/postgresql-exporter' },
            { text: 'Markdown 导出', link: '/markdown-exporter' },
            { text: '导出限制', link: '/export-limitations' }
          ]
        },
        {
          text: '工具类',
          items: [
            { text: 'SchemaUtils', link: '/schema-utils' },
            { text: 'SchemaUtils 链式调用', link: '/schema-utils-chaining' },
            { text: 'SchemaUtils 进阶问题', link: '/schema-utils-advanced-issues' },
            { text: 'SchemaUtils 最佳实践', link: '/schema-utils-best-practices' },
            { text: 'SchemaHelper', link: '/schema-helper' },
            { text: 'CacheManager', link: '/cache-manager' },
            { text: 'TypeConverter', link: '/type-converter' },
            { text: 'label vs description', link: '/label-vs-description' }
          ]
        },
        {
          text: '插件与扩展',
          items: [
            { text: '插件系统', link: '/plugin-system' },
            { text: '添加关键字', link: '/add-keyword' },
            { text: '类型注册', link: '/plugin-type-registration' },
            { text: '自定义扩展', link: '/custom-extensions-guide' },
            { text: 'TypeScript 指南', link: '/typescript-guide' }
          ]
        },
        {
          text: '实践与排错',
          items: [
            { text: '最佳实践', link: '/best-practices' },
            { text: '项目结构最佳实践', link: '/best-practices-project-structure' },
            { text: '性能指南', link: '/performance-guide' },
            { text: '安全检查清单', link: '/security-checklist' },
            { text: '故障排查', link: '/troubleshooting' },
            { text: 'FAQ', link: '/faq' }
          ]
        },
        {
          text: 'API 参考',
          items: [
            { text: 'API 参考', link: '/api-reference' },
            { text: 'API 概览', link: '/api' },
            { text: '编译', link: '/compile' },
            { text: 'JSON Schema 基础', link: '/json-schema-basics' }
          ]
        }
      ]
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/vextjs/schema-dsl'
      }
    ],
    footer: {
      message: 'Released under the MIT License.'
    }
  }
});