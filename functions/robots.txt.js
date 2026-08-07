/**
 * Cloudflare Pages Edge Function for Dynamic robots.txt
 * Fetches dynamic robotsTxtContent configured in Admin Panel API.
 */

export async function onRequest(context) {
  const { env } = context
  try {
    const apiBase = env.VITE_API_BASE_URL || 'https://api.rizaldev.my.id/api/v1'
    const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, '')

    const res = await fetch(`${backendOrigin}/robots.txt`, {
      headers: { 'Accept': 'text/plain' }
    })

    if (res.ok) {
      const text = await res.text()
      return new Response(text, {
        headers: {
          'Content-Type': 'text/plain; charset=UTF-8',
          'Cache-Control': 'public, max-age=60, s-maxage=300'
        }
      })
    }
  } catch (err) {}

  const fallback = "User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: https://scriptml.pages.dev/sitemap.xml"
  return new Response(fallback, {
    headers: {
      'Content-Type': 'text/plain; charset=UTF-8'
    }
  })
}
