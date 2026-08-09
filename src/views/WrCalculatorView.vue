<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { setSeoMeta, getAbsoluteUrl } from '../services/seo.js'
import { siteSettings } from '../services/settingsStore.js'

// Form State
const tMatch = ref('')
const tWr = ref('')
const wrReq = ref('')
const isCalculated = ref(false)
const isCopied = ref(false)

// Quick Preset Options for Target WR
const presetWrList = [55, 60, 65, 70, 75, 80, 85, 90]

const setTargetWrPreset = (val) => {
  wrReq.value = val
  if (tMatch.value && tWr.value) {
    calculateWr()
  }
}

// Results State
const resultData = ref(null)

const calculateWr = () => {
  const matches = parseFloat(tMatch.value)
  const currentWrVal = parseFloat(tWr.value)
  const targetWrVal = parseFloat(wrReq.value)

  if (isNaN(matches) || isNaN(currentWrVal) || isNaN(targetWrVal) || matches <= 0) {
    resultData.value = {
      type: 'error',
      message: 'Mohon masukkan angka yang valid pada seluruh kolom input.'
    }
    isCalculated.value = true
    return
  }

  if (currentWrVal < 0 || currentWrVal > 100 || targetWrVal < 0 || targetWrVal > 100) {
    resultData.value = {
      type: 'error',
      message: 'Nilai Win Rate harus di antara 0% hingga 100%.'
    }
    isCalculated.value = true
    return
  }

  if (currentWrVal >= targetWrVal) {
    resultData.value = {
      type: 'error',
      message: 'Target Win Rate Anda harus lebih besar daripada Win Rate Anda saat ini.'
    }
    isCalculated.value = true
    return
  }

  if (targetWrVal >= 100) {
    resultData.value = {
      type: 'error',
      message: 'Secara matematis, tidak mungkin mencapai Win Rate 100% jika sudah pernah mengalami kekalahan.'
    }
    isCalculated.value = true
    return
  }

  // Formula: (TargetWR * Matches - CurrentWR * Matches) / (100 - TargetWR)
  const currentWins = (currentWrVal / 100) * matches
  const winsNeeded = Math.ceil(((targetWrVal * matches) - (100 * currentWins)) / (100 - targetWrVal))

  if (winsNeeded <= 0 || !isFinite(winsNeeded)) {
    resultData.value = {
      type: 'error',
      message: 'Terjadi kesalahan perhitungan. Silakan periksa kembali angka input Anda.'
    }
  } else {
    resultData.value = {
      type: 'success',
      winsNeeded,
      targetWr: targetWrVal,
      initialMatches: matches,
      initialWr: currentWrVal
    }
  }

  isCalculated.value = true
}

const resetForm = () => {
  tMatch.value = ''
  tWr.value = ''
  wrReq.value = ''
  isCalculated.value = false
  resultData.value = null
}

const copyResultText = () => {
  if (!resultData.value || resultData.value.type !== 'success') return
  const text = `🎮 KALKULATOR WR MLBB 🎮\n• Match Saat Ini: ${resultData.value.initialMatches}\n• WR Saat Ini: ${resultData.value.initialWr}%\n• Target WR: ${resultData.value.targetWr}%\n• Butuh Win Streak: ${resultData.value.winsNeeded} Kemenangan Tanpa Kalah!\n\nHitung WR kamu di: ${window.location.href}`
  navigator.clipboard?.writeText?.(text)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2500)
}

