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
const showAdModal = ref(false)
const hasClickedBanner = ref(false)
const adScriptContainerRef = ref(null)

let adInterval = null
let interactionTriggered = false

const whatsappBuyUrl = computed(() => {
  return siteSettings.premiumBuyUrl || 'https://wa.me/6285262335849?text=Min%20Saya%20mau%20beli%20token%20Script%20MLBB'
})

const priceText = computed(() => {
  return siteSettings.premiumMonthlyPrice || '5.000'
})

// Trigger Popup only upon first user activity / interaction (touch, click, scroll, keypress)
const handleUserInteraction = () => {
  if (interactionTriggered) return
  interactionTriggered = true

  removeActivityListeners()

  if (!isPremium.value && shouldShowPopup()) {
    isVisible.value = true
  }
}

const addActivityListeners = () => {
  window.addEventListener('touchstart', handleUserInteraction, { passive: true })
  window.addEventListener('pointerdown', handleUserInteraction, { passive: true })
  window.addEventListener('click', handleUserInteraction, { passive: true })
  window.addEventListener('scroll', handleUserInteraction, { passive: true })
  window.addEventListener('keydown', handleUserInteraction, { passive: true })
}

const removeActivityListeners = () => {
  window.removeEventListener('touchstart', handleUserInteraction)
  window.removeEventListener('pointerdown', handleUserInteraction)
  window.removeEventListener('click', handleUserInteraction)
  window.removeEventListener('scroll', handleUserInteraction)
  window.removeEventListener('keydown', handleUserInteraction)
}

onMounted(async () => {
  // Ensure background verification completes BEFORE setting up interaction listeners
  await loadPremiumStatus()

  if (!isPremium.value && shouldShowPopup()) {
    addActivityListeners()
  }
})

onUnmounted(() => {
  if (adInterval) clearInterval(adInterval)
  window.removeEventListener('blur', onWindowBlurForAd)
  removeActivityListeners()
})

const handleClose = () => {
  // Prevent closing modal while 15-second ad verification is active
  if (isVerifyingAd.value) return

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
    window.location.reload()
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengaktifkan token.'
  } finally {
    isSubmitting.value = false
  }
}

// Start 15s Timer ONLY after user clicks banner or window loses focus (iframe click)
const startBannerTimerAfterClick = () => {
  if (hasClickedBanner.value) return
  hasClickedBanner.value = true

  if (adInterval) clearInterval(adInterval)
  adInterval = setInterval(() => {
    if (adTimerSeconds.value > 0) {
      adTimerSeconds.value -= 1
    }
    if (adTimerSeconds.value <= 0) {
      completeAdVerification()
    }
  }, 1000)
}

// Window Blur Detection when Ad Modal is active (detects user click on ad iframe)
const onWindowBlurForAd = () => {
  if (isVerifyingAd.value && showAdModal.value && !hasClickedBanner.value) {
    startBannerTimerAfterClick()
  }
}

const renderBannerScript = () => {
  if (!adScriptContainerRef.value) return
  adScriptContainerRef.value.innerHTML = ''
  const contentStr = String(siteSettings.premiumFreeAdScript || '').trim()
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
      adScriptContainerRef.value.appendChild(newScript)
    } else if (node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent.trim())) {
      adScriptContainerRef.value.appendChild(node.cloneNode(true))
    }
  })
}

const handleBannerContainerClick = () => {
  if (isVerifyingAd.value && showAdModal.value && !hasClickedBanner.value) {
    startBannerTimerAfterClick()
  }
}

const completeAdVerification = () => {
  if (adInterval) {
    clearInterval(adInterval)
    adInterval = null
  }
  window.removeEventListener('blur', onWindowBlurForAd)
  isVerifyingAd.value = false
  isAdUnlocked.value = true
  showAdModal.value = false

  // Activate 1-Hour Free Premium
  activateFreeDayPremium()
  successMessage.value = '🎉 Selamat! Status Premium 1 Jam Gratis berhasil diaktifkan!'
  setTimeout(() => {
    window.location.reload()
  }, 800)
}

