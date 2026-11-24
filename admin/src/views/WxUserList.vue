<template>
  <div class="wxuser-page">
    <div class="page-header">
      <div>
        <h2>小程序用户</h2>
        <p>查看微信用户的授权资料与内容数据，可对异常账号进行禁用</p>
      </div>
      <el-button :loading="statsLoading" @click="loadStats">刷新统计</el-button>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <el-card shadow="never"><div class="stat-item"><span class="stat-label">用户总数</span><span class="stat-value">{{ stats.total }}</span></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="stat-item"><span class="stat-label">正常账号</span><span class="stat-value success">{{ stats.active }}</span></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="stat-item"><span class="stat-label">已禁用</span><span class="stat-value warning">{{ stats.disabled }}</span></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="stat-item"><span class="stat-label">已完善资料</span><span class="stat-value small">{{ stats.completed }} / {{ stats.total }}</span></div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="table-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="账号状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="正常" value="active" />
            <el-option label="已禁用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="昵称 / openid / 用户ID"
            clearable
            style="width: 240px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="users" v-loading="loading" stripe border style="width: 100%">
        <el-table-column label="用户" min-width="180">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="36" :src="avatarUrl(row.avatarUrl)">
                <span>{{ (row.nickname || '微').slice(0, 1) }}</span>
              </el-avatar>
              <div class="user-meta">
                <span class="user-name">{{ row.nickname || '未设置昵称' }}</span>
                <span v-if="!row.profileComplete" class="user-tag">资料未完善</span>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="微信标识" width="180">
          <template #default="{ row }">
            <span class="muted">{{ row.openidMasked || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'disabled' ? 'danger' : 'success'" size="small">
              {{ row.status === 'disabled' ? '已禁用' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="内容数据" width="220">
          <template #default="{ row }">
            <span class="content-count">收藏 {{ row.favorites }}</span>
            <span class="content-count">足迹 {{ row.footprints }}</span>
            <span class="content-count">报名 {{ row.registrations }}</span>
            <span class="content-count">评论 {{ row.comments }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="120">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="最后登录" width="120">
          <template #default="{ row }">{{ formatDate(row.lastLoginAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button
              link
              :type="row.status === 'disabled' ? 'success' : 'warning'"
              @click="toggleStatus(row)"
            >
              {{ row.status === 'disabled' ? '启用' : '禁用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          v-model:current-page="filters.page"
          v-model:page-size="filters.limit"
          :page-sizes="[10, 20, 50]"
          @current-change="loadUsers"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="用户详情" width="560px">
      <div v-if="current" class="detail-body">
        <div class="detail-head">
          <el-avatar :size="56" :src="avatarUrl(current.avatarUrl)">
            <span>{{ (current.nickname || '微').slice(0, 1) }}</span>
          </el-avatar>
          <div>
            <div class="detail-name">{{ current.nickname || '未设置昵称' }}</div>
            <div class="muted">{{ current.profileComplete ? '资料已完善' : '资料未完善' }}</div>
          </div>
        </div>
        <div class="detail-row"><span class="detail-label">用户 ID</span><span class="mono">{{ current.id }}</span></div>
        <div class="detail-row"><span class="detail-label">微信标识</span><span class="mono">{{ current.openidMasked || '—' }}</span></div>
        <div class="detail-row"><span class="detail-label">账号状态</span><span>{{ current.status === 'disabled' ? '已禁用' : '正常' }}</span></div>
        <div class="detail-row"><span class="detail-label">注册时间</span><span>{{ formatDate(current.createdAt, true) }}</span></div>
        <div class="detail-row"><span class="detail-label">最后登录</span><span>{{ formatDate(current.lastLoginAt, true) }}</span></div>
        <div class="detail-row"><span class="detail-label">内容数据</span><span>收藏 {{ current.favorites }} · 足迹 {{ current.footprints }} · 报名 {{ current.registrations }} · 评论 {{ current.comments }}</span></div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { wxUserApi } from '../api'

const loading = ref(false)
const statsLoading = ref(false)
const users = ref([])
const total = ref(0)
const stats = ref({ total: 0, active: 0, disabled: 0, completed: 0 })
const detailVisible = ref(false)
const current = ref(null)

const filters = reactive({
  status: '',
  keyword: '',
  page: 1,
  limit: 10
})

function formatDate(value, full = false) {
  if (!value) return '—'
  const d = new Date(value)
  if (isNaN(d.getTime())) return String(value).slice(0, 10)
  const pad = n => String(n).padStart(2, '0')
  const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return full ? `${base} ${pad(d.getHours())}:${pad(d.getMinutes())}` : base
}

function avatarUrl(url) {
  if (!url) return ''
  return url.startsWith('/uploads/') ? url : ''
}

async function loadUsers() {
  loading.value = true
  try {
    const res = await wxUserApi.list({
      page: filters.page,
      limit: filters.limit,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined
    })
    const data = res.data || {}
    users.value = data.list || []
    total.value = data.total || 0
    if (data.stats) stats.value = data.stats
  } catch (e) {
    ElMessage.error('用户列表加载失败')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  statsLoading.value = true
  try {
    const res = await wxUserApi.stats()
    stats.value = res.data || stats.value
  } catch (e) {
    ElMessage.error('统计信息加载失败')
  } finally {
    statsLoading.value = false
  }
}

function handleSearch() {
  filters.page = 1
  loadUsers()
}

function handleSizeChange() {
  filters.page = 1
  loadUsers()
}

function resetFilters() {
  filters.status = ''
  filters.keyword = ''
  filters.page = 1
  loadUsers()
}

function viewDetail(row) {
  current.value = row
  detailVisible.value = true
}

async function toggleStatus(row) {
  const next = row.status === 'disabled' ? 'active' : 'disabled'
  try {
    await wxUserApi.setStatus(row.id, next)
    ElMessage.success(next === 'disabled' ? '账号已禁用' : '账号已启用')
    loadUsers()
    loadStats()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadUsers()
  loadStats()
})
</script>

<style scoped>
.wxuser-page { padding: 4px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-header h2 { margin: 0 0 4px; font-size: 20px; color: #2c3e50; }
.page-header p { margin: 0; font-size: 13px; color: #909399; }
.stat-row { margin-bottom: 16px; }
.stat-item { display: flex; flex-direction: column; gap: 6px; }
.stat-label { font-size: 13px; color: #909399; }
.stat-value { font-size: 22px; font-weight: 600; color: #2c3e50; }
.stat-value.success { color: #67c23a; }
.stat-value.warning { color: #e6a23c; }
.stat-value.small { font-size: 20px; }
.filter-form { margin-bottom: 4px; }
.table-card :deep(.el-card__body) { padding: 16px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
.user-cell { display: flex; align-items: center; gap: 10px; }
.user-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.user-name { font-size: 14px; color: #303133; }
.user-tag { font-size: 11px; color: #e6a23c; }
.content-count { display: inline-block; margin-right: 8px; font-size: 12px; color: #606266; }
.muted { color: #909399; }
.mono { font-family: monospace; font-size: 12px; }
.detail-body { display: flex; flex-direction: column; gap: 14px; }
.detail-head { display: flex; align-items: center; gap: 14px; padding-bottom: 12px; border-bottom: 1px solid #ebeef5; }
.detail-name { font-size: 18px; font-weight: 600; color: #303133; }
.detail-row { display: flex; gap: 12px; font-size: 14px; line-height: 1.6; }
.detail-label { flex: 0 0 88px; color: #909399; }
</style>
