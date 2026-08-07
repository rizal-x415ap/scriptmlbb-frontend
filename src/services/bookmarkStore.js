import { ref, watch } from 'vue'

const BOOKMARKS_STORAGE_KEY = 'script_mlbb_bookmarks'

// Helper to safely load bookmarks from localStorage
const loadBookmarksFromStorage = () => {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Reactive store state
export const bookmarkedArticles = ref(loadBookmarksFromStorage())

// Watcher to keep localStorage synchronized
watch(bookmarkedArticles, (newBookmarks) => {
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(newBookmarks))
  } catch (err) {
    console.error('Failed to save bookmarks to localStorage:', err)
  }
}, { deep: true })

export const isBookmarked = (articleId) => {
  if (!articleId) return false
  return bookmarkedArticles.value.some(item => String(item.id) === String(articleId) || item.slug === String(articleId))
}

export const toggleBookmark = (article) => {
  if (!article) return false
  const targetId = article.id || article.slug
  const existingIdx = bookmarkedArticles.value.findIndex(item => String(item.id) === String(targetId) || item.slug === String(targetId))

  if (existingIdx !== -1) {
    // Remove bookmark
    bookmarkedArticles.value.splice(existingIdx, 1)
    return false
  } else {
    // Add bookmark with normalized fields
    bookmarkedArticles.value.unshift({
      id: article.id,
      title: article.title,
      slug: article.slug,
      cover_image: article.cover_image || article.app_poster_35,
      app_icon: article.app_icon,
      app_version: article.app_version || 'v1.8.94',
      app_size: article.app_size || '45.2 MB',
      read_time: article.read_time || '3 mnt baca',
      category: article.category,
      saved_at: new Date().toISOString()
    })
    return true
  }
}

export const removeBookmark = (articleId) => {
  const existingIdx = bookmarkedArticles.value.findIndex(item => String(item.id) === String(articleId) || item.slug === String(articleId))
  if (existingIdx !== -1) {
    bookmarkedArticles.value.splice(existingIdx, 1)
  }
}
