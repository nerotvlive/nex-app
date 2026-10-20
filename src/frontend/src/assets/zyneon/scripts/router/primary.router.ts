import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import DesktopDashboard from "../../../../pages/DesktopDashboard.vue";
import DesktopDiscover from "../../../../pages/DesktopDiscover.vue";
import DesktopDownloads from "../../../../pages/DesktopDownloads.vue";
import DesktopLibrary from "../../../../pages/DesktopLibrary.vue";
import DesktopSearch from "../../../../pages/DesktopSearch.vue";
import DesktopSettings from "../../../../pages/DesktopSettings.vue";
import DesktopTools from "../../../../pages/DesktopTools.vue";
import Error404 from "../../../../pages/errors/Error404.vue";
import ErrorPage from "../../../../pages/errors/ErrorPage.vue";
import Error501 from "../../../../pages/errors/Error501.vue";
import {WindowControls} from "../windowControls.ts";
import ErrorGame from "../../../../pages/errors/ErrorGame.vue";
import DesktopIndex from "../../../../pages/DesktopIndex.vue";
import DesktopIntro from "../../../../components/shared/DesktopIntro.vue";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
        name: 'index',
        meta: { title: 'Start' },
        component: DesktopIndex
    },
    {
        path: '/intro',
        name: 'intro',
        meta: { title: 'Intro' },
        component: DesktopIntro
    },
    {
        path: '/start',
        name: 'start',
        meta: { title: 'Start' },
        component: DesktopIndex
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        meta: { title: 'Dashboard' },
        component: DesktopDashboard
    },
    {
        path: '/discover',
        name: 'Discover',
        meta: { title: 'Discover' },
        component: DesktopDiscover
    },
    {
        path: '/downloads',
        name: 'Downloads',
        meta: { title: 'Downloads' },
        component: DesktopDownloads
    },
    {
        path: '/library',
        name: 'Library',
        meta: { title: 'Library' },
        component: DesktopLibrary
    },
    {
        path: '/search',
        name: 'Search',
        meta: { title: 'Search' },
        component: DesktopSearch
    },
    {
        path: '/tools',
        name: 'Tools',
        meta: { title: 'Tools' },
        component: DesktopTools
    },
    {
        path: '/notifications',
        name: 'Notifications',
        meta: { title: 'Notifications' },
        component: Error501
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
        path: '/:pathMatch(.*)*',
        name: 'Error: 404',
        meta: { title: 'Error 404' },
        component: Error404
    }
]

export function createPrimaryRouter() {
    const router = createRouter({
        history: createWebHistory(),
        routes
    });

    router.beforeEach((to, from) => {
        if (Object.keys(from.query).length > 0 && Object.keys(to.query).length === 0) {
            return {
                ...to,
                query: { ...from.query, ...to.query }
            }
        }
    });

    router.afterEach((to) => {
        const defaultTitle = 'NEX App';
        const title = to.meta.title as string | undefined;
        document.title = title ? `${title} (primary) - ${defaultTitle}` : defaultTitle;
        WindowControls.pageLoadEvent();
        if(window.hideNotifications) {
            window.hideNotifications();
        }
        if(window.hideFriends) {
            window.hideFriends();
        }
    })

    return router;
}