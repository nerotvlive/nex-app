import { createApp } from 'vue'
import '@/assets/zyneonstudios/styles/shared.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import router from '@/assets/zyneonstudios/scripts/router'
import App from './App.vue'

const app = createApp(App)

app.use(router)
app.mount('#app')

document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

document.addEventListener('dragstart', (event) => {
    event.preventDefault();
});