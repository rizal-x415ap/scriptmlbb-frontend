import { ref, reactive } from 'vue'
import { ApiService } from './api.js'

export const isPremium = ref(false)
export const premiumToken = ref(localStorage.getItem('blog_premium_token') || '')
export const premiumExpiresAt = ref(localStorage.getItem('blog_premium_expires') || '')
export const isVerifyingPremium = ref(true)
let verificationPromise = null

// Optimistic initial check from localStorage on app load so hard reload doesn't flash false
const initialSavedToken = localStorage.getItem('blog_premium_token')
const initialExpires = localStorage.getItem('blog_premium_expires')
if (initialSavedToken) {
  if (!initialExpires || new Date(initialExpires) > new Date()) {
    isPremium.value = true
  }
}

export const premiumState = reactive({
  isPremium,
  premiumToken,
  premiumExpiresAt,
  isVerifyingPremium
})

/**
 * Generate a unique client device fingerprint hash
 */
export function getDeviceFingerprint() {
  const userAgent = navigator.userAgent || ''
  const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0}`
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
  const language = navigator.language || ''
  const rawString = `${userAgent}|${screenRes}|${timeZone}|${language}`

  // Simple string hash
  let hash = 0
  for (let i = 0; i < rawString.length; i++) {
    const char = rawString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return 'DEV-' + Math.abs(hash).toString(36).toUpperCase()
}

/**
 * Verify saved token on app launch in background
 */
export function loadPremiumStatus() {
  if (verificationPromise) return verificationPromise

  verificationPromise = (async () => {
    isVerifyingPremium.value = true
    const savedToken = localStorage.getItem('blog_premium_token')
    if (!savedToken) {
      isPremium.value = false
      isVerifyingPremium.value = false
      return false
    }

    try {
      const fingerprint = getDeviceFingerprint()
      const response = await ApiService.verifyPremium(savedToken, fingerprint)
      
      if (response && response.is_premium) {
        isPremium.value = true
        premiumToken.value = savedToken
        if (response.data?.expires_at) {
          premiumExpiresAt.value = response.data.expires_at
          localStorage.setItem('blog_premium_expires', response.data.expires_at)
        }
        return true
      } else {
        clearPremium()
        return false
      }
    } catch (error) {
      console.warn('Failed to verify premium token status:', error)
      return false
    } finally {
      isVerifyingPremium.value = false
    }
  })()

  return verificationPromise
}

/**
 * Activate a 5-character token input
 */
export async function activateToken(inputToken) {
  const cleanToken = String(inputToken).trim().toUpperCase()
  if (cleanToken.length !== 5) {
    throw new Error('Kode token harus terdiri dari 5 huruf besar (contoh: ABCDE).')
  }

  const fingerprint = getDeviceFingerprint()
  const response = await ApiService.activatePremium(cleanToken, fingerprint)

  if (response && response.status === 'success') {
    isPremium.value = true
    premiumToken.value = cleanToken
    localStorage.setItem('blog_premium_token', cleanToken)
    
    if (response.data?.expires_at) {
      premiumExpiresAt.value = response.data.expires_at
      localStorage.setItem('blog_premium_expires', response.data.expires_at)
    }
    
    return response
  } else {
    throw new Error(response?.message || 'Aktivasi token gagal.')
  }
}

/**
 * Clear premium status (logout premium)
 */
export function clearPremium() {
  isPremium.value = false
  premiumToken.value = ''
  premiumExpiresAt.value = ''
  localStorage.removeItem('blog_premium_token')
  localStorage.removeItem('blog_premium_expires')
}

/**
 * Record pop-up dismiss time
 */
export function dismissPopup() {
  localStorage.setItem('blog_premium_dismiss_time', Date.now().toString())
}

/**
 * Check if pop-up should be displayed (every 5 minutes if not premium)
 */
export function shouldShowPopup() {
  if (isPremium.value) return false

  const lastDismiss = localStorage.getItem('blog_premium_dismiss_time')
  if (!lastDismiss) return true

  const FIVE_MINUTES = 5 * 60 * 1000
  return (Date.now() - parseInt(lastDismiss, 10)) > FIVE_MINUTES
}
