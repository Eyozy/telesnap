// Centralized type definitions for the application

/** Telegram message data structure */
export interface MessageData {
    author: string
    username: string
    avatar: string | null
    content: string
    views: number | null
    isoTimestamp: string | null
    media?: string | null
}

/** Background gradient option */
export interface Gradient {
    name: string
    preview: string
    style: string
}

/** API response wrapper */
export interface ApiResponse<T> {
    success: boolean
    data?: T
    message?: string
}

/** Parsed Telegram URL parts */
export interface TelegramUrlParts {
    channel: string
    messageId: string
}
