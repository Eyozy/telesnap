// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'TeleSnap - Turn Telegram Messages into Images',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content: 'Transform any Telegram message into a beautiful, shareable image instantly. Perfect for social media, documentation, and archiving. Free and easy to use.'
        },
        { name: 'keywords', content: 'telegram, image, converter, screenshot, share, telesnap' },
        { property: 'og:title', content: 'TeleSnap - Turn Telegram Messages into Images' },
        { property: 'og:description', content: 'Transform any Telegram message into a beautiful, shareable image instantly. Perfect for social media, documentation, and archiving. Free and easy to use.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'TeleSnap' },
        { property: 'og:url', content: 'https://tele-snap.vercel.app' },
        { property: 'og:image', content: 'https://tele-snap.vercel.app/og.jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'TeleSnap - Turn Telegram Messages into Images' },
        { name: 'twitter:description', content: 'Transform any Telegram message into a beautiful, shareable image instantly. Perfect for social media, documentation, and archiving.' },
        { name: 'twitter:image', content: 'https://tele-snap.vercel.app/og.jpg' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  }
})
