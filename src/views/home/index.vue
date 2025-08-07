<template>
  <div style="background-color: black;">
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
  </div>
</template>

<script setup lang="ts">
  import GooeyNav from "@/components/GooeyNav.vue";

  const navItems = [
    { label: "Home", href: "/home" },
    { label: "About", href: "/home" },
    { label: "Services", href: "/home" },
    { label: "Contact", href: "/home" },
  ];

  function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
    return arr.map(fn);
  }
  let numbers = [1, 2, 3];
  let doubled = map(numbers, (n) => n * 2); // 输出: [2, 4, 6]
  let strings = ["a123", "b", "c"];
  let lengths = map(strings, (s) => s.length); // 输出: [1, 1, 1]
  console.log(doubled, lengths);
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