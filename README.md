# 📸 TeleSnap

Turn Telegram Messages into Beautiful, Shareable Images.

## ✨ Features

- 🔗 **One-Click Convert** - Paste a Telegram link, instantly generate an image
- 🎨 **Multiple Backgrounds** - 8 beautiful gradient backgrounds to choose from
- 📐 **Custom Spacing** - Flexibly adjust padding around the card
- 🔒 **Hide Link** - Option to hide post link, show timestamp only
- 📥 **HD Export** - 4x scale for crisp, sharp images
- 📋 **Copy Source Link** - One-click copy of the original Telegram link
- 🖼️ **Multi-Media Support** - Renders photo albums, video thumbnails, and GIF badges
- 💬 **Reply & Forward** - Displays quoted replies and forwarded-from attribution
- ⚠️ **Smart Error Toasts** - Distinct notifications for private, restricted, and content-protected links
- 🛡️ **Secure & Reliable** - XSS protection, SSRF protection, rate limiting

## 🚀 Quick Start

### Requirements

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Eyozy/telesnap.git
cd telesnap

# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

Visit http://localhost:3000

### Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📁 Project Structure

```
telesnap/
├── app/
│   ├── assets/css/         # Global styles
│   ├── components/         # Vue components
│   │   ├── ActionButtons.vue    # Download/Copy buttons
│   │   ├── AppHeader.vue        # Top navigation bar
│   │   ├── CustomizePanel.vue   # Customization panel
│   │   └── TelegramCard.vue     # Telegram card component
│   ├── composables/        # Composable functions
│   │   └── useImageGenerator.ts # Image generation logic
│   ├── constants/          # Constant configurations
│   ├── pages/              # Page components
│   └── types/              # TypeScript type definitions
├── server/
│   ├── api/                # API endpoints
│   │   └── fetch-post.ts   # Fetch, parse & sanitize Telegram posts (media, reply, forwarded)
│   └── middleware/         # Server middleware
│       └── rate-limit.ts   # Rate limiting
├── public/                 # Static assets
├── nuxt.config.ts          # Nuxt configuration
└── package.json
```

## 🤝 Contributing

Issues and Pull Requests are welcome!

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details
