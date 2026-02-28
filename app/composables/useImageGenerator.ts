import { ref } from 'vue'
import { snapdom } from '@zumer/snapdom'

/**
 * Composable for generating and downloading images from DOM elements.
 * Handles DOM cloning, styling, and cleanup with proper memory management.
 */
export function useImageGenerator() {
    const generating = ref(false)
    const error = ref('')

    /**
     * Generates and downloads an image from a DOM element.
     * @param element - The HTML element to capture
     * @param filename - Optional filename prefix (defaults to 'telegram-message')
     */
    const downloadImage = async (element: HTMLElement | null, filename = 'telegram-message') => {
        if (!element) {
            error.value = 'No element to capture'
            return
        }

        generating.value = true
        error.value = ''
        let hiddenContainer: HTMLElement | null = null

        try {
            // Create hidden container for the clone
            hiddenContainer = document.createElement('div')
            hiddenContainer.style.cssText = 'position: fixed; left: -9999px; top: 0; z-index: -1;'
            document.body.appendChild(hiddenContainer)

            // Clone and style the element
            const clone = element.cloneNode(true) as HTMLElement
            clone.style.width = '672px' // 42rem fixed width
            clone.style.maxWidth = 'none'

            // Export styling: background no radius; card has radius only when background exists
            const bgDiv = clone.querySelector(':scope > div:first-child') as HTMLElement | null
            const hasBackground = bgDiv && bgDiv.style.background && bgDiv.style.background !== 'transparent'
            const whiteCard = clone.querySelector('.bg-white') as HTMLElement | null

            if (bgDiv) bgDiv.style.borderRadius = '0'
            if (whiteCard && !hasBackground) whiteCard.style.borderRadius = '0'

            // Show full URL (remove truncation)
            const linkSpan = clone.querySelector('.truncate')
            if (linkSpan) linkSpan.classList.remove('truncate')

            // Prevent date wrapping
            const dateSpan = clone.querySelector('.flex-shrink-0.ml-auto') as HTMLElement | null
            if (dateSpan) dateSpan.style.whiteSpace = 'nowrap'

            hiddenContainer.appendChild(clone)

            // Wait for fonts and styles
            await document.fonts.ready
            await new Promise(resolve => setTimeout(resolve, 50))

            // Generate and download
            const result = await snapdom(clone)
            await result.download({
                filename: `${filename}-${Date.now()}.png`,
                scale: 2
            })
        } catch (err: unknown) {
            console.error('Failed to generate image:', err)

            // Provide specific error messages based on error type
            const errorObj = err as { name?: string; message?: string }
            if (errorObj.name === 'SecurityError') {
                error.value = 'Cannot capture: cross-origin image detected. Please try a different post.'
            } else if (errorObj.message?.includes('memory') || errorObj.message?.includes('Memory')) {
                error.value = 'Image too large. Try reducing the content size.'
            } else if (errorObj.name === 'AbortError') {
                error.value = 'Image generation was cancelled.'
            } else {
                error.value = 'Failed to generate image. Please try again.'
            }
        } finally {
            generating.value = false
            // Always cleanup to prevent memory leaks
            if (hiddenContainer?.parentNode) {
                document.body.removeChild(hiddenContainer)
            }
        }
    }

    return {
        generating,
        error,
        downloadImage
    }
}
