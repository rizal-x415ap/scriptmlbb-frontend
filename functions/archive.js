/**
 * Cloudflare Pages Edge Function for Archive Page (/archive)
 */

export async function onRequest(context) {
  const { request, env } = context
  const response = await env.ASSETS.fetch(request)

  try {
    let html = await response.text()
    const title = 'Arsip Artikel & Catatan Teknis'
    const description = 'Filter dan jelajahi seluruh koleksi artikel teknis, catatan arsitektur sistem, dan panduan software.'

    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)} — Script MLBB</title>`)
    html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}" />`)
    html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)} — Script MLBB" />`)
    html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`)
    html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(request.url)}" />`)

    const ssrJsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${request.url}#webpage`,
          'url': request.url,
          'name': title,
          'description': description,
          'publisher': {
            '@type': 'Organization',
            'name': 'Script MLBB',
            'url': new URL(request.url).origin
          }
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${request.url}#breadcrumb`,
          'itemListElement': [
            {
              '@type': 'ListItem',
              'position': 1,
              'name': 'Beranda',
              'item': new URL(request.url).origin
            },
            {
              '@type': 'ListItem',
              'position': 2,
              'name': 'Arsip Artikel',
              'item': request.url
            }
          ]
        }
      ]
    }

    const jsonLdScriptRegex = /<script\s+type="application\/ld\+json">[\s\S]*?<\/script>/i
    const newJsonLdScript = `<script type="application/ld+json">\n${JSON.stringify(ssrJsonLd, null, 2)}\n</script>`
    html = html.replace(jsonLdScriptRegex, newJsonLdScript)

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

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
