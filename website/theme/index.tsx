import {
  HomeLayout as OriginalHomeLayout,
  type HomeLayoutProps
} from '@rspress/core/theme-original';
import { usePage, withBase } from '@rspress/core/runtime';

export * from '@rspress/core/theme-original';

type FooterLink = {
  text: string;
  href: string;
  external?: boolean;
};

type FooterCopy = {
  description: string;
  groups: Array<{
    title: string;
    links: FooterLink[];
  }>;
};

const footerCopy: Record<'en' | 'zh', FooterCopy> = {
  en: {
    description:
      'A compact JSON Schema validation toolkit for DSL rules, reusable validation and multi-format schema export.',
    groups: [
      {
        title: 'Docs',
        links: [
          { text: 'Quick start', href: '/quick-start' },
          { text: 'Document index', href: '/doc-index' },
          { text: 'API reference', href: '/api-reference' }
        ]
      },
      {
        title: 'Capabilities',
        links: [
          { text: 'DSL syntax', href: '/dsl-syntax' },
          { text: 'Export guide', href: '/export-guide' },
          { text: 'TypeScript guide', href: '/typescript-guide' }
        ]
      },
      {
        title: 'Project',
        links: [
          {
            text: 'GitHub',
            href: 'https://github.com/vextjs/schema-dsl',
            external: true
          },
          {
            text: 'Changelog',
            href: 'https://github.com/vextjs/schema-dsl/blob/main/CHANGELOG.md',
            external: true
          },
          {
            text: 'Apache-2.0',
            href: 'https://github.com/vextjs/schema-dsl/blob/main/LICENSE',
            external: true
          }
        ]
      }
    ]
  },
  zh: {
    description:
      '面向 DSL 规则、可复用校验与多格式 schema 导出的紧凑 JSON Schema 验证工具。',
    groups: [
      {
        title: '文档',
        links: [
          { text: '快速上手', href: '/zh/quick-start' },
          { text: '文档索引', href: '/zh/doc-index' },
          { text: 'API 参考', href: '/zh/api-reference' }
        ]
      },
      {
        title: '能力',
        links: [
          { text: 'DSL 语法', href: '/zh/dsl-syntax' },
          { text: '导出指南', href: '/zh/export-guide' },
          { text: 'TypeScript 指南', href: '/zh/typescript-guide' }
        ]
      },
      {
        title: '项目',
        links: [
          {
            text: 'GitHub',
            href: 'https://github.com/vextjs/schema-dsl',
            external: true
          },
          {
            text: '更新日志',
            href: 'https://github.com/vextjs/schema-dsl/blob/main/CHANGELOG.md',
            external: true
          },
          {
            text: 'Apache-2.0',
            href: 'https://github.com/vextjs/schema-dsl/blob/main/LICENSE',
            external: true
          }
        ]
      }
    ]
  }
};

function SchemaDslFooter() {
  const { page } = usePage();
  const lang = page.lang === 'zh' ? 'zh' : 'en';
  const copy = footerCopy[lang];

  return (
    <footer className="sdl-home-footer" aria-labelledby="sdl-home-footer-title">
      <div className="sdl-home-footer__inner">
        <div className="sdl-home-footer__brand">
          <strong id="sdl-home-footer-title">schema-dsl</strong>
          <span>{copy.description}</span>
        </div>
        <nav
          className="sdl-home-footer__grid"
          aria-label={lang === 'zh' ? '首页页脚导航' : 'Home footer navigation'}
        >
          {copy.groups.map(group => (
            <div className="sdl-home-footer__group" key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map(link => (
                <a
                  href={link.external ? link.href : withBase(link.href)}
                  key={link.text}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  target={link.external ? '_blank' : undefined}
                >
                  {link.text}
                </a>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </footer>
  );
}

export function HomeLayout(props: HomeLayoutProps) {
  return (
    <OriginalHomeLayout
      {...props}
      afterFeatures={
        <>
          {props.afterFeatures}
          <SchemaDslFooter />
        </>
      }
    />
  );
}
