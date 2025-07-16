<script setup lang="ts">
import { ref } from 'vue'
import { useCounterStore } from '@/stores/countStore/index'
defineProps<{ msg: string }>()

const count = ref(0)
const counter = useCounterStore()
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <p>Count: {{ counter.count }}</p>
    <p>Double: {{ counter.doubleCount }}</p>
    <button @click="counter.increment()">+1</button>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
