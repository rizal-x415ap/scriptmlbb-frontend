/**
 * Cloudflare Pages Edge Function for Dynamic ads.txt
 * Fetches dynamic adsTxtContent configured in Admin Panel API.
 */

export async function onRequest(context) {
  const { env } = context
  try {
    const apiBase = env.VITE_API_BASE_URL || 'https://api.rizaldev.my.id/api/v1'
    const backendOrigin = apiBase.replace(/\/api\/v1\/?$/, '')

    const res = await fetch(`${backendOrigin}/ads.txt`, {
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

  const fallback = "# Google AdSense Authorization\n# google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0"
  return new Response(fallback, {
    headers: {
      'Content-Type': 'text/plain; charset=UTF-8'
    }
  })
}
