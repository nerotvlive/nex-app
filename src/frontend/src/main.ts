import { createApp } from 'vue';
import './assets/zyneon/css/shared.css';
import 'lucide-static/font/lucide.css';
import { i18n } from './assets/zyneon/scripts'
import router from './assets/zyneon/scripts/router'
import ZyneonDesktop from './ZyneonDesktop.vue';

function init() {
    const app = createApp(ZyneonDesktop)
    app.use(i18n)
    app.use(router)
    app.mount('#app');
}
init();