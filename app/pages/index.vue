<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-100">
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
            <input
              v-model="messageUrl"
              type="text"
              :placeholder="`${DEFAULT_TELEGRAM_URL}`"
              class="flex-1 px-5 py-3 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all text-slate-800 placeholder-slate-400"
            />
            <button
              @click="fetchMessage"
              :disabled="loading"
              class="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-3 px-6 rounded-xl transition-all disabled:cursor-not-allowed shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 cursor-pointer whitespace-nowrap min-w-[120px]"
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
          <p class="mt-2 text-xs text-slate-400 text-center">Private groups and channels are not supported</p>
        </div>

        <!-- Main Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start customization-grid">
          <!-- Preview Area -->
          <div class="lg:col-span-2">
            <!-- Preview Card -->
            <div v-if="messageData" class="flex justify-center">
              <TelegramCard
                ref="messageCard"
                :message="messageData"
                :url="cardUrl"
                :gradient="selectedGradient"
                :padding="cardPadding"
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

            <!-- Action Buttons -->
            <div v-if="messageData" class="mt-6 md:mt-8">
              <ActionButtons
                :generating="generating"
                :url="cardUrl"
                @download="handleDownload"
              />
            </div>
          </div>

          <!-- Customization Panel -->
          <div class="lg:col-span-1 customization-panel">
            <CustomizePanel
              :gradients="GRADIENTS"
              :selected-gradient="selectedGradient"
              :padding="cardPadding"
              :hide-link="hidePostLink"
              @update:gradient="selectedGradient = $event"
              @update:padding="cardPadding = $event"
              @update:hide-link="hidePostLink = $event"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { MessageData, Gradient } from '~/types'
import { DEFAULT_TELEGRAM_URL, DEMO_MESSAGE, GRADIENTS, DEFAULT_PADDING } from '~/constants'
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
const cardPadding = ref(DEFAULT_PADDING)
const hidePostLink = ref(false)

// Template ref
const messageCard = ref<{ $el: HTMLElement } | null>(null)

// Format timestamp on client side only
onMounted(() => {
  updateTimestamp()
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

function handleDownload() {
  const element = messageCard.value?.$el || messageCard.value
  downloadImage(element as HTMLElement)
  if (genError.value) {
    setError(genError.value)
  }
}
</script>

<style scoped>
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
