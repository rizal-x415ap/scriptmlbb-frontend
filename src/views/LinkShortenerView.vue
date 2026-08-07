<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ApiService } from '../services/api.js'
import { isPremium } from '../services/premiumStore.js'
import { siteSettings } from '../services/settingsStore.js'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import AdSlot from '../components/AdSlot.vue'
import { sanitizeHtml } from '../utils/sanitize.js'
import { setSeoMeta } from '../services/seo.js'

const route = useRoute()
const code = computed(() => route.params.code)

const isLoading = ref(true)
const shortLinkData = ref(null)
const article = ref(null)
const isCountingDown = ref(false)
const countdownSeconds = ref(10)
const originalUrl = ref(null)
const isUnlocked = ref(false)
const errorMessage = ref('')

let metaRobotsEl = null

onMounted(async () => {
  setSeoMeta({
    title: 'Halaman Unduh File SafeLink',
    description: 'Menyiapkan tautan unduhan aman secara otomatis.',
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
    errorMessage.value = 'Link unduhan tidak ditemukan atau sudah tidak valid.'
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  // Restore standard robots tag when leaving the page
  if (metaRobotsEl) {
    metaRobotsEl.content = 'index, follow'
  }
})

const startCountdown = () => {
  if (isCountingDown.value || isUnlocked.value) return

  isCountingDown.value = true
  countdownSeconds.value = 10

  const interval = setInterval(async () => {
    countdownSeconds.value -= 1
    if (countdownSeconds.value <= 0) {
      clearInterval(interval)
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
    errorMessage.value = 'Gagal mengambil link unduhan asli.'
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
        <div v-if="isLoading" class="stitch-card p-8 space-y-6">
          <SkeletonLoader height="32px" width="70%" />
          <SkeletonLoader height="400px" width="100%" />
          <SkeletonLoader height="200px" width="100%" />
        </div>

        <!-- Error State -->
        <div v-else-if="errorMessage" class="stitch-card p-8 text-center space-y-4">
          <div class="text-4xl">⚠️</div>
          <h2 class="text-xl font-bold text-gray-900">Terjadi Kesalahan</h2>
          <p class="text-xs text-gray-600 max-w-md mx-auto">{{ errorMessage }}</p>
          <RouterLink to="/" class="inline-block px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
            Kembali ke Beranda
          </RouterLink>
        </div>

        <!-- MAIN SHORTENER INTEGRATED ARTICLE LAYOUT -->
        <div v-else-if="article" class="space-y-8">

          <!-- ========================================== -->
          <!-- MINIMALIST SHORTENER TOP BOX (EDITORIAL STYLE) -->
          <!-- ========================================== -->
          <div class="stitch-card p-5 sm:p-6 bg-white border border-[#dfdfdf] rounded-[12px] space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-[#dfdfdf] pb-3">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse"></span>
                <span class="font-mono-eyebrow text-[#2563eb]">LINK GENERATOR // FILE UNDUHAN</span>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-[#fafafa] text-[#171717] border border-[#dfdfdf]">
                File: {{ shortLinkData?.link_name || 'Download File' }}
              </span>
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
              <div class="space-y-1 text-center sm:text-left">
                <h2 class="text-base font-bold text-[#171717]">Langkah 1: Klik "Get Link Unduhan"</h2>
                <p class="text-xs text-[#707070] max-w-lg">
                  Setelah diklik, silakan baca & gulir artikel di bawah ini hingga akhir untuk mengambil tombol unduhan.
                </p>
              </div>

              <!-- Step 1 Trigger Button -->
              <div class="shrink-0 w-full sm:w-auto">
                <button
                  v-if="!isCountingDown && !isUnlocked"
                  @click="startCountdown"
                  class="stitch-button-primary w-full sm:w-auto px-6 py-2.5 text-xs font-bold rounded-[6px] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>⚡ GET LINK UNDUHAN</span>
                </button>

                <div v-else-if="isCountingDown" class="px-4 py-2 bg-[#fafafa] border border-[#dfdfdf] text-[#171717] rounded-[6px] text-xs font-mono font-semibold flex items-center justify-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-[#2563eb] animate-ping"></span>
                  <span>Countdown 10s Berjalan...</span>
                </div>

                <div v-else-if="isUnlocked" class="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-[6px] text-xs font-mono font-semibold flex items-center justify-center gap-2">
                  <span>✓ Link Unduhan Terbuka di Bawah</span>
                </div>
              </div>
            </div>

            <!-- Premium Bypasser Notice -->
            <div v-if="isPremium" class="p-2.5 bg-amber-50 border border-amber-200 rounded-[6px] text-xs text-amber-900 text-center font-medium">
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

          <!-- ========================================== -->
          <!-- FULL STANDARD EDITORIAL ARTICLE CONTENT -->
          <!-- ========================================== -->
          <article class="stitch-card p-6 sm:p-10 space-y-8 bg-white">
            
            <!-- Article Header Block -->
            <header class="space-y-4">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-blue-50 border border-blue-200">
                <span class="font-mono text-blue-700 font-bold uppercase tracking-wider text-[11px]">{{ getCategoryName(article.category) }}</span>
              </div>

              <h1 class="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900 leading-snug">
                {{ article.title }}
              </h1>

              <p v-if="article.subtitle || article.excerpt" class="text-sm sm:text-base text-gray-600 leading-relaxed">
                {{ article.subtitle || article.excerpt }}
              </p>

              <!-- Author Metadata Row -->
              <div class="flex items-center gap-3.5 pt-4 border-t border-gray-200">
                <img :src="getAuthorAvatar(article.author)" :alt="getAuthorName(article.author)" class="w-10 h-10 rounded-full object-cover border border-gray-200" />
                <div>
                  <div class="font-bold text-gray-900 text-sm">{{ getAuthorName(article.author) }}</div>
                  <div class="text-xs text-gray-500 flex items-center gap-2 font-mono">
                    <span>{{ getFormattedDate(article.published_at || article.created_at) }}</span>
                    <span>•</span>
                    <span class="text-blue-600 font-semibold">{{ article.read_time || '5 min read' }}</span>
                  </div>
                </div>
              </div>
            </header>

            <!-- Main Cover Image Container -->
            <div v-if="article.cover_image" class="w-full h-64 sm:h-96 rounded-xl overflow-hidden border border-gray-200 bg-gray-900 relative shadow-sm">
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

            <!-- ========================================== -->
            <!-- MINIMALIST SHORTENER BOTTOM BOX (BAWAH ARTIKEL) -->
            <!-- ========================================== -->
            <div id="download-unlock-area" class="mt-8 p-6 sm:p-8 bg-[#fafafa] border border-[#dfdfdf] rounded-[12px] space-y-4 text-center scroll-mt-28">
              
              <div class="space-y-1">
                <span class="font-mono-eyebrow text-[#2563eb]">LANGKAH 2 // UNDUH FILE</span>
                <h3 class="text-lg font-bold text-[#171717]">
                  {{ isUnlocked ? 'Link Unduhan Siap Digunakan' : 'Menyiapkan Tombol Unduhan File' }}
                </h3>
              </div>

              <!-- State 1: Before Countdown Started -->
              <div v-if="!isCountingDown && !isUnlocked" class="p-4 bg-white border border-[#dfdfdf] rounded-[8px] text-xs text-[#707070] max-w-md mx-auto space-y-3">
                <p>Silakan klik tombol <strong>"GET LINK UNDUHAN"</strong> di bagian atas artikel untuk memulai countdown 10 detik.</p>
                <button
                  @click="startCountdown"
                  class="stitch-button-primary px-5 py-2 text-xs font-semibold rounded-[6px] transition-colors cursor-pointer"
                >
                  Klik Di Sini Untuk Memulai Countdown
                </button>
              </div>

              <!-- State 2: Countdown Active (10s -> 0s) -->
              <div v-else-if="isCountingDown" class="py-3 space-y-2">
                <div class="font-mono text-3xl font-bold text-[#2563eb]">
                  {{ countdownSeconds }}s
                </div>
                <p class="text-xs font-mono text-[#707070]">
                  Mohon tunggu {{ countdownSeconds }} detik... Tombol unduhan sedang dibuka.
                </p>
              </div>

              <!-- State 3: Countdown Finished -> Green Download Button Unlocked -->
              <div v-else-if="isUnlocked && originalUrl" class="space-y-3 pt-1">
                <a
                  :href="originalUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="stitch-button-primary bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-[6px] inline-flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <span>📥 Download File Sekarang →</span>
                </a>
                <p class="text-xs text-emerald-700 font-medium">
                  ✓ Link unduhan berhasil dibuka. Klik tombol di atas untuk mulai mengunduh file.
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
