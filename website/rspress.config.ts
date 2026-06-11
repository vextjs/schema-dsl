import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginSitemap } from '@rspress/plugin-sitemap';

const englishSidebar = [
  {
    text: 'Start',
    items: [
      { text: 'Quick Start', link: '/quick-start' },
      { text: 'Design Philosophy', link: '/design-philosophy' },
      { text: 'Documentation Index', link: '/doc-index' },
      { text: 'Feature Index', link: '/FEATURE-INDEX' }
    ]
  },
  {
    text: 'Core Syntax',
    items: [
      { text: 'DSL Syntax', link: '/dsl-syntax' },
      { text: 'Type Reference', link: '/type-reference' },
      { text: 'Optional Marker ?', link: '/optional-marker-guide' },
      { text: 'Multi-type Support', link: '/multi-type-support' },
      { text: 'Union Types', link: '/union-types' },
      { text: 'Union Type Guide', link: '/union-type-guide' },
      { text: 'Number Operators', link: '/number-operators' },
      { text: 'Enum', link: '/enum' }
    ]
  },
  {
    text: 'Validation',
    items: [
      { text: 'validate()', link: '/validate' },
      { text: 'validateAsync()', link: '/validate-async' },
      { text: 'Batch Validation', link: '/validate-batch' },
      { text: 'DSL Object Support', link: '/validate-dsl-object-support' },
      { text: 'Validation Guide', link: '/validation-guide' },
      { text: 'Validator', link: '/validator' },
      { text: 'Conditional API', link: '/conditional-api' },
      { text: 'Error Handling', link: '/error-handling' },
      { text: 'String Extensions', link: '/string-extensions' }
    ]
  },
  {
    text: 'Internationalization',
    items: [
      { text: 'i18n Overview', link: '/i18n' },
      { text: 'Multi-language Support', link: '/multi-language' },
      { text: 'i18n User Guide', link: '/i18n-user-guide' },
      { text: 'Frontend i18n Guide', link: '/frontend-i18n-guide' },
      { text: 'Add Custom Locale', link: '/add-custom-locale' },
      { text: 'Dynamic Locale', link: '/dynamic-locale' },
      { text: 'Runtime Locale Support', link: '/runtime-locale-support' }
    ]
  },
  {
    text: 'Exporters',
    items: [
      { text: 'Export Guide', link: '/export-guide' },
      { text: 'MongoDB Exporter', link: '/mongodb-exporter' },
      { text: 'MySQL Exporter', link: '/mysql-exporter' },
      { text: 'PostgreSQL Exporter', link: '/postgresql-exporter' },
      { text: 'Markdown Exporter', link: '/markdown-exporter' },
      { text: 'Export Limitations', link: '/export-limitations' }
    ]
  },
  {
    text: 'Utilities',
    items: [
      { text: 'SchemaUtils', link: '/schema-utils' },
      { text: 'SchemaUtils Chaining', link: '/schema-utils-chaining' },
      { text: 'SchemaUtils Advanced Issues', link: '/schema-utils-advanced-issues' },
      { text: 'SchemaUtils Best Practices', link: '/schema-utils-best-practices' },
      { text: 'SchemaHelper', link: '/schema-helper' },
      { text: 'CacheManager', link: '/cache-manager' },
      { text: 'TypeConverter', link: '/type-converter' },
      { text: 'label vs description', link: '/label-vs-description' }
    ]
  },
  {
    text: 'Plugins and Extensions',
    items: [
      { text: 'Plugin System', link: '/plugin-system' },
      { text: 'addKeyword', link: '/add-keyword' },
      { text: 'Type Registration', link: '/plugin-type-registration' },
      { text: 'Custom Extensions', link: '/custom-extensions-guide' },
      { text: 'TypeScript Guide', link: '/typescript-guide' }
    ]
  },
  {
    text: 'Practice and Troubleshooting',
    items: [
      { text: 'Best Practices', link: '/best-practices' },
      { text: 'Project Structure Best Practices', link: '/best-practices-project-structure' },
      { text: 'Performance Guide', link: '/performance-guide' },
      { text: 'Security Checklist', link: '/security-checklist' },
      { text: 'Troubleshooting', link: '/troubleshooting' },
      { text: 'FAQ', link: '/faq' }
    ]
  },
  {
    text: 'API Reference',
    items: [
      { text: 'API Reference', link: '/api-reference' },
      { text: 'API Overview', link: '/api' },
      { text: 'compile()', link: '/compile' },
      { text: 'JSON Schema Basics', link: '/json-schema-basics' }
    ]
  }
];

