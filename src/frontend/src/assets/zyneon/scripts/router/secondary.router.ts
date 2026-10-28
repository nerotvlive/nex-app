import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import ErrorPage from "../../../../pages/errors/ErrorPage.vue";
import DesktopSettings from "../../../../pages/DesktopSettings.vue";
import DesktopLibrary from "../../../../pages/DesktopLibrary.vue";
import DesktopTools from "../../../../pages/DesktopTools.vue";
import DesktopDownloads from "../../../../pages/DesktopDownloads.vue";
import {WindowControls} from "../windowControls.ts";
import ErrorGame from "../../../../pages/errors/ErrorGame.vue";
import Error404 from "../../../../pages/errors/Error404.vue";
import Error501 from "../../../../pages/errors/Error501.vue";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'Root',
        meta: { title: 'Root' },
        component: ErrorPage
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
        path: '/errorgame',
        name: 'LEGACY DEFENDER',
        meta: { title: 'LEGACY DEFENDER' },
        component: ErrorGame
    },
    {
        path: '/501',
        name: 'Error: 501',
        meta: { title: 'Error 501' },
        component: Error501
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'Error: 404',
        meta: { title: 'Error 404' },
        component: Error404
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
        WindowControls.pageLoadEvent();
    })

    return router;
}