<script setup>
import { onMounted, onUnmounted, ref, watch, computed, nextTick } from 'vue'

const props = defineProps({
  enabled: {
    type: Boolean,
    default: true
  },
  scriptContent: {
    type: String,
    default: ''
  },
  scriptContentDesktop: {
    type: String,
    default: ''
  },
  scriptContentMobile: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: 'IKLAN SPONSOR'
  },
  type: {
    type: String,
    default: 'banner' // 'sidebar', 'feed', 'pre-footer', 'in-article'
  }
})

const containerRef = ref(null)
const isMobileScreen = ref(false)

const checkScreenSize = () => {
  if (typeof window !== 'undefined') {
    isMobileScreen.value = window.innerWidth < 768
  }
}

// Compute active ad script depending on current screen width (Mobile vs Desktop)
const activeScriptContent = computed(() => {
  if (isMobileScreen.value) {
    // Mobile screen (< 768px): prioritize Mobile script, fall back to generic or Desktop script
    return (props.scriptContentMobile || '').trim() || (props.scriptContent || '').trim() || (props.scriptContentDesktop || '').trim()
  } else {
    // Desktop screen (>= 768px): prioritize Desktop script, fall back to generic or Mobile script
    return (props.scriptContentDesktop || '').trim() || (props.scriptContent || '').trim() || (props.scriptContentMobile || '').trim()
  }
})

const renderAd = async () => {
  if (!containerRef.value) return
  await nextTick()

  containerRef.value.innerHTML = ''

  const contentStr = activeScriptContent.value
  if (!contentStr) return

  const parser = new DOMParser()
  const parsedDoc = parser.parseFromString(contentStr, 'text/html')

  const nodes = [
    ...Array.from(parsedDoc.head.childNodes),
    ...Array.from(parsedDoc.body.childNodes)
  ]

  nodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'script') {
      const newScript = document.createElement('script')
      Array.from(node.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value))
      newScript.textContent = node.textContent
      containerRef.value.appendChild(newScript)
    } else if (node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent.trim())) {
      containerRef.value.appendChild(node.cloneNode(true))
    }
  })
}

onMounted(() => {
  checkScreenSize()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', checkScreenSize)
  }
  if (props.enabled) {
    renderAd()
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScreenSize)
  }
})

watch([activeScriptContent, () => props.enabled], () => {
  if (props.enabled) {
    renderAd()
  }
})
</script>

<template>
  <div v-if="enabled" class="w-full my-3 sm:my-4">
    <!-- Custom Ad Script Container -->
    <div
      v-if="activeScriptContent"
      ref="containerRef"
      class="w-full flex justify-center items-center overflow-hidden"
    ></div>

    <!-- Clean Editorial Ad Banner Placeholder -->
    <div
      v-else
      class="stitch-card p-4 sm:p-5 text-center bg-gradient-to-br from-[#fafafa] to-[#f4f4f5] border border-[#dfdfdf] rounded-[10px] space-y-2 relative overflow-hidden group transition-all"
      :class="{
        'py-7 sm:py-9': type === 'feed' || type === 'pre-footer' || type === 'in-article',
        'py-5': type === 'sidebar'
      }"
    >
      <div class="flex items-center justify-between text-[10px] font-mono tracking-wider text-[#707070] uppercase pb-2 border-b border-[#dfdfdf]/60">
        <span class="flex items-center gap-1.5 font-semibold text-[#171717]">
          <span class="w-2 h-2 rounded-full bg-[#2563eb]"></span>
          {{ label }} ({{ isMobileScreen ? 'MOBILE' : 'DESKTOP' }})
        </span>
        <span class="text-[9px] font-bold bg-[#2563eb]/10 text-[#1d4ed8] px-2 py-0.5 rounded border border-[#2563eb]/20">SLOT IKLAN</span>
      </div>

      <div class="py-2 space-y-1">
        <div class="text-xs sm:text-sm font-semibold text-[#171717]">
          Ruang Iklan Digital ({{ isMobileScreen ? 'Mobile HP' : 'Desktop PC' }})
        </div>
        <p class="text-[11px] text-[#707070] max-w-sm mx-auto leading-relaxed">
          Aktifkan & tempelkan skrip iklan {{ isMobileScreen ? 'Mobile (320x50/300x250)' : 'Desktop (728x90/160x600/300x250)' }} di Panel Admin.
        </p>
      </div>
    </div>
  </div>
</template>
