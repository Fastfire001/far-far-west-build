// The HTML document around each content page: head (title, description, canonical URL, the page in the other
// languages, link previews, breadcrumbs as JSON-LD), the site's header and footer. No JavaScript.
import { gameMeta } from '@/domain/gameData'
import { DEFAULT_LOCALE, LANGUAGE_NAMES, LOCALES } from '@/i18n'
import type { Context, Page, PageContent } from './context'
import { html, raw } from './html'
import { pagePath } from './routes'

const SECTIONS = [
  ['jokers', 'jokers/'],
  ['weapons', 'weapons/'],
  ['spells', 'spells/'],
  ['progression', 'progression/'],
] as const

/** Open Graph locale: fr_FR, es_419... */
function ogLocale(locale: string): string {
  return locale.replace('-', '_')
}

export function renderDocument(ctx: Context, page: Page, content: PageContent): string {
  const crumbs = [{ label: ctx.t('site'), url: ctx.planner(), absolute: ctx.siteUrl }].concat(
    content.crumbs.map((c) => ({ label: c.label, url: ctx.href(c.path), absolute: ctx.absolute(c.path) })),
  )
  const breadcrumbList = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [...crumbs, { label: content.heading, absolute: ctx.absolute(page.path) }].map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      item: c.absolute,
    })),
  }
  // "</" cannot appear inside a <script> element.
  const jsonLd = JSON.stringify(breadcrumbList).replace(/<\//g, '<\\/')
  const current = page.path.split('/')[0] + '/'

  return `<!doctype html>\n${html`<html lang="${ctx.locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${content.title}</title>
<meta name="description" content="${content.description}" />
<link rel="canonical" href="${ctx.absolute(page.path)}" />
${LOCALES.map((l) => html`<link rel="alternate" hreflang="${l}" href="${ctx.absolute(page.path, l)}" />\n`)}<link rel="alternate" hreflang="x-default" href="${ctx.absolute(page.path, DEFAULT_LOCALE)}" />
<link rel="icon" type="image/svg+xml" href="${ctx.icon('itemHero')}" />
<link rel="stylesheet" href="${ctx.base}pages/style.css" />
<meta name="theme-color" content="#1d272d" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="${ctx.t('site')}" />
<meta property="og:title" content="${content.title}" />
<meta property="og:description" content="${content.description}" />
<meta property="og:url" content="${ctx.absolute(page.path)}" />
<meta property="og:locale" content="${ogLocale(ctx.locale)}" />
<meta property="og:image" content="${ctx.siteUrl}og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<script type="application/ld+json">${raw(jsonLd)}</script>
</head>
<body>
<header class="site-header">
  <a class="brand" href="${ctx.planner()}">${ctx.t('site')}</a>
  <nav class="sections">
    ${SECTIONS.map(([key, path]) => html`<a href="${ctx.href(path)}"${current === path ? raw(' aria-current="page"') : ''}>${ctx.t(`nav.${key}`)}</a>`)}
  </nav>
  <details class="languages">
    <summary>${ctx.t('language', { name: LANGUAGE_NAMES[ctx.locale] })}</summary>
    <ul>
      ${LOCALES.map((l) => html`<li><a href="${ctx.base}${pagePath(l, page.path)}" hreflang="${l}" lang="${l}"${l === ctx.locale ? raw(' aria-current="true"') : ''}>${LANGUAGE_NAMES[l]}</a></li>`)}
    </ul>
  </details>
  <a class="plank-button" href="${ctx.planner()}">${ctx.t('nav.planner')}</a>
</header>
<main class="page content">
  <nav class="breadcrumbs" aria-label="${ctx.t('nav.breadcrumbs')}">
    <ol>${crumbs.map((c) => html`<li><a href="${c.url}">${c.label}</a></li>`)}</ol>
  </nav>
  <h1>${content.heading}</h1>
  ${content.body}
</main>
<footer class="site-footer">
  <p>${ctx.t('footer', { version: gameMeta.game_version, date: ctx.date(gameMeta.extracted_on) })}</p>
  <p><a href="https://github.com/Fastfire001/far-far-west-build">${ctx.t('source')}</a></p>
</footer>
</body>
</html>`.value}\n`
}
