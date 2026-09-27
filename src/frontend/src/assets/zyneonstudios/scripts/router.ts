import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Library from "@/pages/Library.vue";
import DashboardSearch from "@/components/DashboardSearch.vue";
import Dashboard from "@/pages/Dashboard.vue";
import NotFound from "@/pages/errors/NotFound.vue";
import Settings from "@/pages/Settings.vue";

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Dashboard',
    meta: { title: 'Dashboard' },
    component: Dashboard
  },
  {
    path: '/library',
    name: 'Library',
    meta: { title: 'Library' },
    component: Library
  },
  {
    path: '/search',
    name: 'Search',
    meta: { title: 'Search' },
    component: DashboardSearch
  },
  {
    path: '/settings',
    name: 'Settings',
    meta: { title: 'Settings' },
    component: Settings
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'Error: 404',
    meta: { title: 'Not found' },
    component: NotFound
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  const defaultTitle = 'NEX App'
  document.title = to.meta.title ? `${defaultTitle} » ${to.meta.title}` : defaultTitle
})

export default router
