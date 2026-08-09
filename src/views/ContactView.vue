<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { siteSettings } from '../services/settingsStore.js'
import { setSeoMeta, getAbsoluteUrl } from '../services/seo.js'

// Target Email (Dynamic from siteSettings with fallback)
const contactEmail = computed(() => siteSettings.contactEmail || 'rizal@scriptmlbb.com')

// Form Fields State
const name = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')

// Submission Status State
const isSubmitting = ref(false)
const isSuccess = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const isCopied = ref(false)

const handleSubmit = async () => {
  const trimmedName = name.value.trim()
  const trimmedEmail = email.value.trim()
  const trimmedSubject = subject.value.trim()
  const trimmedMessage = message.value.trim()

  if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
    errorMessage.value = 'Silakan lengkapi seluruh kolom formulir di bawah ini.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  successMessage.value = ''
  isSuccess.value = false

  try {
    const targetUrl = `https://formsubmit.co/ajax/${contactEmail.value}`
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: trimmedName,
        email: trimmedEmail,
        _subject: `[Kontak Script MLBB] ${trimmedSubject}`,
        message: trimmedMessage
      })
    })

    const json = await response.json()

    if (response.ok && (json.success === 'true' || json.success === true || response.status === 200)) {
      isSuccess.value = true
      successMessage.value = `Pesan Anda telah berhasil terkirim ke target email (${contactEmail.value}). Terima kasih!`
      name.value = ''
      email.value = ''
      subject.value = ''
      message.value = ''
    } else {
      throw new Error(json.message || 'Gagal mengirimkan pesan via FormSubmit.')
    }
  } catch (err) {
    console.error('FormSubmit Error:', err)
    errorMessage.value = `Pengiriman otomatis mengalami kendala jaringan. Anda dapat mengirimkan email secara manual ke: ${contactEmail.value}`
  } finally {
    isSubmitting.value = false
  }
}

const copyEmail = () => {
  navigator.clipboard?.writeText?.(contactEmail.value)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2500)
}

onMounted(() => {
  const pageUrl = '/contact'
  const absUrl = getAbsoluteUrl(pageUrl)

  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ContactPage',
        '@id': `${absUrl}#webpage`,
        'url': absUrl,
        'name': 'Hubungi Kami - Script MLBB',
        'description': `Hubungi tim kami melalui formulir kontak atau kirimkan email langsung ke ${contactEmail.value}.`,
        'publisher': {
          '@type': 'Organization',
          'name': siteSettings.brandLogoText || 'Script MLBB',
          'url': getAbsoluteUrl('/')
        }
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${absUrl}#breadcrumb`,
        'itemListElement': [
          {
            '@type': 'ListItem',
            'position': 1,
            'name': 'Beranda',
            'item': getAbsoluteUrl('/')
          },
          {
            '@type': 'ListItem',
            'position': 2,
            'name': 'Hubungi Kami',
            'item': absUrl
          }
        ]
      }
    ]
  }

  setSeoMeta({
    title: 'Hubungi Kami - Script MLBB',
    description: `Hubungi tim kami melalui formulir kontak atau kirimkan email langsung ke ${contactEmail.value}.`,
    url: pageUrl,
    type: 'website',
    jsonLdSchema
  })
})
</script>

