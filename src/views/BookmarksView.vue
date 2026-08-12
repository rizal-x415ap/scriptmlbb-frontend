<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ApiService } from '../services/api.js'
import { siteSettings } from '../services/settingsStore.js'
import { isPremium } from '../services/premiumStore.js'
import { bookmarkedArticles, removeBookmark } from '../services/bookmarkStore.js'
import AdSlot from '../components/AdSlot.vue'
import { setSeoMeta } from '../services/seo.js'

// Sidebar Data State
const mostReadArticles = ref([])
const computedTopics = ref([])

const getCuteAvatar = (name) => {
  const seed = encodeURIComponent(name || 'Rizal Efendi')
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

const loadSidebarWidgets = async () => {
  try {
    const [popular, topics] = await Promise.all([
      ApiService.getPopularArticles(),
      ApiService.getTopics()
    ])
    if (Array.isArray(popular)) mostReadArticles.value = popular
    if (Array.isArray(topics)) computedTopics.value = topics
  } catch (e) {
    // Fail silently
  }
}

onMounted(() => {
  setSeoMeta({
    title: 'Koleksi Artikel Tersimpan',
    description: 'Koleksi artikel favorit dan panduan teknis yang Anda simpan di peramban.',
    url: '/bookmarks',
    type: 'website'
  })

  loadSidebarWidgets()
})

const getFormattedDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getCategoryName = (cat) => {
  if (!cat) return 'SCRIPT MLBB'
  if (typeof cat === 'string') return cat.toUpperCase()
  return (cat.name || 'SCRIPT MLBB').toUpperCase()
}
</script>

<template>
  <div class="space-y-8 py-4">
    <!-- Header Section -->
    <header class="pb-6 border-b border-[#f0f0f0] space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-[#2563eb]/10">
            <span class="font-mono-eyebrow text-[#2563eb]">KOLEKSI PRIBADI</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[#171717]">
            Artikel Disimpan
          </h1>
          <p class="text-sm sm:text-sm text-[#707070]">
            Koleksi artikel dan script skin pilihan yang Anda simpan di peramban.
          </p>
        </div>

        <!-- Count Pill -->
        <div class="px-3.5 py-1.5 rounded-full bg-[#2563eb]/10 text-[#2563eb] text-sm font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-center">
          <svg class="w-4 h-4 text-[#2563eb]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span>{{ bookmarkedArticles.length }} Artikel Disimpan</span>
        </div>
      </div>
    </header>

    <!-- Asymmetric Main Grid Section (8 cols Bookmarks Feed : 4 cols Sidebar Gadgets) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

      <!-- Main Bookmarks Content Track (8 Columns) -->
      <main class="lg:col-span-8 space-y-6">

        <!-- Empty Bookmarks State -->
        <div
          v-if="bookmarkedArticles.length === 0"
          class="py-16 text-center space-y-5"
        >
          <div class="w-16 h-16 rounded-full bg-[#2563eb]/10 flex items-center justify-center mx-auto text-[#2563eb]">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <div class="space-y-1 max-w-md mx-auto">
            <h2 class="text-xl font-bold text-[#171717]">Belum Ada Artikel Disimpan</h2>
            <p class="text-sm sm:text-sm text-[#707070]">
              Klik tombol penanda buku (🔖 Simpan) pada artikel atau script yang Anda sukai untuk menyimpannya di sini.
            </p>
          </div>
          <div class="pt-2">
            <RouterLink
              to="/"
              class="stitch-button-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
            >
              <span>Jelajahi Artikel Terbaru</span>
              <span>→</span>
            </RouterLink>
          </div>
        </div>

        <!-- Bookmarks Feed Stream List -->
        <div v-else class="divide-y divide-[#f0f0f0]">
          <article
            v-for="item in bookmarkedArticles"
            :key="item.id || item.slug"
            class="py-4 flex flex-row items-center justify-between gap-3.5 sm:gap-6 group"
          >
            <!-- Left Side: Category, Title, Date & Actions -->
            <div class="flex flex-col justify-between flex-1 min-w-0 space-y-2">
              <!-- Category & Date -->
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono-eyebrow text-[#2563eb]">
                  {{ getCategoryName(item.category) }}
                </span>
                <span v-if="item.saved_at" class="text-[11px] sm:text-sm text-[#707070] font-mono">
                  {{ getFormattedDate(item.saved_at) }}
                </span>
              </div>

              <!-- Title -->
              <RouterLink :to="'/article/' + (item.slug || item.id)" class="block">
                <h3 class="text-sm sm:text-base font-semibold text-[#171717] leading-snug group-hover:text-[#2563eb] transition-colors line-clamp-2">
                  {{ item.title }}
                </h3>
              </RouterLink>

              <!-- Footer Actions Row -->
              <div class="pt-1.5 flex items-center justify-start">
                <button
                  @click="removeBookmark(item.id || item.slug)"
                  class="text-sm text-[#707070] hover:text-rose-600 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Hapus dari simpanan"
                >
                  <svg class="w-3.5 h-3.5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Hapus</span>
                </button>
              </div>
            </div>

            <!-- Right Side: 1:1 Square Thumbnail Image -->
            <RouterLink
              :to="'/article/' + (item.slug || item.id)"
              class="w-20 sm:w-28 aspect-square shrink-0 rounded-[14px] overflow-hidden bg-[#f4f4f5] relative block"
            >
              <img
                :src="item.cover_image"
                :alt="item.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </RouterLink>
          </article>
        </div>
      </main>

      <!-- Sidebar Gadgets (4 Columns - Matching Home Page) -->
      <aside class="lg:col-span-4 space-y-8">

        <!-- Home Sidebar Ad Slot 1 -->
        <AdSlot
          v-if="!isPremium"
          :enabled="siteSettings.showHomeSidebarAd1 !== false"
          :scriptContent="siteSettings.homeSidebarAd1Script"
          label="IKLAN SIDEBAR 1"
          type="sidebar"
        />

        <!-- Most Read Articles Bento Gadget -->
        <div v-if="siteSettings.showMostReadWidget && mostReadArticles.length > 0" class="space-y-3">
          <!-- Widget Header -->
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-[#2563eb] shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            <span class="text-xs font-bold text-[#171717] uppercase tracking-widest">Terpopuler</span>
          </div>

          <!-- Article Ranked List -->
          <div class="space-y-0">
            <RouterLink
              v-for="(item, index) in mostReadArticles"
              :key="item.id"
              :to="'/article/' + (item.slug || item.id)"
              class="flex items-center gap-3 py-3 group border-b border-[#f0f0f0] last:border-0"
            >
              <!-- Rank Number (Deep Navy -> Vivid Blue Gradient 01 -> 05) -->
              <span
                class="text-2xl font-black font-mono shrink-0 leading-none w-7 text-center"
                :class="['text-[#1e3a8a]', 'text-[#1e40af]', 'text-[#1d4ed8]', 'text-[#2563eb]', 'text-[#3b82f6]'][index] || 'text-[#3b82f6]'"
              >{{ String(index + 1).padStart(2, '0') }}</span>

              <!-- Content -->
              <div class="flex-1 min-w-0 space-y-0.5">
                <h4 class="text-sm font-semibold text-[#171717] line-clamp-2 leading-snug group-hover:text-[#2563eb] transition-colors">
                  {{ item.title }}
                </h4>
                <div class="flex items-center gap-1.5 text-[11px] text-[#a1a1aa] font-mono">
                  <svg class="w-3 h-3 text-[#a1a1aa] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{{ (item.views_count || 120).toLocaleString() }} views</span>
                </div>
              </div>
            </RouterLink>
          </div>

          <!-- Footer -->
          <RouterLink to="/archive" class="flex items-center justify-center gap-1.5 w-full py-2 rounded-full bg-[#f4f4f5] hover:bg-[#2563eb]/10 text-xs font-semibold text-[#707070] hover:text-[#2563eb] transition-all">
            <span>Lihat Semua Artikel</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </RouterLink>
        </div>

        <!-- Publisher / Profile Gadget -->
        <div v-if="siteSettings.showAuthorWidget" class="space-y-4 pb-6 border-b border-[#f0f0f0]">
          <div class="flex items-center gap-4">
            <div class="relative shrink-0">
              <img
                :src="siteSettings.authorAvatarUrl || getCuteAvatar(siteSettings.authorName || 'Rizal Efendi')"
                :alt="siteSettings.authorName || 'Rizal Efendi'"
                class="w-12 h-12 rounded-full object-contain border border-[#e4e4e7] p-0.5 bg-[#f4f4f5]"
              />
              <span class="absolute bottom-0 right-0 w-3 h-3 bg-[#2563eb] rounded-full border-2 border-white"></span>
            </div>
            <div>
              <h3 class="font-bold text-[#171717] text-sm sm:text-base">{{ siteSettings.authorName || 'Rizal Efendi' }}</h3>
              <p class="text-xs sm:text-sm text-[#707070]">{{ siteSettings.authorTitle || 'Penulis & Pengembang Sistem' }}</p>
            </div>
          </div>

          <p class="text-xs sm:text-sm text-[#707070] leading-relaxed">
            {{ siteSettings.authorBio || 'Berbagi pengalaman teknis seputar pemrograman, arsitektur web, dan desain sistem modern.' }}
          </p>

          <div class="flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
            <span class="text-xs font-mono text-[#888888]">{{ siteSettings.authorFollowersCount || '5.2k Pembaca' }}</span>
            <a
              :href="siteSettings.authorInstagramUrl || 'https://instagram.com'"
              target="_blank"
              rel="noopener noreferrer"
              class="stitch-button-primary px-3 py-1 text-xs inline-flex items-center gap-1"
            >
              <span>Ikuti {{ siteSettings.authorInstagramHandle || 'Penulis' }}</span>
            </a>
          </div>
        </div>

        <!-- TOPIK POPULER Gadget -->
        <div v-if="siteSettings.showTopicsWidget && computedTopics.length > 0" class="space-y-3 pb-6 border-b border-[#f0f0f0]">
          <h4 class="font-mono-eyebrow text-[#171717]">TOPIK POPULER</h4>
          <div class="flex flex-wrap gap-2">
            <RouterLink
              v-for="tag in computedTopics"
              :key="tag.name"
              :to="'/archive?category=' + encodeURIComponent(tag.name)"
              class="px-3.5 py-1.5 rounded-full text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer bg-[#f4f4f5] text-[#666666] hover:bg-[#2563eb] hover:text-white"
            >
              <span>{{ tag.name }}</span>
              <span class="text-[10px] opacity-70 font-mono">({{ tag.count }})</span>
            </RouterLink>
          </div>
        </div>

        <!-- Home Sidebar Ad Slot 2 -->
        <AdSlot
          v-if="!isPremium"
          :enabled="siteSettings.showHomeSidebarAd2 !== false"
          :scriptContent="siteSettings.homeSidebarAd2Script"
          label="IKLAN SIDEBAR 2"
          type="sidebar"
        />

      </aside>

    </div>
  </div>
</template>
