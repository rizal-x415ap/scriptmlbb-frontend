import { reactive, ref, watch } from 'vue'
import { ApiService } from './api.js'
import { isPremium } from './premiumStore.js'

const defaultSettings = {
  siteTitle: 'Script MLBB // Blog & Artikel Software',
  siteDescription: 'Script MLBB adalah website teknologi yang membahas Mobile Legends, Gadget, tutorial, pemrograman, Script Skin ML, Loading Screen  ML dan lainnya.',
  metaKeywords: 'loading screen ml, loading screen Moibile legends, intro ml, script skin ml, script ml, script mobile legends skin, cara menghitung wr, situs penghitung wr, mobile legends, hitung wr, website penghitung wr, penghitung wr',
  siteBaseUrl: 'http://localhost:5173',
  faviconUrl: '/favicon.svg',
  brandLogoText: 'Script MLBB',
  brandLogoUrl: '',
  contactEmail: 'rizal@scriptmlbb.com',
  premiumFreeAdUrl: 'https://scriptmlbb.com',
  showAnnouncementBar: true,
  announcementText: '⚡ DAPATKAN UPDATE ARTIKEL TERBARU DAN WAWASAN ARSITEKTUR SISTEM',
  announcementLink: '/archive',
  featuredPostCategory: 'All',
  archiveTitle: 'Jelajahi Arsip Artikel & Script Skin',
  archiveSubtitle: 'Filter seluruh koleksi artikel teknis, catatan arsitektur sistem, dan panduan teknis modern.',
  showMostReadWidget: true,
  showAuthorWidget: true,
  showNewsletterWidget: true,
  showTopicsWidget: true,
  showFooter: true,
  footerTagline: 'KARYA DIGITAL — PRESISI EDITORIAL',
  footerBio: 'Temukan informasi teknologi, Digital Marketing, Gadget, tutorial, pemrograman, Mobile Legends, Script ML, dan hal menarik lainnya.',
  footerCol2Title: 'Kategori',
  // Custom Script Injections
  headScriptContent: '',
  bodyOpenScriptContent: '',
  bodyCloseScriptContent: '',
  // Global Ad Scripts (Auto-Disabled for Premium)
  globalHeadAdScript: '',
  globalBodyOpenAdScript: '',
  globalBodyCloseAdScript: '',
  footerCol2Link1Text: 'Rekayasa Web',
  footerCol2Link1Url: '/archive?category=Rekayasa Web',
  footerCol2Link2Text: 'Arsitektur Sistem',
  footerCol2Link2Url: '/archive?category=Arsitektur Sistem',
  footerCol2Link3Text: 'Desain Sistem',
  footerCol2Link3Url: '/archive?category=Desain Sistem',
  footerCol2Link4Text: 'Kecerdasan Buatan',
  footerCol2Link4Url: '/archive?category=Kecerdasan Buatan',
  footerCol3Title: 'Sumber Daya',
  footerCol3Link1Text: 'Dokumentasi Vue 3',
  footerCol3Link1Url: 'https://vuejs.org',
  footerCol3Link2Text: 'Panduan Vite',
  footerCol3Link2Url: 'https://vitejs.dev',
  footerCol3Link3Text: 'Dokumentasi Tailwind',
  footerCol3Link3Url: 'https://tailwindcss.com',
  footerCol3Link4Text: 'Arsip Artikel',
  footerCol3Link4Url: '/archive',
  footerCopyright: '© 2026 SCRIPT MLBB INC. HAK CIPTA DILINDUNGI UNTUK SELURUH KARYA.',
  socialLink1Text: 'Twitter / X',
  socialLink1Url: 'https://twitter.com',
  socialLink2Text: 'GitHub',
  socialLink2Url: 'https://github.com',
  socialLink3Text: 'LinkedIn',
  socialLink3Url: 'https://linkedin.com',
  socialLink4Text: '',
  socialLink4Url: '',
  authorName: 'Rizal Efendi',
  authorTitle: 'Penulis & Pengembang Sistem',
  authorAvatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  authorBio: 'Berbagi pengalaman teknis seputar pemrograman, arsitektur web, dan desain sistem modern.',
  authorFollowersCount: '5.2k Pembaca',
  authorInstagramUrl: 'https://instagram.com/@rizalefd_',
  authorInstagramHandle: '@rizalefd_',
  // Ad Management & Placements Settings
  showHomeSidebarAd1: true,
  homeSidebarAd1Script: '',
  showHomeSidebarAd2: true,
  homeSidebarAd2Script: '',
  showHomeFeedAd: true,
  homeFeedAdScript: '',
  showPreFooterAd: true,
  preFooterAdScript: '',
  showArticleMiddleAd: true,
  articleMiddleAdScript: '',
  showArticleEndAd: true,
  articleEndAdScript: '',
  showArticleSidebarAd: true,
  articleSidebarAdScript: '',
  // Shortener Page Ad Settings
  showShortenerTopAd: true,
  shortenerTopAdScript: '',
  showShortenerMiddleAd: true,
  shortenerMiddleAdScript: '',
  showShortenerBottomAd: true,
  shortenerBottomAdScript: '',
  showShortenerLeftAd: true,
  shortenerLeftAdScript: '',
  showShortenerRightAd: true,
  shortenerRightAdScript: '',
  // Custom Global Header & Body Script Injections (Google Analytics, GTM, AdSense Main Script, etc.)
  headScriptContent: '',
  bodyOpenScriptContent: '',
  bodyCloseScriptContent: '',
  // Premium Subscription Settings
  premiumBuyUrl: 'https://wa.me/6285262335849?text=Min%20Saya%20mau%20beli%20token%20Script%20MLBB',
  premiumMonthlyPrice: '5.000',
  premiumFreeAdMode: 'direct_link',
  premiumFreeAdScript: ''
}

