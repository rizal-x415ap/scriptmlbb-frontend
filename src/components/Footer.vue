<script setup>
import { RouterLink } from 'vue-router'
import { siteSettings } from '../services/settingsStore.js'

const currentYear = new Date().getFullYear()

const isExternalLink = (url) => {
  if (!url) return false
  return /^https?:\/\//i.test(url) || url.startsWith('//')
}
</script>

<template>
  <footer v-if="siteSettings.showFooter" class="mt-20 border-t border-[#f0f0f0] bg-white text-[#707070] py-14">
    <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[#f0f0f0]">
        
        <!-- Brand Info & Motto Column -->
        <div class="md:col-span-2 space-y-4">
          <div class="flex items-center gap-2.5">
            <img
              v-if="siteSettings.brandLogoUrl"
              :src="siteSettings.brandLogoUrl"
              :alt="siteSettings.brandLogoText || 'Logo'"
              class="w-7 h-7 rounded-[6px] object-contain shrink-0"
            />
            <div
              v-else
              class="w-7 h-7 rounded-[6px] bg-[#2563eb] flex items-center justify-center text-white font-bold text-sm"
            >
              {{ (siteSettings.brandLogoText || 'S').charAt(0).toUpperCase() }}
            </div>
            <span class="font-semibold text-lg text-[#171717]">{{ siteSettings.brandLogoText || 'Script MLBB' }}</span>
          </div>
          
          <p class="text-sm sm:text-base leading-relaxed text-[#707070] max-w-sm">
            {{ siteSettings.footerBio || 'An editorial tech publication dedicated to high-performance web architecture, developer tooling, design systems, and software craftsmanship.' }}
          </p>

          <div v-if="siteSettings.footerTagline" class="font-mono-eyebrow text-[#b2b2b2] text-xs sm:text-sm">
            {{ siteSettings.footerTagline }}
          </div>
        </div>

        <!-- Column 2 Links -->
        <div class="space-y-3">
          <h4 class="text-sm sm:text-sm font-bold text-[#171717] tracking-wider uppercase font-mono">{{ siteSettings.footerCol2Title || 'Categories' }}</h4>
          <ul class="space-y-2.5 text-sm sm:text-base font-medium">
            <li v-if="siteSettings.footerCol2Link1Text">
              <a
                v-if="isExternalLink(siteSettings.footerCol2Link1Url)"
                :href="siteSettings.footerCol2Link1Url"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol2Link1Text }}
              </a>
              <RouterLink
                v-else
                :to="siteSettings.footerCol2Link1Url || '#'"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol2Link1Text }}
              </RouterLink>
            </li>

            <li v-if="siteSettings.footerCol2Link2Text">
              <a
                v-if="isExternalLink(siteSettings.footerCol2Link2Url)"
                :href="siteSettings.footerCol2Link2Url"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol2Link2Text }}
              </a>
              <RouterLink
                v-else
                :to="siteSettings.footerCol2Link2Url || '#'"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol2Link2Text }}
              </RouterLink>
            </li>

            <li v-if="siteSettings.footerCol2Link3Text">
              <a
                v-if="isExternalLink(siteSettings.footerCol2Link3Url)"
                :href="siteSettings.footerCol2Link3Url"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol2Link3Text }}
              </a>
              <RouterLink
                v-else
                :to="siteSettings.footerCol2Link3Url || '#'"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol2Link3Text }}
              </RouterLink>
            </li>

            <li v-if="siteSettings.footerCol2Link4Text">
              <a
                v-if="isExternalLink(siteSettings.footerCol2Link4Url)"
                :href="siteSettings.footerCol2Link4Url"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol2Link4Text }}
              </a>
              <RouterLink
                v-else
                :to="siteSettings.footerCol2Link4Url || '#'"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol2Link4Text }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Column 3 Links -->
        <div class="space-y-3">
          <h4 class="text-sm sm:text-sm font-bold text-[#171717] tracking-wider uppercase font-mono">{{ siteSettings.footerCol3Title || 'Resources' }}</h4>
          <ul class="space-y-2.5 text-sm sm:text-base font-medium">
            <li v-if="siteSettings.footerCol3Link1Text">
              <a
                v-if="isExternalLink(siteSettings.footerCol3Link1Url)"
                :href="siteSettings.footerCol3Link1Url"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol3Link1Text }}
              </a>
              <RouterLink
                v-else
                :to="siteSettings.footerCol3Link1Url || '#'"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol3Link1Text }}
              </RouterLink>
            </li>

            <li v-if="siteSettings.footerCol3Link2Text">
              <a
                v-if="isExternalLink(siteSettings.footerCol3Link2Url)"
                :href="siteSettings.footerCol3Link2Url"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol3Link2Text }}
              </a>
              <RouterLink
                v-else
                :to="siteSettings.footerCol3Link2Url || '#'"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol3Link2Text }}
              </RouterLink>
            </li>

            <li v-if="siteSettings.footerCol3Link3Text">
              <a
                v-if="isExternalLink(siteSettings.footerCol3Link3Url)"
                :href="siteSettings.footerCol3Link3Url"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol3Link3Text }}
              </a>
              <RouterLink
                v-else
                :to="siteSettings.footerCol3Link3Url || '#'"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol3Link3Text }}
              </RouterLink>
            </li>

            <li v-if="siteSettings.footerCol3Link4Text">
              <a
                v-if="isExternalLink(siteSettings.footerCol3Link4Url)"
                :href="siteSettings.footerCol3Link4Url"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol3Link4Text }}
              </a>
              <RouterLink
                v-else
                :to="siteSettings.footerCol3Link4Url || '#'"
                class="hover:text-[#2563eb] transition-colors"
              >
                {{ siteSettings.footerCol3Link4Text }}
              </RouterLink>
            </li>
          </ul>
        </div>
      </div>

      <div class="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-[#888888]">
        <p>{{ siteSettings.footerCopyright || `© ${currentYear} Supabaze Editorial. All rights reserved.` }}</p>
        <div class="flex flex-wrap items-center gap-4 sm:gap-6">
          <a
            v-if="siteSettings.socialLink1Text || siteSettings.twitterUrl"
            :href="siteSettings.socialLink1Url || siteSettings.twitterUrl || '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-[#171717] transition-colors"
          >
            {{ siteSettings.socialLink1Text || 'Twitter / X' }}
          </a>

          <a
            v-if="siteSettings.socialLink2Text || siteSettings.githubUrl"
            :href="siteSettings.socialLink2Url || siteSettings.githubUrl || '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-[#171717] transition-colors"
          >
            {{ siteSettings.socialLink2Text || 'GitHub' }}
          </a>

          <a
            v-if="siteSettings.socialLink3Text || siteSettings.linkedinUrl"
            :href="siteSettings.socialLink3Url || siteSettings.linkedinUrl || '#'"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-[#171717] transition-colors"
          >
            {{ siteSettings.socialLink3Text || 'LinkedIn' }}
          </a>

          <a
            v-if="siteSettings.socialLink4Text && siteSettings.socialLink4Url"
            :href="siteSettings.socialLink4Url"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-[#171717] transition-colors"
          >
            {{ siteSettings.socialLink4Text }}
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>
