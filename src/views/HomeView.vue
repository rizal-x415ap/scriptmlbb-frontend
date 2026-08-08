<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ApiService } from '../services/api.js'
import { siteSettings } from '../services/settingsStore.js'
import { isPremium } from '../services/premiumStore.js'
import SkeletonLoader from '../components/SkeletonLoader.vue'
import ArticleCardSkeleton from '../components/ArticleCardSkeleton.vue'
import AdSlot from '../components/AdSlot.vue'
import { setSeoMeta, getAbsoluteUrl } from '../services/seo.js'

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
})

// Async Loading & API State (Smart Skeleton - Only shows if request takes > 150ms)
const isLoading = ref(false)
const featuredArticle = ref(null)
const articles = ref([])

// Reactive Category Filter State
const selectedCategory = ref('All')

// Dynamic Categories derived from Backend Data
const categories = computed(() => {
  const cats = new Set(['All'])
  if (featuredArticle.value && featuredArticle.value.category) {
    cats.add(getCategoryName(featuredArticle.value.category))
  }
  if (Array.isArray(articles.value)) {
    articles.value.forEach(a => {
      if (a.category) cats.add(getCategoryName(a.category))
    })
  }
  return Array.from(cats)
})

// Dynamic Most Read Articles (Sorted by views_count from MySQL)
const mostReadArticles = computed(() => {
  if (!Array.isArray(articles.value)) return []
  return [...articles.value]
    .sort((a, b) => (b.views_count || b.likes_count || 0) - (a.views_count || a.likes_count || 0))
    .slice(0, 4)
})

// Featured Section Category Filter & Horizontal Slider Ref
const selectedFeaturedCategory = ref('All')
const featuredContainerRef = ref(null)
const topSliderArticles = ref([])

const scrollFeaturedLeft = () => {
  if (featuredContainerRef.value) {
    featuredContainerRef.value.scrollBy({ left: -300, behavior: 'smooth' })
  }
}

const scrollFeaturedRight = () => {
  if (featuredContainerRef.value) {
    featuredContainerRef.value.scrollBy({ left: 300, behavior: 'smooth' })
  }
}

// Top Featured Slider Articles (Fixed Max 5 Newest Articles, Independent from Feed Load More)
const featuredArticlesList = computed(() => {
  let list = topSliderArticles.value
  if (selectedCategory.value !== 'All') {
    list = articles.value.filter(a => getCategoryName(a.category).toLowerCase() === selectedCategory.value.toLowerCase())
  }
  return list.slice(0, 5)
})

// Interactive Newsletter Subscription State
const emailInput = ref('')
const isSubscribed = ref(false)
const subscribeMessage = ref('')

const handleSubscribe = async () => {
  if (emailInput.value && emailInput.value.includes('@')) {
    const res = await ApiService.subscribeNewsletter(emailInput.value)
    isSubscribed.value = true
    subscribeMessage.value = res.message
    emailInput.value = ''
  }
}

// Accordion Gadget State
const isArchiveOpen = ref(true)
const toggleArchive = () => {
  isArchiveOpen.value = !isArchiveOpen.value
}

// Dynamic Topics from Database
const dynamicTopics = ref([])

const computedTopics = computed(() => {
  if (Array.isArray(dynamicTopics.value) && dynamicTopics.value.length > 0) {
    return dynamicTopics.value
  }
  // Fallback: Calculate dynamically from loaded articles
  const map = {}
  if (Array.isArray(articles.value)) {
    articles.value.forEach(a => {
      const cat = getCategoryName(a.category)
      if (cat) {
        map[cat] = (map[cat] || 0) + 1
      }
    })
  }
  return Object.keys(map).map(name => ({ name, count: map[name] }))
})

