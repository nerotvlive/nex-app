import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import DesktopDashboard from "../../../pages/DesktopDashboard.vue";
import DesktopDiscover from "../../../pages/DesktopDiscover.vue";
import DesktopDownloads from "../../../pages/DesktopDownloads.vue";
import DesktopLibrary from "../../../pages/DesktopLibrary.vue";
import DesktopSearch from "../../../pages/DesktopSearch.vue";
import DesktopSettings from "../../../pages/DesktopSettings.vue";
import DesktopTools from "../../../pages/DesktopTools.vue";
import Error404 from "../../../pages/errors/Error404.vue";

const routes: Array<RouteRecordRaw> = [
    {
        path: '/',
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
        path: '/settings',
        name: 'Settings',
        meta: { title: 'Settings' },
        component: DesktopSettings
    },
    {
        path: '/tools',
        name: 'Tools',
        meta: { title: 'Tools' },
        component: DesktopTools
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'Error: 404',
        meta: { title: 'Error 404' },
        component: Error404
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.afterEach((to) => {
    const defaultTitle = 'NEX App';
    const title = to.meta.title as string | undefined;
    document.title = title ? `${title} • ${defaultTitle}` : defaultTitle;
})

export default router;