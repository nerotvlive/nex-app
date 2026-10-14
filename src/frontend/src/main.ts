import { createApp } from 'vue';
import './assets/zyneon/css/shared.css';
import 'lucide-static/font/lucide.css';
import {i18n, createPrimaryRouter, createSecondaryRouter} from './assets/zyneon/scripts'
import PrimaryFrame from './frames/PrimaryFrame.vue';
import SecondaryFrame from './frames/SecondaryFrame.vue';

const urlParams = new URLSearchParams(window.location.search)
const isSecondary = urlParams.get('mode') === 'secondary'

const app = createApp(isSecondary ? SecondaryFrame : PrimaryFrame)
app.use(i18n)
app.use(isSecondary ? createSecondaryRouter() : createPrimaryRouter())
app.mount('#app');

document.addEventListener('contextmenu', (e) => {
    e.preventDefault()
});

document.addEventListener('dragstart', function (e) {
    e.preventDefault();
});