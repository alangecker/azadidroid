// Composables
import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/default/Default.vue'),
    children: [
      {
        path: '',
        redirect: {
          name: 'ModelList'
        }
      },
      {
        path: '/installer',
        name: 'Installer',
        components: {
          default: () => import(/* webpackChunkName: "home" */ '@/views/Installer.vue'),
        }
      },
      {
        path: '/list',
        name: 'ModelList',
        // route level code-splitting
        // this generates a separate chunk (about.[hash].js) for this route
        // which is lazy-loaded when the route is visited.
        components: {
          default: () => import(/* webpackChunkName: "home" */ '@/views/Home.vue'),
        }
      },
      {
        path: '/model/:codename',
        name: 'Model',
        components: {
          default: () => import(/* webpackChunkName: "home2" */ '@/views/Home.vue'),
          sidebar: () => import(/* webpackChunkName: "model" */ '@/views/ModelSidebar.vue'),
        }
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

export default router
