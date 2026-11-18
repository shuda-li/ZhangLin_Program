<template>
  <div class="dashboard">
    <h2 class="page-title">数据概览</h2>
    
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-icon spots">
          <el-icon><component :is="icons.MapLocation" /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ overview.totalScenicSpots }}</p>
          <p class="stat-label">景点数量</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon activities">
          <el-icon><component :is="icons.Calendar" /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ overview.totalActivities }}</p>
          <p class="stat-label">活动数量</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon users">
          <el-icon><component :is="icons.User" /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ overview.totalUsers }}</p>
          <p class="stat-label">用户数量</p>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-icon visits">
          <el-icon><component :is="icons.View" /></el-icon>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ formatNumber(overview.totalVisits) }}</p>
          <p class="stat-label">总访问量</p>
        </div>
      </el-card>
    </div>

    <div class="charts-row">
      <el-card class="chart-card">
        <h3>本周访问趋势</h3>
        <div ref="weekChartRef" class="chart"></div>
      </el-card>
      <el-card class="chart-card">
        <h3>本月访问趋势</h3>
        <div ref="monthChartRef" class="chart"></div>
      </el-card>
    </div>

    <div class="bottom-row">
      <el-card class="list-card">
        <h3>热门景点 TOP5</h3>
        <el-table :data="topSpots" border>
          <el-table-column prop="name" label="景点名称" />
          <el-table-column prop="visits" label="访问量" />
        </el-table>
      </el-card>
      <el-card class="list-card">
        <h3>近期活动</h3>
        <el-table :data="recentActivities" border>
          <el-table-column prop="title" label="活动名称" />
          <el-table-column prop="startTime" label="开始时间" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { MapLocation, Calendar, User, View } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { statsApi, activityApi } from '../api'

const icons = { MapLocation, Calendar, User, View }

const overview = ref({
  totalScenicSpots: 0,
  totalActivities: 0,
  totalUsers: 0,
  totalVisits: 0,
  todayVisits: 0,
  weeklyVisits: [],
  monthlyVisits: []
})

const topSpots = ref([])
const recentActivities = ref([])
const weekChartRef = ref(null)
const monthChartRef = ref(null)

let weekChart = null
let monthChart = null

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

const getStatusType = (status) => {
  const types = {
    ongoing: 'success',
    upcoming: 'warning',
    limited: 'info',
    completed: 'default'
  }
  return types[status] || 'default'
}

const getStatusLabel = (status) => {
  const labels = {
    ongoing: '进行中',
    upcoming: '即将开始',
    limited: '名额有限',
    completed: '已结束'
  }
  return labels[status] || status
}

const initCharts = () => {
  if (weekChartRef.value) {
    weekChart = echarts.init(weekChartRef.value)
    weekChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: { type: 'value' },
      series: [{
        data: overview.value.weeklyVisits,
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(30, 58, 95, 0.3)' },
            { offset: 1, color: 'rgba(30, 58, 95, 0.05)' }
          ])
        },
        lineStyle: { color: '#1e3a5f' }
      }]
    })
  }

  if (monthChartRef.value) {
    monthChart = echarts.init(monthChartRef.value)
    monthChart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月']
      },
      yAxis: { type: 'value' },
      series: [{
        data: overview.value.monthlyVisits,
        type: 'bar',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#2d5a87' },
            { offset: 1, color: '#1e3a5f' }
          ])
        }
      }]
    })
  }
}

const fetchData = () => {
  statsApi.overview().then(res => {
    if (res.code === 200) {
      overview.value = res.data
      setTimeout(() => {
        initCharts()
      }, 100)
    }
  })

  statsApi.scenic().then(res => {
    if (res.code === 200) {
      topSpots.value = res.data.topSpots
    }
  })

  activityApi.list({ limit: 5 }).then(res => {
    if (res.code === 200) {
      recentActivities.value = res.data.list
    }
  })
}

onMounted(() => {
  fetchData()
})

watch(() => overview.value, () => {
  if (weekChart && monthChart) {
    initCharts()
  }
}, { deep: true })
</script>

<style>
.dashboard {
  padding: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 24px;
  color: white;
}

.stat-icon.spots { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.stat-icon.activities { background: linear-gradient(135deg, #43e97b, #38f9d7); }
.stat-icon.users { background: linear-gradient(135deg, #fa709a, #fee140); }
.stat-icon.visits { background: linear-gradient(135deg, #a8edea, #fed6e3); color: #1e3a5f; }

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #999;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  padding: 20px;
}

.chart-card h3 {
  font-size: 16px;
  margin-bottom: 20px;
  color: #333;
}

.chart {
  height: 250px;
}

.bottom-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.list-card {
  padding: 20px;
}

.list-card h3 {
  font-size: 16px;
  margin-bottom: 20px;
  color: #333;
}
</style>