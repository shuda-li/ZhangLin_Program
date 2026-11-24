import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import ScenicList from '../views/ScenicList.vue'
import ScenicForm from '../views/ScenicForm.vue'
import ActivityList from '../views/ActivityList.vue'
import ActivityForm from '../views/ActivityForm.vue'
import UserList from '../views/UserList.vue'
import UserForm from '../views/UserForm.vue'
import Stats from '../views/Stats.vue'
import AISettings from '../views/AISettings.vue'
import CommentList from '../views/CommentList.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/scenic',
    name: 'ScenicList',
    component: ScenicList
  },
  {
    path: '/scenic/add',
    name: 'ScenicAdd',
    component: ScenicForm
  },
  {
    path: '/scenic/edit/:id',
    name: 'ScenicEdit',
    component: ScenicForm
  },
  {
    path: '/activity',
    name: 'ActivityList',
    component: ActivityList
  },
  {
    path: '/activity/add',
    name: 'ActivityAdd',
    component: ActivityForm
  },
  {
    path: '/activity/edit/:id',
    name: 'ActivityEdit',
    component: ActivityForm
  },
  {
    path: '/user',
    name: 'UserList',
    component: UserList
  },
  {
    path: '/user/add',
    name: 'UserAdd',
    component: UserForm
  },
  {
    path: '/user/edit/:id',
    name: 'UserEdit',
    component: UserForm
  },
  {
    path: '/stats',
    name: 'Stats',
    component: Stats
  },
  {
    path: '/settings/ai-keys',
    name: 'AISettings',
    component: AISettings
  },
  {
    path: '/comments',
    name: 'CommentList',
    component: CommentList
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router