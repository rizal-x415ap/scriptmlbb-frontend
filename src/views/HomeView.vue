<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ApiService } from '../services/api.js'
import { siteSettings, loadSiteSettings } from '../services/settingsStore.js'
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
const isFeedLoading = ref(false)
const featuredArticle = ref(null)
const articles = ref([])

// Reactive Category Filter State
const selectedCategory = ref('All')
const allCategoriesList = ref(['All'])

// Dynamic Categories sorted by article count descending (Highest article count first, with 'All' at index 0)
const categories = computed(() => {
  const countMap = {}

  // 1. Populate countMap from backend dynamicTopics (DB orderByDesc articles_count)
  if (Array.isArray(dynamicTopics.value)) {
    dynamicTopics.value.forEach(t => {
      if (t.name) {
        countMap[t.name] = t.count || 0
      }
    })
  }

  // 2. Fallback: Add any missing categories from loaded articles
  if (Array.isArray(articles.value)) {
    articles.value.forEach(a => {
      const catName = getCategoryName(a.category)
      if (catName && catName !== 'All') {
        if (!(catName in countMap)) {
          countMap[catName] = 1
        }
      }
    })
  }

  // 3. Sort category names by count descending
  const sortedCategories = Object.keys(countMap).sort((a, b) => {
    return (countMap[b] || 0) - (countMap[a] || 0)
  })

  // 'All' is always pinned at the beginning
  return ['All', ...sortedCategories]
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

// Top Featured Slider Articles (Fixed 5 Latest Articles for Site Settings Featured Category)
const featuredArticlesList = computed(() => {
  if (!Array.isArray(topSliderArticles.value)) return []
  return topSliderArticles.value.slice(0, 5)
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

const getCuteAvatar = (name) => {
  const seed = encodeURIComponent(name || 'Rizal Efendi')
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

const getAuthorAvatar = (author) => {
  if (author && typeof author === 'object' && author.avatar) return author.avatar
  if (siteSettings.authorAvatarUrl) return siteSettings.authorAvatarUrl
  return getCuteAvatar(siteSettings.authorName || 'Rizal Efendi')
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

const loadHomeFeed = async (page = 1, category = 'All') => {
  let isDone = false
  const timer = setTimeout(() => {
    if (!isDone) {
      isLoading.value = true
    }
  }, 150)

  try {
    // Ensure siteSettings is loaded before resolving featuredPostCategory
    await loadSiteSettings()

    const data = await ApiService.getHomeFeed(page, category)
    featuredArticle.value = data?.featured || null
    articles.value = data?.feed || []
    
    // Fetch 5 top articles specifically for the top featured slider based on siteSettings.featuredPostCategory
    const targetCategory = siteSettings.featuredPostCategory || 'All'
    if (targetCategory !== 'All') {
      try {
        const featData = await ApiService.getHomeFeed(1, targetCategory)
        topSliderArticles.value = (featData?.feed || []).slice(0, 5)
      } catch (e) {
        topSliderArticles.value = (data?.feed || []).slice(0, 5)
      }
    } else {
      topSliderArticles.value = (data?.feed || []).slice(0, 5)
    }

    if (Array.isArray(data?.topics) && data.topics.length > 0) {
      dynamicTopics.value = data.topics
      data.topics.forEach(t => {
        if (t.name) allCategoriesList.value.push(t.name)
      })
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

const selectCategory = async (cat) => {
  if (selectedCategory.value === cat && articles.value.length > 0) return
  selectedCategory.value = cat
  currentPage.value = 1
  isFeedLoading.value = true

  try {
    const data = await ApiService.getHomeFeed(1, cat)
    articles.value = data?.feed || []
    if (data?.pagination) {
      currentPage.value = data.pagination.current_page || 1
      lastPage.value = data.pagination.last_page || 1
    }
  } catch (e) {
  } finally {
    isFeedLoading.value = false
  }
}

const loadMoreArticles = async () => {
  if (currentPage.value >= lastPage.value || isLoadingMore.value) return
  isLoadingMore.value = true
  try {
    const nextPage = currentPage.value + 1
    const res = await ApiService.getHomeFeed(nextPage, selectedCategory.value)
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

// Watch siteSettings.featuredPostCategory to re-evaluate top slider articles if settings update dynamically
watch(() => siteSettings.featuredPostCategory, async (newCat) => {
  const targetCategory = newCat || 'All'
  if (targetCategory !== 'All') {
    try {
      const featData = await ApiService.getHomeFeed(1, targetCategory)
      topSliderArticles.value = (featData?.feed || []).slice(0, 5)
    } catch (e) {
      // Keep existing topSliderArticles
    }
  } else {
    topSliderArticles.value = (articles.value || []).slice(0, 5)
  }
})

// Filtered Articles Computed Property (Featured articles pinned at top)
const filteredArticles = computed(() => {
  const list = articles.value.filter(article => {
    const matchesSearch = !props.searchQuery ||
      article.title.toLowerCase().includes(props.searchQuery.toLowerCase()) ||
      (article.excerpt && article.excerpt.toLowerCase().includes(props.searchQuery.toLowerCase()))
    return matchesSearch
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
      <!-- Section Header -->
      <div class="flex flex-wrap items-center gap-3 border-b border-[#f0f0f0] pb-4">
        <span
          class="w-2.5 h-2.5 rounded-full animate-pulse transition-colors"
          :class="isPremium ? 'bg-amber-500' : 'bg-[#2563eb]'"
        ></span>
        <h1
          class="font-extrabold text-xl sm:text-2xl lg:text-3xl tracking-tight leading-snug transition-colors home-hero-title"
          :class="isPremium ? 'text-amber-600' : 'text-[#171717]'"
        >
          Update Script Skin Mobile Legends
        </h1>

        <!-- Real-Time Device Date Badge (Blue/Amber Theme) -->
        <span
          class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
          :class="isPremium ? 'bg-amber-100 text-amber-800' : 'bg-[#2563eb]/10 text-[#2563eb]'"
        >
          <svg class="w-3.5 h-3.5" :class="isPremium ? 'text-amber-600' : 'text-[#2563eb]'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{{ currentDateFormatted }}</span>
        </span>
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
              <h3 class="text-base sm:text-lg font-semibold text-[#171717] leading-snug line-clamp-2 group-hover:text-[#2563eb] transition-colors">
                {{ item.title }}
              </h3>
            </RouterLink>
          </div>

          <!-- Date Footer -->
          <div class="pt-3 mt-3 border-t border-[#f0f0f0] flex items-center justify-between text-xs sm:text-sm text-[#888888] font-mono">
            <span>{{ getFormattedDate(item.published_at || item.date) }}</span>
          </div>
        </article>

        <!-- Cardless Open End Slider Item (Matching Exact Structure & 1:1 Ratio of Article Items) -->
        <RouterLink
          :to="(siteSettings.featuredPostCategory && siteSettings.featuredPostCategory !== 'All') ? '/archive?category=' + encodeURIComponent(siteSettings.featuredPostCategory) : '/archive'"
          class="w-[240px] sm:w-[260px] shrink-0 snap-start flex flex-col justify-between group cursor-pointer"
        >
          <div class="space-y-3">
            <!-- 1:1 Aspect Ratio Box (Same height & rounded corners as article thumbnail cover) -->
            <div class="w-full aspect-square rounded-[14px] bg-[#f4f4f5] group-hover:bg-[#2563eb] transition-colors duration-300 flex flex-col items-center justify-center p-6 text-center text-[#171717] group-hover:text-white relative">
              <div class="w-12 h-12 rounded-full bg-white group-hover:bg-white/20 text-[#2563eb] group-hover:text-white flex items-center justify-center transition-colors mb-3 shadow-xs">
                <svg class="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
              <span class="text-xs font-bold font-mono tracking-wider">ARSIP LENGKAP</span>
            </div>

            <!-- Eyebrow Tag (Same font & position as article category) -->
            <div>
              <span class="font-mono-eyebrow text-[#2563eb]">
                LIHAT LAINNYA
              </span>
            </div>

            <!-- Title (Same size & typography as article title) -->
            <h3 class="text-base sm:text-lg font-semibold text-[#171717] group-hover:text-[#2563eb] transition-colors leading-snug line-clamp-2">
              Jelajahi Artikel {{ (siteSettings.featuredPostCategory && siteSettings.featuredPostCategory !== 'All') ? siteSettings.featuredPostCategory : 'Lainnya' }}
            </h3>
          </div>

          <!-- Date Footer Alignment Line (Same border-t as article cards) -->
          <div class="pt-3 mt-3 border-t border-[#f0f0f0] flex items-center justify-between text-xs text-[#888888] font-mono">
            <span>Buka Arsip →</span>
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
            @click="selectCategory(cat)"
            class="px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all cursor-pointer"
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
        <div v-if="isLoading || isFeedLoading" class="divide-y divide-[#f0f0f0]">
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
                <div class="pt-1.5 flex items-center gap-2 text-xs sm:text-sm text-[#52525b] font-mono">
                  <span>{{ getFormattedDate(article.published_at || article.date) }}</span>
                  <span class="text-[#a1a1aa]">•</span>
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
            class="stitch-button-secondary px-8 py-3 text-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
        <div v-if="siteSettings.showMostReadWidget" class="space-y-3">
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
              <!-- Rank Number -->
              <span
                class="text-2xl font-black font-mono shrink-0 leading-none w-7 text-center"
                :class="index === 0 ? 'text-[#2563eb]' : 'text-[#e4e4e7]'"
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

              <!-- Thumbnail -->
              <div class="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-[#f4f4f5]">
                <img
                  :src="item.cover_image"
                  :alt="item.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
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
            <div class="relative">
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

        <!-- TOPIK POPULER Gadget (Dynamic from Database) -->
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
