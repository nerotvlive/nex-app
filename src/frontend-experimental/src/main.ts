import { createApp } from 'vue'
import './assets/zyneon/css/shared.css'
import 'lucide-static/font/lucide.css';
import ZyneonDesktop from './ZyneonDesktop.vue'
import ZyneonSerwiN from './tools/serwin/ZyneonSerwiN.vue'
import ZyneonJsonExplorer from './tools/json-explorer/ZyneonJsonExplorer.vue'

function init() {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams) {
        if(urlParams.get("SerwiN")) {
            if(urlParams.get("SerwiN") === "true") {
                createApp(ZyneonSerwiN).mount('#app');
                return;
            }
        } else if(urlParams.get("JSON-Explorer")) {
            if(urlParams.get("JSON-Explorer") === "true") {
                createApp(ZyneonJsonExplorer).mount('#app');
                return;
            }
        }
    }

    createApp(ZyneonDesktop).mount('#app');
}
init();