<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ApiService } from '../services/api.js'
import { siteSettings } from '../services/settingsStore.js'
import { isBookmarked as checkIsBookmarked, toggleBookmark as toggleBookmarkStore } from '../services/bookmarkStore.js'
import { isArticleLiked, addLikedArticle, removeLikedArticle } from '../services/likedStore.js'
import ArticleCardSkeleton from '../components/ArticleCardSkeleton.vue'
import { setSeoMeta, getAbsoluteUrl } from '../services/seo.js'

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
})

const route = useRoute()

// Async Loading & Real-Time API State
const isLoading = ref(false)
const isSearching = ref(false)
const isLoadingMore = ref(false)
const archiveDataset = ref([])

// Search & Filter State (Initialized from URL ?search= & ?category= or props)
const searchInput = ref(route.query.search || props.searchQuery || '')
const selectedCategory = ref(route.query.category || 'All')
const selectedYear = ref('All')
const sortBy = ref('newest')
const currentPage = ref(1)
const lastPage = ref(1)
const totalArticles = ref(0)
const availableCategories = ref(['All'])
const yearsList = ref(['All', '2026', '2025', '2024'])

let searchDebounceTimer = null

watch(() => route.query.category, (newCat) => {
  const cat = newCat || 'All'
  if (cat !== selectedCategory.value) {
    selectedCategory.value = cat
    fetchArchiveData(1, false)
  }
})

watch(() => route.query.search, (newSearch) => {
  const query = newSearch || ''
  if (query !== searchInput.value) {
    searchInput.value = query
    fetchArchiveData(1, false)
  }
})

// Fetch Real-Time Archive Data directly from API
const fetchArchiveData = async (page = 1, append = false) => {
  if (page === 1 && !append) {
    isSearching.value = true
  } else {
    isLoadingMore.value = true
  }

  try {
    const params = {
      page,
      search: searchInput.value || '',
      category: selectedCategory.value !== 'All' ? selectedCategory.value : '',
      year: selectedYear.value !== 'All' ? selectedYear.value : '',
      sort: sortBy.value || 'newest'
    }

    const res = await ApiService.getArchiveArticles(params)
    const newItems = res.data || []

    if (append) {
      const existingIds = new Set(archiveDataset.value.map(a => a.id))
      const uniqueItems = newItems.filter(a => !existingIds.has(a.id))
      archiveDataset.value.push(...uniqueItems)
    } else {
      archiveDataset.value = newItems
    }

    if (res.meta) {
      currentPage.value = res.meta.current_page || page
      lastPage.value = res.meta.last_page || 1
      totalArticles.value = res.meta.total !== undefined ? res.meta.total : archiveDataset.value.length
    } else {
      totalArticles.value = archiveDataset.value.length
    }
  } catch (e) {
    console.error('Error fetching archive from API:', e)
  } finally {
    isSearching.value = false
    isLoadingMore.value = false
    isLoading.value = false
  }
}

// Fetch Category Filter Options from Backend API Topics
const fetchCategoryOptions = async () => {
  try {
    const feedData = await ApiService.getHomeFeed(1)
    if (Array.isArray(feedData?.topics) && feedData.topics.length > 0) {
      const cats = feedData.topics.map(t => t.name).filter(Boolean)
      availableCategories.value = ['All', ...new Set(cats)]
    }
  } catch (e) {}
}

const loadMore = async () => {
  if (currentPage.value >= lastPage.value || isLoadingMore.value) return
  await fetchArchiveData(currentPage.value + 1, true)
}

// Real-Time Watchers for Search Input (300ms Debounce) & Dropdowns
watch(searchInput, () => {
  clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    fetchArchiveData(1, false)
  }, 300)
})

watch([selectedCategory, selectedYear, sortBy], () => {
  fetchArchiveData(1, false)
})

const clearFilters = () => {
  searchInput.value = ''
  selectedCategory.value = 'All'
  selectedYear.value = 'All'
  sortBy.value = 'newest'
  fetchArchiveData(1, false)
}

// Helpers for API Data Normalization
const getCategoryName = (cat) => {
  if (!cat) return 'General'
  return typeof cat === 'object' ? cat.name : cat
}

const getFormattedDate = (date) => {
  if (!date) return ''
  if (typeof date === 'string' && date.includes('T')) {
    return new Date(date).toLocaleDateString('id-ID', { month: 'short', day: '2-digit', year: 'numeric' })
  }
  return date
}

