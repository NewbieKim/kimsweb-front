<template>
  <GooeyNav
    :items="navItems"
    :animation-time="600"
    :particle-count="15"
    :particle-distances="[90, 10]"
    :particle-r="100"
    :time-variance="300"
    :colors="[1, 2, 3, 1, 2, 3, 1, 4]"
    :initial-active-index="0"
  />
</template>

<script setup lang="ts">
  import GooeyNav from "@/components/GooeyNav.vue";

  const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/" },
    { label: "Services", href: "/" },
    { label: "Contact", href: "/" },
  ];
</script>

<style>
  /* Add these CSS custom properties to your global styles */
  :root {
    --color-1: #ff6b6b;
    --color-2: #4ecdc4;
    --color-3: #45b7d1;
    --color-4: #f9ca24;
  }
</style>