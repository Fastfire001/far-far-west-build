// Minimal HTML templating for the static content pages: interpolated values are escaped, unless they are Html
// themselves (built with html`` or raw()).
export class Html {
  constructor(readonly value: string) {}

  toString(): string {
    return this.value
  }
}

export type Part = Html | string | number | null | undefined | false | Part[]

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export function escape(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ENTITIES[c])
}

function render(part: Part): string {
  if (part instanceof Html) return part.value
  if (Array.isArray(part)) return part.map(render).join('')
  if (part === null || part === undefined || part === false) return ''
  return escape(String(part))
}

export function html(strings: TemplateStringsArray, ...values: Part[]): Html {
  return new Html(strings.reduce((out, string, i) => out + render(values[i - 1]) + string))
}

/** Trusted markup, inserted as it is. */
export function raw(markup: string): Html {
  return new Html(markup)
}
