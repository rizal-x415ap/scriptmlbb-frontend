/**
 * Lightweight Client-Side HTML Sanitizer Utility
 * Prevents Stored XSS attacks when rendering HTML via v-html
 */
export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml) return ''

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(dirtyHtml, 'text/html')

    // Remove dangerous structural tags
    const dangerousElements = doc.querySelectorAll('script, iframe, object, embed, form, base')
    dangerousElements.forEach(el => el.remove())

    // Remove inline event handlers (onclick, onerror, onload, etc.) and javascript: URIs
    const allElements = doc.body.querySelectorAll('*')
    allElements.forEach(el => {
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.startsWith('on') || attr.value.toLowerCase().startsWith('javascript:')) {
          el.removeAttribute(attr.name)
        }
      })
    })

    return doc.body.innerHTML
  } catch {
    return dirtyHtml
  }
}
