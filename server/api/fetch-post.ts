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
  media: string[]
  mediaType?: 'photo' | 'video' | 'gif' | null
  forwardedFrom: {
    name: string
    url: string | null
  } | null
  replyTo?: { author: string; text: string } | null
}

const TELEGRAM_URL_REGEX = /^https?:\/\/(t\.me|telegram\.me)\/(c\/\d+|[a-zA-Z0-9_]+)\/(\d+)$/
const ALLOWED_HOSTS = ['t.me', 'telegram.me']

const FETCH_TIMEOUT_MS = 10_000
const IMAGE_FETCH_TIMEOUT_MS = 5_000

async function imageToBase64(url: string): Promise<string | null> {
  if (!url) return null

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    })
    clearTimeout(timeoutId)

    if (!response.ok) return null

    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return `data:${contentType};base64,${base64}`
  } catch {
    return null
  }
}

const CACHE_MAX_AGE = 300
const CACHE_STALE_MAX_AGE = 3600

function validateTelegramUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) return false
    if (parsed.protocol !== 'https:') return false
    return true
  } catch {
    return false
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { url } = body

  if (!url) {
    throw createError({
      statusCode: 400,
      message: 'Please provide a Telegram message link'
    })
  }

  const match = url.match(TELEGRAM_URL_REGEX)
  if (!match) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Telegram link format. Examples: https://t.me/channel/123 or https://t.me/c/1234567890/123'
    })
  }

  if (!validateTelegramUrl(url)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Telegram URL'
    })
  }

  const [, , channelName, messageId] = match

  try {
    const embedUrl = `https://t.me/${channelName}/${messageId}?embed=1&mode=tme`
    let messageData = await fetchAndParse(embedUrl, channelName, messageId, true)

    if (!messageData) {
      const staticUrl = `https://t.me/s/${channelName}/${messageId}`
      messageData = await fetchAndParse(staticUrl, channelName, messageId, false)
    }

    if (!messageData) {
      throw createError({
        statusCode: 404,
        message: 'Message could not be extracted.'
      })
    }

    const mediaPromises = messageData.media ? messageData.media.map(m => imageToBase64(m)) : []
    const [avatarBase64, ...mediaBase64s] = await Promise.all([
      messageData.avatar ? imageToBase64(messageData.avatar) : Promise.resolve(null),
      ...mediaPromises
    ])

    if (messageData.avatar) messageData.avatar = avatarBase64
    if (messageData.media && messageData.media.length > 0) {
      const validMedia = mediaBase64s.filter(m => m !== null) as string[]
      messageData.media = validMedia
    }

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
})

