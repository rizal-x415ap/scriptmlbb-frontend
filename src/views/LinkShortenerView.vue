<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ApiService } from '../services/api.js'
import { isPremium } from '../services/premiumStore.js'
import { siteSettings } from '../services/settingsStore.js'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import AdSlot from '../components/AdSlot.vue'
import { sanitizeHtml } from '../utils/sanitize.js'
import { setSeoMeta } from '../services/seo.js'

const route = useRoute()
const router = useRouter()
const code = computed(() => route.params.code)

const isLoading = ref(true)
const shortLinkData = ref(null)
const article = ref(null)
const isCountingDown = ref(false)
const countdownSeconds = ref(15)
const originalUrl = ref(null)
const isUnlocked = ref(false)
const errorMessage = ref('')

let metaRobotsEl = null

onMounted(async () => {
  setSeoMeta({
    title: 'Halaman Download File SafeLink',
    description: 'Menyiapkan tautan download aman secara otomatis.',
    url: `/go/${code.value}`,
    type: 'website'
  })

  // SEO Noindex, Nofollow Tag Enforcement
  metaRobotsEl = document.querySelector('meta[name="robots"]')
  if (!metaRobotsEl) {
    metaRobotsEl = document.createElement('meta')
    metaRobotsEl.name = 'robots'
    document.head.appendChild(metaRobotsEl)
  }
  metaRobotsEl.content = 'noindex, nofollow'

  try {
    isLoading.value = true
    const data = await ApiService.resolveShortLink(code.value)
    if (!data) {
      router.replace('/')
      return
    }
    shortLinkData.value = data
    article.value = data.random_article

    // If user is premium, auto unlock & redirect immediately
    if (isPremium.value) {
      await unlockUrl()
      if (originalUrl.value) {
        window.location.href = originalUrl.value
      }
    }
  } catch (err) {
    router.replace('/')
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
  // Restore standard robots tag when leaving the page
  if (metaRobotsEl) {
    metaRobotsEl.content = 'index, follow'
  }
})

let countdownInterval = null

const startCountdown = () => {
  if (isCountingDown.value || isUnlocked.value) return

  isCountingDown.value = true
  countdownSeconds.value = 15

  if (countdownInterval) clearInterval(countdownInterval)

  countdownInterval = setInterval(async () => {
    if (countdownSeconds.value > 0) {
      countdownSeconds.value -= 1
    }
    if (countdownSeconds.value <= 0) {
      clearInterval(countdownInterval)
      countdownInterval = null
      isCountingDown.value = false
      await unlockUrl()
    }
  }, 1000)
}

const unlockUrl = async () => {
  try {
    const url = await ApiService.unlockShortLink(code.value)
    originalUrl.value = url
    isUnlocked.value = true
  } catch (err) {
    errorMessage.value = 'Gagal mengambil link download asli.'
  }
}

// Helpers
const getCategoryName = (category) => {
  if (!category) return 'EDITORIAL'
  return typeof category === 'object' ? (category.name || 'EDITORIAL') : category
}

const getAuthorName = (author) => {
  if (!author) return 'Tim Redaksi'
  return typeof author === 'object' ? (author.name || 'Tim Redaksi') : author
}

const getAuthorAvatar = (author) => {
  if (author && typeof author === 'object' && author.avatar) return author.avatar
  return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
}

const getFormattedDate = (dateString) => {
  if (!dateString) return 'Baru Saja'
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

const formattedContent = computed(() => {
  if (!article.value || !article.value.content) return ''
  return sanitizeHtml(article.value.content)
})
</script>

<template>
  <div class="w-full max-w-[1280px] mx-auto py-4 sm:py-8">
    
    <!-- 12-Column Responsive Desktop Layout Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

      <!-- LEFT SIDE BANNER AD SLOT (Desktop lg:col-span-2) -->
      <aside v-if="!isPremium" class="hidden lg:block lg:col-span-2 sticky top-24 space-y-4">
        <AdSlot
          :enabled="siteSettings.showShortenerLeftAd !== false"
          :scriptContent="siteSettings.shortenerLeftAdScript"
          label="IKLAN SISI KIRI DESKTOP"
          type="sidebar"
        />
      </aside>
      <div v-else class="hidden lg:block lg:col-span-2"></div>

      <!-- CENTER MAIN CONTENT AREA (Desktop lg:col-span-8) -->
      <main class="lg:col-span-8 space-y-8 min-w-0">

        <!-- Skeleton Loading State -->
        <div v-if="isLoading" class="space-y-6">
          <SkeletonLoader height="32px" width="70%" />
          <SkeletonLoader height="400px" width="100%" />
          <SkeletonLoader height="200px" width="100%" />
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="py-16 text-center space-y-4">
          <div class="text-4xl">⚠️</div>
          <h2 class="text-xl font-bold text-gray-900">Terjadi Kesalahan</h2>
          <p class="text-xs text-gray-600 max-w-md mx-auto">{{ errorMessage }}</p>
          <RouterLink to="/" class="stitch-button-primary inline-block px-5 py-2.5 text-xs font-semibold">
            Kembali ke Beranda
          </RouterLink>
        </div>

        <!-- MAIN SHORTENER INTEGRATED ARTICLE LAYOUT -->
        <div v-else-if="article" class="space-y-8">

          <!-- MINIMALIST SHORTENER TOP BOX -->
          <div class="p-5 sm:p-6 bg-[#f4f4f5] rounded-2xl space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#e4e4e7] pb-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse"></span>
                <span class="font-mono-eyebrow text-[#2563eb]">LINK GENERATOR // FILE DOWNLOAD</span>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white text-[#171717] border border-[#e4e4e7]">
                File: {{ shortLinkData?.link_name || 'Download File' }}
              </span>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
              <div class="space-y-1 text-center sm:text-left">
                <h2 class="text-base sm:text-lg font-bold text-[#171717]">Get Link Download File</h2>
                <p class="text-xs sm:text-sm text-[#707070] max-w-lg">
                  {{ (isCountingDown || isUnlocked) ? 'Silakan gulir / scroll halaman artikel ini ke bawah untuk mengambil link download.' : 'Klik tombol di samping, lalu silakan gulir / scroll halaman ke bawah.' }}
                </p>
              </div>

              <!-- Step 1 Trigger Button / Scroll Status Badge -->
              <div class="shrink-0 w-full sm:w-auto">
                <button
                  v-if="!isCountingDown && !isUnlocked"
                  @click="startCountdown"
                  class="stitch-button-primary w-full sm:w-auto px-6 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                >
                  <span>⚡ GET LINK DOWNLOAD</span>
                </button>

                <div v-else class="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-full text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 border border-emerald-200 shadow-xs">
                  <svg class="w-4 h-4 text-emerald-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span>Silakan Scroll Ke Bawah Halaman</span>
                </div>
              </div>
            </div>

            <!-- Premium Bypasser Notice -->
            <div v-if="isPremium" class="p-2.5 bg-amber-50 rounded-full text-xs text-amber-900 text-center font-medium">
              👑 Status Premium Aktif — Mengalihkan langsung ke link file...
            </div>
          </div>

          <!-- SHORTENER TOP AD SLOT (Atas Artikel) -->
          <AdSlot
            v-if="!isPremium"
            :enabled="siteSettings.showShortenerTopAd !== false"
            :scriptContent="siteSettings.shortenerTopAdScript"
            label="IKLAN ATAS SHORTENER"
            type="in-article"
          />

          <!-- FULL STANDARD EDITORIAL ARTICLE CONTENT -->
          <article class="space-y-8">
            
            <!-- Article Header Block -->
            <header class="space-y-4 pb-6 border-b border-[#f0f0f0]">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[#2563eb]/10">
                <span class="font-mono-eyebrow text-[#2563eb]">{{ getCategoryName(article.category) }}</span>
              </div>

              <h1 class="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-snug">
                {{ article.title }}
              </h1>

              <p v-if="article.subtitle || article.excerpt" class="text-sm sm:text-base text-gray-600 leading-relaxed">
                {{ article.subtitle || article.excerpt }}
              </p>

              <!-- Author Metadata Row -->
              <div class="flex items-center gap-3.5 pt-4 border-t border-[#f0f0f0]">
                <img :src="getAuthorAvatar(article.author)" :alt="getAuthorName(article.author)" class="w-10 h-10 rounded-full object-cover border border-[#e4e4e7]" />
                <div>
                  <div class="font-bold text-gray-900 text-sm">{{ getAuthorName(article.author) }}</div>
                  <div class="text-xs text-gray-500 flex items-center gap-2 font-mono">
                    <span>{{ getFormattedDate(article.published_at || article.created_at) }}</span>
                    <span>•</span>
                    <span class="text-[#2563eb] font-semibold">{{ article.read_time || '5 min read' }}</span>
                  </div>
                </div>
              </div>
            </header>

            <!-- Main Cover Image Container -->
            <div v-if="article.cover_image" class="w-full h-64 sm:h-96 rounded-2xl overflow-hidden bg-gray-900 relative">
              <img :src="article.cover_image" :alt="article.title" class="w-full h-full object-cover" />
            </div>

            <!-- SHORTENER MIDDLE AD SLOT (Tengah Artikel) -->
            <AdSlot
              v-if="!isPremium"
              :enabled="siteSettings.showShortenerMiddleAd !== false"
              :scriptContent="siteSettings.shortenerMiddleAdScript"
              label="IKLAN TENGAH SHORTENER"
              type="in-article"
            />

            <!-- Rich Text Article Content Body -->
            <div class="max-w-[65ch] space-y-6 text-gray-900 text-base sm:text-lg leading-relaxed article-content-body pt-2" v-html="formattedContent">
            </div>

            <!-- SHORTENER BOTTOM AD SLOT (Bawah Artikel) -->
            <AdSlot
              v-if="!isPremium"
              :enabled="siteSettings.showShortenerBottomAd !== false"
              :scriptContent="siteSettings.shortenerBottomAdScript"
              label="IKLAN BAWAH SHORTENER"
              type="in-article"
            />

            <!-- MINIMALIST SHORTENER BOTTOM BOX (BAWAH ARTIKEL) -->
            <div id="download-unlock-area" class="mt-8 p-6 sm:p-8 bg-[#f4f4f5] rounded-2xl space-y-4 text-center scroll-mt-36">
              
              <div class="space-y-1">
                <span class="font-mono-eyebrow text-[#2563eb]">PENGAMBILAN FILE DOWNLOAD</span>
                <h3 class="text-base sm:text-lg font-bold text-[#171717]">
                  {{ isUnlocked ? 'Link File Siap Diunduh' : (isCountingDown ? 'Memproses Link Download File...' : 'Menunggu Klik "Get Link Download"') }}
                </h3>
              </div>

              <!-- State 1: Before Countdown Started (Clean instruction, NO manual button) -->
              <div v-if="!isCountingDown && !isUnlocked" class="p-4 bg-white rounded-xl text-xs sm:text-sm text-[#707070] max-w-md mx-auto space-y-2 border border-[#e4e4e7]">
                <p class="leading-relaxed">
                  Silakan klik tombol <strong class="text-[#2563eb]">"GET LINK DOWNLOAD"</strong> di bagian atas halaman untuk memproses dan membuka link file secara otomatis.
                </p>
              </div>

              <!-- State 2: Countdown Active (10s -> 0s) -->
              <div v-else-if="isCountingDown" class="py-4 space-y-2">
                <div class="font-mono text-4xl font-extrabold text-[#2563eb] tracking-tight">
                  {{ countdownSeconds }}s
                </div>
                <p class="text-xs sm:text-sm font-mono text-[#707070]">
                  Mohon tunggu {{ countdownSeconds }} detik... Tombol download sedang disiapkan.
                </p>
                <!-- Animated Progress Bar -->
                <div class="max-w-xs mx-auto h-2 bg-[#e4e4e7] rounded-full overflow-hidden mt-2">
                  <div
                    class="h-full bg-[#2563eb] rounded-full transition-all duration-1000 ease-linear"
                    :style="{ width: ((15 - countdownSeconds) / 15 * 100) + '%' }"
                  ></div>
                </div>
              </div>

              <!-- State 3: Countdown Finished -> Green Download Button Unlocked -->
              <div v-else-if="isUnlocked && originalUrl" class="space-y-3 pt-2">
                <a
                  :href="originalUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="stitch-button-primary bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-8 py-3.5 inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-95"
                >
                  <span>📥 Download File Sekarang →</span>
                </a>
                <p class="text-xs sm:text-sm text-emerald-700 font-semibold">
                  ✓ Link download aman terverifikasi. Klik tombol di atas untuk mulai mengunduh.
                </p>
              </div>

            </div>

          </article>

        </div>
      </main>

      <!-- RIGHT SIDE BANNER AD SLOT (Desktop lg:col-span-2) -->
      <aside v-if="!isPremium" class="hidden lg:block lg:col-span-2 sticky top-24 space-y-4">
        <AdSlot
          :enabled="siteSettings.showShortenerRightAd !== false"
          :scriptContent="siteSettings.shortenerRightAdScript"
          label="IKLAN SISI KANAN DESKTOP"
          type="sidebar"
        />
      </aside>
      <div v-else class="hidden lg:block lg:col-span-2"></div>

    </div>
  </div>
</template>
