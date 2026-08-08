<script setup>
import SkeletonLoader from './SkeletonLoader.vue'

defineProps({
  isPlayStore: {
    type: Boolean,
    default: true
  }
})
</script>

<template>
  <div class="space-y-8 py-4">
    <!-- Top Back Navigation & Action Bar Skeleton -->
    <div class="flex items-center justify-between border-b border-[#f0f0f0] pb-4">
      <SkeletonLoader className="h-7 w-28 sm:w-36 rounded-full" />
      <div class="flex items-center gap-2">
        <SkeletonLoader className="h-7 w-20 rounded-full" />
        <SkeletonLoader className="h-7 w-24 rounded-full" />
      </div>
    </div>

    <!-- Asymmetric 8:4 Grid Layout Skeleton -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      
      <!-- LEFT TRACK SKELETON (8 Cols) -->
      <div class="lg:col-span-8 space-y-8">
        
        <!-- A) PLAY STORE STYLE APP / SCRIPT TEMPLATE SKELETON -->
        <template v-if="isPlayStore">
          <!-- Play Store Unified Hero Section Skeleton -->
          <div class="space-y-6 pb-8 border-b border-[#f0f0f0]">
            <!-- Title Skeleton (2 Lines) -->
            <div class="space-y-3">
              <SkeletonLoader className="h-8 sm:h-10 w-full rounded-lg" />
              <SkeletonLoader className="h-8 sm:h-10 w-3/4 rounded-lg" />
              
              <!-- ROW 2 Pill Badges Skeleton -->
              <div class="flex flex-wrap items-center gap-2 pt-1">
                <SkeletonLoader className="h-6 w-24 rounded-full" />
                <SkeletonLoader className="h-6 w-28 rounded-full" />
                <SkeletonLoader className="h-6 w-24 rounded-full" />
              </div>
            </div>

            <!-- Play Store Metrics Bar (Rating, Reviews, Downloads, File Size) Skeleton -->
            <SkeletonLoader className="w-full h-16 rounded-2xl" />

            <!-- Download CTA Button Skeleton -->
            <SkeletonLoader className="h-12 w-full sm:w-64 rounded-full" />
          </div>

          <!-- Cover Image Banner Skeleton -->
          <SkeletonLoader className="w-full h-64 sm:h-96 rounded-2xl" />

          <!-- Rich Text Paragraph Content Skeleton -->
          <div class="space-y-4">
            <SkeletonLoader className="h-6 w-48 rounded-md" />
            <SkeletonLoader className="h-4 w-full" />
            <SkeletonLoader className="h-4 w-full" />
            <SkeletonLoader className="h-4 w-5/6" />
          </div>

          <!-- Download Detail Section Card (#download-section) Skeleton -->
          <div class="relative p-4 sm:p-6 bg-[#f8fafc] rounded-xl border-2 border-[#2563eb]/40 space-y-5 overflow-hidden">
            <!-- Top Right Corner Badge Skeleton -->
            <div class="absolute top-0 right-0">
              <SkeletonLoader className="h-6 w-32 rounded-bl-lg" />
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start pt-3 sm:pt-2">
              <!-- Left Col: Poster 3:5 & Details Skeleton -->
              <div class="lg:col-span-7 flex flex-row items-start gap-3 sm:gap-5">
                <SkeletonLoader className="w-24 sm:w-36 aspect-[3/5] rounded-lg shrink-0" />
                <div class="flex-1 space-y-3">
                  <SkeletonLoader className="h-6 w-full rounded-md" />
                  <div class="border-b border-[#e2e8f0]"></div>
                  <div class="flex flex-wrap gap-1.5">
                    <SkeletonLoader className="h-5 w-16 rounded-full" />
                    <SkeletonLoader className="h-5 w-20 rounded-full" />
                    <SkeletonLoader className="h-5 w-14 rounded-full" />
                  </div>
                  <SkeletonLoader className="h-5 w-36 rounded-md" />
                </div>
              </div>

              <!-- Right Col: Link Download File Skeletons -->
              <div class="lg:col-span-5 space-y-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#e2e8f0]">
                <div class="flex items-center justify-between gap-2">
                  <SkeletonLoader className="h-4 w-28 rounded-md" />
                  <SkeletonLoader className="h-5 w-32 rounded-md" />
                </div>
                <div class="space-y-2.5 pt-1">
                  <SkeletonLoader className="h-6 w-full rounded-md" />
                  <SkeletonLoader className="h-6 w-4/5 rounded-md" />
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- B) STANDARD EDITORIAL POST TEMPLATE SKELETON -->
        <template v-else>
          <!-- Header Skeleton -->
          <div class="space-y-4 pb-6 border-b border-[#f0f0f0]">
            <SkeletonLoader className="h-5 w-28 rounded-full" />
            <SkeletonLoader className="h-9 w-full rounded-md" />
            <SkeletonLoader className="h-9 w-4/5 rounded-md" />
            <SkeletonLoader className="h-5 w-3/4 rounded-md" />

            <div class="flex items-center gap-3.5 pt-4 border-t border-[#f0f0f0]">
              <SkeletonLoader className="w-10 h-10 rounded-full shrink-0" />
              <div class="space-y-2 flex-1">
                <SkeletonLoader className="h-4 w-36 rounded-md" />
                <SkeletonLoader className="h-3 w-56 rounded-md" />
              </div>
            </div>
          </div>

          <!-- Main Thumbnail Skeleton -->
          <SkeletonLoader className="w-full h-72 sm:h-96 rounded-2xl" />

          <!-- Rich Text Paragraph Lines Skeleton -->
          <div class="space-y-4 max-w-[65ch]">
            <SkeletonLoader className="h-7 w-64 rounded-md" />
            <SkeletonLoader className="h-4 w-full" />
            <SkeletonLoader className="h-4 w-full" />
            <SkeletonLoader className="h-4 w-5/6" />

            <!-- Blockquote Skeleton -->
            <div class="border-l-2 border-[#2563eb] pl-6 py-4 bg-[#f8fafc]">
              <SkeletonLoader className="h-5 w-4/5" />
            </div>

            <SkeletonLoader className="h-7 w-56 pt-4 rounded-md" />
            <SkeletonLoader className="h-4 w-full" />
            <SkeletonLoader className="h-4 w-11/12" />

            <!-- Code Block Skeleton -->
            <SkeletonLoader className="h-48 w-full rounded-lg" />
          </div>
        </template>
      </div>

      <!-- RIGHT TRACK SKELETON (4 Cols Home-Parity Sidebar Widgets) -->
      <div class="lg:col-span-4 space-y-6">
        <!-- Ad Slot Skeleton -->
        <SkeletonLoader className="w-full h-48 rounded-2xl" />

        <!-- Most Read Articles Widget Skeleton -->
        <div class="p-5 bg-[#f8fafc] rounded-2xl space-y-4 border border-[#e2e8f0]">
          <SkeletonLoader className="h-5 w-36 rounded-md" />
          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <SkeletonLoader className="w-12 h-12 rounded-lg shrink-0" />
              <div class="space-y-1.5 flex-1">
                <SkeletonLoader className="h-4 w-full" />
                <SkeletonLoader className="h-3 w-20" />
              </div>
            </div>
            <div class="flex items-center gap-3">
              <SkeletonLoader className="w-12 h-12 rounded-lg shrink-0" />
              <div class="space-y-1.5 flex-1">
                <SkeletonLoader className="h-4 w-full" />
                <SkeletonLoader className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>

        <!-- Author Profile Widget Skeleton -->
        <div class="p-5 bg-[#f8fafc] rounded-2xl space-y-3 border border-[#e2e8f0]">
          <div class="flex items-center gap-3">
            <SkeletonLoader className="w-12 h-12 rounded-full shrink-0" />
            <div class="space-y-1 flex-1">
              <SkeletonLoader className="h-4 w-28" />
              <SkeletonLoader className="h-3 w-20" />
            </div>
          </div>
          <SkeletonLoader className="h-3 w-full" />
        </div>

        <!-- Topics Widget Skeleton -->
        <div class="p-5 bg-[#f8fafc] rounded-2xl space-y-3 border border-[#e2e8f0]">
          <SkeletonLoader className="h-5 w-28 rounded-md" />
          <div class="flex flex-wrap gap-2">
            <SkeletonLoader className="h-6 w-16 rounded-full" />
            <SkeletonLoader className="h-6 w-24 rounded-full" />
            <SkeletonLoader className="h-6 w-20 rounded-full" />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
