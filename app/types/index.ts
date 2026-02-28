export interface MessageData {
    author: string
    username: string
    avatar: string | null
    content: string
    views: number | null
    isoTimestamp: string | null
    media?: string[]
    mediaType?: 'photo' | 'video' | 'gif' | null
    forwardedFrom?: {
        name: string
        url: string | null
    } | null
    replyTo?: {
        author: string
        text: string
    } | null
}

export interface Gradient {
    name: string
    preview: string
    style: string
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    message?: string
}

export interface TelegramUrlParts {
    channel: string
    messageId: string
}
