import { defineEventHandler, createError, getHeader } from 'h3'

// Simple in-memory rate limiter
// For production, consider using Redis-backed solution for multi-instance support
const requestCounts = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = 30 // Maximum requests per window
const WINDOW_MS = 60_000 // 1 minute window
const CLEANUP_INTERVAL_MS = 300_000 // Cleanup every 5 minutes

// Periodic cleanup to prevent memory leak
// Removes expired entries from the map
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function startCleanupInterval() {
    if (cleanupInterval) return

    cleanupInterval = setInterval(() => {
        const now = Date.now()
        for (const [ip, record] of requestCounts) {
            if (now > record.resetTime) {
                requestCounts.delete(ip)
            }
        }
    }, CLEANUP_INTERVAL_MS)
}

// Start cleanup on module load
startCleanupInterval()

export default defineEventHandler((event) => {
    // Only apply rate limiting to API routes
    if (!event.path?.startsWith('/api/')) {
        return
    }

    // Get client identifier (IP address)
    const forwarded = getHeader(event, 'x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() ||
        getHeader(event, 'x-real-ip') ||
        event.node.req.socket.remoteAddress ||
        'unknown'

    const now = Date.now()
    const record = requestCounts.get(ip)

    // Reset expired windows
    if (!record || now > record.resetTime) {
        requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS })
        return
    }

    // Check if rate limit exceeded
    if (record.count >= RATE_LIMIT) {
        throw createError({
            statusCode: 429,
            statusMessage: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.'
        })
    }

    // Increment request count
    record.count++
})
