import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import SpaceshipGrid from '../components/SpaceshipGrid.vue'
import BMW from '../components/BMW.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage,
    meta: {
      title: 'Toon Hartman - LEGO Portfolio'
    }
  },
  {
    path: '/spaceships',
    name: 'Spaceships',
    component: SpaceshipGrid,
    meta: {
      title: '25 or 01 - Spaceship Grid'
    }
  },
  {
    path: '/bmw',
    name: 'BMW',
    component: BMW,
    meta: {
      title: 'BMW - Interactive Portfolio Book'
    }
  },
  // Redirect any unknown routes to home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Update page title based on route
router.beforeEach((to) => {
  document.title = to.meta.title || 'Toon Hartman - LEGO Portfolio'
})

export default router