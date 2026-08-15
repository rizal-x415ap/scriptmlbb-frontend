<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { isPremium, premiumToken, premiumExpiresAt, activateToken, activateFreeDayPremium, clearPremium } from '../services/premiumStore.js'
import { siteSettings } from '../services/settingsStore.js'
import { setSeoMeta } from '../services/seo.js'

onMounted(() => {
  setSeoMeta({
    title: 'Akses Premium & Token Berlangganan',
    description: 'Nikmati pengalaman membaca tanpa iklan, unduh file langsung tanpa iklan pendek, dan akses fitur eksklusif.',
    url: '/premium',
    type: 'website'
  })
})

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

onUnmounted(() => {
  if (adInterval) clearInterval(adInterval)
  window.removeEventListener('blur', onWindowBlurForAd)
})

const whatsappBuyUrl = computed(() => {
  return siteSettings.premiumBuyUrl || 'https://wa.me/6285262335849?text=Min%20Saya%20mau%20beli%20token%20Script%20MLBB'
})

const priceText = computed(() => {
  return siteSettings.premiumMonthlyPrice || '5.000'
})

const formattedExpiry = computed(() => {
  if (!premiumExpiresAt.value) return 'Selamanya'
  try {
    const d = new Date(premiumExpiresAt.value)
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  } catch {
    return premiumExpiresAt.value
  }
})

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
    tokenInput.value = ''
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

  activateFreeDayPremium()
  successMessage.value = '🎉 Selamat! Status Premium 1 Jam Gratis telah aktif!'
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
    // Mode Direct Link
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

