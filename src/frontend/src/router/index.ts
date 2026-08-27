import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import HomePage from '../pages/Dashboard.vue'
import NotFoundError from '../pages/errors/NotFound.vue'

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
    component: HomePage
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'Error: 404',
    meta: { title: 'Not found' },
    component: NotFoundError
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
