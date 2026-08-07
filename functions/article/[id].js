/**
 * Cloudflare Pages Edge Function for Article Detail Pages (/article/*)
 * Intercepts requests, fetches live article metadata from Laravel API,
 * and dynamically injects Open Graph, Twitter Cards, and SEO meta tags
 * directly into raw HTML for social media preview (WhatsApp, FB, Telegram) & search bots.
 */

export async function onRequest(context) {
  const { request, params, env } = context
  const articleId = params.id
  const url = new URL(request.url)

  // Fetch static index.html template from Cloudflare Pages assets origin
  const response = await env.ASSETS.fetch(request)

  if (!articleId) return response

  try {
    const apiBase = env.VITE_API_BASE_URL || 'https://api.rizaldev.my.id/api/v1'
    const apiKey = env.VITE_API_KEY || 'sk_blog_sec_8f93e41b2a7605d1c904e12b7f3298a4'

    const apiRes = await fetch(`${apiBase}/articles/${articleId}`, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey
      }
    })

    if (!apiRes.ok) return response

    const json = await apiRes.json()
    const article = json?.data
    if (!article) return response

    const title = article.title || 'Script MLBB'
    const rawExcerpt = article.excerpt || article.title || 'Artikel Script MLBB'
    const excerpt = cleanTextSnippet(rawExcerpt, 160)
    const coverImage = article.cover_image || article.app_icon || `${url.origin}/favicon.svg`
    const absoluteCover = coverImage.startsWith('http') ? coverImage : `${url.origin}${coverImage.startsWith('/') ? '' : '/'}${coverImage}`

    let html = await response.text()

    // 1. Replace <title> tag
    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)} — Script MLBB</title>`)

    // 2. Replace meta description tag in place
    html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${escapeHtml(excerpt)}" />`)

    // 3. Replace Open Graph tags in place
    html = html.replace(/<meta\s+property="og:type"\s+content=".*?"\s*\/?>/i, `<meta property="og:type" content="article" />`)
    html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)} — Script MLBB" />`)
    html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(excerpt)}" />`)
    html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i, `<meta property="og:image" content="${escapeHtml(absoluteCover)}" />`)

    // 4. Replace Twitter Card tags in place
    html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(title)} — Script MLBB" />`)
    html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(excerpt)}" />`)
    html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${escapeHtml(absoluteCover)}" />`)

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=UTF-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300'
      }
    })
  } catch (err) {
    return response
  }
}

function cleanTextSnippet(raw, max = 160) {
  let str = String(raw || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (str.length > max) str = str.slice(0, max).trim() + '...'
  return str
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
