/**
 * High-Performance SEO & Social Media Manager Utility
 * Handles dynamic Meta Title, Description, Keywords, Canonical URLs,
 * Open Graph (OG) tags, Twitter Cards, and JSON-LD Structured Data Schemas.
 */

import { siteSettings } from './settingsStore.js'

/**
 * Clean HTML string into plain text excerpt for meta description
 */
export function cleanExcerptText(raw, maxLength = 160) {
  if (!raw) return ''
  let text = String(raw)
    .replace(/<[^>]+>/g, ' ')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^##+\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length > maxLength) {
    text = text.slice(0, maxLength).trim() + '...'
  }
  return text
}

/**
 * Ensure image or page URL is absolute
 */
export function getAbsoluteUrl(path) {
  if (!path) return window.location.origin
  if (/^https?:\/\//i.test(path)) return path
  const origin = window.location.origin
  return path.startsWith('/') ? `${origin}${path}` : `${origin}/${path}`
}

/**
 * Helper to update or create a meta tag in document <head>
 */
function setMetaTag(attrName, attrValue, content) {
  if (!content && content !== '') return
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attrName, attrValue)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

/**
 * Update Canonical Link tag
 */
function setCanonicalUrl(url) {
  let element = document.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', url)
}

/**
 * Inject or update JSON-LD Structured Data Schema script tag
 */
export function injectJsonLd(schemaData, schemaId = 'seo-jsonld-schema') {
  let scriptEl = document.getElementById(schemaId)
  if (!schemaData) {
    if (scriptEl) scriptEl.remove()
    return
  }

  if (!scriptEl) {
    scriptEl = document.createElement('script')
    scriptEl.id = schemaId
    scriptEl.type = 'application/ld+json'
    document.head.appendChild(scriptEl)
  }
  scriptEl.textContent = JSON.stringify(schemaData)
}

/**
 * Main SEO Meta Setter
 */
export function setSeoMeta({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  authorName,
  sectionCategory,
  jsonLdSchema = null
}) {
  const brandName = siteSettings.brandLogoText || 'Script MLBB'
  const defaultTitle = siteSettings.siteTitle || `${brandName} // Blog & Artikel Software`
  const defaultDescription = siteSettings.siteDescription || 'Blog artikel teknis, arsitektur web modern, dan catatan rekayasa perangkat lunak.'

  // 1. Page Title Calculation
  let finalTitle = ''
  if (title && title.trim()) {
    const cleanTitle = title.trim()
    if (cleanTitle.toLowerCase() === brandName.toLowerCase()) {
      finalTitle = brandName
    } else if (cleanTitle.toLowerCase().includes(brandName.toLowerCase())) {
      finalTitle = cleanTitle
    } else {
      finalTitle = `${cleanTitle} — ${brandName}`
    }
  } else {
    finalTitle = siteSettings.siteTitle || brandName
  }
  document.title = finalTitle

  // 2. Meta Description & Keywords
  const finalDescription = cleanExcerptText(description || defaultDescription, 160)
  setMetaTag('name', 'description', finalDescription)

  const finalKeywords = keywords || siteSettings.metaKeywords || 'Vue3, Vite, Laravel, Mobile Legends, Script MLBB'
  setMetaTag('name', 'keywords', finalKeywords)

  // 3. Canonical URL
  const currentUrl = getAbsoluteUrl(url || window.location.pathname)
  setCanonicalUrl(currentUrl)

  // 4. Open Graph Meta Tags (Facebook, WhatsApp, Telegram, LinkedIn)
  const finalImage = getAbsoluteUrl(image || siteSettings.brandLogoUrl || '/favicon.svg')
  setMetaTag('property', 'og:site_name', brandName)
  setMetaTag('property', 'og:type', type)
  setMetaTag('property', 'og:title', title || finalTitle)
  setMetaTag('property', 'og:description', finalDescription)
  setMetaTag('property', 'og:url', currentUrl)
  setMetaTag('property', 'og:image', finalImage)
  setMetaTag('property', 'og:image:alt', title || brandName)

  if (type === 'article') {
    if (publishedTime) setMetaTag('property', 'article:published_time', new Date(publishedTime).toISOString())
    if (modifiedTime) setMetaTag('property', 'article:modified_time', new Date(modifiedTime).toISOString())
    if (authorName || siteSettings.authorName) setMetaTag('property', 'article:author', authorName || siteSettings.authorName)
    if (sectionCategory) setMetaTag('property', 'article:section', sectionCategory)
  }

  // 5. Twitter Card Meta Tags
  setMetaTag('name', 'twitter:card', 'summary_large_image')
  setMetaTag('name', 'twitter:title', title || finalTitle)
  setMetaTag('name', 'twitter:description', finalDescription)
  setMetaTag('name', 'twitter:image', finalImage)

  // 6. JSON-LD Schema
  if (jsonLdSchema) {
    injectJsonLd(jsonLdSchema)
  } else {
    // Default WebSite Schema
    injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': brandName,
      'url': getAbsoluteUrl('/'),
      'description': defaultDescription
    })
  }
}
