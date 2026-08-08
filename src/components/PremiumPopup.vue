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
      }, 2000)
    }
  }, 1000)
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="isVisible && !isPremium"
      class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[#171717]/75 backdrop-blur-xs overflow-y-auto"
    >
      <!-- Sleek Compact Modal Container -->
      <div class="relative w-full max-w-sm sm:max-w-md bg-white rounded-[20px] shadow-2xl border border-[#e4e4e7] overflow-hidden transform transition-all my-auto">
        
        <!-- Header Container -->
        <div class="p-5 sm:p-6 relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white">
          <!-- Close Button -->
          <button
            @click="handleClose"
            class="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer"
            title="Tutup"
          >
            ✕
          </button>

          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span class="font-mono-eyebrow text-blue-100">AKSES PREMIUM</span>
          </div>

          <h3 class="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
            Nikmati Akses Premium
          </h3>
          <p class="text-xs text-blue-100/90 mt-0.5 font-mono">
            Bebas Iklan • Direct Download • Tanpa Antri
          </p>
        </div>

        <!-- Body Content -->
        <div class="p-5 sm:p-6 space-y-4">

          <!-- Ringkas: 2 Keuntungan Utama (Pills format) -->
          <div class="grid grid-cols-2 gap-2 text-xs font-medium text-[#171717]">
            <div class="p-2.5 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] flex items-center gap-2">
              <span class="text-base shrink-0">🚫</span>
              <span class="font-semibold leading-tight text-[11px] sm:text-xs">Bebas Iklan 100%</span>
            </div>
            <div class="p-2.5 rounded-xl bg-[#f4f4f5] border border-[#e4e4e7] flex items-center gap-2">
              <span class="text-base shrink-0">⚡</span>
              <span class="font-semibold leading-tight text-[11px] sm:text-xs">Direct Download</span>
            </div>
          </div>

          <!-- OPSI 1: GRATIS 1 HARI VIA KLIK IKLAN -->
          <div class="p-4 bg-gradient-to-r from-amber-50 via-amber-50/90 to-amber-100/50 rounded-2xl border border-amber-200/90 space-y-2.5">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5 font-bold text-amber-900 text-xs sm:text-sm">
                <span>🎁</span>
                <span>Opsi 1: Gratis 1 Hari</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 font-mono">
                KLIK 15 DETIK
              </span>
            </div>

            <p class="text-xs text-amber-950/80 leading-relaxed">
              Klik iklan sponsor di bawah & lihat selama 15 detik untuk aktifkan Premium 1 Hari tanpa token.
            </p>

            <!-- Ad Click Button / Progress -->
            <div>
              <button
                v-if="!isVerifyingAd && !isAdUnlocked"
                @click="startAdVerification"
                class="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
              >
                <span>🚀 Klik Iklan 15s (Gratis 1 Hari)</span>
              </button>

              <!-- Live 15s Countdown Progress State -->
              <div v-else-if="isVerifyingAd" class="p-3 bg-white rounded-xl border border-amber-300 space-y-1.5 text-center">
                <div class="flex items-center justify-between text-xs font-mono font-bold text-amber-900">
                  <span class="flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                    <span>Verifikasi Iklan...</span>
                  </span>
                  <span class="text-amber-700 font-extrabold text-sm">{{ adTimerSeconds }}s</span>
                </div>
                <div class="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-amber-600 rounded-full transition-all duration-1000 ease-linear"
                    :style="{ width: ((15 - adTimerSeconds) / 15 * 100) + '%' }"
                  ></div>
                </div>
              </div>

              <div v-else-if="isAdUnlocked" class="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold text-center border border-emerald-300">
                🎉 Premium 1 Hari Gratis Aktif!
              </div>
            </div>
          </div>

          <!-- OPSI 2: KODE TOKEN / BELI WHATSAPP -->
          <div class="pt-2 border-t border-[#e4e4e7] space-y-3">
            <form @submit.prevent="handleActivate" class="space-y-2">
              <label class="block text-xs font-mono text-[#707070] font-semibold uppercase">Opsi 2: Punya Kode Token?</label>
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  :value="tokenInput"
                  @input="handleInput"
                  placeholder="KODE (ABCDE)"
                  maxlength="5"
                  class="min-w-0 flex-1 px-3 py-2.5 bg-[#f4f4f5] border border-[#e4e4e7] rounded-xl text-center font-mono font-bold text-xs sm:text-sm uppercase tracking-widest text-[#171717] focus:bg-white focus:border-[#2563eb] outline-none transition-all placeholder:text-gray-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-xs"
                />
                <button
                  type="submit"
                  :disabled="isSubmitting || tokenInput.length !== 5"
                  class="px-4 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
                >
                  <span v-if="isSubmitting" class="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  <span>{{ isSubmitting ? '...' : 'Aktifkan' }}</span>
                </button>
              </div>

              <!-- Messages -->
              <div v-if="errorMessage" class="p-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium text-center">
                ⚠️ {{ errorMessage }}
              </div>
              <div v-if="successMessage" class="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium text-center">
                ✅ {{ successMessage }}
              </div>
            </form>

            <a
              :href="whatsappBuyUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full text-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>💬 Beli Token via WA (Rp {{ priceText }}/bln)</span>
            </a>
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
