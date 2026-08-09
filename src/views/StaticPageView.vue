<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ApiService } from '../services/api'
import { sanitizeHtml } from '../utils/sanitize'
import { setSeoMeta, cleanExcerptText, getAbsoluteUrl } from '../services/seo'
import { siteSettings } from '../services/settingsStore'

const route = useRoute()
const router = useRouter()

const page = ref(null)
const isLoading = ref(true)
const errorMessage = ref('')

const sanitizedContent = computed(() => {
  return sanitizeHtml(page.value?.content || '')
})

const fetchPageDetail = async () => {
  const slug = route.params.slug
  if (!slug) {
    router.replace('/')
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await ApiService.getPageBySlug(slug)
    if (data) {
      page.value = data
      const description = data.meta_description || data.excerpt || cleanExcerptText(data.content, 160)
      const pageUrl = `/page/${data.slug}`
      const absPageUrl = getAbsoluteUrl(pageUrl)
      const isAbout = data.slug.includes('about') || data.slug.includes('tentang')
      const isContact = data.slug.includes('contact') || data.slug.includes('kontak')
      const pageType = isAbout ? 'AboutPage' : (isContact ? 'ContactPage' : 'WebPage')

      const jsonLdSchema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': pageType,
            '@id': `${absPageUrl}#webpage`,
            'url': absPageUrl,
            'name': data.title,
            'description': description,
            'publisher': {
              '@type': 'Organization',
              'name': siteSettings.brandLogoText || 'Script MLBB',
              'url': getAbsoluteUrl('/')
            }
          },
          {
            '@type': 'BreadcrumbList',
            '@id': `${absPageUrl}#breadcrumb`,
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
                'name': data.title,
                'item': absPageUrl
              }
            ]
          }
        ]
      }

      setSeoMeta({
        title: data.title,
        description: description,
        url: pageUrl,
        type: 'website',
        jsonLdSchema
      })
    } else {
      router.replace('/')
    }
  } catch (err) {
    router.replace('/')
  } finally {
    isLoading.value = false
  }
}

const getFormattedDate = (dateStr) => {
  if (!dateStr) return 'Terbaru'
  const date = new Date(dateStr)
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

onMounted(() => {
  fetchPageDetail()
})

watch(() => route.params.slug, () => {
  fetchPageDetail()
})
</script>

<template>
  <div class="space-y-8 py-4">
    <!-- Breadcrumb Navigation -->
    <div class="flex items-center gap-2 text-sm text-[#707070] font-mono">
      <RouterLink to="/" class="hover:text-[#171717] transition-colors">Beranda</RouterLink>
      <span>/</span>
      <span class="text-[#171717] font-semibold truncate">{{ page?.title || 'Halaman' }}</span>
    </div>

    <!-- Skeleton Loading State -->
    <div v-if="isLoading" class="space-y-6 animate-pulse">
      <div class="h-8 bg-gray-200 rounded w-1/2"></div>
      <div class="h-4 bg-gray-200 rounded w-1/4"></div>
      <div class="space-y-3 pt-4">
        <div class="h-4 bg-gray-200 rounded w-full"></div>
        <div class="h-4 bg-gray-200 rounded w-5/6"></div>
        <div class="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMessage" class="py-16 text-center space-y-4">
      <h2 class="text-xl font-bold text-[#171717]">{{ errorMessage }}</h2>
      <p class="text-sm text-[#707070]">Halaman yang Anda cari mungkin telah dipindahkan atau dihapus.</p>
      <RouterLink to="/" class="stitch-button-primary inline-block px-5 py-2.5 text-sm font-semibold">
        Kembali ke Beranda
      </RouterLink>
    </div>

    <!-- Static Page Content -->
    <article v-else-if="page" class="space-y-6">
      <header class="border-b border-[#f0f0f0] pb-5 space-y-2">
        <h1 class="text-2xl sm:text-4xl font-bold tracking-tight text-[#171717] leading-tight">
          {{ page.title }}
        </h1>
        <div class="text-sm text-[#707070] font-mono flex items-center gap-2">
          <span>Diperbarui pada {{ getFormattedDate(page.updated_at) }}</span>
        </div>
      </header>

      <!-- Page Rich Text Body -->
      <div
        class="max-w-[65ch] space-y-5 text-[#171717] text-base leading-[1.75] article-content-body pt-2"
        v-html="sanitizedContent"
      ></div>
    </article>
  </div>
</template>