const archivePosts = [
  { id: 'featured-1', title: 'Understanding Vue 3 Reactivity & Memory Mechanics', date: 'Jul 15, 2026', reads: '4.2k' },
  { id: '1', title: 'Micro-Frontends vs Monorepos: Lessons Learned', date: 'Jul 10, 2026', reads: '3.8k' },
  { id: '2', title: 'Mastering HTTP/3 & QUIC Protocol Stream Multiplexing', date: 'Jun 28, 2026', reads: '5.1k' }
]

// Helpers for API Data Normalization (Laravel API returns category & author objects)
const getCategoryName = (cat) => {
  if (!cat) return ''
  return typeof cat === 'object' ? cat.name : cat
}

const getAuthorName = (author) => {
  if (!author) return ''
  return typeof author === 'object' ? (author.name || '') : author
}

const getAuthorAvatar = (author) => {
  if (!author) return ''
  return typeof author === 'object' ? (author.avatar || '') : author
}

const getFormattedDate = (date) => {
  if (!date) return ''
  if (typeof date === 'string' && date.includes('T')) {
    return new Date(date).toLocaleDateString('id-ID', { month: 'short', day: '2-digit', year: 'numeric' })
  }
  return date
}

const formatViews = (val) => {
  const num = Number(val) || 0
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace('.0', '') + 'm'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace('.0', '') + 'k'
  }
  return num.toString()
}

// Device Real-Time Date Formatted
const currentDateFormatted = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
})

// Load Home Feed Data from Laravel API Service
const currentPage = ref(1)
const lastPage = ref(1)
const isLoadingMore = ref(false)

const loadHomeFeed = async () => {
  let isDone = false
  const timer = setTimeout(() => {
    if (!isDone) {
      isLoading.value = true
    }
  }, 150)

  try {
    const data = await ApiService.getHomeFeed(1)
    featuredArticle.value = data?.featured || null
    articles.value = data?.feed || []
    
    // Store top 5 newest articles for top slider independently
    topSliderArticles.value = (data?.feed || []).slice(0, 5)

    if (Array.isArray(data?.topics)) {
      dynamicTopics.value = data.topics
    }
    if (data?.pagination) {
      currentPage.value = data.pagination.current_page || 1
      lastPage.value = data.pagination.last_page || 1
    }

    // Set Home Page SEO & WebSite Schema
    setSeoMeta({
      title: 'Script MLBB',
      description: siteSettings.siteDescription || 'Portal informasi artikel teknis, catatan arsitektur sistem, dan panduan software modern.',
      url: '/',
      type: 'website',
      jsonLdSchema: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        'name': siteSettings.brandLogoText || 'Script MLBB',
        'url': getAbsoluteUrl('/'),
        'description': siteSettings.siteDescription || 'Portal informasi artikel teknis dan arsitektur web modern.'
      }
    })
  } finally {
    isDone = true
    clearTimeout(timer)
    isLoading.value = false
  }
}

const loadMoreArticles = async () => {
  if (currentPage.value >= lastPage.value || isLoadingMore.value) return
  isLoadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const res = await ApiService.getHomeFeed(nextPage)
    if (Array.isArray(res?.feed) && res.feed.length > 0) {
      const existingIds = new Set(articles.value.map(a => a.id))
      const newItems = res.feed.filter(a => !existingIds.has(a.id))
      articles.value.push(...newItems)
      currentPage.value = nextPage
      if (res?.pagination?.last_page) {
        lastPage.value = res.pagination.last_page
      }
    }
  } catch (e) {
  } finally {
    isLoadingMore.value = false
  }
}

onMounted(() => {
  loadHomeFeed()
})

