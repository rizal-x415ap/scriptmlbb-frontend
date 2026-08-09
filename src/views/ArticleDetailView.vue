<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { ApiService } from '../services/api.js'
import { siteSettings } from '../services/settingsStore.js'
import { isBookmarked as checkIsBookmarked, toggleBookmark as toggleBookmarkStore } from '../services/bookmarkStore.js'
import { isArticleLiked, addLikedArticle, removeLikedArticle } from '../services/likedStore.js'
import ArticleDetailSkeleton from '../components/ArticleDetailSkeleton.vue'
import AdSlot from '../components/AdSlot.vue'
import { isPremium } from '../services/premiumStore.js'
import { sanitizeHtml } from '../utils/sanitize.js'
import { setSeoMeta, getAbsoluteUrl } from '../services/seo.js'

const route = useRoute()
const router = useRouter()

// Get article ID from router param
const articleId = computed(() => route.params.id || 'featured-1')

// Async Loading State (Smart Skeleton - Only shows if request takes > 150ms)
const isLoading = ref(false)
const article = ref(null)

// Interactive Like & Bookmark state
const isLiked = ref(false)
const likesCount = ref(0)
const isBookmarked = computed(() => article.value ? checkIsBookmarked(article.value.id || article.value.slug) : false)
const isCopied = ref(false)

// Helpers for API Data Normalization (Laravel API returns category & author objects)
const getCategoryName = (cat) => {
  if (!cat) return ''
  return typeof cat === 'object' ? (cat.name || '') : cat
}

const getCuteAvatar = (name) => {
  const seed = encodeURIComponent(name || 'Rizal Efendi')
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

const getAuthorName = (author) => {
  if (author && typeof author === 'object' && author.name) return author.name
  if (typeof author === 'string' && author.trim()) return author
  return siteSettings.authorName || 'Rizal Efendi'
}

const getAuthorAvatar = (author) => {
  if (author && typeof author === 'object' && author.avatar) return author.avatar
  if (siteSettings.authorAvatarUrl) return siteSettings.authorAvatarUrl
  const name = getAuthorName(author)
  return getCuteAvatar(name)
}

const getAuthorTitle = (author) => {
  if (author && typeof author === 'object' && author.title) return author.title
  return siteSettings.authorTitle || 'Penulis & Pengembang Sistem'
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

const formatDownloads = (val) => {
  const num = Math.max(0, (Number(val) || 0) - 15)
  if (num > 0) {
    return num.toLocaleString('id-ID') + '+'
  }
  return '1.000+'
}

// Clean any JSON-stringified comment content
const getCleanCommentContent = (rawContent) => {
  if (!rawContent) return ''
  if (typeof rawContent === 'object' && rawContent.content) {
    return rawContent.content
  }
  if (typeof rawContent === 'string' && rawContent.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(rawContent)
      if (parsed && parsed.content) {
        return parsed.content
      }
    } catch {
      // Return raw string if not valid JSON
    }
  }
  return rawContent
}

const sidebarArticles = ref([])

const loadSidebarArticles = async () => {
  try {
    const res = await ApiService.getHomeFeed(1)
    if (Array.isArray(res?.feed)) {
      sidebarArticles.value = res.feed
    }
  } catch (e) {
    // Fail silently
  }
}

const mostReadArticles = computed(() => {
  return [...sidebarArticles.value]
    .sort((a, b) => (b.views_count || 0) - (a.views_count || 0))
    .slice(0, 5)
})

const computedTopics = computed(() => {
  const counts = {}
  sidebarArticles.value.forEach(art => {
    const catName = getCategoryName(art.category)
    if (catName && catName !== 'All') {
      counts[catName] = (counts[catName] || 0) + 1
    }
  })
  return Object.keys(counts).map(name => ({
    name,
    count: counts[name]
  })).sort((a, b) => b.count - a.count).slice(0, 8)
})

// Render dynamic HTML / Markdown content
const formattedContent = computed(() => {
  if (!article.value || !article.value.content) {
    return ''
  }

  let raw = article.value.content

  // 1. Convert Markdown ## to <h2> and ### to <h3> if present
  raw = raw.replace(/^##\s+(.*$)/gim, '<h2>$1</h2>')
  raw = raw.replace(/^###\s+(.*$)/gim, '<h3>$1</h3>')

  // 2. Format <h2> and <h3> tags for clean editorial styling
  raw = raw.replace(/<h2([^>]*)>(.*?)<\/h2>/gim, (match, attrs, titleHtml) => {
    return `<h2 class="text-xl sm:text-2xl font-semibold text-[#171717] pt-6 pb-2 border-b border-[#dfdfdf] my-6">${titleHtml}</h2>`
  })
  raw = raw.replace(/<h3([^>]*)>(.*?)<\/h3>/gim, (match, attrs, titleHtml) => {
    return `<h3 class="text-lg sm:text-xl font-semibold text-[#171717] pt-4 pb-1 my-4">${titleHtml}</h3>`
  })

  // 3. Format blockquotes and code blocks
  raw = raw.replace(/^>\s+(.*$)/gim, '<blockquote>$1</blockquote>')
  raw = raw.replace(/<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/gim, (match, attrs, innerContent) => {
    return `<blockquote class="border-l-3 border-[#2563eb] bg-[#f8fafc] text-[#334155] pl-5 pr-4 py-3 my-6 rounded-r-lg italic text-base sm:text-lg leading-relaxed">${innerContent}</blockquote>`
  })
  raw = raw.replace(/```([\s\S]*?)```/gim, '<div class="rounded-[6px] bg-[#1c1c1c] text-[#fafafa] p-6 border border-white/10 overflow-x-auto my-6 font-mono text-sm"><pre><code>$1</code></pre></div>')

  // 4. Auto-inject loading="lazy" & decoding="async" to all inline article content <img> tags
  raw = raw.replace(/<img([^>]+)>/gim, (match, attrs) => {
    if (attrs.includes('loading=')) return match
    return `<img${attrs} loading="lazy" decoding="async" class="rounded-[8px] max-w-full h-auto my-4 shadow-sm" />`
  })

  return sanitizeHtml(raw)
})

const updateArticleSeo = (data) => {
  if (!data) return

  const title = data.title || ''
  const description = data.excerpt || cleanExcerptText(data.content, 160)
  const image = data.cover_image || siteSettings.brandLogoUrl
  const categoryName = getCategoryName(data.category)
  const author = getAuthorName(data.author) || siteSettings.authorName || 'Admin'
  const articleUrl = `/article/${data.slug || data.id}`
  const absArticleUrl = getAbsoluteUrl(articleUrl)

  // 1. Article / BlogPosting Schema
  const articleGraphItem = {
    '@type': isPlayStoreStyle.value ? 'TechArticle' : 'BlogPosting',
    '@id': `${absArticleUrl}#article`,
    'isPartOf': { '@id': absArticleUrl },
    'headline': title,
    'description': description,
    'image': [getAbsoluteUrl(image)],
    'datePublished': data.published_at || data.created_at || new Date().toISOString(),
    'dateModified': data.updated_at || data.published_at || new Date().toISOString(),
    'author': {
      '@type': 'Person',
      'name': author,
      'url': getAbsoluteUrl('/about')
    },
    'publisher': {
      '@type': 'Organization',
      'name': siteSettings.brandLogoText || 'Script MLBB',
      'url': getAbsoluteUrl('/'),
      'logo': {
        '@type': 'ImageObject',
        'url': getAbsoluteUrl(siteSettings.faviconUrl || '/favicon.svg')
      }
    },
    'articleSection': categoryName
  }

  // 2. BreadcrumbList Schema (Beranda > Category > Article)
  const breadcrumbGraphItem = {
    '@type': 'BreadcrumbList',
    '@id': `${absArticleUrl}#breadcrumb`,
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
        'name': categoryName,
        'item': getAbsoluteUrl(`/archive?category=${encodeURIComponent(categoryName)}`)
      },
      {
        '@type': 'ListItem',
        'position': 3,
        'name': title,
        'item': absArticleUrl
      }
    ]
  }

  const graphList = [articleGraphItem, breadcrumbGraphItem]

  // 3. SoftwareApplication Schema for App/Script Posts
  if (isPlayStoreStyle.value || data.download_links || data.app_version) {
    graphList.push({
      '@type': 'SoftwareApplication',
      '@id': `${absArticleUrl}#software`,
      'name': title,
      'operatingSystem': 'Android, iOS, Windows',
      'applicationCategory': 'GameApplication',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'IDR'
      },
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': String(data.rating_average || '4.8'),
        'reviewCount': String(data.ratings_count || '150')
      }
    })
  }

  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@graph': graphList
  }

  setSeoMeta({
    title,
    description,
    image,
    url: articleUrl,
    type: 'article',
    publishedTime: data.published_at || data.created_at,
    modifiedTime: data.updated_at || data.published_at,
    authorName: author,
    sectionCategory: categoryName,
    jsonLdSchema
  })
}