const closeAdModal = () => {
  if (adInterval) {
    clearInterval(adInterval)
    adInterval = null
  }
  window.removeEventListener('blur', onWindowBlurForAd)
  isVerifyingAd.value = false
  hasClickedBanner.value = false
  showAdModal.value = false
}

// Start 15-Second Ad Click Verification Logic
const startAdVerification = () => {
  if (isVerifyingAd.value || isAdUnlocked.value) return

  const mode = siteSettings.premiumFreeAdMode || 'direct_link'

  if (mode === 'banner_script') {
    showAdModal.value = true
    isVerifyingAd.value = true
    hasClickedBanner.value = false
    adTimerSeconds.value = 15

    window.addEventListener('blur', onWindowBlurForAd)

    setTimeout(() => {
      renderBannerScript()
    }, 100)
  } else {
    // Mode Direct Link (Open in new tab + 15s Timer)
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
        completeAdVerification()
      }
    }, 1000)
  }
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
          <!-- Close Button or Lock Badge during 15s Verification -->
          <button
            v-if="!isVerifyingAd"
            @click="handleClose"
            class="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center text-xs font-bold transition-all cursor-pointer z-10"
            title="Tutup Modal"
          >
            ✕
          </button>
          <div
            v-else
            class="absolute top-3.5 right-3.5 px-2.5 py-1 rounded-full bg-amber-500/90 text-amber-950 flex items-center gap-1.5 text-[10px] font-mono font-bold z-10 shadow-xs border border-amber-300 animate-pulse select-none"
            title="Modal dikunci hingga verifikasi 15s selesai"
          >
            <span>🔒 Dikunci {{ adTimerSeconds }}s</span>
          </div>

          <div class="flex items-center gap-2 mb-1">
            <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span class="font-mono-eyebrow text-blue-100">AKSES PREMIUM</span>
          </div>

          <h3 class="text-lg sm:text-xl font-bold text-white tracking-tight leading-snug">
            Nikmati Akses Premium
          </h3>
          <p class="text-xs text-blue-100/90 mt-0.5 font-mono">
            Bebas Iklan • Direct Download • Tanpa Ribet
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
                <span>Opsi 1: Gratis 1 Jam</span>
              </div>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 font-mono">
                KLIK 15 DETIK
              </span>
            </div>

            <p class="text-xs text-amber-950/80 leading-relaxed">
              Klik iklan sponsor di bawah & lihat selama 15 detik untuk aktifkan Premium 1 Jam tanpa token.
            </p>

            <!-- Ad Click Button / Progress -->
            <div>
              <button
                v-if="!isVerifyingAd && !isAdUnlocked"
                @click="startAdVerification"
                class="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
              >
                <span>🚀 Klik Iklan 15s (Gratis 1 Jam)</span>
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

              <div v-else-if="isAdUnlocked" class="p-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 text-white rounded-xl text-xs sm:text-sm font-bold text-center border border-emerald-400 shadow-md space-y-1">
                <div class="font-extrabold text-xs sm:text-sm tracking-wide">🎉 VERIFIKASI IKLAN BERHASIL!</div>
                <div class="text-[11px] font-mono text-emerald-100 font-medium">Status Premium 1 Jam Gratis telah aktif. Modal tertutup otomatis...</div>
              </div>
            </div>
          </div>

          <!-- OPSI 2: KODE TOKEN / BELI WHATSAPP -->
          <div class="pt-2 border-t border-[#e4e4e7] space-y-3">
            <!-- PROMINENT WHATSAPP BUY TOKEN BUTTON (TOP HIGHLIGHT) -->
            <a
              :href="whatsappBuyUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all duration-200 flex items-center justify-between gap-2 shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-95 cursor-pointer ring-2 ring-emerald-500/30"
            >
              <div class="flex items-center gap-2.5">
                <span class="text-base sm:text-lg shrink-0">💬</span>
                <div class="text-left leading-tight">
                  <div class="text-xs sm:text-sm font-extrabold tracking-wide">Beli Token 30 Hari via WA</div>
                  <div class="text-[10px] text-emerald-100 font-mono font-medium">Proses Instan & Langsung Aktif</div>
                </div>
              </div>
              <div class="px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-mono font-bold shrink-0 border border-white/30">
                Rp {{ priceText }}/bln
              </div>
            </a>

            <form @submit.prevent="handleActivate" class="space-y-2 pt-1">
              <label class="block text-xs font-mono text-[#707070] font-semibold uppercase">Punya Kode Token?</label>
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
          </div>

        </div>
      </div>
    </div>
  </Transition>

  <!-- STACKED BANNER AD MODAL POPUP (z-[10000]) -->
  <Transition name="fade">
    <div
      v-if="showAdModal"
      class="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div class="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-300 overflow-hidden transform transition-all my-auto">
        <!-- Header -->
        <div class="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
            <div>
              <h4 class="font-extrabold text-sm sm:text-base tracking-tight">📢 Banner Iklan Sponsor</h4>
              <p class="text-[11px] text-amber-100 font-mono">
                {{ hasClickedBanner ? 'Memverifikasi kunjungan iklan...' : 'Klik banner di bawah untuk mulai timer 15s' }}
              </p>
            </div>
          </div>
          <div class="px-3 py-1 rounded-full bg-black/30 text-white text-xs font-mono font-bold border border-white/20">
            ⏱️ {{ hasClickedBanner ? adTimerSeconds + 's' : '15s' }}
          </div>
        </div>

        <!-- Banner Script Body Container -->
        <div class="p-5 sm:p-6 space-y-4 text-center bg-gray-50/50">
          <div
            v-if="!hasClickedBanner"
            class="p-3 bg-amber-100 text-amber-900 rounded-xl border border-amber-300 text-xs font-bold animate-pulse flex items-center justify-center gap-2"
          >
            <span>👇</span>
            <span>Silakan KLIK BANNER IKLAN di bawah ini untuk memulai hitungan 15 detik!</span>
          </div>
          <div
            v-else
            class="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-300 text-xs font-bold flex items-center justify-center gap-2"
          >
            <span class="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
            <span>Iklan Berhasil Diklik! Mohon tunggu {{ adTimerSeconds }} detik...</span>
          </div>

          <!-- Injected Ad Script Container -->
          <div
            ref="adScriptContainerRef"
            @click="handleBannerContainerClick"
            class="min-h-[180px] flex items-center justify-center p-3 rounded-2xl bg-white border-2 border-dashed transition-all cursor-pointer overflow-hidden relative"
            :class="hasClickedBanner ? 'border-emerald-400 bg-emerald-50/20' : 'border-amber-400 hover:border-amber-600 bg-amber-50/10'"
          >
            <!-- Fallback when script is empty -->
            <div v-if="!siteSettings.premiumFreeAdScript" class="text-xs text-gray-500 font-mono py-8">
              [Klik Di Sini / Banner Iklan Sponsor]
            </div>
          </div>

          <!-- Live Progress Bar -->
          <div class="space-y-1.5 pt-2">
            <div class="flex justify-between text-[11px] font-mono font-bold text-amber-950">
              <span>{{ hasClickedBanner ? 'Hitungan Mundur Verification' : 'Status: Menunggu Klik Banner' }}</span>
              <span>{{ hasClickedBanner ? Math.round(((15 - adTimerSeconds) / 15) * 100) + '%' : '0%' }}</span>
            </div>
            <div class="w-full h-2.5 bg-amber-200/60 rounded-full overflow-hidden">
              <div
                class="h-full bg-amber-600 rounded-full transition-all duration-1000 ease-linear"
                :style="{ width: hasClickedBanner ? ((15 - adTimerSeconds) / 15 * 100) + '%' : '0%' }"
              ></div>
            </div>
          </div>

          <button
            @click="closeAdModal"
            class="w-full py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer mt-2"
          >
            Tutup Iklan
          </button>
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