export const siteSettings = reactive({ ...defaultSettings })
export const isAdminLoggedIn = ref(false)
export const adminToken = ref(localStorage.getItem('blog_admin_token') || '')

if (adminToken.value) {
  isAdminLoggedIn.value = true
}

export function applyGlobalSettings(settings = siteSettings) {
  // 1. Dynamic Document Title
  if (settings.siteTitle) {
    document.title = settings.siteTitle
  }

  // 2. Dynamic Meta Description
  if (settings.siteDescription) {
    let metaDesc = document.querySelector('meta[name="description"]')
    if (!metaDesc) {
      metaDesc = document.createElement('meta')
      metaDesc.name = 'description'
      document.head.appendChild(metaDesc)
    }
    metaDesc.content = settings.siteDescription
  }

  // 3. Dynamic Tab Favicon Icon
  if (settings.faviconUrl) {
    let link = document.querySelector("link[rel*='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'shortcut icon'
      document.head.appendChild(link)
    }
    link.href = settings.faviconUrl
  }

  // 4. Dynamic Canonical URL Tag
  updateCanonicalUrl()

  // 5. Dynamic Default Open Graph Image Tag
  if (settings.ogImageUrl) {
    updateOgImage(settings.ogImageUrl)
  }

  // 6. Custom Head, Body Open & Body Close Script Injections
  injectCustomScripts(settings)
}

