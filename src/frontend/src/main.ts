import { createApp } from 'vue'
import 'bootstrap-icons/font/bootstrap-icons.css';
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

export const openExternal = (url: string) => {
    if (window.openUrl) {
        window.openUrl(url);
    } else {
        window.open(url, '_blank');
    }
};

app.use(router)
app.mount('#app')

document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

document.addEventListener('dragstart', (event) => {
    event.preventDefault();
});