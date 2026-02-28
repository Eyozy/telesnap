export const DEFAULT_TELEGRAM_URL = 'https://t.me/durov/32'

export const DEMO_MESSAGE = {
    author: 'Pavel Durov',
    username: 'durov',
    avatar: 'https://cdn4.telesco.pe/file/NzOZlDrVnZ0FXjzF9A6GUMxz02hcv-Vx4OxOihcpRsFZ8kWiJj5o6ciNTX3Q7cCu2ykAb9sZf-S3LgJFC7OMEg_zH4NXDrngWOnYnYl-Df5aoGdxGCfZeETr24obSHm9R8BvVSPYLKdSvy4zltPNXb0zyfDhKacV3QKzM9WYwvCXBDTuYC3NGc-EaGS1flmdHzReTr1nW_xXzBzgVOnueApTbEYR_L2TrFQCKYgFToShPJ7MQqMSvCLOtPm6jyeDjNqO1hZbA8_ZqIBgoWMYUpjA8MjfsDsHNKRXWX61Re4p4Kwgzo7moEi1uuF5GEq9p7M8OokUk9G90xAl5s7ofg.jpg',
    content: "As some of you might have guessed, apart from jogging bathing and rowing we did some work this week. Lots of @telegram users asked for the possibility to have larger limits for groups and the ability appoint admins in groups. So we were working on it most of this week.\n\nNot me, obviously – I was mainly bathing and rowing (someone has to do the really hard stuff).",
    views: 1000000,
    isoTimestamp: '2015-10-30T13:34:00+00:00',
    media: [] as string[]
} as const

export const GRADIENTS = [
    { name: 'none', preview: 'transparent', style: 'transparent' },
    { name: 'blue', preview: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)', style: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' },
    { name: 'purple', preview: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', style: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)' },
    { name: 'sunset', preview: 'linear-gradient(135deg, #fdba74 0%, #f43f5e 100%)', style: 'linear-gradient(135deg, #fdba74 0%, #f43f5e 100%)' },
    { name: 'mint', preview: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)', style: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' },
    { name: 'rose', preview: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)', style: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)' },
    { name: 'slate', preview: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', style: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)' },
    { name: 'telegram', preview: 'linear-gradient(135deg, #24A1DE 0%, #1a8bc2 100%)', style: 'linear-gradient(135deg, #24A1DE 0%, #1a8bc2 100%)' },
] as const

export const DEFAULT_PADDING = 32

export const RATE_LIMIT = {
    MAX_REQUESTS: 30,
    WINDOW_MS: 60_000
} as const

export const TELEGRAM_URL_REGEX = /^https?:\/\/(t\.me|telegram\.me)\/(c\/\d+|[a-zA-Z0-9_]+)\/(\d+)$/

export const ALLOWED_HTML_TAGS = ['a', 'b', 'i', 'strong', 'em', 'u', 's', 'pre', 'code', 'br', 'span', 'blockquote']
export const ALLOWED_HTML_ATTRS = ['href', 'class', 'style', 'target', 'rel', 'expandable']
