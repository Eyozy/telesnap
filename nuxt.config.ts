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
          content: 'Turn any Telegram message into a beautiful, shareable image. Built with Nuxt 3 and Tailwind CSS.'
        },
        { name: 'keywords', content: 'telegram, image, converter, screenshot, share, telesnap' },
        { property: 'og:title', content: 'TeleSnap - Turn Telegram Messages into Images' },
        { property: 'og:description', content: 'Turn any Telegram message into a beautiful, shareable image.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/og.jpg' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'TeleSnap' },
        { name: 'twitter:description', content: 'Turn any Telegram message into a beautiful, shareable image.' },
        { name: 'twitter:image', content: '/og.jpg' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  }
})
