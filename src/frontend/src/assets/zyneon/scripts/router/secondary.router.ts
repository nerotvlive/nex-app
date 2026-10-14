import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import ErrorPage from "../../../../pages/errors/ErrorPage.vue";
import Error501 from "../../../../pages/errors/Error501.vue";
import DesktopSettings from "../../../../pages/DesktopSettings.vue";
import DesktopLibrary from "../../../../pages/DesktopLibrary.vue";
import DesktopTools from "../../../../pages/DesktopTools.vue";
import DesktopDownloads from "../../../../pages/DesktopDownloads.vue";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Root',
        meta: { title: 'Root' },
        component: Error501
    },
    {
        path: '/library',
        name: 'Library',
        meta: { title: 'Library' },
        component: DesktopLibrary
    },
    {
        path: '/tools',
        name: 'Tools',
        meta: { title: 'Tools' },
        component: DesktopTools
    },
    {
        path: '/downloads',
        name: 'Downloads',
        meta: { title: 'Downloads' },
        component: DesktopDownloads
    },
    {
        path: '/settings',
        name: 'Settings',
        meta: { title: 'Settings' },
        component: DesktopSettings
    },
    {
        path: '/error',
        name: 'Unknown Error',
        meta: { title: 'Unknown Error' },
        component: ErrorPage
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'Error: 501',
        meta: { title: 'Error 501' },
        component: Error501
    }
]

export function createSecondaryRouter() {
    const router = createRouter({
        history: createWebHistory(),
        routes
    });

    router.afterEach((to) => {
        const defaultTitle = 'NEX App';
        const title = to.meta.title as string | undefined;
        document.title = title ? `${title} (secondary) - ${defaultTitle}` : defaultTitle;
    })

    return router;
}