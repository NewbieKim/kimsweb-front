import { ref } from "vue";
const ROUTER_KEY = '__router__'
// 生成实例
function createRouter(options: Object) {
  return new Router(options)
}
function useRouter() {
  return inject(ROUTER_KEY)
}
// 创建路由
function createWebHashHistory() {
  function bindEvents(fn) {
    window.addEventListener('hashchange',fn)
  }
  return { bindEvents, url:window.location.hash.slice(1) || '/' }
}
class Router {
  constructor(options) {
    this.history = options.history
    this.routes = options.routes
    this.current = ref(this.history.url)
    // 绑定
    this.history.bindEvents(() => {
      this.current.value = window.location.hash.slice(1)
    })
  }
  install(app) {
    app.provide(ROUTER_KEY, this)
  }
}
export { createWebHashHistory, createRouter, useRouter }