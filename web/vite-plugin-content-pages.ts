// Static content pages (src/pages/, see docs/build-planner.md, "Content pages"): rendered into the built site with
// the sitemap, their stylesheet, font and icons; served on request by the dev server.
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runnerImport, type Plugin, type ResolvedConfig } from 'vite'

/** Public address of the site: canonical URLs, links between languages and the sitemap. */
const SITE_URL = 'https://fastfire001.github.io/far-far-west-build/'

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url))
const SITE_MODULE = path('./src/pages/site.ts')

interface SiteOptions {
  base: string
  siteUrl: string
}

/** What src/pages/site.ts exports (not imported as a type: it relies on the app's path aliases). */
interface SiteModule {
  siteFiles(options: SiteOptions): { file: string; url: string; render(): Promise<string> }[]
  sitemap(options: SiteOptions): string
}

const TYPES: Record<string, string> = { css: 'text/css', svg: 'image/svg+xml', woff2: 'font/woff2' }

/** Files the pages use besides themselves, by path from the root of the site. */
function assets(): Map<string, () => string | Buffer> {
  const files = new Map<string, () => string | Buffer>([
    ['pages/style.css', () => readFileSync(path('./src/styles/main.css'), 'utf8') + readFileSync(path('./src/pages/pages.css'), 'utf8')],
    ['pages/oswald.woff2', () => readFileSync(path('./node_modules/@fontsource-variable/oswald/files/oswald-latin-wght-normal.woff2'))],
  ])
  for (const name of readdirSync(path('../assets/icons/'))) {
    files.set(`icons/${name}`, () => readFileSync(path(`../assets/icons/${name}`)))
  }
  return files
}

export function contentPages(): Plugin {
  let config: ResolvedConfig
  const options = () => ({ base: config.base, siteUrl: SITE_URL })

  return {
    name: 'content-pages',
    configResolved(resolved) {
      config = resolved
    },

    async generateBundle() {
      const { module: site } = await runnerImport<SiteModule>(SITE_MODULE, {
        configFile: false,
        root: config.root,
        resolve: { alias: config.resolve.alias },
        logLevel: 'warn',
      })
      for (const page of site.siteFiles(options())) {
        this.emitFile({ type: 'asset', fileName: page.file, source: await page.render() })
      }
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: site.sitemap(options()) })
      for (const [fileName, read] of assets()) this.emitFile({ type: 'asset', fileName, source: read() })
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? '').split('?')[0]
        try {
          const asset = url.startsWith(config.base) ? assets().get(url.slice(config.base.length)) : undefined
          if (asset) {
            res.setHeader('Content-Type', TYPES[url.split('.').pop()!] ?? 'application/octet-stream')
            res.end(asset())
            return
          }
          if (!url.endsWith('/') || url === config.base) return next()
          const site = (await server.ssrLoadModule(SITE_MODULE)) as SiteModule
          const page = site.siteFiles(options()).find((p) => p.url === url)
          if (!page) return next()
          res.setHeader('Content-Type', 'text/html; charset=utf-8')
          res.end(await page.render())
        } catch (error) {
          next(error)
        }
      })
    },
  }
}
