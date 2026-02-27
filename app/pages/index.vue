<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100">
    <!-- Toast Notification Overlay -->
    <div class="fixed top-0 left-0 right-0 z-[999] flex flex-col items-center pt-8 px-4 pointer-events-none transition-all duration-300">
      <div 
        class="toast-element flex items-center gap-3 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl py-3 px-4 w-full max-w-sm pointer-events-auto"
        :class="showWarningToast ? 'toast-enter' : 'toast-leave'"
      >
        <div class="flex-shrink-0 flex items-center justify-center text-amber-500 px-1">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <div class="flex-1 min-w-0 flex flex-col justify-center text-left">
          <p class="text-[14px] font-medium text-slate-800 leading-tight">Cannot read private link</p>
          <p class="text-[12px] text-slate-500 mt-0.5 whitespace-normal break-words">Please use a public Telegram message link</p>
        </div>
      </div>
    </div>

    <!-- Header -->
    <AppHeader />

    <!-- Main Content -->
    <main class="pt-24 pb-12 px-4 sm:px-6">
      <div class="max-w-5xl mx-auto">
        <!-- Hero Section -->
        <div class="text-center mb-8 md:mb-12">
          <h2 class="hero-title font-bold text-slate-900 mb-3 md:mb-4 tracking-tight">
            Turn Telegram Messages into Images
          </h2>
          <p class="hero-desc text-slate-600 max-w-2xl mx-auto px-2">
            Transform any Telegram post into a beautiful, customizable image instantly.
          </p>
        </div>

        <!-- URL Input -->
        <div class="max-w-2xl mx-auto mb-8 md:mb-12">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <input
                v-model="messageUrl"
                type="text"
                :placeholder="`${DEFAULT_TELEGRAM_URL}`"
                aria-label="Telegram Message URL"
                class="w-full px-5 py-3 pr-10 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-slate-800 placeholder-slate-400"
              />
              <!-- Clear button -->
              <button
                v-if="messageUrl"
                @click="messageUrl = ''"
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Clear input"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              @click="fetchMessage"
              :disabled="loading || !messageUrl"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl cursor-pointer whitespace-nowrap min-w-[120px]"
            >
              <Transition name="fade" mode="out-in">
                <span v-if="loading" key="loading" class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Loading
                </span>
                <span v-else key="generate">Generate</span>
              </Transition>
            </button>
          </div>
          <p v-if="error" class="mt-2 text-sm text-red-500">{{ error }}</p>
          <p class="mt-2 text-xs text-slate-500 text-center">Private groups and channels are not supported</p>
        </div>

        <!-- Main Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start customization-grid">
          <!-- Preview Area -->
          <div ref="previewColRef" class="lg:col-span-2">
            <!-- Preview Card -->
            <div v-if="messageData" class="flex justify-center">
              <TelegramCard
                ref="messageCard"
                :message="messageData"
                :url="cardUrl"
                :gradient="selectedGradient"
                :hide-link="hidePostLink"
                :formatted-time="formattedTimestamp"
              />
            </div>

            <!-- Empty State -->
            <div v-else class="flex justify-center">
              <div class="text-center py-20">
                <div class="w-20 h-20 mx-auto mb-6 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <p class="text-slate-500">Paste a Telegram link to see the preview</p>
              </div>
            </div>
          </div>

          <!-- Customization Panel -->
          <div ref="panelColRef" class="lg:col-span-1 customization-panel">
            <CustomizePanel
              :gradients="GRADIENTS"
              :selected-gradient="selectedGradient"
              :hide-link="hidePostLink"
              @update:gradient="selectedGradient = $event"
              @update:hide-link="hidePostLink = $event"
            />
          </div>
        </div>

        <!-- Action Buttons (outside grid, centered below both panels) -->
        <div v-if="messageData" class="mt-4 lg:mt-8">
          <ActionButtons
            :generating="generating"
            :url="cardUrl"
            @download="handleDownload"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import type { MessageData, Gradient } from '~/types'
import { DEFAULT_TELEGRAM_URL, DEMO_MESSAGE, GRADIENTS } from '~/constants'
import { useImageGenerator } from '~/composables/useImageGenerator'

