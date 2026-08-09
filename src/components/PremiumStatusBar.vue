<script setup>
import { computed } from 'vue'
import { isPremium, premiumExpiresAt, clearPremium } from '../services/premiumStore.js'

const formattedExpiry = computed(() => {
  if (!premiumExpiresAt.value) return 'Selamanya'
  try {
    const d = new Date(premiumExpiresAt.value)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return premiumExpiresAt.value
  }
})

const handleLogout = () => {
  if (confirm('Apakah Anda yakin ingin mengakhiri sesi status Premium di perangkat ini?')) {
    clearPremium()
  }
}
</script>

<template>
  <div
    v-if="isPremium"
    class="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white py-2 px-4 text-xs font-mono shadow-md border-b border-amber-400/40 relative z-50"
  >
    <div class="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8  flex items-center justify-between gap-3">
      <div class="flex items-center gap-2 truncate">
        <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 text-white text-[10px] font-bold shrink-0">
          👑
        </span>
        <span class="font-bold tracking-wide truncate">PREMIUM AKTIF</span>
        <span class="hidden sm:inline text-amber-100">• Bebas Iklan & Direct Download</span>
        <span class="text-amber-200">| Expired: {{ formattedExpiry }}</span>
      </div>

      <button
        @click="handleLogout"
        class="shrink-0 px-2.5 py-1 rounded bg-amber-900/40 hover:bg-amber-900/60 text-amber-100 hover:text-white transition-colors text-[11px] font-sans font-semibold border border-white/20 cursor-pointer"
      >
        Keluar Premium
      </button>
    </div>
  </div>
</template>