export function injectCustomScripts(settings = siteSettings) {
  // 1. General / Analytics Scripts (Always Active for Everyone)
  if (settings.headScriptContent !== undefined) {
    injectScriptContainer('custom-head-scripts-container', document.head, 'append', settings.headScriptContent)
  }
  if (settings.bodyOpenScriptContent !== undefined) {
    injectScriptContainer('custom-body-open-scripts-container', document.body, 'prepend', settings.bodyOpenScriptContent)
  }
  if (settings.bodyCloseScriptContent !== undefined) {
    injectScriptContainer('custom-body-close-scripts-container', document.body, 'append', settings.bodyCloseScriptContent)
  }

  // 2. Global Ad Scripts (Auto-Disabled for Premium Users)
  const isUserPremium = Boolean(isPremium.value)
  const headAdScript = isUserPremium ? '' : (settings.globalHeadAdScript || '')
  const bodyOpenAdScript = isUserPremium ? '' : (settings.globalBodyOpenAdScript || '')
  const bodyCloseAdScript = isUserPremium ? '' : (settings.globalBodyCloseAdScript || '')

  injectScriptContainer('custom-global-head-ad-container', document.head, 'append', headAdScript)
  injectScriptContainer('custom-global-body-open-ad-container', document.body, 'prepend', bodyOpenAdScript)
  injectScriptContainer('custom-global-body-close-ad-container', document.body, 'append', bodyCloseAdScript)
}

// Automatically re-evaluate script injections whenever premium status changes
watch(isPremium, () => {
  injectCustomScripts()
})

function injectScriptContainer(id, targetNode, method, rawContent) {
  let container = document.getElementById(id)
  if (!container) {
    container = document.createElement('div')
    container.id = id
    container.style.display = 'none'
    if (method === 'prepend') {
      targetNode.insertBefore(container, targetNode.firstChild)
    } else {
      targetNode.appendChild(container)
    }
  }

  const contentStr = String(rawContent || '').trim()
  if (container.getAttribute('data-content-hash') === contentStr) {
    return
  }

  container.innerHTML = ''
  container.setAttribute('data-content-hash', contentStr)

  if (!contentStr) {
    return
  }

  const parser = new DOMParser()
  const parsedDoc = parser.parseFromString(contentStr, 'text/html')

  const nodes = [
    ...Array.from(parsedDoc.head.childNodes),
    ...Array.from(parsedDoc.body.childNodes)
  ]

  nodes.forEach((node) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'script') {
      const newScript = document.createElement('script')
      Array.from(node.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value))
      newScript.textContent = node.textContent
      container.appendChild(newScript)
    } else if (node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent.trim())) {
      container.appendChild(node.cloneNode(true))
    }
  })
}

export function updateOgImage(imageUrl = null) {
  const targetImage = imageUrl || siteSettings.ogImageUrl || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80'

  // Open Graph Image
  let ogImg = document.querySelector('meta[property="og:image"]')
  if (!ogImg) {
    ogImg = document.createElement('meta')
    ogImg.setAttribute('property', 'og:image')
    document.head.appendChild(ogImg)
  }
  ogImg.content = targetImage

  // Twitter Image
  let twImg = document.querySelector('meta[name="twitter:image"]')
  if (!twImg) {
    twImg = document.createElement('meta')
    twImg.name = 'twitter:image'
    document.head.appendChild(twImg)
  }
  twImg.content = targetImage
}

export function updateCanonicalUrl(customUrl = null) {
  let targetUrl = customUrl
  if (!targetUrl) {
    const base = (siteSettings.siteBaseUrl || window.location.origin).replace(/\/$/, '')
    targetUrl = `${base}${window.location.pathname}`
  }

  // Canonical link tag
  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = targetUrl

  // Open Graph URL meta tag
  let ogUrl = document.querySelector('meta[property="og:url"]')
  if (!ogUrl) {
    ogUrl = document.createElement('meta')
    ogUrl.setAttribute('property', 'og:url')
    document.head.appendChild(ogUrl)
  }
  ogUrl.content = targetUrl
}

export async function loadSiteSettings() {
  const data = await ApiService.getSettings()
  if (data) {
    Object.assign(siteSettings, data)
  }
  applyGlobalSettings(siteSettings)
}

export async function saveSiteSettings(updatedData) {
  Object.assign(siteSettings, updatedData)
  applyGlobalSettings(siteSettings)

  // Persist to Laravel Backend Database
  try {
    await ApiService.updateSettings(siteSettings)
  } catch (err) {
    console.warn('Failed to save to backend database:', err)
  }
}
