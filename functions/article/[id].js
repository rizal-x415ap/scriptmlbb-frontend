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
    const coverImage = article.cover_image || `${url.origin}/favicon.svg`
    const absoluteCover = coverImage.startsWith('http') ? coverImage : `${url.origin}${coverImage.startsWith('/') ? '' : '/'}${coverImage}`
    const finalTitle = title.toLowerCase().includes('script mlbb') ? title : `${title} — Script MLBB`

    let html = await response.text()

    // 1. Replace <title> tag
    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(finalTitle)}</title>`)

    // 2. Replace meta description tag in place
    html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${escapeHtml(excerpt)}" />`)

    // 3. Replace Open Graph tags in place
    html = html.replace(/<meta\s+property="og:type"\s+content=".*?"\s*\/?>/i, `<meta property="og:type" content="article" />`)
    html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(finalTitle)}" />`)
    html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(excerpt)}" />`)
    html = html.replace(/<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i, `<meta property="og:image" content="${escapeHtml(absoluteCover)}" />`)

    // 4. Replace Twitter Card tags in place
    html = html.replace(/<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(finalTitle)}" />`)
    html = html.replace(/<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(excerpt)}" />`)
    html = html.replace(/<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i, `<meta name="twitter:image" content="${escapeHtml(absoluteCover)}" />`)

    // 5. Replace canonical link tag in place
    html = html.replace(/<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i, `<link rel="canonical" href="${escapeHtml(url.href)}" />`)

    // 6. Replace default static JSON-LD script with dynamic Article @graph schema in raw HTML (for Ctrl+U & Search Engine Scrapers)
    const categoryName = typeof article.category === 'object' ? article.category?.name : (article.category || 'General')
    const authorName = typeof article.author === 'object' ? article.author?.name : (article.author || 'Admin')
    const isAppStyle = Boolean(article.app_poster_35 || article.download_links || article.app_version)

    const articleGraphItem = {
      '@type': isAppStyle ? 'TechArticle' : 'BlogPosting',
      '@id': `${url.href}#article`,
      'isPartOf': { '@id': url.href },
      'headline': title,
      'description': excerpt,
      'image': [absoluteCover],
      'datePublished': article.published_at || article.created_at || new Date().toISOString(),
      'dateModified': article.updated_at || article.published_at || new Date().toISOString(),
      'author': {
        '@type': 'Person',
        'name': authorName,
        'url': `${url.origin}/about`
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'Script MLBB',
        'url': url.origin,
        'logo': {
          '@type': 'ImageObject',
          'url': `${url.origin}/favicon.svg`
        }
      },
      'articleSection': categoryName
    }

    const breadcrumbGraphItem = {
      '@type': 'BreadcrumbList',
      '@id': `${url.href}#breadcrumb`,
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Beranda',
          'item': url.origin
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': categoryName,
          'item': `${url.origin}/archive?category=${encodeURIComponent(categoryName)}`
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': title,
          'item': url.href
        }
      ]
    }

    const graphList = [articleGraphItem, breadcrumbGraphItem]

    if (isAppStyle) {
      // 1. Ambil deskripsi bersih tanpa tag HTML (Google mewajibkan deskripsi untuk Product)
      const itemDescription = (article.meta_description || article.excerpt || title)
        .replace(/<[^>]*>?/gm, '')
        .trim();

      // 2. Buat objek Schema berbasis Product
      const schemaProduct = {
        '@type': 'Product',
        '@id': `${url.href}#product`,
        'name': title,
        'description': itemDescription || title,
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'IDR',
          'availability': 'https://schema.org/InStock'
        }
      };

      // 3. Hanya tambahkan aggregateRating jika rating benar-benar ada dan bernilai > 0
      const reviewCountNum = Number(article.ratings_count || 0);
      const ratingValueNum = Number(article.rating_average || 0);

      if (reviewCountNum > 0 && ratingValueNum > 0) {
        schemaProduct['aggregateRating'] = {
          '@type': 'AggregateRating',
          'ratingValue': String(ratingValueNum),
          'reviewCount': String(reviewCountNum)
        };
      }

      graphList.push(schemaProduct);
    }

    const ssrJsonLd = {
      '@context': 'https://schema.org',
      '@graph': graphList
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