// Composables
const { generating, error: genError, downloadImage } = useImageGenerator()

// State
const messageUrl = ref('')
const messageData = ref<MessageData | null>({ ...DEMO_MESSAGE })
const loading = ref(false)
const error = ref('')
const cardUrl = ref(DEFAULT_TELEGRAM_URL)
let errorTimeout: ReturnType<typeof setTimeout> | null = null

// Toast State
const showWarningToast = ref(false)
let toastTimeout: ReturnType<typeof setTimeout> | null = null

function triggerWarningToast() {
  if (toastTimeout) clearTimeout(toastTimeout)
  showWarningToast.value = true
  toastTimeout = setTimeout(() => {
    showWarningToast.value = false
  }, 3000)
}

// Auto-clear error after 5 seconds
function setError(message: string) {
  if (errorTimeout) clearTimeout(errorTimeout)
  error.value = message
  if (message) {
    errorTimeout = setTimeout(() => {
      error.value = ''
    }, 5000)
  }
}
const formattedTimestamp = ref('')

// Customization state
const selectedGradient = ref<Gradient>(GRADIENTS[0])
const hidePostLink = ref(false)

// Template ref
const messageCard = ref<{ $el: HTMLElement } | null>(null)
const previewColRef = ref<HTMLElement | null>(null)
const panelColRef = ref<HTMLElement | null>(null)

// Capture and lock the panel height once when data loads at default gradient
watch(messageData, async () => {
  if (selectedGradient.value.name !== GRADIENTS[0].name || !panelColRef.value || !previewColRef.value) return
  await nextTick()
  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
    panelColRef.value.style.height = previewColRef.value.offsetHeight + 'px'
  }
})

// Format timestamp on client side only
onMounted(() => {
  updateTimestamp()
  // Fetch demo message with real avatar on mount
  fetchDemoMessage()
})

function updateTimestamp() {
  if (messageData.value?.isoTimestamp) {
    const date = new Date(messageData.value.isoTimestamp)
    formattedTimestamp.value = date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', ' at')
  }
}

async function fetchMessage() {
  if (!messageUrl.value) {
    setError('Please enter a Telegram message link')
    return
  }

  // Pre-flight check: Detect private group/channel links (containing /c/)
  if (messageUrl.value.includes('/c/')) {
    triggerWarningToast()
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/fetch-post', {
      method: 'POST',
      body: { url: messageUrl.value }
    })
    messageData.value = response as MessageData
    cardUrl.value = messageUrl.value
    updateTimestamp()
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } }
    setError(fetchError.data?.message || 'Failed to load message')
  } finally {
    loading.value = false
  }
}

async function handleDownload() {
  const element = messageCard.value?.$el || messageCard.value
  await downloadImage(element as HTMLElement)
  if (genError.value) {
    setError(genError.value)
  }
}

async function fetchDemoMessage() {
  try {
    const response = await $fetch('/api/fetch-post', {
      method: 'POST',
      body: { url: DEFAULT_TELEGRAM_URL }
    })
    messageData.value = response as MessageData
    cardUrl.value = DEFAULT_TELEGRAM_URL
    updateTimestamp()
  } catch (err) {
    // Silent fail - fallback to static DEMO_MESSAGE
    console.log('Failed to fetch demo message, using fallback')
  }
}
</script>

<style scoped>
/* Toast Animations & Styling */
.toast-element {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.1);
  will-change: transform, opacity;
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 10px 15px -3px rgba(0, 0, 0, 0.02),
    0 20px 25px -5px rgba(0, 0, 0, 0.02),
    0 0 0 1px rgba(0, 0, 0, 0.04) inset;
}

.toast-enter {
  opacity: 1;
  transform: translateY(0);
}

.toast-leave {
  opacity: 0;
  transform: translateY(-20px);
}

.hero-title {
  font-size: clamp(1.75rem, 5vw, 3rem);
  line-height: 1.2;
}

.hero-desc {
  font-size: clamp(0.95rem, 2vw, 1.125rem);
  line-height: 1.6;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

@media (max-width: 1023px) {
  .customization-panel {
    max-width: 42rem;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
