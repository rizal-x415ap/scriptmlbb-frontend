<script setup>
import SkeletonLoader from './SkeletonLoader.vue'
</script>

<template>
  <div class="bg-white rounded-[16px] p-6 shadow-xs border-0 flex flex-col sm:flex-row gap-6">
    <!-- Thumbnail Skeleton (1:1 Ratio) -->
    <SkeletonLoader className="w-20 sm:w-28 aspect-square shrink-0 rounded-[12px]" />

    <!-- Details Skeleton -->
    <div class="flex flex-col justify-between flex-1 space-y-4">
      <div class="space-y-3">
        <SkeletonLoader className="h-3.5 w-24 rounded-full" />
        <SkeletonLoader className="h-6 w-5/6" />
        <SkeletonLoader className="h-4 w-full" />
        <SkeletonLoader className="h-4 w-3/4" />
      </div>

      <!-- Author Footer Skeleton -->
      <div class="flex items-center justify-between pt-3 border-t border-[#dfdfdf]">
        <div class="flex items-center gap-3">
          <SkeletonLoader className="w-6 h-6 rounded-full" />
          <SkeletonLoader className="h-3 w-32" />
        </div>
        <SkeletonLoader className="h-6 w-16 rounded-[6px]" />
      </div>
    </div>
  </div>
</template>