const checkIsItemBookmarked = (item) => {
  if (!item) return false
  return checkIsBookmarked(item.id || item.slug)
}

const checkIsItemLiked = (item) => {
  if (!item) return false
  return isArticleLiked(item.id || item.slug)
}

const activeFilterCount = computed(() => {
  let count = 0
  if (searchInput.value) count++
  if (selectedCategory.value !== 'All') count++
  if (selectedYear.value !== 'All') count++
  if (sortBy.value !== 'newest') count++
  return count
})

// Toggle Like Handler
const toggleLike = async (item) => {
  if (!item) return
  const key = item.id || item.slug

  if (!isArticleLiked(key)) {
    addLikedArticle(key)
    item.likes_count = (item.likes_count || 0) + 1
    try {
      const res = await ApiService.likeArticle(key)
      if (res && res.likes_count !== undefined) {
        item.likes_count = res.likes_count
      }
    } catch (e) {}
  } else {
    removeLikedArticle(key)
    item.likes_count = Math.max(0, (item.likes_count || 0) - 1)
  }
}

// Toggle Bookmark Handler
const toggleBookmark = (item) => {
  if (!item) return
  toggleBookmarkStore(item)
}

// Copy RSS XML Feed Link
const isRssCopied = ref(false)

const copyRssFeed = () => {
  const rssUrl = `${window.location.origin}/rss.xml`
  navigator.clipboard?.writeText?.(rssUrl)
  isRssCopied.value = true
  setTimeout(() => {
    isRssCopied.value = false
  }, 2500)
}

onMounted(() => {
  isLoading.value = true
  fetchCategoryOptions()
  fetchArchiveData(1, false)

  const pageUrl = '/archive'
  const absUrl = getAbsoluteUrl(pageUrl)

  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${absUrl}#webpage`,
        'url': absUrl,
        'name': siteSettings.archiveTitle || 'Arsip Artikel & Catatan Teknis',
        'description': siteSettings.archiveSubtitle || 'Filter seluruh koleksi artikel teknis, catatan arsitektur sistem, dan panduan software.',
        'publisher': {
          '@type': 'Organization',
          'name': siteSettings.brandLogoText || 'Script MLBB',
          'url': getAbsoluteUrl('/')
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${absUrl}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Beranda',
            'item': getAbsoluteUrl('/')
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Arsip Artikel',
            'item': absUrl
          }
        ]
      }
    ]
  }

  setSeoMeta({
    title: siteSettings.archiveTitle || 'Arsip Artikel & Catatan Teknis',
    description: siteSettings.archiveSubtitle || 'Filter seluruh koleksi artikel teknis, catatan arsitektur sistem, dan panduan software.',
    url: pageUrl,
    type: 'website',
    jsonLdSchema
  })
})
</script>