const handleLogout = () => {
  if (confirm('Apakah Anda yakin ingin mengakhiri sesi status Premium di perangkat ini?')) {
    clearPremium()
    window.location.reload()
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto py-6 sm:py-10 space-y-8">
    
    <!-- Hero Header Banner (Vibrant Blue Theme) -->
    <div class="p-6 sm:p-10 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
      <div class="space-y-2 max-w-2xl relative z-10">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-mono bg-white/20 text-blue-100 border border-white/30">
          <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
          <span class="font-bold tracking-wider uppercase text-[11px]">LAYANAN BERLANGGANAN PREMIUM</span>
        </div>

        <h1 class="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-snug">
          Akses Bebas Iklan & Direct File Download
        </h1>

        <p class="text-sm sm:text-sm text-blue-100 leading-relaxed">
          Tingkatkan kenyamanan membaca artikel tanpa gangguan banner iklan dan unduh file aplikasi/script secara instan tanpa melewati shortener. Hanya Rp {{ priceText }}/bulan!
        </p>
      </div>

      <!-- Watermark Badge -->
      <div class="absolute right-6 top-1/2 -translate-y-1/2 text-white/10 text-9xl font-black pointer-events-none select-none hidden sm:block">
        👑
      </div>
    </div>

    <!-- Main Grid Content -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- LEFT COLUMN: Activation Form or Active Status Box (7 cols) -->
      <div class="lg:col-span-7 space-y-6">
        
        <!-- Active Premium Status Box -->
        <div v-if="isPremium" class="p-6 sm:p-8 space-y-6 rounded-2xl bg-emerald-50/60 border border-emerald-200">
          <div class="flex items-center justify-between border-b border-emerald-200 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xl font-bold shadow-xs">
                ✓
              </div>
              <div>
                <h3 class="text-base font-bold text-[#171717]">Status Premium Aktif</h3>
                <p class="text-sm text-emerald-800 font-mono">Kode Token: <strong>{{ premiumToken }}</strong></p>
              </div>
            </div>
            <span class="px-3 py-1 rounded-full text-sm font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
              AKTIF
            </span>
          </div>

          <div class="space-y-3 text-sm text-[#171717]">
            <div class="flex justify-between py-2 border-b border-emerald-200/60">
              <span class="text-[#707070]">Berlaku Hingga:</span>
              <span class="font-bold text-[#171717] font-mono">{{ formattedExpiry }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-emerald-200/60">
              <span class="text-[#707070]">Status Iklan:</span>
              <span class="font-semibold text-emerald-700">🚫 Bebas Iklan </span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-[#707070]">Status Download:</span>
              <span class="font-semibold text-emerald-700">⚡ Direct Download </span>
            </div>
          </div>

          <div class="pt-4 border-t border-emerald-200 flex justify-end">
            <button
              @click="handleLogout"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-full transition-colors cursor-pointer"
            >
              Keluar Premium Perangkat Ini
            </button>
          </div>
        </div>

        <!-- Token Input Form & Free 1-Day Option -->
        <div v-else class="pb-6 space-y-6">

          <!-- FREE 1-DAY PREMIUM VIA AD CLICK CARD -->
          <div class="p-5 bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/50 rounded-2xl border border-amber-200 space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2 font-bold text-amber-900 text-sm">
                <span class="text-base">🎁</span>
                <span>Coba Premium 1 Jam GRATIS</span>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 uppercase font-mono">
                GRATIS
              </span>
            </div>

            <p class="text-sm sm:text-sm text-amber-950/80 leading-relaxed">
              Klik iklan sponsor di bawah ini dan buka selama <strong>15 detik</strong> untuk langsung mengaktifkan status Premium <strong>1 Jam</strong> tanpa membeli token!
            </p>

            <!-- Ad Click Verification Trigger Area -->
            <div>
              <button
                v-if="!isVerifyingAd && !isAdUnlocked"
                @click="startAdVerification"
                class="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm sm:text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                <span>🚀 Klik Iklan 15 Detik Untuk Premium Gratis</span>
                <span>→</span>
              </button>

              <!-- Live 15s Countdown Progress State -->
              <div v-else-if="isVerifyingAd" class="p-4 bg-white rounded-xl border border-amber-300 space-y-2 text-center">
                <div class="flex items-center justify-between text-sm sm:text-sm font-mono font-bold text-amber-900">
                  <span class="flex items-center gap-1.5">
                    <span class="w-2.5 h-2.5 rounded-full bg-amber-600 animate-ping"></span>
                    <span>Memverifikasi Kunjungan Iklan...</span>
                  </span>
                  <span class="text-amber-700 font-extrabold text-base">{{ adTimerSeconds }}s</span>
                </div>
                <div class="w-full h-2.5 bg-amber-100 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-amber-600 rounded-full transition-all duration-1000 ease-linear"
                    :style="{ width: ((15 - adTimerSeconds) / 15 * 100) + '%' }"
                  ></div>
                </div>
                <p class="text-sm text-amber-800/90 font-mono">
                  Mohon buka & tonton tab iklan selama {{ adTimerSeconds }} detik...
                </p>
              </div>

              <!-- Unlocked State Banner -->
              <div v-else-if="isAdUnlocked" class="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-sm sm:text-sm font-bold text-center border border-emerald-300">
                🎉 Premium 1 Jam Gratis Berhasil Diaktifkan!
              </div>
            </div>
          </div>

          <div class="border-b border-[#f0f0f0] pb-4 pt-2">
            <h3 class="text-base font-bold text-[#171717]">Atau Aktivasi Kode Token 30 Hari</h3>
            <p class="text-sm text-[#707070] mt-0.5">Masukkan 5 huruf kode token berlangganan Anda di bawah ini</p>
          </div>

          <form @submit.prevent="handleActivate" class="space-y-4">
            <div>
              <label class="block text-sm font-mono text-[#707070] uppercase font-semibold mb-1.5">Kode Token (5 Huruf Besar)</label>
              <input
                type="text"
                :value="tokenInput"
                @input="handleInput"
                placeholder="CONTOH: ABCDE"
                maxlength="5"
                class="w-full px-4 py-3 bg-[#f4f4f5] border border-transparent rounded-2xl text-center font-mono font-bold text-xl uppercase tracking-widest text-[#171717] focus:bg-white focus:border-[#2563eb] outline-none transition-all"
              />
            </div>

            <!-- Feedback Messages -->
            <div v-if="errorMessage" class="p-3 bg-red-50 text-red-700 border border-red-200 rounded-full text-sm font-medium text-center">
              ⚠️ {{ errorMessage }}
            </div>
            <div v-if="successMessage" class="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-sm font-medium text-center">
              ✅ {{ successMessage }}
            </div>

            <button
              type="submit"
              :disabled="isSubmitting || tokenInput.length !== 5"
              class="w-full py-3 stitch-button-primary font-bold text-sm rounded-full transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span v-if="isSubmitting" class="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              <span>{{ isSubmitting ? 'Memverifikasi Token...' : 'Aktifkan Token Sekarang' }}</span>
            </button>
          </form>

          <!-- Buy Token CTA -->
          <div class="pt-4 border-t border-[#f0f0f0] space-y-3 text-center">
            <p class="text-sm text-[#707070]">Belum memiliki kode token berlangganan 30 hari?</p>
            <a
              :href="whatsappBuyUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-full transition-colors gap-2 cursor-pointer"
            >
              <span>Beli Token via WhatsApp (Rp {{ priceText }}/bulan)</span>
            </a>
          </div>
        </div>

      </div>

      <!-- RIGHT COLUMN: Premium Benefits Checklist (5 cols) -->
      <div class="lg:col-span-5 space-y-6">
        <div class="space-y-5 pb-6 border-b border-[#f0f0f0]">
          <h3 class="text-sm font-bold text-[#171717] font-mono-eyebrow border-b border-[#f0f0f0] pb-3">MANFAAT AKUN PREMIUM</h3>

          <div class="space-y-4 text-sm">
            <div class="flex items-start gap-3">
              <div class="w-7 h-7 rounded-full bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                🚫
              </div>
              <div>
                <h4 class="font-bold text-[#171717]">Tanpa Iklan Sama Sekali</h4>
                <p class="text-[#707070] mt-0.5 leading-relaxed">Seluruh slot iklan di beranda, feed, dan artikel otomatis disembunyikan untuk kenyamanan Anda.</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div class="w-7 h-7 rounded-full bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                ⚡
              </div>
              <div>
                <h4 class="font-bold text-[#171717]">Direct Download Tanpa Shortener</h4>
                <p class="text-[#707070] mt-0.5 leading-relaxed">Unduh file aplikasi dan script skin secara instan tanpa menunggu halaman iklan pendek.</p>
              </div>
            </div>

            <div class="flex items-start gap-3">
              <div class="w-7 h-7 rounded-full bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                🎁
              </div>
              <div>
                <h4 class="font-bold text-[#171717]">Opsi 1 Hari Gratis via Klik Iklan</h4>
                <p class="text-[#707070] mt-0.5 leading-relaxed">Cukup klik iklan sponsorship selama 15 detik untuk mengaktifkan status Premium 1 Hari secara cuma-cuma.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-[#f4f4f5] text-sm text-[#707070] space-y-2">
          <h4 class="font-bold text-[#171717]">Butuh Bantuan Aktivasi?</h4>
          <p class="leading-relaxed">Jika Anda mengalami kendala saat mengaktifkan token atau klaim gratis, silakan hubungi tim dukungan kami melalui kontak yang tersedia.</p>
        </div>
      </div>

    </div>
  </div>

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
