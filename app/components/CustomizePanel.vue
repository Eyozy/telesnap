<template>
  <div class="bg-white rounded-3xl border-2 border-slate-200 shadow-xl p-6 h-full flex flex-col justify-between">

    <!-- Header -->
    <h3 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">Customize</h3>

    <!-- Background selection -->
    <div class="flex-1">
      <label class="block text-sm font-semibold text-slate-700 mb-3">Background</label>
      <div class="grid grid-cols-4 gap-3">
        <button
          v-for="gradient in gradients"
          :key="gradient.name"
          @click="emit('update:gradient', gradient)"
          class="h-14 rounded-2xl cursor-pointer ring-2 ring-offset-2 transition-all"
          :class="selectedGradient.name === gradient.name
            ? 'ring-blue-500'
            : 'ring-transparent hover:ring-slate-300'"
          :style="{ background: gradient.preview }"
          :title="gradient.name"
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
