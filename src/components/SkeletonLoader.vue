<script setup>
defineProps({
  className: {
    type: String,
    default: 'h-4 w-full'
  }
})
</script>

<template>
  <div :class="['animate-pulse bg-[#e5e5e5] rounded-[6px]', className]"></div>
</template>
