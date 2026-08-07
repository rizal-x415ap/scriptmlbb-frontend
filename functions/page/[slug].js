/**
 * Cloudflare Pages Edge Function for Static Pages (/page/*)
 * Intercepts requests, fetches live page metadata from Laravel API,
 * and dynamically injects Open Graph, Twitter Cards, and SEO meta tags.
 */

export async function onRequest(context) {
  const { request, params, env } = context
  const slug = params.slug
  const url = new URL(request.url)

  const response = await env.ASSETS.fetch(request)

  if (!slug) return response

  try {
    const apiBase = env.VITE_API_BASE_URL || 'https://api.rizaldev.my.id/api/v1'
    const apiKey = env.VITE_API_KEY || 'sk_blog_sec_8f93e41b2a7605d1c904e12b7f3298a4'

    const apiRes = await fetch(`${apiBase}/pages/${slug}`, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': apiKey
      }
    })

    if (!apiRes.ok) return response

    const json = await apiRes.json()
    const page = json?.data
    if (!page) return response

    const title = page.title || 'Script MLBB'
    const rawDescription = page.meta_description || page.excerpt || page.title || 'Halaman Script MLBB'
    const description = cleanTextSnippet(rawDescription, 160)

    let html = await response.text()

    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)} — Script MLBB</title>`)

    const metaTags = `
      <meta name="description" content="${escapeHtml(description)}" />
      <meta property="og:site_name" content="Script MLBB" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content="${escapeHtml(title)} — Script MLBB" />
      <meta property="og:description" content="${escapeHtml(description)}" />
      <meta property="og:url" content="${escapeHtml(url.href)}" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${escapeHtml(title)} — Script MLBB" />
      <meta name="twitter:description" content="${escapeHtml(description)}" />
    `

    html = html.replace('</head>', `${metaTags}\n</head>`)

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
