<script setup>
import SkeletonLoader from './SkeletonLoader.vue'
</script>

<template>
  <div class="space-y-8 py-4">
    <!-- Navigation Bar Skeleton -->
    <div class="flex items-center justify-between border-b border-[#dfdfdf] pb-4">
      <SkeletonLoader className="h-4 w-28" />
      <div class="flex items-center gap-2">
        <SkeletonLoader className="h-8 w-20 rounded-[6px]" />
        <SkeletonLoader className="h-8 w-8 rounded-[6px]" />
      </div>
    </div>

    <!-- Asymmetric 8:4 Grid Skeleton -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
      
      <!-- Left Track Skeleton (8 Cols) -->
      <div class="lg:col-span-8 space-y-8">
        <!-- Header Skeleton -->
        <div class="space-y-4">
          <SkeletonLoader className="h-4 w-28 rounded-full" />
          <SkeletonLoader className="h-10 w-full" />
          <SkeletonLoader className="h-10 w-4/5" />
          <SkeletonLoader className="h-5 w-3/4" />

          <div class="flex items-center gap-3.5 pt-4 border-t border-[#dfdfdf]">
            <SkeletonLoader className="w-11 h-11 rounded-full" />
            <div class="space-y-2 flex-1">
              <SkeletonLoader className="h-4 w-36" />
              <SkeletonLoader className="h-3 w-56" />
            </div>
          </div>
        </div>

        <!-- 8-Col Main Thumbnail Skeleton -->
        <SkeletonLoader className="w-full h-72 sm:h-96 rounded-[12px]" />

        <!-- Rich Text Paragraph Lines Skeleton -->
        <div class="space-y-4 max-w-[65ch]">
          <SkeletonLoader className="h-7 w-64" />
          <SkeletonLoader className="h-4 w-full" />
          <SkeletonLoader className="h-4 w-full" />
          <SkeletonLoader className="h-4 w-5/6" />

          <!-- Blockquote Skeleton -->
          <div class="border-l-2 border-[#3ecf8e] pl-6 py-4 bg-[#fafafa]">
            <SkeletonLoader className="h-5 w-4/5" />
          </div>

          <SkeletonLoader className="h-7 w-56 pt-4" />
          <SkeletonLoader className="h-4 w-full" />
          <SkeletonLoader className="h-4 w-11/12" />

          <!-- Code Block Skeleton -->
          <SkeletonLoader className="h-48 w-full rounded-[6px]" />
        </div>
      </div>

      <!-- Right Track Skeleton (4 Cols Sidebar Widgets) -->
      <div class="lg:col-span-4 space-y-6">
        <!-- Profile Gadget Skeleton -->
        <div class="stitch-card p-6 space-y-4">
          <div class="flex items-center gap-3.5">
            <SkeletonLoader className="w-14 h-14 rounded-full" />
            <div class="space-y-2 flex-1">
              <SkeletonLoader className="h-4 w-28" />
              <SkeletonLoader className="h-3 w-36" />
            </div>
          </div>
          <SkeletonLoader className="h-3 w-full" />
          <SkeletonLoader className="h-3 w-4/5" />
        </div>

        <!-- TOC Gadget Skeleton -->
        <div class="stitch-card p-6 space-y-3">
          <SkeletonLoader className="h-4 w-36" />
          <SkeletonLoader className="h-6 w-full rounded-[6px]" />
          <SkeletonLoader className="h-6 w-full rounded-[6px]" />
          <SkeletonLoader className="h-6 w-full rounded-[6px]" />
        </div>
      </div>

    </div>
  </div>
</template>
