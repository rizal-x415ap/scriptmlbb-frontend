<script setup>
import { ref, onMounted } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import PremiumStatusBar from './components/PremiumStatusBar.vue'
import PremiumPopup from './components/PremiumPopup.vue'
import { siteSettings, loadSiteSettings } from './services/settingsStore.js'
import { isPremium, loadPremiumStatus } from './services/premiumStore.js'

const searchQuery = ref('')

const handleSearch = (query) => {
  searchQuery.value = query
}

const isExternalLink = (url) => {
  if (!url) return false
  return /^https?:\/\//i.test(url) || url.startsWith('//')
}

onMounted(() => {
  loadSiteSettings()
  loadPremiumStatus()
})
</script>

<template>
  <div :class="['min-h-screen flex flex-col bg-white text-[#171717] selection:bg-[#3b82f6] selection:text-white', { 'premium-theme': isPremium }]">
    
    <!-- Premium Status Bar (Always at top if premium) -->
    <PremiumStatusBar />
    
    <!-- Premium Subscription Pop-up Modal -->
    <PremiumPopup />
    
    <!-- Sticky Top Wrapper (Announcement Bar above Navbar - Stays Fixed on Scroll) -->
    <div class="sticky top-0 z-50 border-b border-[#f0f0f0]">
      <!-- Sticky Announcement Bar at Very Top -->
      <div
        v-if="siteSettings.showAnnouncementBar"
        class="bg-[#f5f6f7] text-white py-2 text-xs font-mono border-b border-white/10"
      >
        <div class="max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 truncate">
            <span class="w-2 h-2 rounded-full text-[#2563eb] animate-pulse shrink-0"></span>
            <span class="truncate font-bold text-[#d97706]">{{ siteSettings.announcementText }}</span>
          </div>

          <!-- External URL (e.g. https://t.me/..., https://...) -->
          <a
            v-if="isExternalLink(siteSettings.announcementLink)"
            :href="siteSettings.announcementLink"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 font-semibold text-[#60a5fa] hover:text-[#93c5fd] hover:underline flex items-center gap-1 transition-colors"
          >
            <span 
            class="shrink-0 px-3 py-1 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white transition-colors text-[11px] font-semibold cursor-pointer"
            >Join Now</span>
          </a>

          <!-- Internal Route (e.g. /article/..., /archive) -->
          <RouterLink
            v-else-if="siteSettings.announcementLink"
            :to="siteSettings.announcementLink"
            class="shrink-0 font-semibold text-[#60a5fa] hover:text-[#93c5fd] hover:underline flex items-center gap-1 transition-colors"
          >
            <span>Join Now</span>
            <span>→</span>
          </RouterLink>
        </div>
      </div>

      <!-- Top Navbar -->
      <Navbar @search="handleSearch" />
    </div>

    <!-- Main Content View -->
    <main class="flex-grow max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <RouterView :searchQuery="searchQuery" />
    </main>

    <!-- Footer -->
    <Footer />
  </div>
</template>
