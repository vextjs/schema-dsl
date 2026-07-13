import {
  HomeLayout as OriginalHomeLayout,
  Layout as OriginalLayout,
  Button,
  Link,
  renderHtmlOrText,
  type HomeHeroProps,
  type LayoutProps,
  type HomeLayoutProps
} from '@rspress/core/theme-original';
import {
  normalizeImagePath,
  useFrontmatter,
  usePage,
  withBase
} from '@rspress/core/runtime';
import { useEffect } from 'react';
import {
  enhanceThemeSwitchControls,
  isKeyboardActivationKey
} from './accessibility';

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
      'A progressive TypeScript Schema DSL for concise, serializable field rules, validation, reuse, export, i18n and runtime isolation.',
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
      '渐进式 TypeScript Schema DSL，用简洁命令驱动验证、Schema 复用、多格式导出、国际化和运行时隔离。',
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

type HeroImage = {
  src?: string | { light?: string; dark?: string };
  alt?: string;
  srcset?: string | string[];
  sizes?: string | string[];
};

function normalizeImageList(value?: string | string[]) {
  const normalized = (Array.isArray(value) ? value : [value]).filter(Boolean).join(', ');
  return normalized || undefined;
}

export function HomeHero({ beforeHeroActions, afterHeroActions, image }: HomeHeroProps) {
  const { frontmatter } = useFrontmatter();
  const hero = frontmatter.hero ?? {};
  const heroImage = hero.image as HeroImage | undefined;
  const imageSource = typeof heroImage?.src === 'string'
    ? { light: heroImage.src, dark: heroImage.src }
    : heroImage?.src ?? { light: '', dark: '' };
  const heroText = hero.text
    ? hero.text.toString().split(/\n/g).filter(Boolean)
    : [];
  const hasImage = Boolean(image || heroImage);

  return (
    <div className={`rp-home-hero${hasImage ? '' : ' rp-home-hero--no-image'}`}>
      <div className="rp-home-hero__container">
        {hero.badge && (
          typeof hero.badge === 'string'
            ? <div className="rp-home-hero__badge">{hero.badge}</div>
            : hero.badge.link
              ? <Link className="rp-home-hero__badge" href={hero.badge.link}>{hero.badge.text}</Link>
              : <div className="rp-home-hero__badge">{hero.badge.text}</div>
        )}
        <div className="rp-home-hero__content">
          <h1 className="rp-home-hero__title">
            <span className="rp-home-hero__title-brand" {...renderHtmlOrText(hero.name)} />
          </h1>
          {heroText.map((text: string) => (
            <div className="rp-home-hero__subtitle" key={text} {...renderHtmlOrText(text)} />
          ))}
        </div>
        <p className="rp-home-hero__tagline" {...renderHtmlOrText(hero.tagline)} />
        {beforeHeroActions}
        <div className="rp-home-hero__actions">
          {hero.actions?.map((action: { link: string; text: string; theme?: 'brand' | 'alt' }) => (
            <Button
              className="rp-home-hero__action"
              href={action.link}
              key={action.link}
              theme={action.theme}
              type="a"
              {...renderHtmlOrText(action.text)}
            />
          ))}
        </div>
        {afterHeroActions}
      </div>
      {image ? (
        <div className="rp-home-hero__image">{image}</div>
      ) : heroImage ? (
        <div className="rp-home-hero__image">
          <img
            alt={heroImage.alt}
            className="rp-home-hero__image-img rp-home-hero__image-img--light"
            height={375}
            sizes={normalizeImageList(heroImage.sizes)}
            src={normalizeImagePath(imageSource.light ?? '')}
            srcSet={normalizeImageList(heroImage.srcset)}
            width={375}
          />
          <img
            alt={heroImage.alt}
            className="rp-home-hero__image-img rp-home-hero__image-img--dark"
            height={375}
            sizes={normalizeImageList(heroImage.sizes)}
            src={normalizeImagePath(imageSource.dark ?? '')}
            srcSet={normalizeImageList(heroImage.srcset)}
            width={375}
          />
        </div>
      ) : null}
    </div>
  );
}

