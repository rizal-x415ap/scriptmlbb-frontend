import { ref, watch } from 'vue'

const LIKED_STORAGE_KEY = 'script_mlbb_liked_articles'

const loadLikedFromStorage = () => {
  try {
    const raw = localStorage.getItem(LIKED_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Reactive ref containing array of liked article IDs/slugs
export const likedArticleIds = ref(loadLikedFromStorage())

watch(likedArticleIds, (newLiked) => {
  try {
    localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify(newLiked))
  } catch (err) {
    console.error('Failed to save liked state to localStorage:', err)
  }
}, { deep: true })

export const isArticleLiked = (articleIdOrSlug) => {
  if (!articleIdOrSlug) return false
  const key = String(articleIdOrSlug)
  return likedArticleIds.value.includes(key)
}

export const addLikedArticle = (articleIdOrSlug) => {
  if (!articleIdOrSlug) return
  const key = String(articleIdOrSlug)
  if (!likedArticleIds.value.includes(key)) {
    likedArticleIds.value.push(key)
  }
}

export const removeLikedArticle = (articleIdOrSlug) => {
  if (!articleIdOrSlug) return
  const key = String(articleIdOrSlug)
  const idx = likedArticleIds.value.indexOf(key)
  if (idx !== -1) {
    likedArticleIds.value.splice(idx, 1)
  }
}
