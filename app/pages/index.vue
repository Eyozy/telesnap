<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100">
    <!-- Toast Notification Overlay -->
    <div class="fixed top-0 left-0 right-0 z-[999] flex flex-col items-center pt-4 px-4 pointer-events-none transition-all duration-300">
      <div 
        class="toast-wrapper flex flex-col items-center pointer-events-auto w-auto max-w-[90vw]"
        :class="showWarningToast ? 'toast-enter' : 'toast-leave'"
      >
        <div class="toast-tab flex items-center justify-center gap-1.5 font-semibold text-[13.5px] z-10" :class="activeToast.color">
          <svg class="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" v-html="activeToast.icon"></svg>
          <span class="text-slate-800">{{ activeToast.title }}</span>
        </div>
        <div class="toast-body flex items-center justify-center shadow-sm z-0">
          <div class="text-[14px] leading-snug text-slate-600 text-center font-medium">{{ activeToast.desc }}</div>
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
          <div class="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium tracking-wide">
            <span class="text-sm">💡</span>
            <span>Telesnap supports public channel & group links only.</span>
          </div>
        </div>

        <!-- Main Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start customization-grid">
          <!-- Preview Area -->
          <div ref="previewColRef" class="lg:col-span-2">
            <!-- Preview Card -->
            <div v-if="messageData" class="flex justify-center">
              <div ref="messageCardWrap" class="max-w-full">
                <TelegramCard
                  :message="messageData"
                  :url="cardUrl"
                  :gradient="selectedGradient"
                  :hide-link="hidePostLink"
                  :formatted-time="formattedTimestamp"
                />
              </div>
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
        <div v-if="messageData" class="mt-4 lg:mt-6 w-full flex justify-center">
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

const { generating, error: genError, downloadImage } = useImageGenerator()

const messageUrl = ref('')
const messageData = ref<MessageData | null>({ ...DEMO_MESSAGE })
const loading = ref(false)
const error = ref('')
const cardUrl = ref(DEFAULT_TELEGRAM_URL)
let errorTimeout: ReturnType<typeof setTimeout> | null = null

// Toast State
const showWarningToast = ref(false)
const activeToast = ref({ title: '', desc: '', color: 'text-red-500', icon: '' })
let toastTimeout: ReturnType<typeof setTimeout> | null = null

function showToast(title: string, desc: string, type: 'error' | 'warning' = 'error') {
  if (toastTimeout) clearTimeout(toastTimeout)
  activeToast.value = {
    title,
    desc,
    color: type === 'error' ? 'text-red-500' : 'text-amber-500',
    icon: type === 'error'
      ? `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>`
      : `<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>`
  }
  showWarningToast.value = true
  toastTimeout = setTimeout(() => { showWarningToast.value = false }, 4000)
}

function setError(message: string) {
  if (message) showToast('Extraction Failed', message, 'error')
}

const formattedTimestamp = ref('')

const selectedGradient = ref<Gradient>(GRADIENTS[0])
const hidePostLink = ref(false)

const messageCardWrap = ref<HTMLElement | null>(null)
const previewColRef = ref<HTMLElement | null>(null)
const panelColRef = ref<HTMLElement | null>(null)

let isPanelHeightLocked = false
watch(messageData, async () => {
  if (selectedGradient.value.name !== GRADIENTS[0].name || !panelColRef.value || !previewColRef.value || isPanelHeightLocked) return
  await nextTick()
  if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
    const height = previewColRef.value.offsetHeight
    if (height > 0) {
      panelColRef.value.style.height = height + 'px'
      isPanelHeightLocked = true
    }
  }
})

onMounted(() => {
  updateTimestamp()
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
    showToast('Invalid Input', 'Please enter a Telegram message link', 'warning')
    return
  }

  if (messageUrl.value.includes('/c/')) {
    showToast('Private Link', 'Private link detected. Try a public one.', 'error')
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
    const errorMsg = fetchError.data?.message || 'Failed to load message'
    showToast('Content Unavailable', errorMsg, 'error')
  } finally {
    loading.value = false
  }
}

async function handleDownload() {
  const element = messageCardWrap.value
  await downloadImage(element as HTMLElement)
  if (genError.value) {
    showToast('Download Failed', genError.value, 'error')
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
  } catch {
    // silent fail — fallback to static DEMO_MESSAGE
  }
}
</script>

<style scoped>
/* Toast Animations & Styling */
.toast-wrapper {
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.08)) drop-shadow(0 4px 6px rgba(0, 0, 0, 0.03));
}

.toast-enter {
  opacity: 1;
  transform: translateY(0);
}

.toast-leave {
  opacity: 0;
  transform: translateY(-30px);
}

.toast-tab {
  position: relative;
  background: #ffffff;
  border-radius: 12px 12px 0 0;
  padding: 6px 16px 6px 16px;
  --radius: 12px;
}

.toast-tab::before {
  content: "";
  position: absolute;
  width: var(--radius);
  height: var(--radius);
  left: calc(-1 * var(--radius));
  bottom: 0;
  background: radial-gradient(circle at 0 0, transparent calc(var(--radius) - 0.5px), #ffffff calc(var(--radius)));
}

.toast-tab::after {
  content: "";
  position: absolute;
  width: var(--radius);
  height: var(--radius);
  right: calc(-1 * var(--radius)); 
  bottom: 0;
  background: radial-gradient(circle at 100% 0, transparent calc(var(--radius) - 0.5px), #ffffff calc(var(--radius)));
}

.toast-body {
  background: #ffffff;
  border-radius: 16px;
  padding: 8px 16px;
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
