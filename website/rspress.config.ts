import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginSitemap } from '@rspress/plugin-sitemap';

const englishSidebar = [
  {
    text: 'Start',
    items: [
      { text: 'Quick Start', link: '/quick-start' },
      { text: 'Design Philosophy', link: '/design-philosophy' },
      { text: 'TypeScript Guide', link: '/typescript-guide' }
    ]
  },
  {
    text: 'Schema Authoring',
    items: [
      { text: 'DSL Syntax', link: '/dsl-syntax' },
      { text: 'Complete Type List', link: '/type-reference' },
      { text: 'Chain Method List', link: '/chain-methods' },
      { text: 'Optional Marker ?', link: '/optional-marker-guide' },
      { text: 'Multi-type Support', link: '/multi-type-support' },
      { text: 'Union Types', link: '/union-types' },
      { text: 'Union Type Guide', link: '/union-type-guide' },
      { text: 'Number Operators', link: '/number-operators' },
      { text: 'Enum', link: '/enum' },
      { text: 'String Extensions', link: '/string-extensions' }
    ]
  },
  {
    text: 'Validation and Runtime',
    items: [
      { text: 'validate()', link: '/validate' },
      { text: 'validateAsync()', link: '/validate-async' },
      { text: 'Batch Validation', link: '/validate-batch' },
      { text: 'DSL Object Support', link: '/validate-dsl-object-support' },
      { text: 'Validation Guide', link: '/validation-guide' },
      { text: 'Validator', link: '/validator' },
      { text: 'Conditional API', link: '/conditional-api' },
      { text: 'Error Handling', link: '/error-handling' },
      { text: 'compile()', link: '/compile' },
      { text: 'Runtime Isolation', link: '/runtime-isolation' }
    ]
  },
  {
    text: 'Export and Interop',
    items: [
      { text: 'JSON Schema Basics', link: '/json-schema-basics' },
      { text: 'Export Guide', link: '/export-guide' },
      { text: 'Export Limitations', link: '/export-limitations' },
      { text: 'MongoDB Exporter', link: '/mongodb-exporter' },
      { text: 'MySQL Exporter', link: '/mysql-exporter' },
      { text: 'PostgreSQL Exporter', link: '/postgresql-exporter' },
      { text: 'Markdown Exporter', link: '/markdown-exporter' },
      { text: 'TypeConverter', link: '/type-converter' }
    ]
  },
  {
    text: 'Reuse and Utilities',
    items: [
      { text: 'SchemaUtils', link: '/schema-utils' },
      { text: 'SchemaUtils Chaining', link: '/schema-utils-chaining' },
      { text: 'SchemaHelper', link: '/schema-helper' },
      { text: 'Validator Cache', link: '/cache-manager' },
      { text: 'Labels and Messages', link: '/label-vs-description' }
    ]
  },
  {
    text: 'Internationalization',
    items: [
      { text: 'i18n Overview', link: '/i18n' },
      { text: 'i18n User Guide', link: '/i18n-user-guide' },
      { text: 'Frontend i18n Guide', link: '/frontend-i18n-guide' },
      { text: 'Add Custom Locale', link: '/add-custom-locale' },
      { text: 'Dynamic Locale', link: '/dynamic-locale' },
      { text: 'Runtime Locale Support', link: '/runtime-locale-support' }
    ]
  },
  {
    text: 'Extensions and Integration',
    items: [
      { text: 'Extension Overview', link: '/extensions-overview' },
      { text: 'Custom DSL Types', link: '/custom-extensions' },
      { text: 'Custom Validation Keywords', link: '/add-keyword' },
      { text: 'Framework Integration', link: '/framework-extension-setup' },
      { text: 'Plugin Manager (Advanced)', link: '/plugin-system' }
    ]
  },
  {
    text: 'Production and Troubleshooting',
    items: [
      { text: 'Best Practices', link: '/best-practices' },
      { text: 'Project Structure Best Practices', link: '/best-practices-project-structure' },
      { text: 'Performance Guide', link: '/performance-guide' },
      { text: 'Troubleshooting', link: '/troubleshooting' },
      { text: 'FAQ', link: '/faq' }
    ]
  },
  {
    text: 'Reference and Index',
    items: [
      { text: 'API Reference', link: '/api-reference' },
      { text: 'Documentation Index', link: '/doc-index' },
      { text: 'Feature Index', link: '/FEATURE-INDEX' }
    ]
  }
];