async function fetchAndParse(url: string, channelName: string, messageId: string, isEmbed: boolean): Promise<TelegramMessage | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  let response: Response
  try {
    response = await fetch(url, {
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
  return parseTelegramPage(html, channelName, messageId, isEmbed)
}

function parseTelegramPage(html: string, channelName: string, messageId: string, isEmbed: boolean): TelegramMessage | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { document } = parseHTML(html) as any

  const messageBlock = document.querySelector(`[data-post="${channelName}/${messageId}"]`)

  if (!isEmbed && !messageBlock) return null

  const searchScope = messageBlock || document

  const errorEl = searchScope.querySelector('.tgme_widget_message_error')
  if (errorEl) {
    const errorText = errorEl.textContent || 'Access denied by Telegram.'
    const errorLower = errorText.toLowerCase()

    // Check if error is related to content protection
    if (errorLower.includes('protected') || errorLower.includes('restricted') || errorLower.includes('forwarding')) {
      throw createError({
        statusCode: 403,
        message: 'This channel has content protection enabled. Cannot extract message content.'
      })
    }

    throw createError({
      statusCode: 400,
      message: errorText
    })
  }

  const authorNameEl = searchScope.querySelector('.tgme_widget_message_author_name') || searchScope.querySelector('.tgme_widget_message_owner_name')
  let author = authorNameEl?.textContent?.trim() || ''

  if (!author) {
    const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || ''
    author = decodeHtmlEntities(ogSiteName)
  }

  if (!author) {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || ''
    const title = decodeHtmlEntities(ogTitle) || channelName
    const authorMatch = title.match(/^([^-]+)\s*-\s*.+$/)
    author = authorMatch?.[1]?.trim() || title
  }

  if (!author) {
    author = channelName
  }

  const messageWidget = searchScope.querySelector('.tgme_widget_message')

  // Multi-layer content protection detection
  const protectionClasses = ['noforwards', 'no-forwards', 'protected', 'restricted', 'tgme_protected']
  const hasProtectionClass = protectionClasses.some(cls => messageWidget?.classList?.contains(cls))

  const hasProtectionAttr = messageWidget?.hasAttribute('data-protected') ||
                            messageWidget?.hasAttribute('data-noforwards')

  if (hasProtectionClass || hasProtectionAttr) {
    throw createError({
      statusCode: 403,
      message: 'This channel has content protection enabled. Cannot extract message content.'
    })
  }

  const contentEl = searchScope.querySelector('.tgme_widget_message_text.js-message_text') || searchScope.querySelector('.tgme_widget_message_text')

  if (contentEl) {
    contentEl.querySelector('.tgme_widget_message_reply')?.remove()
  }

  let content = contentEl?.innerHTML || ''

  content = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<i[^>]*class="[^"]*emoji[^"]*"[^>]*>(?:<b>)?([^<]*)(?:<\/b>)?<\/i>/gi, '$1')
    .replace(/<(?!\/?(?:a|b|i|strong|em|u|s|pre|code|span|blockquote)\b)[^>]+>/gi, '')
    .trim()
  content = decodeHtmlEntities(content)

  if (!content) {
    const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || ''
    content = decodeHtmlEntities(ogDescription)
  }

  // Validate content authenticity - detect placeholder/protected content indicators
  const protectedIndicators = [
    'this message is protected',
    'content not available',
    'restricted content',
    'protected content',
    '此消息受保护',
    '内容不可用',
    '受限内容'
  ]
  const contentLower = content.toLowerCase().trim()
  const isPlaceholder = protectedIndicators.some(indicator => contentLower.includes(indicator)) ||
                        (content.trim().length > 0 && content.trim().length < 5 && /^[.*\-_]+$/.test(content.trim()))

  if (isPlaceholder) {
    throw createError({
      statusCode: 403,
      message: 'This content appears to be protected or unavailable.'
    })
  }

  const hasMedia = searchScope.querySelector('.tgme_widget_message_video_player') || searchScope.querySelector('.tgme_widget_message_photo_wrap')
  if (!content && !hasMedia) {
    throw createError({
      statusCode: 404,
      message: 'Message appears to be empty or protected. Cannot generate image.'
    })
  }

  let avatar = null
  const avatarImg = messageBlock?.querySelector('.tgme_widget_message_user_photo img') || searchScope.querySelector('.tgme_widget_message_user_photo img')

  if (avatarImg) {
    avatar = avatarImg.getAttribute('src') || avatarImg.getAttribute('data-src') || null
  }

  if (!avatar) {
    const avatarIcon = messageBlock?.querySelector('i.tgme_widget_message_user_photo') || searchScope.querySelector('i.tgme_widget_message_user_photo')
    if (avatarIcon) {
      const bgMatch = (avatarIcon.getAttribute('style') || '').match(/background-image:\s*url\('([^']+)'\)/)
      if (bgMatch) avatar = bgMatch[1]
    }
  }

  let mediaArray: string[] = []
  let mediaType: TelegramMessage['mediaType'] = null

  const videoPlayer = searchScope.querySelector('.tgme_widget_message_video_player')
  if (videoPlayer) {
    if (videoPlayer.classList?.contains('js-message_gif') || searchScope.querySelector('.tgme_widget_message_document_icon_gif')) {
      mediaType = 'gif'
    } else {
      mediaType = 'video'
    }

    const thumb = videoPlayer.querySelector('.tgme_widget_message_video_thumb')
    if (thumb) {
      const bgMatch = (thumb.getAttribute('style') || '').match(/background-image:\s*url\('([^']+)'\)/)
      if (bgMatch) mediaArray.push(bgMatch[1])
    }
  }

  if (mediaArray.length === 0) {
    const photoWraps = searchScope.querySelectorAll('.tgme_widget_message_photo_wrap')
    if (photoWraps && photoWraps.length > 0) {
      mediaType = 'photo'
      Array.from(photoWraps).forEach((wrap: any) => {
        const bgMatch = (wrap.getAttribute('style') || '').match(/background-image:\s*url\('([^']+)'\)/)
        if (bgMatch && !mediaArray.includes(bgMatch[1])) mediaArray.push(bgMatch[1])
      })
    }
  }

  const timeLink = document.querySelector(`a[href*="/${channelName}/${messageId}"] time`)
  const isoTimestamp = timeLink?.getAttribute('datetime') || null

  const viewsEl = searchScope.querySelector('.tgme_widget_message_views')
  let views: number | null = null
  if (viewsEl) {
    const viewsText = viewsEl.textContent || ''
    const cleanedViews = viewsText.replace(/[,\s]/g, '')
    if (cleanedViews.endsWith('K')) {
      views = parseFloat(cleanedViews) * 1000
    } else if (cleanedViews.endsWith('M')) {
      views = parseFloat(cleanedViews) * 1000000
    } else {
      views = parseInt(cleanedViews) || null
    }
  }

  const forwardedEl = searchScope.querySelector('.tgme_widget_message_forwarded_from')
  let forwardedFrom: TelegramMessage['forwardedFrom'] = null
  if (forwardedEl) {
    const nameEl = forwardedEl.querySelector('.tgme_widget_message_forwarded_from_name')
    const name = nameEl?.textContent?.trim() || ''
    const url = nameEl?.getAttribute('href') || null
    if (name) forwardedFrom = { name, url }
  }

  const replyEl = searchScope.querySelector('.tgme_widget_message_reply')
  let replyTo = null
  if (replyEl) {
    const replyAuthor = replyEl.querySelector('.tgme_widget_message_author_name')?.textContent?.trim()
    const replyText = replyEl.querySelector('.tgme_widget_message_text')?.textContent?.trim()
    if (replyAuthor) replyTo = { author: replyAuthor, text: replyText || '' }
  }

  return {
    author,
    username: channelName,
    avatar,
    content: content.trim(),
    isoTimestamp,
    views,
    media: mediaArray,
    mediaType,
    forwardedFrom,
    replyTo
  }
}

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