const loadArticle = async () => {
  let isDone = false
  const timer = setTimeout(() => {
    if (!isDone) {
      isLoading.value = true
    }
  }, 150)

  try {
    const data = await ApiService.getArticleById(articleId.value)
    if (!data) {
      router.replace('/')
      return
    }
    article.value = data
    likesCount.value = data?.likes_count || 0
    isLiked.value = isArticleLiked(data.id) || isArticleLiked(data.slug)
    updateArticleSeo(data)
  } catch (err) {
    router.replace('/')
  } finally {
    isDone = true
    clearTimeout(timer)
    isLoading.value = false
  }
}

onMounted(() => {
  loadArticle()
  loadSidebarArticles()
})

watch(() => route.params.id, () => {
  loadArticle()
})

const toggleLike = async () => {
  if (!article.value) return

  const targetKey = article.value.id || article.value.slug

  if (!isLiked.value) {
    // Like action
    isLiked.value = true
    likesCount.value++
    addLikedArticle(targetKey)

    try {
      const res = await ApiService.likeArticle(targetKey)
      if (res && res.likes_count !== undefined) {
        likesCount.value = res.likes_count
      }
    } catch (err) {
      console.error('Gagal memperbarui jumlah suka ke DB:', err)
    }
  } else {
    // Unlike action
    isLiked.value = false
    likesCount.value = Math.max(0, likesCount.value - 1)
    removeLikedArticle(targetKey)
  }
}

const toggleBookmark = () => {
  if (article.value) {
    toggleBookmarkStore(article.value)
  }
}

const copyShareLink = () => {
  navigator.clipboard?.writeText?.(window.location.href)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}

const isPlayStoreStyle = computed(() => {
  if (!article.value) return false
  if (article.value.template === 'standard') return false
  if (article.value.template === 'playstore' || article.value.template === 'app') return true

  const cat = getCategoryName(article.value.category).toLowerCase()
  const title = (article.value.title || '').toLowerCase()
  const slug = (article.value.slug || '').toLowerCase()
  return cat.includes('script') || cat.includes('aplikasi') || title.includes('mod') || title.includes('script') || title.includes('playstore') || slug.includes('playstore') || slug.includes('mlbb')
})

const appScreenshotsList = computed(() => {
  if (article.value && Array.isArray(article.value.app_screenshots) && article.value.app_screenshots.length > 0) {
    return article.value.app_screenshots.map(s => typeof s === 'object' ? s.url : s)
  }
  return []
})

const appFeaturesList = computed(() => {
  if (article.value && Array.isArray(article.value.app_features) && article.value.app_features.length > 0) {
    return article.value.app_features
  }
  return []
})

const parsedDownloadLinks = computed(() => {
  if (!article.value) return []

  let links = []
  if (Array.isArray(article.value.download_links) && article.value.download_links.length > 0) {
    links = article.value.download_links.map(l => ({
      name: l.name || l.label || 'Link Unduhan File',
      url: l.url || article.value.app_download_url || '#'
    }))
  } else if (article.value?.app_download_url) {
    links = [{ name: 'Server Unduhan Utama', url: article.value.app_download_url }]
  }

  // If user is Premium -> return direct URLs
  if (isPremium.value) {
    return links
  }

  // If user is Non-Premium -> map URLs to shortlink `/go/:code` where available
  const shortLinksMap = {}
  if (Array.isArray(article.value.short_links)) {
    article.value.short_links.forEach(s => {
      shortLinksMap[s.original_url] = s.code
    })
  }

  return links.map(link => {
    const code = shortLinksMap[link.url]
    return {
      ...link,
      url: code ? `/go/${code}` : link.url,
      isShortener: !!code
    }
  })
})

// Comments State

