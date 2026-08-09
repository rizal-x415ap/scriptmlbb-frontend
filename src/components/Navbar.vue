<script setup>
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { siteSettings } from '../services/settingsStore.js'
import { bookmarkedArticles } from '../services/bookmarkStore.js'
import { isPremium } from '../services/premiumStore.js'

const route = useRoute()
const router = useRouter()
const isMobileMenuOpen = ref(false)
const searchQuery = ref('')

const emit = defineEmits(['search'])

const handleSearchSubmit = () => {
  const query = searchQuery.value.trim()
  emit('search', query)
  
  router.push({
    path: '/archive',
    query: query ? { search: query } : {}
  })

  if (isMobileMenuOpen.value) {
    isMobileMenuOpen.value = false
  }
}

const navLinks = [
  { name: 'Beranda', path: '/' },
  { name: 'Hitung WR', path: '/hitung-wr', isWr: true },
  { name: 'Disimpan', path: '/bookmarks', isBookmark: true }
]
</script>

<template>
  <header class="relative z-40 bg-white/95 backdrop-blur-md">
    <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16 gap-4">

        <!-- Brand Logo Container with Clean Editorial Icon Mark -->
        <RouterLink to="/" class="flex items-center gap-2.5 group shrink-0">
          <img
            v-if="siteSettings.brandLogoUrl"
            :src="siteSettings.brandLogoUrl"
            :alt="siteSettings.brandLogoText || 'Logo'"
            class="w-8 h-8 rounded-[8px] object-contain shrink-0 border border-[#e4e4e7]"
          />
          <div
            v-else
            class="w-8 h-8 rounded-[8px] text-white flex items-center justify-center border transition-colors shrink-0 brand-logo-icon"
            :class="isPremium ? 'bg-amber-600 border-amber-600 group-hover:bg-amber-700' : 'bg-[#171717] border-[#171717]/10 group-hover:bg-[#2563eb]'"
          >
            <!-- Minimalist Script Terminal Emblem -->
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </svg>
          </div>
          <div class="flex items-center gap-1.5">
            <span
              class="font-bold text-lg tracking-tight transition-colors brand-logo-text"
              :class="isPremium ? 'text-amber-600 group-hover:text-amber-700' : 'text-[#171717] group-hover:text-[#2563eb]'"
            >
              {{ siteSettings.brandLogoText || 'Script MLBB' }}
            </span>
            <span v-if="isPremium" class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
              PRO
            </span>
          </div>
        </RouterLink>

        <!-- Search Bar (Desktop) -->
        <form @submit.prevent="handleSearchSubmit" class="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <div class="relative w-full">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari artikel, script skin..."
              class="w-full pl-9.5 pr-4 py-2.5 text-sm bg-[#f4f4f5] border border-transparent rounded-full text-[#171717] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
            />
            <button type="submit" class="absolute left-3 top-2.5 text-[#707070] hover:text-[#2563eb] transition-colors cursor-pointer" aria-label="Cari">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </button>
          </div>
        </form>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center gap-7">
          <RouterLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            class="text-base font-semibold transition-colors inline-flex items-center gap-1.5 md:gap-2"
            :class="[
              route.path === link.path
                ? 'text-[#2563eb]'
                : 'text-[#707070] hover:text-[#171717]'
            ]"
          >
            <!-- Beranda Icon -->
            <svg v-if="link.path === '/'" class="w-4 h-4 shrink-0" :class="route.path === '/' ? 'text-[#2563eb]' : 'text-[#707070]'" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>

            <!-- Hitung WR Icon -->
            <svg v-else-if="link.isWr" class="w-4 h-4 shrink-0" :class="route.path === '/hitung-wr' ? 'text-[#2563eb]' : 'text-[#707070]'" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-3-2.25V18m-3-2.25V18m9-6V18M3 4.5h18a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5zM6 7.5h12v3H6v-3z" />
            </svg>

            <!-- Disimpan / Bookmark Icon -->
            <svg v-else-if="link.isBookmark" class="w-4 h-4 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>

            <span>{{ link.name }}</span>
            <span
              v-if="link.isBookmark && bookmarkedArticles.length > 0"
              class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 font-mono"
            >
              {{ bookmarkedArticles.length }}
            </span>
          </RouterLink>
        </nav>

        <!-- CTA Buttons -->
        <div class="hidden sm:flex items-center gap-3 shrink-0">
          <RouterLink to="/archive" class="stitch-button-primary px-4 py-2 text-xs sm:text-sm flex items-center gap-1.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            Jelajahi Arsip
          </RouterLink>
        </div>

        <!-- Mobile Menu Hamburger -->
        <button
          @click="isMobileMenuOpen = !isMobileMenuOpen"
          class="md:hidden p-2 rounded-full text-[#707070] hover:text-[#171717] hover:bg-[#f4f4f5]"
          aria-label="Menu navigasi utama"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Mobile Search & Drawer -->
      <div v-if="isMobileMenuOpen" class="md:hidden py-4 border-t border-[#f0f0f0] space-y-3.5">
        <form @submit.prevent="handleSearchSubmit" class="px-2">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari artikel, script skin..."
            class="w-full px-4 py-2.5 text-sm bg-[#f4f4f5] border border-transparent rounded-full text-[#171717] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb]"
          />
        </form>
        <div class="space-y-1.5 px-1">
          <RouterLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
            @click="isMobileMenuOpen = false"
            class="flex items-center gap-3 px-4 py-3 text-sm sm:text-lg font-bold rounded-xl transition-colors"
            :class="[
              route.path === link.path
                ? 'bg-[#2563eb]/10 text-[#1d4ed8]'
                : 'text-[#171717] hover:bg-[#f4f4f5]'
            ]"
          >
            <!-- Mobile Icons -->
            <svg v-if="link.path === '/'" class="w-5 h-5 shrink-0" :class="route.path === '/' ? 'text-[#2563eb]' : 'text-[#707070]'" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <svg v-else-if="link.isWr" class="w-5 h-5 shrink-0" :class="route.path === '/hitung-wr' ? 'text-[#2563eb]' : 'text-[#707070]'" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-3-2.25V18m-3-2.25V18m9-6V18M3 4.5h18a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 011.5-1.5zM6 7.5h12v3H6v-3z" />
            </svg>
            <svg v-else-if="link.isBookmark" class="w-5 h-5 shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>

            <span>{{ link.name }}</span>
            <span
              v-if="link.isBookmark && bookmarkedArticles.length > 0"
              class="ml-auto px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 font-mono"
            >
              {{ bookmarkedArticles.length }}
            </span>
          </RouterLink>
        </div>
      </div>
    </div>
  </header>
</template>