<template>
  <div class="space-y-10 py-4">

    <!-- Header & Hero Search Bar -->
    <header class="pb-8 border-b border-[#f0f0f0] space-y-5">
      <div class="max-w-2xl space-y-3">
        <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-[#2563eb]/10">
          <span class="font-mono-eyebrow text-[#2563eb]">ARSIP & PENCARIAN</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-[#171717]">
          {{ siteSettings.archiveTitle || 'Jelajahi Arsip Artikel & Catatan Teknis' }}
        </h1>
        <p class="text-[#707070] text-sm sm:text-base leading-relaxed">
          {{ siteSettings.archiveSubtitle || 'Filter seluruh koleksi artikel teknis, catatan arsitektur sistem, dan panduan teknis modern.' }}
        </p>
      </div>

      <!-- Main Search Input Control -->
      <div class="relative max-w-2xl">
        <input
          v-model="searchInput"
          type="text"
          placeholder="Cari berdasarkan kata kunci, judul, penulis, atau topik..."
          class="w-full pl-11 pr-10 py-3 text-sm sm:text-sm bg-[#f4f4f5] border border-transparent rounded-full text-[#171717] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
        />
        <svg class="w-5 h-5 text-[#707070] absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>

        <button
          v-if="searchInput"
          @click="searchInput = ''"
          class="absolute right-4 top-3.5 text-[#707070] hover:text-[#171717] font-mono text-sm cursor-pointer"
        >
          ✕
        </button>
      </div>
    </header>

    <!-- Multi-dimensional Filters Control Surface -->
    <div class="pb-6 border-b border-[#f0f0f0] space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <!-- Category Dropdown Filter -->
        <div class="space-y-1.5">
          <label class="font-mono-eyebrow text-[#707070]">Kategori</label>
          <select
            v-model="selectedCategory"
            class="w-full px-3 py-2 text-sm bg-[#f4f4f5] border border-transparent rounded-full text-[#171717] focus:outline-none focus:border-[#2563eb] focus:bg-white"
          >
            <option v-for="cat in availableCategories" :key="cat" :value="cat">
              {{ cat === 'All' ? 'Semua Kategori' : cat }}
            </option>
          </select>
        </div>

        <!-- Year Published Dropdown Filter -->
        <div class="space-y-1.5">
          <label class="font-mono-eyebrow text-[#707070]">Tahun Terbit</label>
          <select
            v-model="selectedYear"
            class="w-full px-3 py-2 text-sm bg-[#f4f4f5] border border-transparent rounded-full text-[#171717] focus:outline-none focus:border-[#2563eb] focus:bg-white"
          >
            <option v-for="year in yearsList" :key="year" :value="year">
              {{ year === 'All' ? 'Semua Tahun' : year }}
            </option>
          </select>
        </div>

        <!-- Sort Criteria Dropdown -->
        <div class="space-y-1.5">
          <label class="font-mono-eyebrow text-[#707070]">Urutkan Berdasarkan</label>
          <select
            v-model="sortBy"
            class="w-full px-3 py-2 text-sm bg-[#f4f4f5] border border-transparent rounded-full text-[#171717] focus:outline-none focus:border-[#2563eb] focus:bg-white"
          >
            <option value="newest">Terbaru Diterbitkan</option>
            <option value="popular">Paling Banyak Disukai</option>
            <option value="readingTime">Waktu Baca Paling Singkat</option>
          </select>
        </div>

      </div>

      <!-- Active Filters Bar & Reset -->
      <div class="flex items-center justify-between text-sm text-[#707070]">
        <div class="flex items-center gap-2">
          <span>Ditemukan <strong class="text-[#171717] font-mono">{{ totalArticles }}</strong> artikel</span>
          <span v-if="activeFilterCount > 0" class="text-[#b2b2b2]">•</span>
          <span v-if="activeFilterCount > 0" class="text-[#2563eb] font-semibold font-mono">
            {{ activeFilterCount }} filter aktif
          </span>
        </div>

        <button
          v-if="activeFilterCount > 0"
          @click="clearFilters"
          class="text-[#2563eb] hover:underline font-medium flex items-center gap-1 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Hapus Filter
        </button>
      </div>
    </div>

    <!-- Asymmetric 8:4 Grid Layout (8 Cols Archive List : 4 Cols Archive Gadgets) -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

      <!-- Main Archive Stream Track (8 Columns) -->
      <main class="lg:col-span-8 space-y-4">
        <!-- Skeleton Loading State -->
        <div v-if="isLoading || isSearching" class="divide-y divide-[#f0f0f0]">
          <ArticleCardSkeleton v-for="n in 3" :key="n" />
        </div>

        <!-- Archive Articles List -->
        <div v-else class="space-y-6">
          <div class="divide-y divide-[#f0f0f0]">
            <article
              v-for="item in archiveDataset"
              :key="item.id"
              class="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              <div class="space-y-2 flex-1">
                <!-- Kategori & Tanggal -->
                <div class="flex items-center gap-3">
                  <span class="font-mono-eyebrow text-[#2563eb]">
                    {{ getCategoryName(item.category) }}
                  </span>
                  <span v-if="getFormattedDate(item.published_at || item.created_at)" class="text-sm text-[#707070] font-mono">
                    {{ getFormattedDate(item.published_at || item.created_at) }}
                  </span>
                </div>

                <!-- Judul Artikel -->
                <RouterLink :to="'/article/' + (item.slug || item.id)" class="block pt-0.5">
                  <h3 class="text-base sm:text-lg font-semibold text-[#171717] leading-snug group-hover:text-[#2563eb] transition-colors">
                    {{ item.title }}
                  </h3>
                </RouterLink>
              </div>

              <!-- Action Buttons -->
              <div class="flex items-center gap-2 self-end sm:self-center pt-2 sm:pt-0">
                <button
                  @click="toggleLike(item)"
                  class="px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  :class="checkIsItemLiked(item) ? 'bg-rose-50 text-rose-600' : 'bg-[#f4f4f5] text-[#707070] hover:text-[#171717] hover:bg-[#e4e4e7]'"
                >
                  <svg class="w-3.5 h-3.5" :fill="checkIsItemLiked(item) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{{ item.likes_count }}</span>
                </button>

                <button
                  @click="toggleBookmark(item)"
                  class="p-1.5 rounded-full text-sm transition-colors cursor-pointer"
                  :class="checkIsItemBookmarked(item) ? 'bg-amber-50 text-amber-600' : 'bg-[#f4f4f5] text-[#707070] hover:text-[#171717] hover:bg-[#e4e4e7]'"
                >
                  <svg class="w-3.5 h-3.5" :fill="checkIsItemBookmarked(item) ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </article>
          </div>

          <!-- Empty Results Message -->
          <div v-if="archiveDataset.length === 0" class="text-center py-16 space-y-3">
            <p class="text-base text-[#171717] font-semibold">Tidak ada artikel yang sesuai</p>
            <p class="text-sm text-[#707070]">Coba sesuaikan kata kunci pencarian Anda atau hapus filter yang aktif.</p>
            <button @click="clearFilters" class="stitch-button-secondary px-4 py-2 text-sm cursor-pointer">
              Hapus Filter Pencarian
            </button>
          </div>

          <!-- Paginasi Load More Button -->
          <div v-if="currentPage < lastPage" class="pt-6 text-center">
            <button
              @click="loadMore"
              :disabled="isLoadingMore"
              class="stitch-button-secondary px-6 py-2.5 text-sm font-bold inline-flex items-center gap-2 cursor-pointer transition-all"
            >
              <svg v-if="isLoadingMore" class="w-4 h-4 animate-spin text-[#2563eb]" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ isLoadingMore ? 'Memuat Artikel...' : 'Muat Lebih Banyak Artikel ↓' }}</span>
            </button>
          </div>
        </div>
      </main>

      <!-- Sidebar Gadgets Track (4 Columns) -->
      <aside class="lg:col-span-4 space-y-8">

        <!-- Timeline Archive Gadget -->
        <div class="space-y-4 pb-6 border-b border-[#f0f0f0]">
          <div class="flex items-center justify-between pb-2 border-b border-[#f0f0f0]">
            <span class="font-mono-eyebrow text-[#171717]">ARSIP PER BULAN</span>
            <span class="text-sm text-[#2563eb] font-mono">KRONOLOGI</span>
          </div>

          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between py-1.5 px-3 rounded-full bg-[#f4f4f5]">
              <span class="font-medium text-[#171717]">Agustus 2026</span>
              <span class="font-mono text-[#2563eb] font-semibold">3 artikel</span>
            </div>
            <div class="flex items-center justify-between py-1.5 px-3 rounded-full hover:bg-[#f4f4f5] transition-colors text-[#707070]">
              <span>Juli 2026</span>
              <span class="font-mono">2 artikel</span>
            </div>
            <div class="flex items-center justify-between py-1.5 px-3 rounded-full hover:bg-[#f4f4f5] transition-colors text-[#707070]">
              <span>Desember 2025</span>
              <span class="font-mono">1 artikel</span>
            </div>
          </div>
        </div>

        <!-- RSS & Export Gadget -->
        <div class="space-y-3 pb-6 border-b border-[#f0f0f0]">
          <span class="font-mono-eyebrow text-[#2563eb]">UMPAN RSS EDITORIAL</span>
          <h4 class="font-semibold text-[#171717] text-sm">Berlangganan Umpan RSS</h4>
          <p class="text-sm text-[#707070] leading-relaxed">
            Dapatkan pembaruan format XML instan setiap kali artikel baru diterbitkan.
          </p>
          <button
            @click="copyRssFeed"
            class="w-full stitch-button-secondary py-2 text-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <svg class="w-4 h-4 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <span>{{ isRssCopied ? 'Tautan RSS XML Disalin!' : 'Copy RSS XML Link' }}</span>
          </button>
        </div>

      </aside>

    </div>

  </div>
</template>
