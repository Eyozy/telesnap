<template>
  <div class="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Customize</h3>
    </div>

    <!-- Background selection -->
    <div class="mb-6">
      <label class="block text-sm font-semibold text-slate-700 mb-3">Background</label>
      <div class="grid grid-cols-4 gap-2">
        <button
          v-for="gradient in gradients"
          :key="gradient.name"
          @click="emit('update:gradient', gradient)"
          class="h-12 rounded-xl transition-all ring-2 ring-offset-2 cursor-pointer"
          :class="selectedGradient.name === gradient.name ? 'ring-blue-500 scale-105' : 'ring-transparent hover:ring-slate-300'"
          :style="{ background: gradient.preview }"
          :title="gradient.name"
        />
      </div>
    </div>

    <!-- Padding slider (only when background selected) -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      leave-active-class="transition-all duration-200 ease-in"
      enter-from-class="opacity-0 max-h-0 overflow-hidden"
      enter-to-class="opacity-100 max-h-32"
      leave-from-class="opacity-100 max-h-32"
      leave-to-class="opacity-0 max-h-0 overflow-hidden"
    >
      <div v-if="selectedGradient.name !== 'none'" class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-semibold text-slate-700">Spacing</label>
          <Transition
            enter-active-class="transition-opacity duration-200"
            leave-active-class="transition-opacity duration-150"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <button
              v-if="padding !== defaultPadding"
              @click="emit('update:padding', defaultPadding)"
              class="text-xs text-slate-500 hover:text-blue-500 transition-colors cursor-pointer flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Reset
            </button>
          </Transition>
        </div>
        <input
          :value="padding"
          @input="emit('update:padding', Number(($event.target as HTMLInputElement).value))"
          type="range"
          min="20"
          max="80"
          class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div class="flex justify-between text-xs text-slate-500 mt-2">
          <span>Compact</span>
          <span>Spacious</span>
        </div>
      </div>
    </Transition>

    <!-- Hide post link toggle -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <label class="text-sm font-semibold text-slate-700">Hide Post Link</label>
        <button
          @click="emit('update:hideLink', !hideLink)"
          class="w-12 h-6 rounded-full transition-colors duration-200 relative cursor-pointer"
          :class="hideLink ? 'bg-blue-600' : 'bg-slate-300'"
          role="switch"
          :aria-checked="hideLink"
          aria-label="Toggle hide post link"
        >
          <span
            class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-out shadow-sm"
            :class="hideLink ? 'translate-x-6' : 'translate-x-0'"
          />
        </button>
      </div>
      <Transition name="fade" mode="out-in">
        <p v-if="hideLink" key="hidden" class="text-xs text-slate-500">Hiding post link, showing time only</p>
        <p v-else key="shown" class="text-xs text-slate-500">Showing post link and timestamp</p>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Gradient } from '~/types'
import { DEFAULT_PADDING } from '~/constants'

interface Props {
  gradients: Gradient[]
  selectedGradient: Gradient
  padding?: number
  hideLink?: boolean
}

withDefaults(defineProps<Props>(), {
  padding: DEFAULT_PADDING,
  hideLink: false
})

const defaultPadding = DEFAULT_PADDING

const emit = defineEmits<{
  'update:gradient': [gradient: Gradient]
  'update:padding': [padding: number]
  'update:hideLink': [hideLink: boolean]
}>()
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

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
</style>