onMounted(() => {
  const pageUrl = '/hitung-wr'
  const absUrl = getAbsoluteUrl(pageUrl)

  const jsonLdSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${absUrl}#webapp`,
        'name': 'Kalkulator Win Rate Mobile Legends (MLBB)',
        'url': absUrl,
        'description': 'Kalkulator WR MLBB otomatis untuk menghitung jumlah win streak kemenangan tanpa kalah yang dibutuhkan untuk mencapai target Win Rate Mobile Legends.',
        'applicationCategory': 'GameApplication',
        'operatingSystem': 'All',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'IDR'
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
            'name': 'Kalkulator WR MLBB',
            'item': absUrl
          }
        ]
      }
    ]
  }

  setSeoMeta({
    title: 'Kalkulator Win Rate Mobile Legends (MLBB) - Hitung WR',
    description: 'Hitung berapa jumlah kemenangan tanpa kalah (Win Streak) yang dibutuhkan untuk mencapai target Win Rate (WR) Mobile Legends kamu.',
    url: pageUrl,
    type: 'website',
    jsonLdSchema
  })
})
</script>

<template>
  <div class="max-w-2xl mx-auto py-4 sm:py-8 px-2 sm:px-4 space-y-6 sm:space-y-8">
    
    <!-- Header Section with Responsive Mobile Layout -->
    <header class="text-center space-y-3 pb-4 sm:pb-6 border-b border-[#f0f0f0]">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#2563eb]/10 text-[#2563eb]">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-3-2.25V18m-3-2.25V18m9-6V18M3 4.5h18a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 01-1.5-1.5zM6 7.5h12v3H6v-3z" />
        </svg>
        <span class="font-mono tracking-wide uppercase">KALKULATOR WIN RATE MLBB</span>
      </div>

      <h1 class="text-2xl sm:text-4xl font-extrabold text-[#171717] tracking-tight leading-tight">
        Hitung Win Rate Mobile Legends
      </h1>

      <blockquote class="text-sm sm:text-sm text-[#707070] leading-relaxed italic bg-[#f8fafc] p-3.5 sm:p-4 rounded-xl border-l-4 border-[#2563eb] text-left">
        "Kalkulator ini memungkinkan kamu untuk menghitung WR (Win Rate) Mobile Legend. Cukup masukkan total pertandingan yang sudah kamu jalani, winrate sejauh ini, dan Jumlah Winrate yang kamu mau di kolom yang disediakan."
      </blockquote>
    </header>

    <!-- Main Calculator Card Optimized for Mobile -->
    <div class="bg-white border border-[#e4e4e7] rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-5 shadow-xs">
      <form @submit.prevent="calculateWr" class="space-y-4 sm:space-y-5">
        
        <!-- Input 1: Total Match -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label for="tMatch" class="text-sm font-bold text-[#171717] uppercase tracking-wider font-mono">
              1. Total Match Kamu
            </label>
            <span class="text-[10px] text-[#707070] font-mono">Pertandingan</span>
          </div>
          <div class="relative">
            <input
              id="tMatch"
              v-model="tMatch"
              type="number"
              min="1"
              placeholder="Contoh: 132"
              required
              class="w-full pl-4 pr-16 py-3 text-sm bg-[#f4f4f5] border border-transparent rounded-xl text-[#171717] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all font-mono"
            />
            <span class="absolute right-3 top-2.5 px-2 py-0.5 rounded bg-[#e4e4e7] text-[10px] font-mono text-[#52525b]">Match</span>
          </div>
        </div>

        <!-- Input 2: Current WR -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label for="tWr" class="text-sm font-bold text-[#171717] uppercase tracking-wider font-mono">
              2. Total WR Kamu Saat Ini (%)
            </label>
            <span class="text-[10px] text-[#707070] font-mono">Persentase</span>
          </div>
          <div class="relative">
            <input
              id="tWr"
              v-model="tWr"
              type="number"
              step="any"
              min="0"
              max="100"
              placeholder="Contoh: 62.5"
              required
              class="w-full pl-4 pr-16 py-3 text-sm bg-[#f4f4f5] border border-transparent rounded-xl text-[#171717] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all font-mono"
            />
            <span class="absolute right-3 top-2.5 px-2 py-0.5 rounded bg-[#e4e4e7] text-[10px] font-mono text-[#52525b]">% WR</span>
          </div>
        </div>

        <!-- Input 3: Target WR & Quick Presets -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <label for="wrReq" class="text-sm font-bold text-[#171717] uppercase tracking-wider font-mono">
              3. Target WR Yang Kamu Inginkan (%)
            </label>
            <span class="text-[10px] text-[#2563eb] font-semibold font-mono">Target</span>
          </div>
          <div class="relative">
            <input
              id="wrReq"
              v-model="wrReq"
              type="number"
              step="any"
              min="0"
              max="100"
              placeholder="Contoh: 70"
              required
              class="w-full pl-4 pr-20 py-3 text-sm bg-[#f4f4f5] border border-transparent rounded-xl text-[#171717] placeholder-[#a1a1aa] focus:outline-none focus:border-[#2563eb] focus:bg-white transition-all font-mono"
            />
            <span class="absolute right-3 top-2.5 px-2 py-0.5 rounded bg-[#2563eb]/10 text-[10px] font-mono text-[#2563eb] font-bold">% Target</span>
          </div>

          <!-- Quick Preset Target WR Buttons for Easy Mobile Tapping -->
          <div class="pt-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span class="text-[10px] text-[#707070] font-mono shrink-0">Pilih Cepat:</span>
            <button
              v-for="preset in presetWrList"
              :key="preset"
              type="button"
              @click="setTargetWrPreset(preset)"
              class="px-2.5 py-1 rounded-full text-[11px] font-mono transition-colors shrink-0 cursor-pointer border"
              :class="Number(wrReq) === preset ? 'bg-[#2563eb] text-white border-[#2563eb] font-bold' : 'bg-[#f4f4f5] text-[#52525b] border-transparent hover:bg-[#e4e4e7]'"
            >
              {{ preset }}%
            </button>
          </div>
        </div>

        <!-- Submit & Reset Action Buttons -->
        <div class="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            type="submit"
            class="w-full sm:flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-[0.98] text-white py-3.5 px-6 rounded-xl text-sm font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-[#2563eb]/20"
          >
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 15.75V18m-3-2.25V18m-3-2.25V18m9-6V18M3 4.5h18a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H3a1.5 1.5 0 01-1.5-1.5V6a1.5 1.5 0 01-1.5-1.5zM6 7.5h12v3H6v-3z" />
            </svg>
            <span>Hitung Hasil WR</span>
          </button>

          <button
            type="button"
            @click="resetForm"
            class="w-full sm:w-auto px-5 py-3 bg-[#f4f4f5] hover:bg-[#e4e4e7] active:bg-[#d4d4d8] text-[#171717] text-sm font-semibold rounded-xl transition-colors cursor-pointer text-center"
          >
            Reset Form
          </button>
        </div>

      </form>

      <!-- Output Result Hero Card -->
      <transition name="fade">
        <div v-if="isCalculated && resultData" class="pt-4 border-t border-[#f0f0f0]">
          
          <!-- Success Result Box -->
          <div v-if="resultData.type === 'success'" class="space-y-4 bg-gradient-to-br from-[#2563eb]/10 via-[#2563eb]/5 to-transparent border border-[#2563eb]/25 rounded-2xl p-4 sm:p-6 shadow-xs">
            
            <div class="flex items-center justify-between gap-2">
              <span class="font-mono-eyebrow text-[#2563eb] text-[10px] sm:text-[11px] tracking-wider uppercase">HASIL KALKULASI WIN RATE</span>
              <button
                @click="copyResultText"
                class="stitch-button-secondary px-3 py-1 text-[11px] font-mono inline-flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform"
              >
                <svg class="w-3.5 h-3.5 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>{{ isCopied ? 'Tersalin!' : 'Salin Hasil' }}</span>
              </button>
            </div>

            <!-- Big Metric Hero Showcase -->
            <div class="bg-white border border-[#2563eb]/20 rounded-xl p-4 sm:p-5 text-center space-y-1 shadow-xs">
              <div class="text-3xl sm:text-5xl font-black text-[#2563eb] font-mono tracking-tight">
                {{ resultData.winsNeeded }}
              </div>
              <div class="text-sm sm:text-sm font-extrabold text-[#171717]">
                Kemenangan Beruntun (Win Streak) Tanpa Kalah
              </div>
              <p class="text-[11px] sm:text-sm text-[#707070] pt-1">
                Dibutuhkan untuk menaikkan WR dari <strong class="text-[#171717] font-mono">{{ resultData.initialWr }}%</strong> ke <strong class="text-[#2563eb] font-mono">{{ resultData.targetWr }}%</strong>
              </p>
            </div>

            <!-- Stat Breakdown Pills -->
            <div class="grid grid-cols-3 gap-1.5 sm:gap-3 text-center">
              <div class="bg-white p-2.5 rounded-xl border border-[#e4e4e7]">
                <div class="text-[9px] sm:text-[10px] font-mono text-[#707070] uppercase">Match Awal</div>
                <div class="text-sm sm:text-sm font-bold text-[#171717] font-mono">{{ resultData.initialMatches }}</div>
              </div>
              <div class="bg-white p-2.5 rounded-xl border border-[#e4e4e7]">
                <div class="text-[9px] sm:text-[10px] font-mono text-[#707070] uppercase">Target WR</div>
                <div class="text-sm sm:text-sm font-bold text-[#2563eb] font-mono">{{ resultData.targetWr }}%</div>
              </div>
              <div class="bg-white p-2.5 rounded-xl border border-[#e4e4e7]">
                <div class="text-[9px] sm:text-[10px] font-mono text-[#707070] uppercase">Total Match</div>
                <div class="text-sm sm:text-sm font-bold text-[#171717] font-mono">{{ resultData.finalMatches }}</div>
              </div>
            </div>

          </div>

          <!-- Warning & Info States -->
          <div
            v-else
            class="p-4 rounded-xl text-sm sm:text-sm leading-relaxed"
            :class="{
              'bg-amber-50 text-amber-900 border border-amber-200': resultData.type === 'warning' || resultData.type === 'info',
              'bg-rose-50 text-rose-900 border border-rose-200': resultData.type === 'error'
            }"
          >
            <div class="flex items-center gap-2 font-bold mb-1">
              <svg v-if="resultData.type === 'error'" class="w-4 h-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <svg v-else class="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ resultData.type === 'error' ? 'Peringatan Input' : 'Informasi Kalkulasi' }}</span>
            </div>
            <p>{{ resultData.message }}</p>
          </div>

        </div>
      </transition>

    </div>

    <!-- Tips & Information Section -->
    <div class="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 sm:p-6 space-y-3 text-sm text-[#707070] leading-relaxed">
      <h4 class="font-bold text-[#171717] text-sm sm:text-sm flex items-center gap-2">
        <svg class="w-4 h-4 text-[#2563eb] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <span>Tips Menaikkan Win Rate MLBB</span>
      </h4>
      <ul class="space-y-1.5 pl-1">
        <li class="flex items-start gap-2">
          <span class="text-[#2563eb] font-bold">•</span>
          <span><strong>Bermain dengan Mabar (Party/Fullteam)</strong>: Menghindari bertemu pemain <i>solo queue</i> acak yang tidak komunikatif.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-[#2563eb] font-bold">•</span>
          <span><strong>Kuasai Hero Meta</strong>: Gunakan hero yang sedang mendapat <i>buff</i> pada patch Mobile Legends terbaru.</span>
        </li>
        <li class="flex items-start gap-2">
          <span class="text-[#2563eb] font-bold">•</span>
          <span><strong>Fokus Objective</strong>: Utamakan kehancuran Turret dan amankan Lord untuk menang lebih cepat.</span>
        </li>
      </ul>
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

/* Hide horizontal scrollbar for preset buttons */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