const chineseSidebar = [
  {
    text: '开始',
    items: [
      { text: '快速上手', link: '/zh/quick-start' },
      { text: '设计理念', link: '/zh/design-philosophy' },
      { text: '文档索引', link: '/zh/doc-index' },
      { text: '功能索引', link: '/zh/FEATURE-INDEX' }
    ]
  },
  {
    text: '核心语法',
    items: [
      { text: 'DSL 语法', link: '/zh/dsl-syntax' },
      { text: '类型参考', link: '/zh/type-reference' },
      { text: '可选标记 ?', link: '/zh/optional-marker-guide' },
      { text: '多类型支持', link: '/zh/multi-type-support' },
      { text: '联合类型', link: '/zh/union-types' },
      { text: '联合类型指南', link: '/zh/union-type-guide' },
      { text: '数字比较运算符', link: '/zh/number-operators' },
      { text: '枚举', link: '/zh/enum' }
    ]
  },
  {
    text: '验证',
    items: [
      { text: 'validate()', link: '/zh/validate' },
      { text: 'validateAsync()', link: '/zh/validate-async' },
      { text: '批量验证', link: '/zh/validate-batch' },
      { text: 'DSL 对象支持', link: '/zh/validate-dsl-object-support' },
      { text: '验证指南', link: '/zh/validation-guide' },
      { text: 'Validator', link: '/zh/validator' },
      { text: '条件 API', link: '/zh/conditional-api' },
      { text: '错误处理', link: '/zh/error-handling' },
      { text: 'String 扩展', link: '/zh/string-extensions' }
    ]
  },
  {
    text: '国际化',
    items: [
      { text: 'i18n 概览', link: '/zh/i18n' },
      { text: '多语言支持', link: '/zh/multi-language' },
      { text: 'i18n 用户指南', link: '/zh/i18n-user-guide' },
      { text: '前端 i18n 指南', link: '/zh/frontend-i18n-guide' },
      { text: '添加自定义语言包', link: '/zh/add-custom-locale' },
      { text: '动态语言切换', link: '/zh/dynamic-locale' },
      { text: '运行时 locale 支持', link: '/zh/runtime-locale-support' }
    ]
  },
  {
    text: '导出器',
    items: [
      { text: '导出指南', link: '/zh/export-guide' },
      { text: 'MongoDB 导出', link: '/zh/mongodb-exporter' },
      { text: 'MySQL 导出', link: '/zh/mysql-exporter' },
      { text: 'PostgreSQL 导出', link: '/zh/postgresql-exporter' },
      { text: 'Markdown 导出', link: '/zh/markdown-exporter' },
      { text: '导出限制', link: '/zh/export-limitations' }
    ]
  },
  {
    text: '工具类',
    items: [
      { text: 'SchemaUtils', link: '/zh/schema-utils' },
      { text: 'SchemaUtils 链式调用', link: '/zh/schema-utils-chaining' },
      { text: 'SchemaUtils 进阶问题', link: '/zh/schema-utils-advanced-issues' },
      { text: 'SchemaUtils 最佳实践', link: '/zh/schema-utils-best-practices' },
      { text: 'SchemaHelper', link: '/zh/schema-helper' },
      { text: 'CacheManager', link: '/zh/cache-manager' },
      { text: 'TypeConverter', link: '/zh/type-converter' },
      { text: 'label vs description', link: '/zh/label-vs-description' }
    ]
  },
  {
    text: '插件与扩展',
    items: [
      { text: '插件系统', link: '/zh/plugin-system' },
      { text: '添加关键字', link: '/zh/add-keyword' },
      { text: '类型注册', link: '/zh/plugin-type-registration' },
      { text: '自定义扩展', link: '/zh/custom-extensions-guide' },
      { text: 'TypeScript 指南', link: '/zh/typescript-guide' }
    ]
  },
  {
    text: '实践与排错',
    items: [
      { text: '最佳实践', link: '/zh/best-practices' },
      { text: '项目结构最佳实践', link: '/zh/best-practices-project-structure' },
      { text: '性能指南', link: '/zh/performance-guide' },
      { text: '安全检查清单', link: '/zh/security-checklist' },
      { text: '故障排查', link: '/zh/troubleshooting' },
      { text: 'FAQ', link: '/zh/faq' }
    ]
  },
  {
    text: 'API 参考',
    items: [
      { text: 'API 参考', link: '/zh/api-reference' },
      { text: 'API 概览', link: '/zh/api' },
      { text: '编译', link: '/zh/compile' },
      { text: 'JSON Schema 基础', link: '/zh/json-schema-basics' }
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
