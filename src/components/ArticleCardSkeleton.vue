<script setup>
import SkeletonLoader from './SkeletonLoader.vue'
</script>

<template>
  <div class="py-5 border-b border-[#f0f0f0] flex flex-row items-center justify-between gap-4 sm:gap-6">
    <!-- Details Skeleton -->
    <div class="flex flex-col justify-between flex-1 space-y-3">
      <SkeletonLoader className="h-3 w-20 rounded-full" />
      <SkeletonLoader className="h-5 w-4/5" />
      <SkeletonLoader className="h-3 w-1/3" />
    </div>

    <!-- Thumbnail Skeleton (1:1 Ratio) -->
    <SkeletonLoader className="w-20 sm:w-28 aspect-square shrink-0 rounded-[12px]" />
  </div>
</template>