const chineseSidebar = [
  {
    text: '开始',
    items: [
      { text: '快速上手', link: '/zh/quick-start' },
      { text: '设计理念', link: '/zh/design-philosophy' },
      { text: 'TypeScript 指南', link: '/zh/typescript-guide' }
    ]
  },
  {
    text: 'Schema 写法',
    items: [
      { text: 'DSL 语法', link: '/zh/dsl-syntax' },
      { text: '完整类型列表', link: '/zh/type-reference' },
      { text: '链式字段方法列表', link: '/zh/chain-methods' },
      { text: '可选标记 ?', link: '/zh/optional-marker-guide' },
      { text: '多类型支持', link: '/zh/multi-type-support' },
      { text: '联合类型', link: '/zh/union-types' },
      { text: '联合类型指南', link: '/zh/union-type-guide' },
      { text: '数字比较运算符', link: '/zh/number-operators' },
      { text: '枚举', link: '/zh/enum' },
      { text: 'String 扩展', link: '/zh/string-extensions' }
    ]
  },
  {
    text: '验证与运行时',
    items: [
      { text: 'validate()', link: '/zh/validate' },
      { text: 'validateAsync()', link: '/zh/validate-async' },
      { text: '批量验证', link: '/zh/validate-batch' },
      { text: 'DSL 对象支持', link: '/zh/validate-dsl-object-support' },
      { text: '验证指南', link: '/zh/validation-guide' },
      { text: 'Validator', link: '/zh/validator' },
      { text: '条件 API', link: '/zh/conditional-api' },
      { text: '错误处理', link: '/zh/error-handling' },
      { text: '编译', link: '/zh/compile' },
      { text: '运行时隔离', link: '/zh/runtime-isolation' }
    ]
  },
  {
    text: '导出与互操作',
    items: [
      { text: 'JSON Schema 基础', link: '/zh/json-schema-basics' },
      { text: '导出指南', link: '/zh/export-guide' },
      { text: '导出限制', link: '/zh/export-limitations' },
      { text: 'MongoDB 导出', link: '/zh/mongodb-exporter' },
      { text: 'MySQL 导出', link: '/zh/mysql-exporter' },
      { text: 'PostgreSQL 导出', link: '/zh/postgresql-exporter' },
      { text: 'Markdown 导出', link: '/zh/markdown-exporter' },
      { text: 'TypeConverter', link: '/zh/type-converter' }
    ]
  },
  {
    text: '复用与工具',
    items: [
      { text: 'SchemaUtils', link: '/zh/schema-utils' },
      { text: 'SchemaUtils 链式调用', link: '/zh/schema-utils-chaining' },
      { text: 'SchemaHelper', link: '/zh/schema-helper' },
      { text: 'Validator 缓存', link: '/zh/cache-manager' },
      { text: '标签与错误消息', link: '/zh/label-vs-description' }
    ]
  },
  {
    text: '国际化',
    items: [
      { text: 'i18n 概览', link: '/zh/i18n' },
      { text: 'i18n 用户指南', link: '/zh/i18n-user-guide' },
      { text: '前端 i18n 指南', link: '/zh/frontend-i18n-guide' },
      { text: '添加自定义语言包', link: '/zh/add-custom-locale' },
      { text: '动态语言切换', link: '/zh/dynamic-locale' },
      { text: '运行时 locale 支持', link: '/zh/runtime-locale-support' }
    ]
  },
  {
    text: '扩展与集成',
    items: [
      { text: '扩展概览', link: '/zh/extensions-overview' },
      { text: '自定义 DSL 类型', link: '/zh/custom-extensions' },
      { text: '自定义校验关键字', link: '/zh/add-keyword' },
      { text: '框架集成与目录结构', link: '/zh/framework-extension-setup' },
      { text: '插件管理器（高级）', link: '/zh/plugin-system' }
    ]
  },
  {
    text: '生产实践与排错',
    items: [
      { text: '最佳实践', link: '/zh/best-practices' },
      { text: '项目结构最佳实践', link: '/zh/best-practices-project-structure' },
      { text: '性能指南', link: '/zh/performance-guide' },
      { text: '故障排查', link: '/zh/troubleshooting' },
      { text: 'FAQ', link: '/zh/faq' }
    ]
  },
  {
    text: '参考与索引',
    items: [
      { text: 'API 参考', link: '/zh/api-reference' },
      { text: '文档索引', link: '/zh/doc-index' },
      { text: '功能索引', link: '/zh/FEATURE-INDEX' }
    ]
  }
];

