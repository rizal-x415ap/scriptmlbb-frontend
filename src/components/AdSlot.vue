<script setup>
import { onMounted, ref, watch, nextTick } from 'vue'

const props = defineProps({
  enabled: {
    type: Boolean,
    default: true
  },
  scriptContent: {
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

const renderAd = async () => {
  if (!containerRef.value) return
  await nextTick()

  containerRef.value.innerHTML = ''

  const contentStr = (props.scriptContent || '').trim()
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
  if (props.enabled && props.scriptContent) {
    renderAd()
  }
})

watch(() => props.scriptContent, () => {
  if (props.enabled) {
    renderAd()
  }
})
</script>

<template>
  <div v-if="enabled" class="w-full my-3 sm:my-4">
    <!-- Custom Ad Script Container -->
    <div
      v-if="scriptContent && scriptContent.trim()"
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
          {{ label }}
        </span>
        <span class="text-[9px] font-bold bg-[#2563eb]/10 text-[#1d4ed8] px-2 py-0.5 rounded border border-[#2563eb]/20">SLOT IKLAN</span>
      </div>

      <div class="py-2 space-y-1">
        <div class="text-xs sm:text-sm font-semibold text-[#171717]">
          Ruang Iklan Digital (Ad Space)
        </div>
        <p class="text-[11px] text-[#707070] max-w-sm mx-auto leading-relaxed">
          Aktifkan & tempelkan kode skrip iklan Anda (Google AdSense / Media Banner) melalui Panel Admin.
        </p>
      </div>
    </div>
  </div>
</template>
