// URL of the icon of each game item: the hand-drawn one (assets/icons/<type>/<id>.svg) if it exists, otherwise the
// generated one (assets/ai/icons/<type>/<id>.svg, see scripts/build_icons.py). Found by id, whatever the folder.
const generated = import.meta.glob<string>('../../assets/ai/icons/**/*.svg', { query: '?url', import: 'default', eager: true })
const handDrawn = import.meta.glob<string>('../../assets/icons/**/*.svg', { query: '?url', import: 'default', eager: true })

const byId = new Map(
  [...Object.entries(generated), ...Object.entries(handDrawn)].map(([path, url]) => [
    path.slice(path.lastIndexOf('/') + 1, -'.svg'.length),
    url,
  ]),
)

export function iconUrl(id: string): string | undefined {
  return byId.get(id)
}