const englishNav = [
  {
    text: 'Guide',
    link: '/quick-start'
  },
  {
    text: 'Export',
    link: '/export-guide'
  },
  {
    text: 'Utilities',
    link: '/schema-utils'
  },
  {
    text: 'API',
    link: '/api-reference'
  },
  {
    text: 'Releases',
    items: [
      {
        text: 'Changelog',
        link: 'https://github.com/vextjs/schema-dsl/blob/main/CHANGELOG.md'
      },
      {
        text: 'Contributing',
        link: 'https://github.com/vextjs/schema-dsl/blob/main/CONTRIBUTING.md'
      }
    ]
  }
];

const chineseNav = [
  {
    text: '指南',
    link: '/zh/quick-start'
  },
  {
    text: '导出',
    link: '/zh/export-guide'
  },
  {
    text: '工具',
    link: '/zh/schema-utils'
  },
  {
    text: 'API',
    link: '/zh/api-reference'
  },
  {
    text: '发布',
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
];

export default defineConfig({
  // Keep the repository-root docs directory as the single source of truth.
  // Many docs link back to ../README.md, ../examples/, ../CHANGELOG.md, etc.,
  // so mirroring them under website/docs would create a second drifting source.
  root: path.join(__dirname, '..', 'docs'),
  base: '/schema-dsl/',
  lang: 'en',
  title: 'schema-dsl',
  icon: '/favicon.svg',
  logo: '/favicon.svg',
  logoText: 'schema-dsl',
  globalStyles: path.join(__dirname, 'styles', 'schema-dsl.css'),
  description: 'A concise and powerful JSON Schema validation library with DSL syntax, chainable APIs, multi-format export, and TypeScript support.',
  outDir: 'dist',
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'schema-dsl',
      description: 'A concise and powerful JSON Schema validation library.'
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'schema-dsl',
      description: '简洁强大的 JSON Schema 验证库。'
    }
  ],
  plugins: [
    pluginSitemap({
      siteUrl: 'https://vextjs.github.io/schema-dsl'
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
  languageParity: {
    enabled: true
  },
  themeConfig: {
    nav: englishNav,
    locales: [
      {
        lang: 'en',
        label: 'English',
        title: 'schema-dsl',
        description: 'A concise and powerful JSON Schema validation library.',
        nav: englishNav,
        sidebar: {
          '/': englishSidebar
        }
      },
      {
        lang: 'zh',
        label: '简体中文',
        title: 'schema-dsl',
        description: '简洁强大的 JSON Schema 验证库。',
        nav: chineseNav,
        sidebar: {
          '/zh/': chineseSidebar
        }
      }
    ],
    sidebar: {
      '/': englishSidebar,
      '/zh/': chineseSidebar
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/vextjs/schema-dsl'
      }
    ],
    footer: {
      message: 'Released under the Apache-2.0 License.'
    }
  }
});
