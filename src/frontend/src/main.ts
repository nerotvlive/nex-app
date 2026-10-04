import { createApp } from 'vue';
import './assets/zyneon/css/shared.css';
import 'lucide-static/font/lucide.css';
import ZyneonDesktop from './ZyneonDesktop.vue';

function init() {
    createApp(ZyneonDesktop).mount('#app');
}
init();