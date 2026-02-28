<template>
  <div class="message-card relative" :class="cardClasses" :style="containerStyle">
    <!-- Background gradient -->
    <div
      v-if="gradient.name !== 'none'"
      class="absolute inset-0"
      :style="{ background: gradient.style }"
    />

    <!-- Card content -->
    <div class="relative z-10">
      <div
        class="bg-white shadow-2xl ring-1 ring-black/5 overflow-hidden w-[42rem] max-w-full rounded-2xl"
      >
        <div class="px-6 pt-6 pb-4">
          <!-- Author section -->
          <div class="flex items-start gap-4 mb-4">
            <div class="flex-shrink-0">
              <img
                v-if="message.avatar && !avatarFailed"
                :src="message.avatar"
                class="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100"
                alt="avatar"
                loading="lazy"
                @error="avatarFailed = true"
              />
              <div v-else class="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                {{ message.author?.charAt(0).toUpperCase() || '?' }}
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-slate-900 text-base">{{ message.author || 'Unknown' }}</div>
              <div v-if="message.username" class="text-blue-600 text-sm">@{{ message.username }}</div>
              <!-- Forwarded source indicator -->
              <div v-if="message.forwardedFrom" class="text-slate-500 text-xs mt-1 flex items-center gap-1">
                <span>↪</span>
                <span>Forwarded from</span>
                <a
                  v-if="message.forwardedFrom.url"
                  :href="message.forwardedFrom.url"
                  class="text-blue-600 hover:underline"
                  style="color: #2563eb;"
                  target="_blank"
                  rel="noopener"
                >{{ message.forwardedFrom.name }}</a>
                <span v-else>{{ message.forwardedFrom.name }}</span>
              </div>
            </div>
          </div>

          <!-- Message content and Quotes -->
          <div>
            <!-- Quoted Reply Component -->
            <div v-if="message.replyTo" class="relative mb-2 pl-2.5 cursor-pointer max-w-full">
              <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-blue-500 rounded-sm"></div>
              <div class="text-[14px] font-semibold text-blue-500 leading-tight mb-0.5 truncate">{{ message.replyTo.author }}</div>
              <div class="text-[14px] text-slate-600 leading-snug truncate">{{ message.replyTo.text }}</div>
            </div>
            <div 
              class="message-content whitespace-pre-wrap break-words leading-relaxed text-[15px] text-slate-800" 
              v-html="sanitizedContent"
            />
            <div v-if="message.media && message.media.length > 0" class="mt-4 rounded-xl overflow-hidden border border-slate-100 relative media-grid" :class="'media-grid-' + Math.min(message.media.length, 4)">
              <!-- Map through max 4 images -->
              <template v-for="(img, idx) in message.media.slice(0, 4)" :key="idx">
                <div class="relative w-full h-full" :class="{ 'item-0': message.media.length === 3 && idx === 0 }">
                  <img :src="img" class="media-item" alt="post-media" loading="lazy" />
                  
                  <!-- Badges on the first image only -->
                  <template v-if="idx === 0">
                    <!-- Video Badge Overlay -->
                    <div v-if="message.mediaType === 'video'" class="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div class="w-14 h-14 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm">
                        <svg class="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    
                    <!-- GIF Badge Overlay -->
                    <div v-if="message.mediaType === 'gif'" class="absolute top-3 left-3 pointer-events-none">
                      <div class="bg-black/40 text-white text-[11px] font-bold px-2 py-1 rounded backdrop-blur-sm tracking-wider uppercase shadow-sm">
                        GIF
                      </div>
                    </div>
                  </template>
                  
                  <!-- Overflow Cover for 4+ images (applied to the 4th item) -->
                  <div v-if="idx === 3 && message.media.length > 4" class="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                    <span class="text-white text-3xl font-bold tracking-tight">+{{ message.media.length - 4 }}</span>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-white border-t border-slate-100">
          <div class="flex flex-wrap items-center justify-between text-xs text-slate-500 gap-y-2 gap-x-4">
            <Transition name="slide-fade" mode="out-in">
              <div v-if="!hideLink" key="link" class="flex items-center gap-2 min-w-0 max-w-full">
                <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span class="truncate">{{ url }}</span>
              </div>
              <div v-else key="no-link" class="min-w-0" />
            </Transition>
            <span v-if="formattedTime" class="flex-shrink-0 ml-auto whitespace-nowrap">{{ formattedTime }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import DOMPurify from 'dompurify'
import type { MessageData, Gradient } from '~/types'
import { ALLOWED_HTML_TAGS, ALLOWED_HTML_ATTRS } from '~/constants'

const avatarFailed = ref(false)

interface Props {
  message: MessageData
  url: string
  gradient: Gradient
  hideLink?: boolean
  formattedTime?: string
}

const props = withDefaults(defineProps<Props>(), {
  hideLink: false,
  formattedTime: ''
})

watch(() => props.message.avatar, () => {
  avatarFailed.value = false
})

const containerStyle = computed(() => ({
  padding: props.gradient.name !== 'none' ? '32px' : '0'
}))

const cardClasses = computed(() => ({
  'w-fit max-w-full': true
}))

function linkifyUrls(text: string): string {
  const urlPattern = /(?<!["'=])(?:https?:\/\/[^\s<>]+|www\.[^\s<>]+|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|org|net|io|me|co|dev|app|ai|xyz|info|biz|tv|cc|ru|cn|uk|de|fr|jp|kr|in|br|au|ca|nl|it|es|ch|se|no|fi|dk|pl|cz|at|be|pt|gr|tr|ua|il|sa|ae|sg|hk|tw|nz|za|mx|ar|cl|pe|co\.uk|com\.br|co\.jp|com\.au|co\.nz|co\.za)(?:\/[^\s<>]*)?)/gi
  return text.replace(urlPattern, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`
    return `<a href="${href}" style="color: #2563eb; text-decoration: none;" target="_blank" rel="noopener">${url}</a>`
  })
}

const sanitizedContent = computed(() => {
  if (!props.message?.content) return ''
  if (!import.meta.client) return props.message.content

  let content = DOMPurify.sanitize(props.message.content, {
    ALLOWED_TAGS: ALLOWED_HTML_TAGS,
    ALLOWED_ATTR: ALLOWED_HTML_ATTRS
  })

  content = content.replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
    if (attrs.includes('style=')) {
      return match.replace(/style="([^"]*)"/i, 'style="$1; color: #2563eb; text-decoration: none;"')
    }
    return `<a ${attrs} style="color: #2563eb; text-decoration: none;">`
  })

  const textParts = content.split(/(<[^>]*>)/)
  for (let i = 0; i < textParts.length; i++) {
    const part = textParts[i]
    if (i % 2 === 0 && part) {
      let newText = part.replace(/(^|[\s(（【'"])(#[^\s#<.,!?;:()（）【】'"]+)/g, '$1<span style="color: #2563eb;">$2</span>')
      newText = newText.replace(/([^\s])(#[^\s#<.,!?;:()（）【】'"]+)/g, '$1<span style="color: #2563eb;">$2</span>')
      newText = newText.replace(/<span style="color: #2563eb;"><span style="color: #2563eb;">/g, '<span style="color: #2563eb;">').replace(/<\/span><\/span>/g, '</span>')
      textParts[i] = newText
    }
  }
  content = textParts.join('')

  const parts = content.split(/(<a[^>]*>.*?<\/a>)/gi)
  content = parts.map(part => {
    if (part.match(/^<a[^>]*>/i)) return part
    return linkifyUrls(part)
  }).join('')

  return content
})

defineExpose({})
</script>

<style scoped>
.message-card {
  transition: all 0.3s ease;
}

/* Message formatting */
.message-content a {
  color: #2563eb;
  text-decoration: none;
}

.message-content :deep(blockquote) {
  border-left: 3px solid #cbd5e1; /* slate-300 */
  padding-left: 10px;
  margin-top: 6px;
  margin-bottom: 6px;
  font-style: normal;
}

/* Media Grid System */
.media-grid {
  display: grid;
  gap: 4px;
  border-radius: 0.75rem;
  overflow: hidden;
}

/* 1 Image: Display single column. Keep original ratio. */
.media-grid-1 {
  grid-template-columns: 1fr;
}
.media-grid-1 .media-item {
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* 2 Images: 2 columns, equal width */
.media-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.media-grid-2 .media-item {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
}

/* 3 Images: 1 large left, 2 stacked right */
.media-grid-3 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  aspect-ratio: 16 / 9;
}
.media-grid-3 .item-0 {
  grid-row: span 2;
  height: 100%;
}
.media-grid-3 .media-item {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 4 Images: 2x2 grid */
.media-grid-4 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  aspect-ratio: 3 / 2;
}
.media-item {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-fade-enter-active {
  transition: all 0.2s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.15s ease-in;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}
</style>
