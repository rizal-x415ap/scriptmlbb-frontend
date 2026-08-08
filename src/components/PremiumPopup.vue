<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue'
import { isPremium, activateToken, activateFreeDayPremium, shouldShowPopup, dismissPopup, loadPremiumStatus } from '../services/premiumStore.js'
import { siteSettings } from '../services/settingsStore.js'

const isVisible = ref(false)
const tokenInput = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// 15-Second Ad Click Verification State
const isVerifyingAd = ref(false)
const adTimerSeconds = ref(15)
const isAdUnlocked = ref(false)
let adInterval = null

const whatsappBuyUrl = computed(() => {
  return siteSettings.premiumBuyUrl || 'https://wa.me/6285262335849?text=Min%20Saya%20mau%20beli%20token%20Script%20MLBB'
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

onUnmounted(() => {
  if (adInterval) clearInterval(adInterval)
})

const handleClose = () => {
  if (adInterval) clearInterval(adInterval)
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

// Start 15-Second Ad Click Verification Logic
const startAdVerification = () => {
  if (isVerifyingAd.value || isAdUnlocked.value) return

  // Open target sponsor ad link in new tab
  const targetAdUrl = siteSettings.premiumFreeAdUrl || siteSettings.announcementLink || 'https://scriptmlbb.com'
  window.open(targetAdUrl, '_blank')

  isVerifyingAd.value = true
  adTimerSeconds.value = 15

  if (adInterval) clearInterval(adInterval)

  adInterval = setInterval(() => {
    if (adTimerSeconds.value > 0) {
      adTimerSeconds.value -= 1
    }
    if (adTimerSeconds.value <= 0) {
      clearInterval(adInterval)
      adInterval = null
      isVerifyingAd.value = false
      isAdUnlocked.value = true

      // Activate 1-Day Free Premium
      activateFreeDayPremium()
      successMessage.value = '🎉 Selamat! Status Premium 1 Hari Gratis telah aktif!'

      setTimeout(() => {
        isVisible.value = false
      }, 2500)
    }
  }, 1000)
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isVisible && !isPremium"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pt-20 sm:pt-24 bg-[#171717]/70 backdrop-blur-xs overflow-y-auto"
    >
      <!-- Sleek Professional Modal Container matching Blog Editorial Aesthetic -->
      <div class="relative w-full max-w-md bg-white rounded-[16px] shadow-2xl border border-[#dfdfdf] overflow-hidden transform transition-all my-auto">
        
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
            Rp {{ priceText }}/bulan • Bebas Iklan & Direct Download
          </p>
        </div>

        <!-- Body Content -->
        <div class="p-6 space-y-5">
          
          <!-- Benefit Bullet Checklist -->
          <div class="space-y-2.5 text-xs text-[#171717]">
            <div class="flex items-start gap-2.5 p-3 rounded-[10px] bg-[#f9f9f9] border border-[#dfdfdf]">
              <span class="text-[#2563eb] font-bold text-sm shrink-0">✓</span>
              <span class="leading-relaxed"><strong>Bebas Iklan 100%</strong> — Tanpa kemunculan banner iklan di seluruh halaman.</span>
            </div>
            <div class="flex items-start gap-2.5 p-3 rounded-[10px] bg-[#f9f9f9] border border-[#dfdfdf]">
              <span class="text-[#2563eb] font-bold text-sm shrink-0">✓</span>
              <span class="leading-relaxed"><strong>Direct Download</strong> — Unduh file langsung tanpa halaman perantara shortener.</span>
            </div>
          </div>

          <!-- FREE 1-DAY PREMIUM VIA AD CLICK OPTION CARD -->
          <div class="p-4 bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/50 rounded-[12px] border border-amber-200 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 font-bold text-amber-900 text-xs sm:text-sm">
                <span>🎁</span>
                <span>Coba Premium 1 Hari GRATIS</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase font-mono">
                GRATIS
              </span>
            </div>

            <p class="text-xs text-amber-950/80 leading-relaxed">
              Klik iklan sponsor di bawah dan buka selama <strong>15 detik</strong> untuk membuka status Premium 1 Hari tanpa token!
            </p>

            <!-- Ad Click Verification Trigger Area -->
            <div>
              <button
                v-if="!isVerifyingAd && !isAdUnlocked"
                @click="startAdVerification"
                class="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-[8px] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs active:scale-95"
              >
                <span>🚀 Klik Iklan 15s Untuk Premium Gratis</span>
                <span>→</span>
              </button>

              <!-- Live 15s Countdown Progress State -->
              <div v-else-if="isVerifyingAd" class="p-3 bg-white rounded-[8px] border border-amber-300 space-y-2 text-center">
                <div class="flex items-center justify-between text-xs font-mono font-bold text-amber-900">
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                    <span>Memverifikasi Iklan...</span>
                  </span>
                  <span class="text-amber-700 font-extrabold text-sm">{{ adTimerSeconds }}s</span>
                </div>
                <div class="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-amber-600 rounded-full transition-all duration-1000 ease-linear"
                    :style="{ width: ((15 - adTimerSeconds) / 15 * 100) + '%' }"
                  ></div>
                </div>
                <p class="text-[11px] text-amber-800/90 font-mono">
                  Mohon lihat tab iklan selama {{ adTimerSeconds }} detik...
                </p>
              </div>

              <!-- Unlocked State Banner -->
              <div v-else-if="isAdUnlocked" class="p-2.5 bg-emerald-100 text-emerald-900 rounded-[8px] text-xs font-bold text-center border border-emerald-300">
                🎉 Premium 1 Hari Gratis Berhasil Diaktifkan!
              </div>
            </div>
          </div>

          <!-- Token Input Form -->
          <form @submit.prevent="handleActivate" class="space-y-3 pt-1 border-t border-[#dfdfdf]">
            <div>
              <label class="block text-xs font-mono text-[#707070] uppercase font-semibold mb-1.5">Aktivasi Kode Token 30 Hari (5 Huruf)</label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  :value="tokenInput"
                  @input="handleInput"
                  placeholder="KODE (ABCDE)"
                  maxlength="5"
                  class="min-w-0 flex-1 px-3 py-2.5 bg-[#fafafa] border border-[#dfdfdf] rounded-[8px] text-center font-mono font-bold text-sm uppercase tracking-widest text-[#171717] focus:bg-white focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb] outline-none transition-all placeholder:text-gray-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs"
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
