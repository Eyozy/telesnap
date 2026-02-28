<template>
  <div class="flex flex-row items-center justify-center gap-3">
    <!-- Download button -->
    <button
      @click="$emit('download')"
      :disabled="generating"
      class="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-medium py-2.5 sm:py-3 px-5 sm:px-8 rounded-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 cursor-pointer text-sm sm:text-base min-w-[140px]"
    >
      <Transition name="fade" mode="out-in">
        <span v-if="generating" key="generating" class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          Generating...
        </span>
        <span v-else key="download" class="flex items-center justify-center gap-2">
          <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Download
        </span>
      </Transition>
    </button>

    <!-- Copy button -->
    <button
      @click="handleCopy"
      class="bg-white hover:bg-slate-50 text-slate-700 font-medium py-2.5 sm:py-3 px-5 sm:px-8 rounded-xl transition-all flex items-center justify-center gap-2 border-2 border-slate-200 shadow-lg hover:shadow-xl cursor-pointer text-sm sm:text-base min-w-[120px]"
      :class="{ 'border-green-400 text-green-600': copied }"
    >
      <Transition name="fade" mode="out-in">
        <span v-if="copied" key="copied" class="flex items-center justify-center gap-2">
          <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Copied!
        </span>
        <span v-else key="copy" class="flex items-center justify-center gap-2">
          <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
          </svg>
          Copy
        </span>
      </Transition>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  generating?: boolean
  url: string
}

const props = withDefaults(defineProps<Props>(), {
  generating: false
})

const emit = defineEmits<{
  download: []
}>()

const copied = ref(false)

const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(props.url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // clipboard access denied — no-op
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
