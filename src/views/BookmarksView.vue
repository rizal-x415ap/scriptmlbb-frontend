<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { bookmarkedArticles, removeBookmark } from '../services/bookmarkStore.js'
import { setSeoMeta } from '../services/seo.js'

onMounted(() => {
  setSeoMeta({
    title: 'Koleksi Artikel Tersimpan',
    description: 'Koleksi artikel favorit dan panduan teknis yang Anda simpan di peramban.',
    url: '/bookmarks',
    type: 'website'
  })
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
    <header class="stitch-card p-6 sm:p-8 bg-[#ffffff] space-y-4">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dfdfdf] pb-4">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[#2563eb]/10 border border-[#2563eb]/20">
            <span class="font-mono-eyebrow text-[#1d4ed8] font-semibold">KOLEKSI PRIBADI</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-[#171717]">
            Artikel Disimpan
          </h1>
          <p class="text-xs sm:text-sm text-[#707070]">
            Koleksi artikel dan script skin pilihan yang Anda simpan di peramban.
          </p>
        </div>

        <!-- Count Pill -->
        <div class="px-3.5 py-1.5 rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 text-[#1d4ed8] text-xs font-semibold flex items-center gap-1.5 shrink-0 self-start sm:self-center">
          <svg class="w-4 h-4 text-[#2563eb]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <span>{{ bookmarkedArticles.length }} Artikel Disimpan</span>
        </div>
      </div>
    </header>

    <!-- Empty Bookmarks State -->
    <div
      v-if="bookmarkedArticles.length === 0"
      class="stitch-card p-12 text-center space-y-5 bg-[#ffffff]"
    >
      <div class="w-16 h-16 rounded-full bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center mx-auto text-[#2563eb]">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </div>
      <div class="space-y-1 max-w-md mx-auto">
        <h2 class="text-xl font-bold text-[#171717]">Belum Ada Artikel Disimpan</h2>
        <p class="text-xs sm:text-sm text-[#707070]">
          Klik tombol penanda buku (🔖 Simpan) pada artikel atau script yang Anda sukai untuk menyimpannya di sini.
        </p>
      </div>
      <div class="pt-2">
        <RouterLink
          to="/"
          class="stitch-button-primary px-5 py-2.5 text-xs inline-flex items-center gap-2 shadow-sm"
        >
          <span>Jelajahi Artikel Terbaru</span>
          <span>→</span>
        </RouterLink>
      </div>
    </div>

    <!-- Bookmarks Feed Stream List (Super Neat Mobile & Desktop Row Layout) -->
    <div v-else class="space-y-4">
      <article
        v-for="item in bookmarkedArticles"
        :key="item.id || item.slug"
        class="stitch-card p-4 sm:p-5 flex flex-row items-center justify-between gap-3.5 sm:gap-6 group hover:border-[#2563eb] transition-colors bg-[#ffffff]"
      >
        <!-- Left Side: Category, Title, Date & Actions -->
        <div class="flex flex-col justify-between flex-1 min-w-0 space-y-2">
          <!-- Category & Date -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-mono-eyebrow text-[#1d4ed8] bg-[#2563eb]/10 px-2 py-0.5 rounded border border-[#2563eb]/20 font-semibold text-[11px] sm:text-xs">
              {{ getCategoryName(item.category) }}
            </span>
            <span v-if="item.saved_at" class="text-[11px] sm:text-xs text-[#707070] font-mono">
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
          <div class="pt-1.5 flex items-center justify-start border-t border-[#dfdfdf]/60">
            <button
              @click="removeBookmark(item.id || item.slug)"
              class="text-xs text-[#707070] hover:text-rose-600 font-medium flex items-center gap-1 transition-colors cursor-pointer"
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
          class="w-20 sm:w-28 aspect-square shrink-0 rounded-[8px] overflow-hidden bg-[#171717] relative border border-[#dfdfdf] block"
        >
          <img
            :src="item.cover_image"
            :alt="item.title"
            class="w-full h-full object-cover"
          />
        </RouterLink>
      </article>
    </div>
  </div>
</template>