// Helper to parse comment if content or object is stored as raw JSON string
const parseCommentData = (commentObj) => {
  if (!commentObj) return { author_name: 'Pengguna', content: '', rating: 5 }

  let name = commentObj.author_name || commentObj.name || 'Pengguna'
  let email = commentObj.author_email || commentObj.email || ''
  let text = commentObj.content || ''
  let rating = Number(commentObj.rating) || 5

  if (typeof commentObj === 'string' && commentObj.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(commentObj)
      name = parsed.author_name || parsed.name || name
      email = parsed.author_email || parsed.email || email
      text = parsed.content || text
      rating = Number(parsed.rating) || rating
    } catch (e) {}
  } else if (typeof commentObj.content === 'string' && commentObj.content.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(commentObj.content)
      name = parsed.author_name || parsed.name || name
      email = parsed.author_email || parsed.email || email
      text = parsed.content || text
      rating = Number(parsed.rating) || rating
    } catch (e) {}
  }

  return {
    id: commentObj.id || Date.now(),
    author_name: name,
    author_email: email,
    content: text,
    rating: rating,
    created_at: commentObj.created_at || new Date().toISOString(),
    replies: Array.isArray(commentObj.replies) ? commentObj.replies.map(parseCommentData) : []
  }
}

// Scoped Article Comments list (Strictly from API database response)
const articleComments = computed(() => {
  if (article.value && Array.isArray(article.value.comments)) {
    return article.value.comments.map(parseCommentData)
  }
  return []
})

// Star Rating State for Review Submission
const selectedRating = ref(5)
const hoverRating = ref(0)

const ratingLabels = {
  1: '1.0 ★ Buruk / Tidak Bekerja',
  2: '2.0 ★ Kurang Memuaskan',
  3: '3.0 ★ Cukup / Standar',
  4: '4.0 ★ Sangat Baik',
  5: '5.0 ★ Sempurna / Rekomendasi VIP'
}

// Compute dynamic rating stats strictly from API database comments
const ratingStats = computed(() => {
  const totalCount = articleComments.value.length
  if (totalCount === 0) {
    return {
      average: '5.0',
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      getPercent: () => 0
    }
  }

  let sum = 0
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

  articleComments.value.forEach(c => {
    const r = Number(c.rating) || 5
    if (r >= 1 && r <= 5) {
      distribution[r]++
      sum += r
    }
  })

  const avg = (sum / totalCount).toFixed(1)

  return {
    average: avg,
    total: totalCount,
    distribution: distribution,
    getPercent: (star) => {
      return Math.round((distribution[star] / totalCount) * 100)
    }
  }
})

// Filter 4-star and 5-star reviews strictly from API database comments
const featuredReviews = computed(() => {
  return articleComments.value
    .filter(c => (Number(c.rating) || 5) >= 4)
    .map(c => ({
      id: c.id,
      author_name: c.author_name,
      rating: c.rating,
      content: c.content,
      is_verified: true
    }))
})

// Comment Form State (Mandatory Name & Email)
const commentAuthorInput = ref('')
const commentEmailInput = ref('')
const commentTextInput = ref('')
const commentSubmitMessage = ref('')
const commentErrorMessage = ref('')
const isSubmittingComment = ref(false)

// User Reply State
const activeReplyParentId = ref(null)
const replyAuthorInput = ref('')
const replyEmailInput = ref('')
const replyTextInput = ref('')
const isSubmittingReply = ref(false)

