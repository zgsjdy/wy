import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router' // 导入路由
import { createPinia } from 'pinia' // 导入 pinia

const pinia = createPinia()  // 创建 pinia 实例

const app = createApp(App)

app.use(router) // 使用路由
app.use(pinia) // 使用 pinia

app.mount('#app')
