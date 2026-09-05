/**
 * Shared Markdown renderer for database-loaded descriptions (#215).
 *
 * Descriptions imported from 5e.tools are stored as Markdown (`**bold**`,
 * `*italic*`, `- lists`, `\n\n` paragraphs) in Supabase and copied onto
 * characters. Older rows may still contain the literal HTML (`<ul>/<li>`,
 * `<p>`, `<br>`, `<strong>/<em>`) that earlier app versions stored.
 *
 * Security model (escape-first):
 * - `html: false` means markdown-it never emits raw HTML: anything that looks
 *   like a tag is escaped, so guild-supplied markup can never execute.
 * - `legacyHtmlToMarkdown()` converts the small legacy HTML subset the app
 *   itself used to produce into Markdown before parsing. Everything else is
 *   left for markdown-it to escape.
 */
import MarkdownIt from 'markdown-it'

/**
 * Normalizes the legacy HTML subset (lists, breaks, paragraphs, emphasis)
 * that older app versions stored in descriptions into Markdown.
 *
 * Idempotent: text that is already Markdown passes through unchanged.
 * Unknown HTML is intentionally left alone — the renderer escapes it.
 */
export function legacyHtmlToMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    // <br> -> hard line break (two spaces + newline keeps working with breaks: false)
    .replace(/<br\s*\/?>/gi, '  \n')
    // <p>...</p> -> paragraph break
    .replace(/<p\b[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    // Emphasis tags -> Markdown emphasis
    .replace(/<strong\b[^>]*>/gi, '**')
    .replace(/<\/strong>/gi, '**')
    .replace(/<b\s*>/gi, '**')
    .replace(/<\/b>/gi, '**')
    .replace(/<em\b[^>]*>/gi, '*')
    .replace(/<\/em>/gi, '*')
    .replace(/<i\s*>/gi, '*')
    .replace(/<\/i>/gi, '*')
    // Lists -> Markdown list items (ordered lists degrade to bullets, which
    // is acceptable for legacy descriptions)
    .replace(/<li\b[^>]*>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<ul\b[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '')
    .replace(/<ol\b[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '')
}

const md = new MarkdownIt({
  // Escape-first: raw HTML in stored text is rendered as text, never markup.
  html: false,
  // Autolink http/https/ftp/mailto URLs (linkify-it is bundled with markdown-it).
  linkify: true,
  // Paragraphs come from \n\n, matching what the 5e.tools adapter produces.
  breaks: false,
})

/**
 * Renders a database-loaded description string into safe HTML.
 *
 * Legacy HTML is normalized to Markdown first; any remaining raw HTML is
 * escaped by markdown-it (`html: false`), so the returned markup only ever
 * contains parser-generated tags and is safe to bind with `v-html`.
 */
export function renderMarkdown(text: string): string {
  return md.render(legacyHtmlToMarkdown(text))
}
