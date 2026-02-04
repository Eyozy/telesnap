import { readBody, createError } from 'h3'
import { parseHTML } from 'linkedom'

/** Telegram message data structure */
interface TelegramMessage {
  author: string
  username: string
  avatar: string | null
  content: string
  isoTimestamp: string | null
  views: number | null
  media: string | null
}

/** Telegram URL validation regex */
const TELEGRAM_URL_REGEX = /^https?:\/\/(t\.me|telegram\.me)\/([a-zA-Z0-9_]+)\/(\d+)$/

/** Allowed Telegram domains for SSRF protection */
const ALLOWED_HOSTS = ['t.me', 'telegram.me']

/** Request timeout in milliseconds */
const FETCH_TIMEOUT_MS = 10_000

/** Cache settings */
const CACHE_MAX_AGE = 300 // 5 minutes
const CACHE_STALE_MAX_AGE = 3600 // 1 hour stale-while-revalidate

/**
 * Validates that a URL is a legitimate Telegram URL.
 * Prevents SSRF attacks by strictly validating the hostname and protocol.
 */
function validateTelegramUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // Only allow exact Telegram domains
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return false
    }
    // Prevent protocol switching (must be HTTPS)
    if (parsed.protocol !== 'https:') {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * API endpoint to fetch and parse Telegram post data.
 * Uses DOM parsing and server-side caching for security and performance.
 */
export default defineCachedEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body

  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'Please provide a Telegram message link'
    })
  }

  // Validate URL format with regex
  const match = url.match(TELEGRAM_URL_REGEX)
  if (!match) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Telegram link format. Example: https://t.me/channel/123'
    })
  }

  // Additional SSRF protection: validate the URL strictly
  if (!validateTelegramUrl(url)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Telegram URL'
    })
  }

  const [, , channelName, messageId] = match

  try {
    // Use static page version (/s/) to get message with datetime attribute
    const staticUrl = `https://t.me/s/${channelName}/${messageId}`

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let response: Response
    try {
      response = await fetch(staticUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!response.ok) {
      throw createError({
        statusCode: 404,
        message: 'Cannot access this message. Please ensure the link is correct and the channel is public.'
      })
    }

    const html = await response.text()
    const messageData = parseTelegramPage(html, channelName, messageId)

    return messageData

  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string }
    console.error('Error fetching Telegram message:', err.message)

    if (err.statusCode) throw error

    throw createError({
      statusCode: 500,
      message: 'Failed to fetch message. Please try again later.'
    })
  }
}, {
  maxAge: CACHE_MAX_AGE,
  staleMaxAge: CACHE_STALE_MAX_AGE,
  swr: true,
  getKey: async (event) => {
    const body = await readBody(event)
    return `telegram:${body?.url || 'unknown'}`
  }
})

/**
 * Parses Telegram HTML page using DOM parser.
 * More secure and maintainable than regex-based parsing.
 */
function parseTelegramPage(html: string, channelName: string, messageId: string): TelegramMessage {
  // linkedom returns a DOM-like document object
  // Using 'any' here as linkedom lacks proper TypeScript types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { document } = parseHTML(html) as any

  // Find the specific message block by data-post attribute
  const messageBlock = document.querySelector(`[data-post="${channelName}/${messageId}"]`)
  const searchScope = messageBlock || document

  // Extract title from meta tag
  const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || ''
  const title = decodeHtmlEntities(ogTitle) || channelName

  // Parse author from title (format: "Author - Channel")
  const authorMatch = title.match(/^([^-]+)\s*-\s*.+$/)
  const author = authorMatch?.[1]?.trim() || title

  // Extract message content
  const contentEl = searchScope.querySelector('.tgme_widget_message_text')
  let content = contentEl?.innerHTML || ''

  // Clean content: convert <br> to newlines, strip unwanted tags
  content = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(?!\/?(?:a|b|i|strong|em|u|s|pre|code|span)\b)[^>]+>/gi, '')
    .trim()
  content = decodeHtmlEntities(content)

  // Extract avatar
  const avatarEl = searchScope.querySelector('.tgme_widget_message_user_photo img')
  const avatar = avatarEl?.getAttribute('src') || null

  // Extract post image from background-image style
  const photoWrap = searchScope.querySelector('.tgme_widget_message_photo_wrap')
  let postImage: string | null = null
  if (photoWrap) {
    const style = photoWrap.getAttribute('style') || ''
    const bgMatch = style.match(/background-image:\s*url\('([^']+)'\)/)
    postImage = bgMatch ? bgMatch[1] : null
  }

  // Fallback to og:image if no post image found
  // Removed because it often picks up the channel avatar for text-only posts
  // if (!postImage) {
  //   const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content')
  //   // Only use og:image if it's not an avatar
  //   if (ogImage && !ogImage.includes('userpic')) {
  //     postImage = ogImage
  //   }
  // }

  // Extract timestamp from time element
  const timeLink = document.querySelector(`a[href*="/${channelName}/${messageId}"] time`)
  const isoTimestamp = timeLink?.getAttribute('datetime') || null

  // Extract view count
  const viewsEl = searchScope.querySelector('.tgme_widget_message_views')
  let views: number | null = null
  if (viewsEl) {
    const viewsText = viewsEl.textContent || ''
    const cleanedViews = viewsText.replace(/[,\s]/g, '')
    // Handle K/M suffixes
    if (cleanedViews.endsWith('K')) {
      views = parseFloat(cleanedViews) * 1000
    } else if (cleanedViews.endsWith('M')) {
      views = parseFloat(cleanedViews) * 1000000
    } else {
      views = parseInt(cleanedViews) || null
    }
  }

  return {
    author,
    username: channelName,
    avatar,
    content: content.trim(),
    isoTimestamp,
    views,
    media: postImage
  }
}

/** Decode common HTML entities */
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  }
  return text.replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, match => entities[match] || match)
}