<template>
  <div class="max-w-4xl mx-auto py-6 space-y-8">
    
    <!-- Hero Header -->
    <header class="space-y-4 text-center max-w-2xl mx-auto pb-6 border-b border-[#f0f0f0]">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[#2563eb]/10 text-[#2563eb] font-mono-eyebrow">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span>HUBUNGI KAMI</span>
      </div>

      <h1 class="text-3xl sm:text-4xl font-extrabold text-[#171717] tracking-tight">
        Layanan Bantuan & Kontak
      </h1>

      <p class="text-xs sm:text-sm text-[#707070] leading-relaxed">
        Punya pertanyaan, masukan, kritik, penawaran kerjasama sponsor, atau masalah teknis? Silakan kirimkan pesan Anda melalui formulir di bawah ini atau hubungi email kami secara langsung.
      </p>
    </header>

    <!-- 2-Column Asymmetric Grid Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

      <!-- Form Contact Column (7 Columns) -->
      <main class="lg:col-span-7 bg-white border border-[#e4e4e7] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
        
        <div class="space-y-1">
          <h2 class="text-lg font-bold text-[#171717]">Kirimkan Pesan</h2>
          <p class="text-xs text-[#707070]">Pesan Anda akan diteruskan secara instan ke email pengelola.</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          
          <!-- Name Input -->
          <div class="space-y-1.5">
            <label for="name" class="block text-xs font-bold text-[#171717] font-mono uppercase tracking-wider">
              Nama Lengkap *
            </label>
            <input
              id="name"
              v-model="name"
              type="text"
              placeholder="Masukkan nama lengkap Anda"
              required
              class="w-full px-4 py-3 text-xs sm:text-sm bg-[#f4f4f5] border border-transparent rounded-xl text-[#171717] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
            />
          </div>

          <!-- Email Input -->
          <div class="space-y-1.5">
            <label for="email" class="block text-xs font-bold text-[#171717] font-mono uppercase tracking-wider">
              Alamat Email Anda *
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="nama@email.com"
              required
              class="w-full px-4 py-3 text-xs sm:text-sm bg-[#f4f4f5] border border-transparent rounded-xl text-[#171717] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
            />
          </div>

          <!-- Subject Input -->
          <div class="space-y-1.5">
            <label for="subject" class="block text-xs font-bold text-[#171717] font-mono uppercase tracking-wider">
              Subjek Pesan *
            </label>
            <input
              id="subject"
              v-model="subject"
              type="text"
              placeholder="Contoh: Kerjasama Sponsor / Pertanyaan Teknis"
              required
              class="w-full px-4 py-3 text-xs sm:text-sm bg-[#f4f4f5] border border-transparent rounded-xl text-[#171717] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all"
            />
          </div>

          <!-- Message Textarea -->
          <div class="space-y-1.5">
            <label for="message" class="block text-xs font-bold text-[#171717] font-mono uppercase tracking-wider">
              Isi Pesan Anda *
            </label>
            <textarea
              id="message"
              v-model="message"
              rows="5"
              placeholder="Tuliskan pesan, pertanyaan, atau detail kendala Anda secara lengkap di sini..."
              required
              class="w-full px-4 py-3 text-xs sm:text-sm bg-[#f4f4f5] border border-transparent rounded-xl text-[#171717] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all resize-none"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full stitch-button-primary py-3.5 px-6 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-60 transition-all"
          >
            <svg v-if="isSubmitting" class="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <svg v-else class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span>{{ isSubmitting ? 'Mengirimkan Pesan...' : 'Kirim Pesan Sekarang' }}</span>
          </button>

        </form>

        <!-- Feedback Banners -->
        <transition name="fade">
          <div v-if="isSuccess" class="p-4 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs sm:text-sm space-y-1">
            <div class="font-bold flex items-center gap-1.5">
              <span>✓ Pesan Terkirim!</span>
            </div>
            <p>{{ successMessage }}</p>
          </div>

          <div v-else-if="errorMessage" class="p-4 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 text-xs sm:text-sm space-y-2">
            <div class="font-bold flex items-center gap-1.5 text-rose-700">
              <span>⚠️ Terjadi Kendala Pengiriman</span>
            </div>
            <p>{{ errorMessage }}</p>
            <div class="pt-1">
              <a
                :href="`mailto:${contactEmail}?subject=${encodeURIComponent(subject || 'Kontak Manual')}&body=${encodeURIComponent(message || '')}`"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <span>Buka Aplikasi Email Manual (mailto:)</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </transition>

      </main>

      <!-- Sidebar Information Column (5 Columns) -->
      <aside class="lg:col-span-5 space-y-6">

        <!-- Direct Email Card -->
        <div class="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-6 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <span class="text-[10px] font-mono text-[#707070] uppercase tracking-wider block">EMAIL RESMI</span>
              <h3 class="font-bold text-[#171717] text-sm sm:text-base break-all font-mono">
                {{ contactEmail }}
              </h3>
            </div>
          </div>

          <p class="text-xs text-[#707070] leading-relaxed">
            Anda dapat menghubungi kami kapan saja melalui alamat email resmi di atas apabila formulir pengiriman otomatis mengalami kendala.
          </p>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-[#e2e8f0]">
            <button
              @click="copyEmail"
              class="stitch-button-secondary py-2 px-3 text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <svg class="w-3.5 h-3.5 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>{{ isCopied ? 'Email Disalin!' : 'Salin Email' }}</span>
            </button>

            <a
              :href="`mailto:${contactEmail}`"
              class="px-3 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-full text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors text-center"
            >
              <span>Kirim Email Langsung</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        <!-- Response Time Guarantee Card -->
        <div class="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-[#171717] uppercase tracking-wider font-mono">
            <svg class="w-4 h-4 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>WAKTU BALASAN ESTIMASI</span>
          </div>
          <p class="text-xs text-[#707070] leading-relaxed">
            Tim kami berusaha membalas seluruh pesan email yang masuk dalam waktu <strong>kurang dari 24 jam</strong> pada hari kerja (Senin - Jumat).
          </p>
        </div>

        <!-- Social Media Quick Links -->
        <div class="bg-white border border-[#e4e4e7] rounded-2xl p-6 space-y-3 text-xs">
          <span class="font-mono-eyebrow text-[#2563eb]">MEDIA SOSIAL RESMI</span>
          <div class="flex flex-col gap-2 pt-1">
            <a
              :href="siteSettings.authorInstagramUrl || 'https://instagram.com'"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center justify-between p-2.5 rounded-xl bg-[#f4f4f5] hover:bg-[#e4e4e7] text-[#171717] font-semibold transition-colors"
            >
              <span class="flex items-center gap-2">
                <span>📸</span>
                <span>Instagram Penulis</span>
              </span>
              <span>↗</span>
            </a>
          </div>
        </div>

      </aside>

    </div>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
