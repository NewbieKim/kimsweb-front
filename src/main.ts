import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import pinia from './stores'
import router from './router'
import svgIcon from '@/svg/index.vue'
import './css/tailwind.css'
// createApp(App)
// .use(pinia)
// .use(router).mount('#app')
// 改造下 写法显得简便
async function initApp() {
    const app = createApp(App);
    app.use(pinia);
    app.use(router);
    app.mount('#app');
    app.component('svg-icon', svgIcon)
}
initApp()