function AccessibilityEnhancer() {
  const { page } = usePage();
  const lang = page.lang === 'zh' ? 'zh' : 'en';

  useEffect(() => {
    let searchTrigger: HTMLElement | null = null;
    let navTrigger: HTMLElement | null = null;
    let searchWasOpen = false;
    let navWasOpen = false;
    let themeRefreshFrame: number | null = null;

    const labels = lang === 'zh'
      ? {
        search: '搜索文档',
        searchDialog: '文档搜索',
        closeSearch: '关闭搜索',
        navigation: '移动端导航',
        darkTheme: '深色主题',
      }
      : {
        search: 'Search documentation',
        searchDialog: 'Documentation search',
        closeSearch: 'Close search',
        navigation: 'Mobile navigation',
        darkTheme: 'Dark theme',
      };

    const enhance = () => {
      const searchModal = document.querySelector<HTMLElement>('.rp-search-panel__modal');
      const searchInput = document.querySelector<HTMLInputElement>('.rp-search-panel__input');
      const searchClose = document.querySelector<HTMLElement>('.rp-search-panel__close');
      const searchCancel = document.querySelector<HTMLElement>('.rp-search-panel__cancel');
      const searchMobile = document.querySelector<HTMLElement>('.rp-search-button--mobile');
      const searchResults = document.querySelector<HTMLElement>('.rp-search-panel__results');

      if (searchModal) {
        searchModal.setAttribute('role', 'dialog');
        searchModal.setAttribute('aria-modal', 'true');
        searchModal.setAttribute('aria-label', labels.searchDialog);
      }
      if (searchInput) {
        searchInput.setAttribute('aria-label', labels.search);
        searchInput.setAttribute('aria-autocomplete', 'list');
      }
      if (searchResults) {
        searchResults.id = 'sdl-search-results';
        searchResults.setAttribute('role', 'listbox');
        searchInput?.setAttribute('aria-controls', searchResults.id);
        const options = searchResults.querySelectorAll<HTMLElement>('.rp-suggest-item');
        let activeOptionId: string | undefined;
        options.forEach((option, index) => {
          option.id = `sdl-search-option-${index}`;
          option.setAttribute('role', 'option');
          const selected = option.classList.contains('rp-suggest-item--current');
          option.setAttribute('aria-selected', String(selected));
          if (selected) activeOptionId = option.id;
        });
        if (activeOptionId) searchInput?.setAttribute('aria-activedescendant', activeOptionId);
        else searchInput?.removeAttribute('aria-activedescendant');
      }
      for (const control of [searchClose, searchCancel, searchMobile]) {
        if (!control) continue;
        control.setAttribute('role', 'button');
        control.tabIndex = 0;
      }
      searchClose?.setAttribute('aria-label', labels.closeSearch);
      searchCancel?.setAttribute('aria-label', labels.closeSearch);
      searchMobile?.setAttribute('aria-label', labels.search);

      const navScreen = document.querySelector<HTMLElement>('.rp-nav-screen--open');
      if (navScreen) {
        navScreen.id = 'sdl-mobile-navigation';
        navScreen.setAttribute('role', 'dialog');
        navScreen.setAttribute('aria-modal', 'true');
        navScreen.setAttribute('aria-label', labels.navigation);
      }
      document.querySelectorAll<HTMLElement>('.rp-nav-hamburger').forEach(button => {
        button.setAttribute('aria-label', labels.navigation);
        button.setAttribute('aria-controls', 'sdl-mobile-navigation');
        button.setAttribute('aria-expanded', String(Boolean(navScreen)));
      });
      enhanceThemeSwitchControls(
        document,
        document.documentElement.classList.contains('dark'),
        labels.darkTheme
      );

      const searchIsOpen = Boolean(searchModal);
      const navIsOpen = Boolean(navScreen);
      if (searchWasOpen && !searchIsOpen && searchTrigger?.isConnected) searchTrigger.focus();
      if (navWasOpen && !navIsOpen && navTrigger?.isConnected) navTrigger.focus();
      searchWasOpen = searchIsOpen;
      navWasOpen = navIsOpen;
    };

    const onClick = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const nextSearchTrigger = target?.closest<HTMLElement>('.rp-search-button, .rp-search-button--mobile');
      const nextNavTrigger = target?.closest<HTMLElement>('.rp-nav-hamburger');
      const nextThemeTrigger = target?.closest<HTMLElement>('.rp-switch-appearance');
      if (nextSearchTrigger) searchTrigger = nextSearchTrigger;
      if (nextNavTrigger) navTrigger = nextNavTrigger;
      if (nextThemeTrigger) {
        if (themeRefreshFrame !== null) cancelAnimationFrame(themeRefreshFrame);
        themeRefreshFrame = requestAnimationFrame(() => {
          themeRefreshFrame = null;
          enhance();
        });
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const keyboardControl = target?.closest<HTMLElement>(
        '.rp-search-button--mobile, .rp-search-panel__close, .rp-search-panel__cancel, .rp-switch-appearance'
      );
      if (keyboardControl && isKeyboardActivationKey(event.key)) {
        event.preventDefault();
        keyboardControl.click();
      }
      if (event.key === 'Escape') {
        document.querySelector<HTMLElement>('.rp-nav-hamburger__sm.rp-nav-hamburger--active')?.click();
      }
    };

    const observer = new MutationObserver(enhance);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: true
    });
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown);
    enhance();

    return () => {
      observer.disconnect();
      if (themeRefreshFrame !== null) cancelAnimationFrame(themeRefreshFrame);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [lang]);

  return null;
}

export function Layout(props: LayoutProps) {
  return (
    <>
      <OriginalLayout {...props} HomeLayout={HomeLayout} />
      <AccessibilityEnhancer />
    </>
  );
}

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
