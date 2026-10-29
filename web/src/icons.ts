// Icon of each game item, found by id whatever its folder (icons/<type>/<id>.svg or .png): the hand-made one (at the
// root of assets/) if it exists, otherwise the game's (assets/game/, extracted by bin/extract-game).
const sources = [
  import.meta.glob<string>('../../assets/game/icons/**/*.{svg,png}', { query: '?url', import: 'default', eager: true }),
  import.meta.glob<string>('../../assets/icons/**/*.{svg,png}', { query: '?url', import: 'default', eager: true }),
]

/** Each later source overrides the earlier ones. */
const byId = new Map(
  sources.flatMap((files) =>
    Object.entries(files).map(([path, url]) => {
      const file = path.slice(path.lastIndexOf('/') + 1)
      return [file.slice(0, file.lastIndexOf('.')), { file, url }] as const
    }),
  ),
)

export function iconUrl(id: string): string | undefined {
  return byId.get(id)?.url
}

/** Name of the icon's file (<id>.svg or <id>.png): the content pages publish it as icons/<file>. */
export function iconFile(id: string): string | undefined {
  return byId.get(id)?.file
}
