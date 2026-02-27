<template>
  <div class="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 lg:h-full lg:flex lg:flex-col lg:justify-between">

    <!-- Header -->
    <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Customize</h3>

    <!-- Background selection -->
    <div class="lg:flex-1">
      <label class="block text-sm font-semibold text-slate-700 mb-3">Background</label>
      <div class="grid grid-cols-8 lg:grid-cols-4 gap-2 lg:gap-3">
        <button
          v-for="gradient in gradients"
          :key="gradient.name"
          @click="emit('update:gradient', gradient)"
          class="w-full aspect-square lg:aspect-auto lg:h-14 rounded-xl lg:rounded-2xl cursor-pointer ring-2 ring-offset-2 transition-all shadow-sm lg:shadow-none hover:shadow-md lg:hover:shadow-none hover:-translate-y-0.5 lg:hover:translate-y-0"
          :class="[
            selectedGradient.name === gradient.name ? 'ring-blue-500' : 'ring-transparent hover:ring-slate-300',
            gradient.name === 'none' ? 'bg-checkerboard' : ''
          ]"
          :style="gradient.name !== 'none' ? { background: gradient.preview } : {}"
          :title="gradient.name"
          :aria-label="'Set background to ' + gradient.name"
        />
      </div>
    </div>

    <!-- Hide post link toggle -->
    <div class="mt-6">
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

interface Props {
  gradients: readonly Gradient[]
  selectedGradient: Gradient
  hideLink?: boolean
}

withDefaults(defineProps<Props>(), {
  hideLink: false
})

const emit = defineEmits<{
  'update:gradient': [gradient: Gradient]
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
</style>

<style>
/* CSS Checkerboard Pattern for transparent background previews */
.bg-checkerboard {
  background-color: #ffffff !important;
  background-image: 
    linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0),
    linear-gradient(45deg, #e2e8f0 25%, transparent 25%, transparent 75%, #e2e8f0 75%, #e2e8f0) !important;
  background-size: 16px 16px !important;
  background-position: 0 0, 8px 8px !important;
}
</style>
