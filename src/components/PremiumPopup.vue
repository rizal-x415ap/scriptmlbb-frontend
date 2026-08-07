<script setup>
import { ref, onMounted, computed } from 'vue'
import { isPremium, activateToken, shouldShowPopup, dismissPopup, loadPremiumStatus } from '../services/premiumStore.js'
import { siteSettings } from '../services/settingsStore.js'

const isVisible = ref(false)
const tokenInput = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const whatsappBuyUrl = computed(() => {
  return siteSettings.premiumBuyUrl || 'https://wa.me/6281234567890?text=Halo%20Admin,%20saya%20mau%20beli%20token%20premium%20blog'
})

const priceText = computed(() => {
  return siteSettings.premiumMonthlyPrice || '5.000'
})

onMounted(async () => {
  // Ensure background verification completes BEFORE deciding to display pop-up
  await loadPremiumStatus()

  setTimeout(() => {
    if (!isPremium.value && shouldShowPopup()) {
      isVisible.value = true
    }
  }, 2000)
})

const handleClose = () => {
  isVisible.value = false
  dismissPopup()
}

const handleInput = (e) => {
  tokenInput.value = e.target.value.toUpperCase().slice(0, 5)
}

const handleActivate = async () => {
  if (!tokenInput.value || tokenInput.value.length !== 5) {
    errorMessage.value = 'Masukkan 5 huruf kode token (contoh: ABCDE).'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await activateToken(tokenInput.value)
    successMessage.value = result.message || 'Selamat! Berlangganan Premium berhasil.'
    setTimeout(() => {
      isVisible.value = false
    }, 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengaktifkan token.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isVisible && !isPremium"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24 bg-[#171717]/70 backdrop-blur-xs overflow-y-auto"
    >
      <!-- Sleek Professional Modal Container matching Blog Editorial Aesthetic -->
      <div class="relative w-full max-w-md bg-white rounded-[14px] shadow-2xl border border-[#dfdfdf] overflow-hidden transform transition-all my-auto">
        
        <!-- Header Container (Vibrant Blue Background) -->
        <div class="p-6 pb-5 relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
          <!-- Close Button -->
          <button
            @click="handleClose"
            class="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
            title="Tutup Modal"
          >
            ✕
          </button>

          <div class="flex items-center gap-2 mb-2">
            <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span class="font-mono-eyebrow text-blue-100">AKSES PREMIUM // MEMBER TOKEN</span>
          </div>

          <h3 class="text-xl font-bold text-white tracking-tight leading-snug">
            Berlangganan Akun Premium
          </h3>
          <p class="text-xs text-blue-100 mt-1 font-mono">
            Rp {{ priceText }}/bulan • Tanpa Iklan & Direct Download
          </p>
        </div>

        <!-- Body Content -->
        <div class="p-6 space-y-5">
          
          <!-- Benefit Bullet Checklist -->
          <div class="space-y-2.5 text-xs text-[#171717]">
            <div class="flex items-start gap-2.5 p-3 rounded-[8px] bg-[#f9f9f9] border border-[#dfdfdf]">
              <span class="text-[#2563eb] font-bold text-sm shrink-0">✓</span>
              <span class="leading-relaxed"><strong>Bebas Iklan 100%</strong> — Tanpa kemunculan banner iklan di seluruh halaman.</span>
            </div>
            <div class="flex items-start gap-2.5 p-3 rounded-[8px] bg-[#f9f9f9] border border-[#dfdfdf]">
              <span class="text-[#2563eb] font-bold text-sm shrink-0">✓</span>
              <span class="leading-relaxed"><strong>Direct Download</strong> — Unduh file langsung tanpa halaman perantara shortener.</span>
            </div>
          </div>

          <!-- Token Input Form -->
          <form @submit.prevent="handleActivate" class="space-y-3 pt-1">
            <div>
              <label class="block text-xs font-mono text-[#707070] uppercase font-semibold mb-1.5">Aktivasi Kode Token (5 Huruf)</label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  :value="tokenInput"
                  @input="handleInput"
                  placeholder="KODE (ABCDE)"
                  maxlength="5"
                  class="min-w-0 flex-1 px-3 py-2.5 bg-[#fafafa] border border-[#dfdfdf] rounded-[8px] text-center font-mono font-bold text-sm sm:text-base uppercase tracking-widest text-[#171717] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-gray-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs"
                />
                <button
                  type="submit"
                  :disabled="isSubmitting || tokenInput.length !== 5"
                  class="w-[100px] min-w-[100px] h-[42px] bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-[8px] transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
                >
                  <span v-if="isSubmitting" class="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin shrink-0"></span>
                  <span class="truncate">{{ isSubmitting ? 'Proses...' : 'Aktifkan' }}</span>
                </button>
              </div>
            </div>

            <!-- Feedback Messages -->
            <div v-if="errorMessage" class="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded-[8px] text-xs font-medium text-center">
              ⚠️ {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-[8px] text-xs font-medium text-center">
              ✅ {{ successMessage }}
            </div>
          </form>

          <!-- Buy Link CTA Button (WhatsApp Green) -->
          <div class="pt-3 border-t border-[#dfdfdf] space-y-3">
            <a
              :href="whatsappBuyUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full text-center py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-[8px] text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Beli Token via WhatsApp (Rp {{ priceText }}/bln)</span>
            </a>

            <div class="text-center text-[11px] text-[#707070]">
              Atau buka <RouterLink to="/premium" @click="handleClose" class="text-[#2563eb] font-semibold hover:underline">Halaman Aktivasi Token →</RouterLink>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
