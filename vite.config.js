import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import http from 'node:http'

function seoFilesPlugin() {
  return {
    name: 'vite-plugin-seo-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/robots.txt' || req.url === '/ads.txt' || req.url === '/sitemap.xml' || req.url === '/rss.xml' || req.url === '/feed') {
          // Proxy to Backend Laravel server
          const targetUrl = `http://127.0.0.1:8000${req.url}`
          http.get(targetUrl, (backendRes) => {
            res.writeHead(backendRes.statusCode || 200, backendRes.headers)
            backendRes.pipe(res)
          }).on('error', () => {
            res.writeHead(500, { 'Content-Type': 'text/plain' })
            res.end('Error proxying SEO file request')
          })
          return
        }
        next()
      })
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    seoFilesPlugin()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    modulePreload: {
      polyfill: false
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router')) {
            return 'vendor-vue'
          }
        }
      }
    }
  }
})
