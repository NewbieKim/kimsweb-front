import { reactive, watchEffect } from "vue";
export default function useStorage(name, value: []) {
  let data = reactive(JSON.parse(localStorage.getItem(name)) || [])
  watchEffect(() => {
    localStorage.setItem(name, JSON.stringify(data))
  })
  return data
}