const scrollToDownloadSection = () => {
  const elem = document.getElementById('download-section')
  if (elem) {
    const yOffset = -140 // Generous top clearance offset so sticky header never overlaps
    const y = elem.getBoundingClientRect().top + window.pageYOffset + yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

// Comment Deletion Modal State
const deletingCommentId = ref(null)
const deleteEmailInput = ref('')
const deleteErrorMessage = ref('')
const deleteSuccessMessage = ref('')
const isDeletingComment = ref(false)

const openReplyForm = (parentId) => {
  activeReplyParentId.value = activeReplyParentId.value === parentId ? null : parentId
  replyAuthorInput.value = ''
  replyEmailInput.value = ''
  replyTextInput.value = ''
}

const handleAddComment = async (parentId = null) => {
  const authorName = parentId ? replyAuthorInput.value.trim() : commentAuthorInput.value.trim()
  const authorEmail = parentId ? replyEmailInput.value.trim() : commentEmailInput.value.trim()
  const contentText = parentId ? replyTextInput.value.trim() : commentTextInput.value.trim()

  if (!authorName || !authorEmail || !contentText) {
    if (!parentId) commentErrorMessage.value = 'Silakan isi Nama, Email, dan Teks Komentar Anda.'
    return
  }

  if (parentId) isSubmittingReply.value = true
  else isSubmittingComment.value = true

  commentSubmitMessage.value = ''
  commentErrorMessage.value = ''

  try {
    const payload = {
      author_name: authorName,
      author_email: authorEmail,
      content: contentText,
      rating: parentId ? null : selectedRating.value
    }
    if (parentId !== null && parentId !== undefined) {
      const numericId = Number(parentId)
      if (!isNaN(numericId) && numericId > 0 && numericId < 2000000000) {
        payload.parent_id = numericId
      }
    }

    const response = await ApiService.submitComment(article.value.id || article.value.slug, payload)

    const savedCommentObj = (response && response.data) ? response.data : {
      id: Date.now(),
      parent_id: parentId,
      author_name: authorName,
      author_email: authorEmail,
      content: contentText,
      rating: parentId ? null : selectedRating.value,
      created_at: new Date().toISOString(),
      status: 'approved',
      replies: []
    }

    if (!savedCommentObj.rating && !parentId) {
      savedCommentObj.rating = selectedRating.value
    }

    if (!Array.isArray(article.value.comments)) {
      article.value.comments = []
    }

    if (parentId) {
      // Append reply under parent comment
      const parentObj = article.value.comments.find(c => c.id === parentId || Number(c.id) === Number(parentId))
      if (parentObj) {
        if (!Array.isArray(parentObj.replies)) parentObj.replies = []
        parentObj.replies.push(savedCommentObj)
      }
      activeReplyParentId.value = null
      replyAuthorInput.value = ''
      replyEmailInput.value = ''
      replyTextInput.value = ''
    } else {
      // Add root comment
      article.value.comments.unshift(savedCommentObj)
      commentAuthorInput.value = ''
      commentEmailInput.value = ''
      commentTextInput.value = ''
      commentSubmitMessage.value = '✓ Komentar berhasil diterbitkan!'
    }
  } catch (err) {
    const errorMsg = err.message || 'Gagal mengirim komentar. Silakan periksa kembali data Anda.'
    if (parentId) {
      alert(`⚠️ ${errorMsg}`)
    } else {
      commentErrorMessage.value = errorMsg
    }
  } finally {
    isSubmittingComment.value = false
    isSubmittingReply.value = false
  }

  setTimeout(() => {
    commentSubmitMessage.value = ''
    commentErrorMessage.value = ''
  }, 4000)
}

const openDeleteModal = (commentId) => {
  deletingCommentId.value = commentId
  deleteEmailInput.value = ''
  deleteErrorMessage.value = ''
  deleteSuccessMessage.value = ''
}

const closeDeleteModal = () => {
  deletingCommentId.value = null
  deleteEmailInput.value = ''
  deleteErrorMessage.value = ''
}

const handleConfirmDelete = async () => {
  if (!deleteEmailInput.value.trim() || !deletingCommentId.value) return

  isDeletingComment.value = true
  deleteErrorMessage.value = ''
  deleteSuccessMessage.value = ''

  try {
    await ApiService.deleteComment(deletingCommentId.value, deleteEmailInput.value.trim())

    // Remove comment from local reactive array
    if (article.value && Array.isArray(article.value.comments)) {
      const rootIndex = article.value.comments.findIndex(c => c.id === deletingCommentId.value)
      if (rootIndex !== -1) {
        article.value.comments.splice(rootIndex, 1)
      } else {
        article.value.comments.forEach(c => {
          if (Array.isArray(c.replies)) {
            const replyIdx = c.replies.findIndex(r => r.id === deletingCommentId.value)
            if (replyIdx !== -1) {
              c.replies.splice(replyIdx, 1)
            }
          }
        })
      }
    }

    deleteSuccessMessage.value = '✓ Comment deleted successfully!'
    setTimeout(() => {
      closeDeleteModal()
    }, 1200)
  } catch (err) {
    deleteErrorMessage.value = err.message || 'Email verification failed. Make sure you enter the exact email used when commenting.'
  } finally {
    isDeletingComment.value = false
  }
}
</script>

<template>
  <div class="space-y-8 py-4">

    <!-- Skeleton Loading State for Article Detail -->
    <ArticleDetailSkeleton v-if="isLoading" :isPlayStore="isPlayStoreStyle" />

    <!-- Article Content -->
    <template v-else-if="article">
      <!-- Top Back Navigation & Action Bar (Clean Single Row on Mobile & Desktop) -->
      <div class="flex flex-row items-center justify-between gap-2 border-b border-[#f0f0f0] pb-4">
        <RouterLink
          to="/"
          class="px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 bg-[#f4f4f5] text-[#171717] hover:bg-[#e4e4e7] transition-all group shrink-0"
        >
          <svg class="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span class="hidden sm:inline">Kembali ke Beranda</span>
          <span class="sm:hidden">Kembali</span>
        </RouterLink>

        <div class="flex items-center gap-1.5 sm:gap-2">
          <!-- Like Button -->
          <button
            @click="toggleLike"
            class="px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            :class="isLiked ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'"
          >
            <svg class="w-3.5 h-3.5" :fill="isLiked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>{{ likesCount }} Suka</span>
          </button>

          <!-- Bookmark Button -->
          <button
            @click="toggleBookmark"
            class="p-2 rounded-full text-xs transition-all cursor-pointer"
            :class="isBookmarked ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'"
            aria-label="Simpan artikel"
          >
            <svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" :fill="isBookmarked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>

          <!-- Share Button -->
          <button
            @click="copyShareLink"
            class="px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
            :class="isCopied ? 'bg-emerald-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span class="hidden sm:inline">{{ isCopied ? 'Tautan Disalin!' : 'Bagikan' }}</span>
            <span class="sm:hidden">{{ isCopied ? 'Disalin' : 'Bagikan' }}</span>
          </button>
        </div>
      </div>

      <!-- Asymmetric 8:4 Grid Layout (8 Cols Main Content & Thumbnail : 4 Cols Sidebar Widgets) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

        <!-- Left Track: Header, Thumbnail & Rich Text Content (8 Columns) -->
        <main class="lg:col-span-8 space-y-8">

          <!-- ========================================== -->
          <!-- PLAY STORE STYLE APP DETAIL POST TEMPLATE -->
          <!-- ========================================== -->
          <div v-if="isPlayStoreStyle" class="space-y-8">
            
            <!-- Unified Master App Hero Section -->
            <div class="pb-8 border-b border-[#f0f0f0]">
              <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center">
                
                <!-- LEFT SIDE (lg:col-span-7): App Icon, Title, Developer, Metrics & CTA Download Button -->
                <div class="lg:col-span-7 space-y-5">
                  <div class="space-y-3">
                    <!-- ROW 1: Title & Subtitle (Full Width) -->
                    <div class="space-y-1.5">
                      <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#171717] leading-tight">
                        {{ article.title }}
                      </h1>
                      <p v-if="article.subtitle" class="text-sm sm:text-base text-[#52525b] font-medium leading-relaxed">
                        {{ article.subtitle }}
                      </p>
                    </div>

                    <!-- ROW 2 (Below): Developer Name & Badges in its own full-width row (Distinct Colorful Pill Badges) -->
                    <div class="flex flex-wrap items-center gap-2 pt-1">
                      <!-- Badge 1: Developer Name (Soft Blue Pill) -->
                      <span class="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#2563eb] bg-[#eff6ff] px-2.5 py-0.5 rounded-full border border-[#bfdbfe]">
                        👤 {{ article.app_developer || getAuthorName(article.author) }}
                      </span>
                      <!-- Badge 2: Work Classic / Rank (Soft Emerald Pill) -->
                      <span class="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#059669] bg-[#ecfdf5] px-2.5 py-0.5 rounded-full border border-[#a7f3d0]">
                        ✓ New Patch
                      </span>
                      <!-- Badge 3: No Password (Soft Amber Pill) -->
                      <span class="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#d97706] bg-[#fffbeb] px-2.5 py-0.5 rounded-full border border-[#fef3c7]">
                        🔒 No Password
                      </span>
                    </div>
                  </div>

                  <!-- Play Store Metrics Row (Rating, Reviews, Downloads, File Size, Safety) -->
                  <div class="grid grid-cols-4 divide-x divide-[#e4e4e7] border-y border-[#f0f0f0] py-3 text-center bg-[#f4f4f5] rounded-2xl">
                    <div class="space-y-0.5 px-1">
                      <div class="flex items-center justify-center gap-1 text-sm font-bold text-[#171717]">
                        <span>{{ ratingStats.average }}</span>
                        <span class="text-amber-500 text-xs">★</span>
                      </div>
                      <div class="text-[10px] sm:text-[11px] text-[#52525b] font-medium">{{ ratingStats.total }} ulasan</div>
                    </div>
                    <div class="space-y-0.5 px-1">
                      <div class="flex items-center justify-center gap-1 text-sm font-bold text-[#171717]">
                        <span>{{ formatDownloads(article.views_count) }}</span>
                      </div>
                      <div class="text-[10px] sm:text-[11px] text-[#52525b] font-medium">Unduhan</div>
                    </div>
                    <div class="space-y-0.5 px-1">
                      <div class="flex items-center justify-center gap-1 text-sm font-bold text-[#171717]">
                        <span>{{ article.app_size || '-' }}</span>
                      </div>
                      <div class="text-[10px] sm:text-[11px] text-[#52525b] font-medium">Ukuran File</div>
                    </div>
                    <div class="space-y-0.5 px-1">
                      <div class="flex items-center justify-center gap-1 text-sm font-bold text-[#171717]">
                        <span class="border border-[#171717] px-1 py-0.2 rounded text-[10px]">3+</span>
                      </div>
                      <div class="text-[10px] sm:text-[11px] text-[#52525b] font-medium">Semua Umur</div>
                    </div>
                  </div>

                  <!-- Play Store Primary Download CTA Button Bar -->
                  <div class="flex flex-col sm:flex-row items-center gap-3">
                    <a
                      href="#download-section"
                      @click.prevent="scrollToDownloadSection"
                      class="w-full sm:w-auto flex-1 stitch-button-primary py-3 px-6 text-center text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      <!-- Down Arrow Circle Indicator Icon -->
                      <svg class="w-4 h-4 group-hover:translate-y-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span>Link Download Script</span>
                    </a>
                    <button
                      @click="copyShareLink"
                      class="w-full sm:w-auto px-4 py-3 stitch-button-secondary text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      <span>{{ isCopied ? 'Tautan Disalin!' : 'Bagikan' }}</span>
                    </button>
                  </div>
                </div>

                <!-- RIGHT SIDE (lg:col-span-5): Integrated 1:1 Square Thumbnail Photo -->
                <div class="lg:col-span-5 w-full shrink-0">
                  <div class="w-full aspect-square rounded-2xl overflow-hidden bg-[#171717] relative">
                    <img
                      :src="article.cover_image"
                      :alt="article.title"
                      class="w-full h-full object-cover"
                      fetchpriority="high"
                      decoding="async"
                    />
                    <!-- Floating Views Badge (Pojok Kanan Atas) -->
                    <div class="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-[#171717]/80 text-white backdrop-blur-md border border-white/20 flex items-center gap-1.5 z-10 pointer-events-none">
                      <svg class="w-3.5 h-3.5 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{{ formatViews(article.views_count) }} Dilihat</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- About This App & Feature Highlights Section -->
            <div class="space-y-5 pb-8 border-b border-[#f0f0f0]">
              <div class="flex items-center justify-between border-b border-[#f0f0f0] pb-2">
                <h2 class="text-lg font-bold text-[#171717]">Tentang Script Ini</h2>
                <span v-if="article.app_version" class="text-xs text-[#2563eb] font-semibold flex items-center gap-1">
                  <span>Versi {{ article.app_version }}</span>
                  <span>→</span>
                </span>
              </div>

              <!-- Main Article / App Description Content Body -->
              <div class="max-w-[65ch] space-y-6 text-[#171717] text-base leading-[1.75] article-content-body pt-2" v-html="formattedContent">
              </div>

              <!-- In-Article Middle Ad Slot (Tengah-Tengah Artikel) -->
              <AdSlot
                v-if="!isPremium"
                :enabled="siteSettings.showArticleMiddleAd !== false"
                :scriptContent="siteSettings.articleMiddleAdScript"
                label="IKLAN TENGAH ARTIKEL"
                type="in-article"
              />

              <!-- App Technical Specs & Download Links Box (Card Utama Utuh) -->
              <div id="download-section" class="relative mt-8 p-4 sm:p-6 bg-[#f8fafc] rounded-xl border-2 border-[#2563eb] space-y-5 scroll-mt-36 overflow-hidden shadow-sm">
                
                <!-- Top Right Corner Badge (Menempel Kanan Atas Card) -->
                <div class="absolute top-0 right-0 bg-[#2563eb] text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1.5 font-mono tracking-wider z-10">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>DOWNLOAD SCRIPT</span>
                </div>

                <!-- Grid Layout: On Desktop (lg:), Left is Poster & Specs with Title (7 cols), Right is Simple Blue Link List (5 cols) -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start pt-3 sm:pt-2">
                  
                  <!-- LEFT COLUMN (Desktop lg:col-span-7): Poster Image on Left + Title, Horizontal Line, Badges & Date on Right -->
                  <div class="lg:col-span-7 flex flex-row items-start gap-3 sm:gap-5">
                    <!-- LEFT SIDE: 3:5 Aspect Ratio Poster Thumbnail Image -->
                    <div class="w-24 sm:w-36 aspect-[3/5] rounded-lg overflow-hidden border border-[#e2e8f0] bg-[#171717] shrink-0 relative shadow-xs">
                      <img
                        :src="article.app_poster_35 || article.cover_image"
                        :alt="article.title"
                        class="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>

                    <!-- RIGHT SIDE: Title, Horizontal Line & Feature Badges -->
                    <div class="flex-1 space-y-3 min-w-0 w-full text-left pr-2 sm:pr-0">
                      <!-- Title Inside Card Next to Image -->
                      <div>
                        <h3 class="text-base sm:text-lg lg:text-xl font-bold text-[#171717] leading-snug break-all pr-0">
                          {{ article.title }}
                        </h3>
                      </div>

                      <!-- Horizontal Line Separator (Thicker Vibrant Blue Accent Line) -->
                      <div class="h-0.5 w-full bg-gradient-to-r from-[#2563eb] via-[#3b82f6] to-[#60a5fa] rounded-full my-2"></div>

                      <!-- Tags / Feature Pills Below Line -->
                      <div class="flex flex-wrap gap-1 sm:gap-1.5">
                        <span
                          v-for="(feature, fIdx) in appFeaturesList"
                          :key="fIdx"
                          class="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-white text-[#1d4ed8] border border-[#2563eb]/25"
                        >
                          {{ feature.startsWith('✓') ? feature : '✓ ' + feature }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- RIGHT COLUMN (Desktop lg:col-span-5): Link Download File -->
                  <div class="lg:col-span-5 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#e2e8f0] space-y-3">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <h4 class="text-xs font-bold text-[#171717] uppercase tracking-wider font-mono">LINK UNDUHAN FILE</h4>
                      <span class="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[10px] sm:text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                        Diperbarui pada {{ getFormattedDate(article.published_at) }}
                      </span>
                    </div>

                    <div class="space-y-2.5 pt-1">
                      <!-- Dynamic Download Links Loop (Simple Blue Text Links) -->
                      <template v-for="(link, lIdx) in parsedDownloadLinks" :key="lIdx">
                        <RouterLink
                          v-if="link.isShortener"
                          :to="link.url"
                          class="flex items-center gap-2.5 text-sm sm:text-base font-bold text-[#2563eb] hover:text-[#1d4ed8] active:text-[#1e40af] hover:underline transition-colors py-1 group cursor-pointer"
                        >
                          <svg class="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-transform group-hover:translate-y-0.5 text-[#2563eb] group-hover:text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span class="truncate">{{ link.name }}</span>
                          <span class="text-xs sm:text-sm font-mono opacity-70">→</span>
                        </RouterLink>
                        <a
                          v-else
                          :href="link.url || '#'"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="flex items-center gap-2.5 text-sm sm:text-base font-bold text-[#2563eb] hover:text-[#1d4ed8] active:text-[#1e40af] hover:underline transition-colors py-1 group cursor-pointer"
                        >
                          <svg class="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-transform group-hover:translate-y-0.5 text-[#2563eb] group-hover:text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span class="truncate">{{ link.name }}</span>
                          <span class="text-xs sm:text-sm font-mono opacity-70">→</span>
                        </a>
                      </template>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <!-- Rating & Reviews Play Store Section -->
            <div class="space-y-6 pb-8 border-b border-[#f0f0f0]">
              <h3 class="text-lg font-bold text-[#171717]">Rating & Ulasan Pengguna</h3>
              
              <div class="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#f0f0f0]">
                <div class="text-center shrink-0 space-y-1">
                  <div class="text-5xl font-black text-[#171717]">{{ ratingStats.average }}</div>
                  <div class="flex justify-center text-amber-500 text-sm gap-0.5">
                    <span v-for="s in 5" :key="s" :class="s <= Math.round(Number(ratingStats.average)) ? 'text-amber-500' : 'text-[#dfdfdf]'">★</span>
                  </div>
                  <div class="text-xs text-[#707070] font-mono">{{ ratingStats.total }} ulasan</div>
                </div>

                <!-- Rating Distribution Bars -->
                <div class="flex-1 w-full space-y-1.5 text-xs">
                  <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-2">
                    <span class="w-3 text-right font-mono text-[#707070]">{{ star }}</span>
                    <div class="flex-1 h-2 bg-[#f4f4f5] rounded-full overflow-hidden">
                      <div class="h-full bg-[#2563eb] rounded-full transition-all duration-500" :style="{ width: ratingStats.getPercent(star) + '%' }"></div>
                    </div>
                    <span class="w-8 text-left font-mono text-[10px] text-[#707070]">{{ ratingStats.getPercent(star) }}%</span>
                  </div>
                </div>
              </div>

              <!-- Featured 4 & 5 Star Reviews List -->
              <div class="space-y-3 pt-2">
                <div class="text-xs font-bold text-[#171717] font-mono uppercase tracking-wider">
                  ULASAN UNGGULAN VERIFIKASI ({{ featuredReviews.length }})
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(rev, rIdx) in featuredReviews"
                    :key="rev.id || rIdx"
                    class="p-4 bg-[#f4f4f5] rounded-2xl space-y-2"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2.5">
                        <img
                          :src="getCuteAvatar(rev.author_name)"
                          :alt="rev.author_name"
                          class="w-8 h-8 rounded-full bg-white object-contain p-0.5 shrink-0"
                        />
                        <div>
                          <div class="text-xs font-bold text-[#171717]">{{ rev.author_name }}</div>
                          <div class="text-[10px] text-emerald-600 font-mono flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Pengguna Terverifikasi
                          </div>
                        </div>
                      </div>
                      <div class="flex text-amber-500 text-xs gap-0.5 font-bold">
                        <span v-for="s in 5" :key="s" :class="s <= rev.rating ? 'text-amber-500' : 'text-[#dfdfdf]'">★</span>
                      </div>
                    </div>
                    <p class="text-xs text-[#404040] leading-relaxed">
                      {{ rev.content }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- In-Article End Ad Slot for Play Store Template -->
            <AdSlot
              v-if="!isPremium"
              :enabled="siteSettings.showArticleEndAd !== false"
              :scriptContent="siteSettings.articleEndAdScript"
              label="IKLAN AKHIR ARTIKEL"
              type="in-article"
            />
          </div>

          <!-- DEFAULT EDITORIAL ARTICLE TEMPLATE (FOR STANDARD ARTICLES) -->
          <template v-else>
            <!-- Article Header Block -->
            <header class="space-y-5 pb-6 border-b border-[#f0f0f0]">
              <div class="flex items-center gap-2 font-mono text-xs">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563eb]/10">
                  <span class="font-mono-eyebrow text-[#2563eb]">{{ getCategoryName(article.category) }}</span>
                </div>
                <span v-if="getFormattedDate(article.published_at || article.date)" class="text-[#707070]">•</span>
                <span v-if="getFormattedDate(article.published_at || article.date)" class="text-[#707070]">{{ getFormattedDate(article.published_at || article.date) }}</span>
                <span v-if="article.read_time" class="text-[#707070]">•</span>
                <span v-if="article.read_time" class="text-[#2563eb] font-semibold">{{ article.read_time }}</span>
              </div>

              <h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#171717] leading-[1.15]">
                {{ article.title }}
              </h1>

              <p v-if="article.subtitle" class="text-base sm:text-lg text-[#707070] leading-relaxed">
                {{ article.subtitle }}
              </p>

              <!-- Author Profile Block (Matching Sidebar Data: Icon, Nama, Subtitle & Button Ikuti) -->
              <div class="flex flex-row items-center justify-between gap-4 pt-4 border-t border-[#f0f0f0]">
                <div class="flex items-center gap-3.5">
                  <div class="relative shrink-0">
                    <img
                      :src="getAuthorAvatar(article.author)"
                      :alt="getAuthorName(article.author)"
                      loading="lazy"
                      decoding="async"
                      width="48"
                      height="48"
                      class="w-12 h-12 rounded-full object-contain border border-[#e4e4e7] p-0.5 bg-[#f4f4f5]"
                    />
                    <span class="absolute bottom-0 right-0 w-3 h-3 bg-[#2563eb] rounded-full border-2 border-white"></span>
                  </div>
                  <div>
                    <h3 class="font-bold text-[#171717] text-sm sm:text-base leading-snug">
                      {{ getAuthorName(article.author) }}
                    </h3>
                    <p class="text-xs text-[#707070]">
                      {{ getAuthorTitle(article.author) }}
                    </p>
                  </div>
                </div>

                <a
                  :href="siteSettings.authorInstagramUrl || 'https://instagram.com'"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="stitch-button-primary px-4 py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition-transform"
                >
                  <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.765z" />
                  </svg>
                  <span>Ikuti {{ siteSettings.authorInstagramHandle || 'Penulis' }}</span>
                </a>
              </div>
            </header>

            <!-- Main Thumbnail Image Container with Floating Views Badge -->
            <div class="w-full aspect-video rounded-2xl overflow-hidden border border-[#dfdfdf] bg-[#1c1c1c] shadow-sm relative">
              <img :src="article.cover_image" :alt="article.title" fetchpriority="high" decoding="async" width="800" height="450" class="w-full h-full object-cover" />
              <!-- Floating Views Badge (Pojok Kanan Atas) -->
              <div class="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-[#171717]/85 text-white backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-md z-10 pointer-events-none">
                <svg class="w-3.5 h-3.5 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{{ formatViews(article.views_count) }} Dilihat</span>
              </div>
            </div>

            <!-- In-Article Middle Ad Slot for Standard Template -->
            <AdSlot
              v-if="!isPremium"
              :enabled="siteSettings.showArticleMiddleAd !== false"
              :scriptContent="siteSettings.articleMiddleAdScript"
              label="IKLAN TENGAH ARTIKEL"
              type="in-article"
            />

            <!-- Rich Text Article Content Body -->
            <div class="space-y-6 text-[#171717] text-base sm:text-lg leading-[1.75] article-content-body" v-html="formattedContent">
            </div>

            <!-- In-Article End Ad Slot for Standard Template -->
            <AdSlot
              v-if="!isPremium"
              :enabled="siteSettings.showArticleEndAd !== false"
              :scriptContent="siteSettings.articleEndAdScript"
              label="IKLAN AKHIR ARTIKEL"
              type="in-article"
            />
          </template>

          <!-- Comments Thread Section -->
          <section class="pt-10 border-t border-[#f0f0f0] space-y-8">
            <div class="flex items-center justify-between">
              <h3 class="text-2xl font-bold text-[#171717] tracking-tight">
                Diskusi & Ulasan ({{ articleComments.length }})
              </h3>
              <span class="font-mono-eyebrow text-[#2563eb]">UTAS ULASAN</span>
            </div>

            <!-- Add Comment / Review Form -->
            <div class="space-y-4 pb-8 border-b border-[#f0f0f0]">
              <h4 class="text-sm font-semibold text-[#171717]">Tulis Ulasan & Rating Anda</h4>

              <!-- Interactive Star Rating Picker -->
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-[#f4f4f5] rounded-xl">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold text-[#171717]">Beri Rating:</span>
                  <div class="flex items-center gap-1 cursor-pointer">
                    <button
                      v-for="star in 5"
                      :key="star"
                      type="button"
                      @click="selectedRating = star"
                      @mouseenter="hoverRating = star"
                      @mouseleave="hoverRating = 0"
                      class="text-xl transition-transform hover:scale-125 focus:outline-none"
                    >
                      <span :class="(hoverRating || selectedRating) >= star ? 'text-amber-500' : 'text-[#dfdfdf]'">★</span>
                    </button>
                  </div>
                </div>
                <span class="text-xs font-mono font-medium text-[#2563eb]">
                  {{ ratingLabels[hoverRating || selectedRating] }}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  v-model="commentAuthorInput"
                  type="text"
                  placeholder="Nama Anda *"
                  required
                  class="px-4 py-2.5 text-sm bg-[#f4f4f5] border border-transparent rounded-full text-[#171717] focus:outline-none focus:border-[#2563eb] focus:bg-white"
                />
                <input
                  v-model="commentEmailInput"
                  type="email"
                  placeholder="Email Anda (Rahasia/Verifikasi) *"
                  required
                  class="px-4 py-2.5 text-sm bg-[#f4f4f5] border border-transparent rounded-full text-[#171717] focus:outline-none focus:border-[#2563eb] focus:bg-white"
                />
              </div>

              <div class="text-[11px] text-[#707070] flex items-center gap-1.5 font-mono">
                <span>🔒</span>
                <span>Email Anda hanya digunakan untuk verifikasi ulasan dan <strong>TIDAK AKAN PERNAH</strong> ditampilkan ke publik.</span>
              </div>

              <textarea
                v-model="commentTextInput"
                rows="3"
                placeholder="Tuliskan ulasan atau pengalaman Anda menggunakan aplikasi / script ini..."
                required
                class="w-full p-4 text-sm bg-[#f4f4f5] border border-transparent rounded-2xl text-[#171717] focus:outline-none focus:border-[#2563eb] focus:bg-white resize-none"
              ></textarea>

              <p v-if="commentSubmitMessage" class="text-xs font-semibold text-[#2563eb]">
                {{ commentSubmitMessage }}
              </p>
              <p v-if="commentErrorMessage" class="text-xs font-semibold text-red-600">
                {{ commentErrorMessage }}
              </p>

              <div class="flex justify-end">
                <button
                  @click="handleAddComment(null)"
                  :disabled="isSubmittingComment"
                  class="stitch-button-primary px-5 py-2 text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span v-if="isSubmittingComment" class="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  <span>{{ isSubmittingComment ? 'Mengirim...' : 'Kirim Ulasan & Rating' }}</span>
                </button>
              </div>
            </div>

            <!-- Comments Thread List -->
            <div v-if="articleComments.length > 0" class="divide-y divide-[#f0f0f0]">
              <div
                v-for="comment in articleComments"
                :key="comment.id"
                class="py-5 space-y-4"
              >
                <!-- Root Comment -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                      <img
                        :src="getCuteAvatar(comment.author_name)"
                        :alt="comment.author_name"
                        class="w-8 h-8 rounded-full bg-[#f4f4f5] object-contain p-0.5 shrink-0"
                      />
                      <div>
                        <div class="text-sm font-bold text-[#171717] flex items-center gap-1.5">
                          <span>{{ comment.author_name }}</span>
                          <span v-if="comment.rating" class="text-amber-500 font-normal">★ {{ comment.rating }}.0</span>
                        </div>
                        <div class="text-[10px] text-[#707070] font-mono">
                          {{ getFormattedDate(comment.created_at || comment.date) }}
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        @click="openReplyForm(comment.id)"
                        class="text-xs text-[#2563eb] hover:underline font-semibold cursor-pointer"
                      >
                        Balas
                      </button>
                      <button
                        @click="openDeleteModal(comment.id)"
                        class="text-xs text-red-500 hover:underline cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  <p class="text-sm sm:text-sm text-[#333333] pl-10 leading-relaxed">
                    {{ getCleanCommentContent(comment.content) }}
                  </p>

                  <!-- Inline Reply Box -->
                  <div v-if="activeReplyParentId === comment.id" class="pl-10 pt-3 space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        v-model="replyAuthorInput"
                        type="text"
                        placeholder="Nama Anda *"
                        class="px-3 py-2 text-sm bg-[#f4f4f5] border border-transparent rounded-full text-[#171717] focus:outline-none focus:border-[#2563eb]"
                      />
                      <input
                        v-model="replyEmailInput"
                        type="email"
                        placeholder="Email Anda *"
                        class="px-3 py-2 text-sm bg-[#f4f4f5] border border-transparent rounded-full text-[#171717] focus:outline-none focus:border-[#2563eb]"
                      />
                    </div>
                    <textarea
                      v-model="replyTextInput"
                      rows="2"
                      placeholder="Tulis balasan Anda..."
                      class="w-full p-3 text-sm bg-[#f4f4f5] border border-transparent rounded-xl text-[#171717] focus:outline-none focus:border-[#2563eb] resize-none"
                    ></textarea>
                    <div class="flex justify-end gap-2">
                      <button
                        @click="activeReplyParentId = null"
                        class="px-3 py-1.5 text-sm text-[#707070] hover:text-[#171717] cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        @click="handleAddComment(comment.id)"
                        :disabled="isSubmittingReply"
                        class="stitch-button-primary px-4 py-1.5 text-sm font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span v-if="isSubmittingReply" class="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                        <span>Kirim Balasan</span>
                      </button>
                    </div>
                  </div>

                  <!-- Replies list -->
                  <div v-if="comment.replies && comment.replies.length > 0" class="pl-10 pt-3 space-y-3 divide-y divide-[#f0f0f0]">
                    <div
                      v-for="reply in comment.replies"
                      :key="reply.id"
                      class="pt-3 first:pt-0 space-y-1"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <img
                            :src="getCuteAvatar(reply.author_name)"
                            :alt="reply.author_name"
                            class="w-6 h-6 rounded-full bg-[#f4f4f5] object-contain p-0.5 shrink-0"
                          />
                          <span class="text-sm font-bold text-[#171717]">{{ reply.author_name }}</span>
                          <span
                            v-if="reply.is_author_reply || reply.author_name === siteSettings.authorName || reply.author_name === 'Rizal Efendi' || reply.author_name === 'Admin (Author)'"
                            class="inline-flex items-center text-[#2563eb] shrink-0"
                            title="Penulis Terverifikasi"
                          >
                            <svg class="w-4 h-4 text-[#2563eb]" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                            </svg>
                          </span>
                        </div>
                        <div class="flex items-center gap-2 font-mono text-[10px]">
                          <span class="text-[#707070]">{{ getFormattedDate(reply.created_at || reply.date) }}</span>
                          <span class="text-[#cccccc]">•</span>
                          <button
                            @click="openDeleteModal(reply.id)"
                            class="text-xs text-red-500 hover:underline font-medium cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                      <p class="text-sm text-[#707070] pl-8 leading-relaxed">
                        {{ getCleanCommentContent(reply.content) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="py-8 text-center text-[#707070] text-sm space-y-1">
              <div class="text-2xl">💬</div>
              <div class="font-medium text-[#171717]">Belum ada komentar pada artikel ini.</div>
              <div class="text-xs text-[#707070]">Jadilah yang pertama berbagi pandangan dan memulai diskusi!</div>
            </div>
          </section>

          <!-- Comment Deletion Email Verification Modal -->
          <div
            v-if="deletingCommentId"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div class="flex items-center justify-between border-b border-[#f0f0f0] pb-3">
                <h3 class="text-base font-semibold text-[#171717] flex items-center gap-2">
                  <span>🔐</span>
                  <span>Konfirmasi Hapus Komentar</span>
                </h3>
                <button @click="deletingCommentId = null" class="text-[#707070] hover:text-black font-mono cursor-pointer">✕</button>
              </div>

              <p class="text-xs text-[#707070] leading-relaxed">
                Untuk keamanan, silakan masukkan <strong>Email yang Anda gunakan saat menulis komentar ini</strong> untuk memverifikasi kepemilikan.
              </p>

              <input
                v-model="deleteEmailInput"
                type="email"
                placeholder="Email Anda *"
                class="w-full px-4 py-2.5 text-sm bg-[#f4f4f5] border border-transparent rounded-full text-[#171717] focus:outline-none focus:border-[#2563eb]"
                @keyup.enter="handleConfirmDelete"
              />

              <p v-if="deleteErrorMessage" class="text-xs font-medium text-red-600">
                {{ deleteErrorMessage }}
              </p>
              <p v-if="deleteSuccessMessage" class="text-xs font-semibold text-[#2563eb] bg-[#2563eb]/10 p-2.5 rounded-full border border-[#2563eb]/30">
                {{ deleteSuccessMessage }}
              </p>

              <div class="flex justify-end gap-2 pt-2 border-t border-[#f0f0f0]">
                <button
                  @click="closeDeleteModal"
                  class="stitch-button-secondary px-4 py-2 text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  @click="handleConfirmDelete"
                  :disabled="isDeletingComment"
                  class="px-4 py-2 text-xs font-semibold bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span v-if="isDeletingComment" class="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  <span>{{ isDeletingComment ? 'Memverifikasi...' : 'Hapus Komentar' }}</span>
                </button>
              </div>
            </div>
          </div>

        </main>

        <!-- Right Track: Sidebar Widgets (Matching Home Page Sidebar) -->
        <aside class="lg:col-span-4 space-y-8 sticky top-32">

          <!-- Home Sidebar Ad Slot 1 -->
          <AdSlot
            v-if="!isPremium"
            :enabled="siteSettings.showArticleSidebarAd !== false"
            :scriptContent="siteSettings.articleSidebarAdScript"
            label="IKLAN SIDEBAR DETAIL ARTIKEL"
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

          <!-- Topik Populer Gadget -->
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
    </template>

  </div>
</template>
