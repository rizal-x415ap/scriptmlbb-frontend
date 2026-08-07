/**
 * Cloudflare Pages Edge Function for Premium Page (/premium)
 */

export async function onRequest(context) {
  const { request, env } = context
  const response = await env.ASSETS.fetch(request)

  try {
    let html = await response.text()
    const title = 'Akses Premium & Token Berlangganan'
    const description = 'Nikmati pengalaman membaca tanpa iklan, unduh file langsung tanpa iklan pendek, dan akses fitur eksklusif.'

    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)} — Script MLBB</title>`)
    html = html.replace(/<meta\s+name="description"\s+content=".*?"\s*\/?>/i, `<meta name="description" content="${escapeHtml(description)}" />`)
    html = html.replace(/<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(title)} — Script MLBB" />`)
    html = html.replace(/<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(description)}" />`)

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