// Filtered Articles Computed Property (Featured articles pinned at top)
const filteredArticles = computed(() => {
  const list = articles.value.filter(article => {
    const catName = getCategoryName(article.category)
    const matchesCategory = selectedCategory.value === 'All' || catName === selectedCategory.value
    const matchesSearch = !props.searchQuery ||
      article.title.toLowerCase().includes(props.searchQuery.toLowerCase()) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(props.searchQuery.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  return list.sort((a, b) => {
    const aFeat = (a.is_featured === true || a.is_featured === 1 || a.is_featured === '1') ? 1 : 0
    const bFeat = (b.is_featured === true || b.is_featured === 1 || b.is_featured === '1') ? 1 : 0
    return bFeat - aFeat
  })
})

// Toggle Like Handler
const toggleLike = (item) => {
  item.is_liked = !item.is_liked
  if (item.is_liked) {
    item.likes_count++
  } else {
    item.likes_count--
  }
}

// Toggle Bookmark Handler
const toggleBookmark = (item) => {
  item.is_bookmarked = !item.is_bookmarked
}
</script>

<template>
  <div class="space-y-12 py-4">

    <!-- Top Section: Featured Carousel Slider (Full Width) -->
    <section class="space-y-6">
      <!-- Section Header with Category Filter & Navigation Arrows -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#f0f0f0] pb-4">
        <div class="flex flex-wrap items-center gap-3">
          <span class="w-2.5 h-2.5 rounded-full bg-[#2563eb] animate-pulse"></span>
          <h1 class="font-extrabold text-[#2563eb] text-base sm:text-xl tracking-tight uppercase">
            UPDATE SCRIPT SKIN MOBILE LEGENDS
          </h1>

          <!-- Real-Time Device Date Badge -->
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
            <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{{ currentDateFormatted }}</span>
          </span>

          <!-- Left / Right Slider Controls -->
          <div class="flex items-center gap-1.5 ml-1">
            <button
              @click="scrollFeaturedLeft"
              class="p-2 rounded-full bg-[#f4f4f5] text-[#707070] hover:text-[#171717] hover:bg-[#e4e4e7] transition-all cursor-pointer"
              aria-label="Slide Left"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              @click="scrollFeaturedRight"
              class="p-2 rounded-full bg-[#f4f4f5] text-[#707070] hover:text-[#171717] hover:bg-[#e4e4e7] transition-all cursor-pointer"
              aria-label="Slide Right"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Skeleton Loading -->
      <div v-if="isLoading" class="flex gap-6 overflow-hidden">
        <div v-for="n in 4" :key="n" class="w-[240px] sm:w-[260px] shrink-0 space-y-3">
          <SkeletonLoader className="h-48 w-full rounded-[14px]" />
          <SkeletonLoader className="h-4 w-1/3" />
          <SkeletonLoader className="h-5 w-full" />
          <SkeletonLoader className="h-3 w-1/2" />
        </div>
      </div>

      <!-- Portrait Cards Horizontal Slider Track (Full Width Screen Reach) -->
      <div
        ref="featuredContainerRef"
        v-else-if="featuredArticlesList.length > 0"
        class="flex gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory scroll-smooth"
      >
        <article
          v-for="item in featuredArticlesList"
          :key="'feat-card-' + item.id"
          class="w-[240px] sm:w-[260px] shrink-0 snap-start flex flex-col justify-between group"
        >
          <div class="space-y-3">
            <!-- Thumbnail Image (1:1 Ratio with floating views count badge) -->
            <RouterLink
              :to="'/article/' + (item.slug || item.id)"
              class="block w-full aspect-square rounded-[14px] overflow-hidden bg-[#f4f4f5] relative"
            >
              <img
                :src="item.cover_image"
                :alt="item.title"
                loading="lazy"
                decoding="async"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <!-- Floating Views Badge (Pojok Kanan Atas) -->
              <div class="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#171717]/80 text-white backdrop-blur-md border border-white/20 flex items-center gap-1 shadow-xs z-10 pointer-events-none">
                <svg class="w-3 h-3 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{{ formatViews(item.views_count) }}</span>
              </div>
            </RouterLink>

            <!-- Category Badge -->
            <div>
              <span class="font-mono-eyebrow text-[#2563eb]">
                {{ getCategoryName(item.category) }}
              </span>
            </div>

            <!-- Article Title -->
            <RouterLink :to="'/article/' + (item.slug || item.id)" class="block">
              <h3 class="text-base font-semibold text-[#171717] leading-snug line-clamp-2 group-hover:text-[#2563eb] transition-colors">
                {{ item.title }}
              </h3>
            </RouterLink>
          </div>

          <!-- Date Footer -->
          <div class="pt-3 mt-3 border-t border-[#f0f0f0] flex items-center justify-between text-xs text-[#888888] font-mono">
            <span>{{ getFormattedDate(item.published_at || item.date) }}</span>
          </div>
        </article>

        <!-- Card "Lihat Artikel Lainnya" di Akhir Slider Track (Minimalis & Elegan) -->
        <RouterLink
          :to="selectedCategory !== 'All' ? '/archive?category=' + encodeURIComponent(selectedCategory) : '/archive'"
          class="w-[200px] sm:w-[220px] shrink-0 snap-start flex flex-col justify-between p-5 rounded-[14px] border border-[#ebebeb] hover:border-[#2563eb] bg-white group cursor-pointer transition-all duration-300"
        >
          <div class="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-3">
            <div class="w-11 h-11 rounded-full bg-[#f4f4f5] group-hover:bg-[#2563eb] text-[#171717] group-hover:text-white flex items-center justify-center transition-colors duration-300">
              <svg class="w-5 h-5 group-hover:translate-x-0.5 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
            <div class="space-y-1">
              <span class="block text-xs font-bold text-[#171717] group-hover:text-[#2563eb] transition-colors">
                Lihat Artikel Lainnya
              </span>
              <span class="block text-[11px] text-[#888888] font-mono">
                {{ selectedCategory !== 'All' ? selectedCategory : 'Arsip Lengkap' }}
              </span>
            </div>
          </div>

          <div class="pt-3 border-t border-[#f0f0f0] flex items-center justify-center text-[11px] font-semibold text-[#2563eb] group-hover:underline">
            <span>Jelajahi →</span>
          </div>
        </RouterLink>
      </div>

      <div v-else class="py-12 text-center text-[#707070] text-sm">
        Tidak ada artikel pilihan yang ditemukan dalam kategori ini.
      </div>
    </section>

    <!-- Asymmetric Main Grid Section (8 cols Articles Feed : 4 cols Sidebar Gadgets) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

      <!-- Main Content Track (8 Columns) -->
      <main class="lg:col-span-8 space-y-6">

        <!-- Category Filter Tabs -->
        <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#f0f0f0]">
          <button
            v-for="cat in categories"
            :key="cat"
            @click="selectedCategory = cat"
            class="px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer"
            :class="[
              selectedCategory === cat
                ? 'bg-[#2563eb] text-white'
                : 'bg-[#f4f4f5] text-[#666666] hover:bg-[#e4e4e7] hover:text-[#171717]'
            ]"
          >
            {{ cat === 'All' ? 'Semua Kategori' : cat }}
          </button>
        </div>

        <!-- Skeleton Loading State for Feed Stream -->
        <div v-if="isLoading" class="divide-y divide-[#f0f0f0]">
          <ArticleCardSkeleton v-for="n in 3" :key="n" />
        </div>

        <!-- Feed Articles Stream -->
        <div v-else class="divide-y divide-[#f0f0f0]">
          <template v-for="(article, index) in filteredArticles" :key="article.id || article.slug || index">
            <article
              class="py-5 flex flex-row items-center justify-between gap-4 sm:gap-6 group"
            >
              <!-- Sisi Kiri: Kategori, Judul & Tanggal -->
              <div class="flex flex-col justify-between flex-1 min-w-0 space-y-2">
                <!-- Kategori Badge & Pin Disematkan -->
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-mono-eyebrow text-[#2563eb]">
                    {{ getCategoryName(article.category) }}
                  </span>
                  <span
                    v-if="article.is_featured"
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700"
                  >
                    <svg class="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                    </svg>
                    <span>Disematkan</span>
                  </span>
                </div>

                <!-- Judul Artikel -->
                <RouterLink :to="'/article/' + (article.slug || article.id)" class="block">
                  <h2 class="text-base sm:text-lg font-semibold text-[#171717] leading-snug line-clamp-2 group-hover:text-[#2563eb] transition-colors">
                    {{ article.title }}
                  </h2>
                </RouterLink>

                <!-- Tanggal & Meta Footer -->
                <div class="pt-1.5 flex items-center gap-2 text-xs text-[#888888] font-mono">
                  <span>{{ getFormattedDate(article.published_at || article.date) }}</span>
                  <span class="text-[#cccccc]">•</span>
                  <span>{{ article.read_time }}</span>
                </div>
              </div>

              <!-- Sisi Kanan: Thumbnail Image (Rasio 1:1 Aspect Square with Floating Views Badge) -->
              <RouterLink
                :to="'/article/' + (article.slug || article.id)"
                class="w-20 sm:w-28 aspect-square shrink-0 rounded-[14px] overflow-hidden bg-[#f4f4f5] relative block"
              >
                <img
                  :src="article.cover_image"
                  :alt="article.title"
                  loading="lazy"
                  decoding="async"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <!-- Floating Views Badge (Pojok Kanan Atas) -->
                <div class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#171717]/80 text-white backdrop-blur-md border border-white/20 flex items-center gap-1 shadow-xs z-10 pointer-events-none">
                  <svg class="w-3 h-3 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{{ formatViews(article.views_count) }}</span>
                </div>
              </RouterLink>
            </article>

            <!-- In-Feed Ad Slot (Disisipkan setelah artikel ke-3 / index === 2) -->
            <AdSlot
              v-if="!isPremium && index === 2"
              :enabled="siteSettings.showHomeFeedAd !== false"
              :scriptContent="siteSettings.homeFeedAdScript"
              label="IKLAN FEED UTAMA (POST 3)"
              type="feed"
            />
          </template>

          <div v-if="filteredArticles.length === 0" class="text-center py-16 text-[#707070]">
            Tidak ada artikel yang sesuai dengan kriteria filter.
          </div>
        </div>

        <!-- Load More Feed Button -->
        <div v-if="currentPage < lastPage" class="text-center pt-6">
          <button
            @click="loadMoreArticles"
            :disabled="isLoadingMore"
            class="stitch-button-secondary px-8 py-2.5 text-xs inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="isLoadingMore" class="w-3.5 h-3.5 rounded-full border-2 border-[#171717] border-t-transparent animate-spin"></span>
            <span>{{ isLoadingMore ? 'Memuat Artikel...' : 'Muat Artikel Lainnya' }}</span>
          </button>
        </div>
      </main>

      <!-- Sidebar Gadgets (4 Columns) -->
      <aside class="lg:col-span-4 space-y-8">

        <!-- Home Sidebar Ad Slot 1 (Sisi Kanan Tempat 1) -->
        <AdSlot
          v-if="!isPremium"
          :enabled="siteSettings.showHomeSidebarAd1 !== false"
          :scriptContent="siteSettings.homeSidebarAd1Script"
          label="IKLAN SIDEBAR 1"
          type="sidebar"
        />

        <!-- Most Read Articles Bento Gadget -->
        <div v-if="siteSettings.showMostReadWidget" class="space-y-4 pb-6 border-b border-[#f0f0f0]">
          <div class="flex items-center justify-between pb-2 border-b border-[#f0f0f0]">
            <span class="font-mono-eyebrow text-[#171717]">ARTIKEL TERPOPULER</span>
            <span class="w-2 h-2 rounded-full bg-[#2563eb] animate-pulse"></span>
          </div>

          <div class="space-y-3.5 divide-y divide-[#f0f0f0]">
            <article
              v-for="(item, index) in mostReadArticles"
              :key="item.id"
              class="pt-3 first:pt-0 space-y-1.5 group"
            >
              <div class="flex items-center justify-between text-xs text-[#888888]">
                <span class="font-mono-eyebrow text-[#2563eb]">#0{{ index + 1 }} • {{ getCategoryName(item.category) }}</span>
                <span class="font-mono text-[#888888] flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {{ item.views_count || 120 }}
                </span>
              </div>

              <RouterLink :to="'/article/' + (item.slug || item.id)" class="block">
                <h4 class="text-sm font-semibold text-[#171717] line-clamp-2 leading-snug group-hover:text-[#2563eb] transition-colors">
                  {{ item.title }}
                </h4>
              </RouterLink>
            </article>
          </div>

          <div class="pt-3 border-t border-[#f0f0f0] flex items-center justify-between text-xs text-[#888888]">
            <span class="font-mono">DIURUTKAN POPULARITAS</span>
            <RouterLink to="/archive" class="font-semibold text-[#171717] hover:text-[#2563eb] flex items-center gap-1">
              Lihat Semua
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </RouterLink>
          </div>
        </div>

        <!-- Publisher / Profile Gadget -->
        <div v-if="siteSettings.showAuthorWidget" class="space-y-4 pb-6 border-b border-[#f0f0f0]">
          <div class="flex items-center gap-4">
            <div class="relative">
              <img
                :src="siteSettings.authorAvatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'"
                :alt="siteSettings.authorName || 'Author'"
                class="w-12 h-12 rounded-full object-cover border border-[#e4e4e7]"
              />
              <span class="absolute bottom-0 right-0 w-3 h-3 bg-[#2563eb] rounded-full border-2 border-white"></span>
            </div>
            <div>
              <h3 class="font-bold text-[#171717] text-sm">{{ siteSettings.authorName || 'Rizal Efendi' }}</h3>
              <p class="text-xs text-[#707070]">{{ siteSettings.authorTitle || 'Penulis & Pengembang Sistem' }}</p>
            </div>
          </div>

          <p class="text-xs text-[#707070] leading-relaxed">
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

        <!-- TOPIK POPULER Gadget (Dynamic from Database) -->
        <div v-if="siteSettings.showTopicsWidget && computedTopics.length > 0" class="space-y-3 pb-6 border-b border-[#f0f0f0]">
          <h4 class="font-mono-eyebrow text-[#171717]">TOPIK POPULER</h4>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tag in computedTopics"
              :key="tag.name"
              @click="selectedCategory = tag.name"
              class="px-3 py-1 rounded-full text-xs transition-colors flex items-center gap-1.5 cursor-pointer border-0"
              :class="selectedCategory === tag.name ? 'bg-[#2563eb] text-white font-semibold' : 'bg-[#f4f4f5] text-[#666666] hover:bg-[#e4e4e7] hover:text-[#171717]'"
            >
              <span>{{ tag.name }}</span>
              <span class="text-[10px] opacity-70 font-mono">({{ tag.count }})</span>
            </button>
          </div>
        </div>

        <!-- Home Sidebar Ad Slot 2 (Sisi Kanan Tempat 2) -->
        <AdSlot
          v-if="!isPremium"
          :enabled="siteSettings.showHomeSidebarAd2 !== false"
          :scriptContent="siteSettings.homeSidebarAd2Script"
          label="IKLAN SIDEBAR 2"
          type="sidebar"
        />

      </aside>

    </div>

    <!-- Pre-Footer Banner Ad Slot (Sebelum Footer) -->
    <AdSlot
      v-if="!isPremium"
      :enabled="siteSettings.showPreFooterAd !== false"
      :scriptContent="siteSettings.preFooterAdScript"
      label="IKLAN PRE-FOOTER BANNER"
      type="pre-footer"
    />

  </div>
</template>
