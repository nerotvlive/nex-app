import { createApp } from 'vue'
import 'bootstrap-icons/font/bootstrap-icons.css';
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(router)
app.mount('#app')

document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

document.addEventListener('dragstart', (event) => {
    event.preventDefault();
});