/**
 * Laravel REST API Integration Layer
 * 
 * Direct API connection to Laravel 12 Backend Endpoint: http://127.0.0.1:8000/api/v1
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.rizaldev.my.id/api/v1'
const API_KEY = import.meta.env.VITE_API_KEY || 'sk_blog_sec_8f93e41b2a7605d1c904e12b7f3298a4'

/**
 * Construct secure headers including X-API-Key and optional Bearer token
 */
function getHeaders(extraHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-API-Key': API_KEY,
    ...extraHeaders
  }

  const adminToken = localStorage.getItem('admin_token')
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`
  }

  return headers
}

function getSwrCache(key) {
  try {
    const raw = localStorage.getItem(`swr_${key}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function setSwrCache(key, data) {
  try {
    localStorage.setItem(`swr_${key}`, JSON.stringify(data))
  } catch {}
}

export const ApiService = {
  // Fetch Site Settings for all visitors (SWR pattern)
  async getSettings() {
    const cached = getSwrCache('settings')
    const fetchPromise = fetch(`${API_BASE_URL}/settings`, { headers: getHeaders() })
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json?.data) {
          setSwrCache('settings', json.data)
        }
        return json?.data || null
      })
      .catch(() => null)

    if (cached) {
      fetchPromise.catch(() => {})
      return cached
    }
    return await fetchPromise
  },

  // Admin Authentication for Layout Customizer
  async adminLogin(email, password) {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    })
    const json = await response.json()
    if (!response.ok) {
      throw new Error(json.message || 'Login failed')
    }
    if (json.token) {
      localStorage.setItem('admin_token', json.token)
    }
    return json
  },

  // Save Site Settings permanently to Laravel Backend Database
  async updateSettings(settingsData) {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(settingsData)
    })
    const json = await response.json()
    if (!response.ok) {
      throw new Error(json.message || 'Failed to update settings')
    }
    return json
  },

  // Fetch Home Feed Data (SWR pattern for instant FCP/LCP)
  async getHomeFeed(page = 1) {
    const cacheKey = `home_feed_page_${page}`
    const cached = page === 1 ? getSwrCache('home_feed') : null
    const fetchPromise = fetch(`${API_BASE_URL}/home-feed?page=${page}`, { headers: getHeaders() })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        return res.json()
      })
      .then(json => {
        const feedData = json.data || { featured: null, feed: [], pagination: { current_page: 1, last_page: 1 } }
        if (page === 1) {
          setSwrCache('home_feed', feedData)
        }
        return feedData
      })

    if (cached) {
      fetchPromise.catch(() => {})
      return cached
    }
    return await fetchPromise
  },

  // Fetch Single Article Details by ID or Slug (SWR pattern for instant FCP/LCP)
  async getArticleById(idOrSlug) {
    const cacheKey = `article_${idOrSlug}`
    const cached = getSwrCache(cacheKey)

    const fetchPromise = fetch(`${API_BASE_URL}/articles/${idOrSlug}`, {
      headers: getHeaders()
    })
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) return null
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(json => {
        const articleData = json?.data || null
        if (articleData) {
          setSwrCache(cacheKey, articleData)
        }
        return articleData
      })
      .catch(err => {
        if (err.message?.includes('404')) return null
        return null
      })

    if (cached) {
      fetchPromise.catch(() => {})
      return cached
    }
    return await fetchPromise
  },

  // Fetch Archive Articles with filtering & search parameters
  async getArchiveArticles(params = {}) {
    const query = new URLSearchParams(params).toString()
    const response = await fetch(`${API_BASE_URL}/articles?${query}`, {
      headers: getHeaders()
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const json = await response.json()
    return json.data || []
  },

  // Submit Article Comment
  async submitComment(articleId, commentData) {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/comments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(commentData)
    })
    const json = await response.json()
    if (!response.ok) {
      const errorMsg = json.message || (json.errors ? Object.values(json.errors).flat().join(', ') : `HTTP error! status: ${response.status}`)
      throw new Error(errorMsg)
    }
    return json
  },

  // Delete Comment with Email Verification Security
  async deleteComment(commentId, email) {
    const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      body: JSON.stringify({ email })
    })
    const json = await response.json()
    if (!response.ok) {
      const errorMsg = json.message || (json.errors ? Object.values(json.errors).flat().join(', ') : 'Email verification failed.')
      throw new Error(errorMsg)
    }
    return json
  },

  // Toggle Article Like
  async likeArticle(articleId) {
    const response = await fetch(`${API_BASE_URL}/articles/${articleId}/like`, {
      method: 'POST',
      headers: getHeaders()
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  },

  // Fetch Static Single Page Detail by Slug
  async getPageBySlug(slug) {
    try {
      const response = await fetch(`${API_BASE_URL}/pages/${slug}`, {
        headers: getHeaders()
      })
      if (!response.ok) return null
      const json = await response.json()
      return json.data || null
    } catch {
      return null
    }
  },

  // Fetch All Static Pages List
  async getPages() {
    try {
      const response = await fetch(`${API_BASE_URL}/pages`, {
        headers: getHeaders()
      })
      if (!response.ok) return []
      const json = await response.json()
      return json.data || []
    } catch {
      return []
    }
  },

  // Resolve Short Link for Download Landing Page
  async resolveShortLink(code) {
    const response = await fetch(`${API_BASE_URL}/go/${code}`, {
      headers: getHeaders()
    })
    if (!response.ok) {
      throw new Error(`Short link not found! status: ${response.status}`)
    }
    const json = await response.json()
    return json.data
  },

  // Get Original URL after 10s Countdown
  async unlockShortLink(code) {
    const response = await fetch(`${API_BASE_URL}/go/${code}/unlock`, {
      method: 'POST',
      headers: getHeaders()
    })
    if (!response.ok) {
      throw new Error(`Failed to unlock short link! status: ${response.status}`)
    }
    const json = await response.json()
    return json.original_url
  },

  // Activate 5-character Premium Token
  async activatePremium(token, device_fingerprint) {
    const response = await fetch(`${API_BASE_URL}/premium/activate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ token, device_fingerprint, device_name: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser' })
    })
    const json = await response.json()
    if (!response.ok) {
      throw new Error(json.message || 'Aktivasi token gagal.')
    }
    return json
  },

  // Verify Premium Token Status
  async verifyPremium(token, device_fingerprint) {
    try {
      const response = await fetch(`${API_BASE_URL}/premium/verify`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ token, device_fingerprint })
      })
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }
}
