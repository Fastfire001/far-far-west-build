// URL of the generated icon of each game item (assets/icons/<id>.svg, see scripts/build_icons.py).
const urls = import.meta.glob<string>('../../assets/icons/*.svg', { query: '?url', import: 'default', eager: true })

const byId = new Map(Object.entries(urls).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1, -'.svg'.length), url]))

export function iconUrl(id: string): string | undefined {
  return byId.get(id)
}
