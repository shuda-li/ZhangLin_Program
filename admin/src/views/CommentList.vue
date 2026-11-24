<template>
  <div class="comment-page">
    <div class="page-header">
      <div>
        <h2>评论管理</h2>
        <p>查看、筛选并管理风物故事、景点与导览路线评论</p>
      </div>
      <el-button :loading="statsLoading" @click="loadStats">刷新统计</el-button>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <el-card shadow="never"><div class="stat-item"><span class="stat-label">评论总数</span><span class="stat-value">{{ stats.total }}</span></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="stat-item"><span class="stat-label">正常显示</span><span class="stat-value success">{{ stats.active }}</span></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="stat-item"><span class="stat-label">已屏蔽</span><span class="stat-value warning">{{ stats.hidden }}</span></div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="never"><div class="stat-item"><span class="stat-label">风物 / 景点 / 路线</span><span class="stat-value small">{{ stats.story }} / {{ stats.spot }} / {{ stats.route }}</span></div></el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="table-card">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="内容类型">
          <el-select v-model="filters.targetType" placeholder="全部" clearable style="width: 150px">
            <el-option label="风物故事" value="story" />
            <el-option label="景点介绍" value="spot" />
            <el-option label="导览路线" value="route" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" value="active" />
            <el-option label="已屏蔽" value="hidden" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="内容 / 昵称 / 目标" clearable style="width: 220px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="comments" v-loading="loading" stripe border style="width: 100%">
        <el-table-column prop="id" label="ID" width="150" show-overflow-tooltip />
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTag(row.targetType)" size="small">
              {{ typeLabel(row.targetType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="targetName" label="所属内容" width="160" show-overflow-tooltip />
        <el-table-column prop="nickname" label="昵称" width="120" show-overflow-tooltip />
        <el-table-column label="评分" width="100">
          <template #default="{ row }">
            <span v-if="row.rating" class="rating">{{ '★'.repeat(row.rating) }}</span>
            <span v-else class="muted">—</span>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容" min-width="240" show-overflow-tooltip />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'hidden' ? 'info' : 'success'" size="small">
              {{ row.status === 'hidden' ? '已屏蔽' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发表时间" width="120">
          <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button link :type="row.status === 'hidden' ? 'success' : 'warning'" @click="toggleStatus(row)">
              {{ row.status === 'hidden' ? '恢复' : '屏蔽' }}
            </el-button>
            <el-button link type="danger" @click="removeComment(row)">删除</el-button>
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
          @current-change="loadComments"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="评论详情" width="520px">
      <div v-if="current" class="detail-body">
        <div class="detail-row"><span class="detail-label">所属内容</span><span>{{ current.targetName }}（{{ current.targetId }}）</span></div>
        <div class="detail-row"><span class="detail-label">评论人</span><span>{{ current.nickname }}</span></div>
        <div class="detail-row"><span class="detail-label">发表时间</span><span>{{ formatDate(current.createdAt, true) }}</span></div>
        <div class="detail-row"><span class="detail-label">评分</span><span class="rating">{{ current.rating ? '★'.repeat(current.rating) : '未评分' }}</span></div>
        <div class="detail-row detail-content"><span class="detail-label">评论内容</span><span>{{ current.content }}</span></div>
        <div v-if="current.images && current.images.length" class="detail-row">
          <span class="detail-label">图片</span>
          <div class="detail-images">
            <el-image v-for="(img, i) in current.images" :key="i" :src="img" :preview-src-list="current.images" fit="cover" class="detail-image" />
          </div>
        </div>
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
import { commentApi } from '../api'

const loading = ref(false)
const statsLoading = ref(false)
const comments = ref([])
const total = ref(0)
const stats = ref({ total: 0, active: 0, hidden: 0, story: 0, spot: 0, route: 0 })
const dateRange = ref([])

const TYPE_LABELS = { story: '风物故事', spot: '景点介绍', route: '导览路线' }
const TYPE_TAGS = { story: 'warning', spot: 'success', route: 'primary' }
function typeLabel(type) { return TYPE_LABELS[type] || '其他' }
function typeTag(type) { return TYPE_TAGS[type] || 'info' }
const detailVisible = ref(false)
const current = ref(null)

const filters = reactive({
  targetType: '',
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

async function loadComments() {
  loading.value = true
  try {
    const params = {
      page: filters.page,
      limit: filters.limit,
      targetType: filters.targetType || undefined,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
      startDate: dateRange.value?.[0] ? `${dateRange.value[0]}T00:00:00.000Z` : undefined,
      endDate: dateRange.value?.[1] ? `${dateRange.value[1]}T23:59:59.999Z` : undefined
    }
    const res = await commentApi.list(params)
    comments.value = res.list || []
    total.value = res.total || 0
  } catch (e) {
    ElMessage.error('评论列表加载失败')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  statsLoading.value = true
  try {
    stats.value = await commentApi.stats()
  } catch (e) {
    ElMessage.error('统计信息加载失败')
  } finally {
    statsLoading.value = false
  }
}

function handleSearch() {
  filters.page = 1
  loadComments()
}

function handleSizeChange() {
  filters.page = 1
  loadComments()
}

function resetFilters() {
  filters.targetType = ''
  filters.status = ''
  filters.keyword = ''
  filters.page = 1
  dateRange.value = []
  loadComments()
}

function viewDetail(row) {
  current.value = row
  detailVisible.value = true
}

async function toggleStatus(row) {
  const next = row.status === 'hidden' ? 'active' : 'hidden'
  try {
    await commentApi.setStatus(row.id, next)
    ElMessage.success(next === 'hidden' ? '已屏蔽评论' : '已恢复评论')
    loadComments()
    loadStats()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

async function removeComment(row) {
  try {
    await ElMessageBox.confirm(`确定删除「${row.nickname}」的这条评论吗？此操作不可恢复。`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    await commentApi.remove(row.id)
    ElMessage.success('评论已删除')
    loadComments()
    loadStats()
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadComments()
  loadStats()
})
</script>

<style scoped>
.comment-page { padding: 4px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-header h2 { margin: 0 0 4px; font-size: 20px; color: #2c3e50; }
.page-header p { margin: 0; font-size: 13px; color: #909399; }
.stat-row { margin-bottom: 16px; }
.stat-item { display: flex; flex-direction: column; gap: 6px; }
.stat-label { font-size: 13px; color: #909399; }
.stat-value { font-size: 22px; font-weight: 600; color: #2c3e50; }
.stat-value.success { color: #67c23a; }
.stat-value.warning { color: #e6a23c; }
.filter-form { margin-bottom: 4px; }
.table-card :deep(.el-card__body) { padding: 16px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
.rating { color: #e6a23c; letter-spacing: 1px; }
.muted { color: #c0c4cc; }
.detail-body { display: flex; flex-direction: column; gap: 14px; }
.detail-row { display: flex; gap: 12px; font-size: 14px; line-height: 1.6; }
.detail-label { flex: 0 0 78px; color: #909399; }
.detail-content span:last-child { white-space: pre-wrap; color: #303133; }
.detail-images { display: flex; gap: 8px; flex-wrap: wrap; }
.detail-image { width: 72px; height: 72px; border-radius: 6px; }
</style>
