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

          <!-- Message content -->
          <div>
            <div 
              class="message-content whitespace-pre-wrap break-words leading-relaxed text-[15px] text-slate-800" 
              v-html="sanitizedContent"
            />
            <div v-if="message.media" class="mt-4 rounded-xl overflow-hidden border border-slate-100">
              <img :src="message.media" class="w-full h-auto object-cover" alt="post-media" loading="lazy" />
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

// Track avatar loading state
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

// Reset avatar state when message changes
watch(() => props.message.avatar, () => {
  avatarFailed.value = false
})

const containerStyle = computed(() => ({
  padding: props.gradient.name !== 'none' ? '32px' : '0'
}))

const cardClasses = computed(() => ({
  'w-fit max-w-full': true
}))

/**
 * Converts plain URLs in text to clickable blue links.
 * Handles: http/https URLs, www. prefix, and bare domain names.
 */
function linkifyUrls(text: string): string {
  // Regex to match URLs: 
  // - http:// or https:// URLs
  // - www. prefixed URLs
  // - domain.tld patterns (e.g., example.com, t.me/path)
  const urlPattern = /(?<![\"'=])(?:https?:\/\/[^\s<>]+|www\.[^\s<>]+|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+(?:com|org|net|io|me|co|dev|app|ai|xyz|info|biz|tv|cc|ru|cn|uk|de|fr|jp|kr|in|br|au|ca|nl|it|es|ch|se|no|fi|dk|pl|cz|at|be|pt|gr|tr|ua|il|sa|ae|sg|hk|tw|nz|za|mx|ar|cl|pe|co\.uk|com\.br|co\.jp|com\.au|co\.nz|co\.za)(?:\/[^\s<>]*)?)/gi
  
  return text.replace(urlPattern, (url) => {
    // Skip if already inside an anchor tag (check for preceding href=")
    const href = url.startsWith('http') ? url : `https://${url}`
    // Use inline styles for image export compatibility (CSS classes don't work in snapdom)
    return `<a href="${href}" style="color: #2563eb; text-decoration: none;" target="_blank" rel="noopener">${url}</a>`
  })
}

const sanitizedContent = computed(() => {
  if (!props.message?.content) return ''
  
  // DOMPurify only works in browser, skip sanitization during SSR
  // The component will re-render on client with proper sanitization
  if (!import.meta.client) {
    return props.message.content
  }
  
  // First sanitize the HTML
  let content = DOMPurify.sanitize(props.message.content, {
    ALLOWED_TAGS: ALLOWED_HTML_TAGS,
    ALLOWED_ATTR: ALLOWED_HTML_ATTRS
  })
  
  // Add inline styles to existing anchor tags for image export compatibility
  content = content.replace(/<a\s+([^>]*?)>/gi, (match, attrs) => {
    // If style attribute already exists, append to it; otherwise add it
    if (attrs.includes('style=')) {
      return match.replace(/style="([^"]*)"/i, 'style="$1; color: #2563eb; text-decoration: none;"')
    }
    return `<a ${attrs} style="color: #2563eb; text-decoration: none;">`
  })
  
  // Then linkify URLs that aren't already wrapped in anchor tags
  // Split by existing anchor tags to avoid double-wrapping
  const parts = content.split(/(<a[^>]*>.*?<\/a>)/gi)
  content = parts.map(part => {
    // If it's an anchor tag, leave it alone (already styled above)
    if (part.match(/^<a[^>]*>/i)) {
      return part
    }
    // Otherwise, linkify URLs in this part
    return linkifyUrls(part)
  }).join('')
  
  return content
})

// Expose $el for parent components to access root element
defineExpose({})
</script>

<style scoped>
.message-card {
  transition: all 0.3s ease;
}

.message-content a {
  color: #2563eb;
  text-decoration: none;
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
