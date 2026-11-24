<template>
  <el-container class="app-container">
    <el-aside v-if="$route.path !== '/login'" width="200px" class="sidebar">
      <div class="logo">
        <h2>樟林古港管理后台</h2>
      </div>
      <el-menu
        :default-active="$route.path"
        class="menu"
        mode="vertical"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/">
          <el-icon><component :is="icons.Odometer" /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/scenic">
          <el-icon><component :is="icons.MapLocation" /></el-icon>
          <span>景点管理</span>
        </el-menu-item>
        <el-menu-item index="/activity">
          <el-icon><component :is="icons.Calendar" /></el-icon>
          <span>活动管理</span>
        </el-menu-item>
        <el-menu-item index="/user">
          <el-icon><component :is="icons.User" /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/stats">
          <el-icon><component :is="icons.TrendCharts" /></el-icon>
          <span>数据统计</span>
        </el-menu-item>
        <el-menu-item index="/comments">
          <el-icon><component :is="icons.ChatDot" /></el-icon>
          <span>评论管理</span>
        </el-menu-item>
        <el-menu-item index="/settings/ai-keys">
          <el-icon><component :is="icons.Setting" /></el-icon>
          <span>AI 密钥设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container v-if="$route.path !== '/login'">
      <el-header class="header">
        <div class="header-right">
          <span>{{ user?.nickname || '管理员' }}</span>
          <el-button type="text" @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>
      <el-main class="main">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
    <router-view v-if="$route.path === '/login'" />
  </el-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Odometer,
  MapLocation,
  Calendar,
  User,
  TrendCharts,
  Setting,
  ChatDotRound
} from '@element-plus/icons-vue'
import { authApi } from './api'

const router = useRouter()
const user = ref(null)

const icons = {
  Odometer,
  MapLocation,
  Calendar,
  User,
  TrendCharts,
  Setting,
  ChatDot: ChatDotRound
}

const handleMenuSelect = (key) => {
  router.push(key)
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    user.value = JSON.parse(storedUser)
  } else {
    authApi.profile().then(res => {
      if (res.code === 200) {
        user.value = res.data
        localStorage.setItem('user', JSON.stringify(res.data))
      }
    }).catch(() => {
      if (router.currentRoute.value.path !== '/login') {
        router.push('/login')
      }
    })
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #1e3a5f 0%, #2d5a87 100%);
  color: white;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.logo h2 {
  font-size: 16px;
  font-weight: 600;
}

.menu {
  border: none;
  height: calc(100% - 60px);
}

.menu :deep(.el-menu-item) {
  color: rgba(255, 255, 255, 0.85);
}

.menu :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.1);
}

.menu :deep(.el-menu-item.is-active) {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.header {
  background: white;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-right: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.main {
  padding: 20px;
  overflow-y: auto;
}
</style>