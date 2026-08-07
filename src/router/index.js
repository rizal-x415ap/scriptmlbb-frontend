import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { updateCanonicalUrl } from '../services/settingsStore.js'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('../views/BlogArchiveView.vue')
    },
    {
      path: '/article/:id',
      name: 'article-detail',
      component: () => import('../views/ArticleDetailView.vue'),
      props: true
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      alias: ['/bookmark', '/about'],
      component: () => import('../views/BookmarksView.vue')
    },
    {
      path: '/page/:slug',
      name: 'static-page',
      component: () => import('../views/StaticPageView.vue')
    },
    {
      path: '/go/:code',
      name: 'link-shortener',
      component: () => import('../views/LinkShortenerView.vue')
    },
    {
      path: '/premium',
      name: 'premium',
      component: () => import('../views/PremiumView.vue')
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

router.afterEach(() => {
  updateCanonicalUrl()
})

export default router
