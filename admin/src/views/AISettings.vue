<template>
  <div class="ai-settings">
    <h2 class="page-title">AI 密钥设置</h2>

    <el-alert
      class="notice"
      type="info"
      :closable="false"
      show-icon
      title="密钥仅保存在后端，加密存储，不会下发到小程序端"
      description="请在此输入你自己的 DeepSeek / Tavily API Key。密钥由后端加密后保存在服务器本地文件，接口只返回脱敏信息；清空后 AI 功能将停用。"
    />

    <div class="cards">
      <!-- DeepSeek -->
      <el-card class="key-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">DeepSeek API Key</span>
            <el-tag :type="deepseek.configured ? 'success' : 'info'" size="small">
              {{ deepseek.configured ? '已配置' : '未配置' }}
            </el-tag>
          </div>
        </template>

        <div v-if="deepseek.configured" class="current-key">
          <span class="label">当前密钥</span>
          <code>{{ deepseek.masked }}</code>
        </div>

        <el-form label-position="top" @submit.prevent>
          <el-form-item :label="deepseek.configured ? '更换为新密钥（留空则不修改）' : '输入 API Key'">
            <el-input
              v-model="form.deepseek"
              type="password"
              show-password
              clearable
              placeholder="以 sk- 开头，例如 sk-xxxxxxxx"
              autocomplete="new-password"
            />
          </el-form-item>
        </el-form>

        <div class="actions">
          <el-button type="primary" :loading="saving" @click="saveKeys">保存密钥</el-button>
          <el-button :loading="verifying" @click="verifyKey" :disabled="!deepseek.configured">验证可用性</el-button>
          <el-button type="danger" plain :disabled="!deepseek.configured" @click="clearKey('deepseek')">清除</el-button>
        </div>
        <p class="hint">用于阿樟 AI 问答。密钥可在 DeepSeek 开放平台申请。</p>
      </el-card>

      <!-- Tavily -->
      <el-card class="key-card" shadow="never">
        <template #header>
          <div class="card-header">
            <span class="card-title">Tavily API Key（可选）</span>
            <el-tag :type="tavily.configured ? 'success' : 'info'" size="small">
              {{ tavily.configured ? '已配置' : '未配置' }}
            </el-tag>
          </div>
        </template>

        <div v-if="tavily.configured" class="current-key">
          <span class="label">当前密钥</span>
          <code>{{ tavily.masked }}</code>
        </div>

        <el-form label-position="top" @submit.prevent>
          <el-form-item :label="tavily.configured ? '更换为新密钥（留空则不修改）' : '输入 API Key（选填）'">
            <el-input
              v-model="form.tavily"
              type="password"
              show-password
              clearable
              placeholder="以 tvly- 开头"
              autocomplete="new-password"
            />
          </el-form-item>
        </el-form>

        <div class="actions">
          <el-button type="primary" :loading="saving" @click="saveKeys">保存密钥</el-button>
          <el-button type="danger" plain :disabled="!tavily.configured" @click="clearKey('tavily')">清除</el-button>
        </div>
        <p class="hint">用于 AI 联网搜索。不填则相关功能走本地知识库，不影响基本问答。</p>
      </el-card>
    </div>

    <el-card class="status-card" shadow="never" v-if="status.updatedAt">
      <span class="status-label">最近更新时间</span>
      <span>{{ formatTime(status.updatedAt) }}</span>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { settingsApi } from '../api'

const emptyKey = { configured: false, masked: '' }
const deepseek = ref({ ...emptyKey })
const tavily = ref({ ...emptyKey })
const status = ref({ updatedAt: null })
const form = reactive({ deepseek: '', tavily: '' })
const saving = ref(false)
const verifying = ref(false)

const fetchStatus = () => {
  settingsApi.getAiKeys().then(res => {
    if (res.code === 200) {
      deepseek.value = res.data.deepseek || { ...emptyKey }
      tavily.value = res.data.tavily || { ...emptyKey }
      status.value = { updatedAt: res.data.updatedAt }
    }
  }).catch(() => {
    ElMessage.error('读取密钥状态失败，请检查后端服务')
  })
}

const saveKeys = async () => {
  const payload = {}
  if (form.deepseek.trim()) payload.deepseek = form.deepseek.trim()
  if (form.tavily.trim()) payload.tavily = form.tavily.trim()
  if (Object.keys(payload).length === 0) {
    ElMessage.warning('请先输入要保存的密钥')
    return
  }
  saving.value = true
  try {
    const res = await settingsApi.updateAiKeys(payload)
    if (res.code === 200) {
      ElMessage.success(res.message || '密钥已加密保存')
      form.deepseek = ''
      form.tavily = ''
      fetchStatus()
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '保存失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

const verifyKey = async () => {
  verifying.value = true
  try {
    const res = await settingsApi.verifyDeepSeek()
    if (res.data && res.data.valid) {
      ElMessage.success('密钥验证通过，可以正常使用 AI 问答')
    } else {
      ElMessage.warning((res.message || '验证失败') + '，请检查密钥是否有效或余额是否充足')
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.message || '验证失败，请稍后重试')
  } finally {
    verifying.value = false
  }
}

const clearKey = async (name) => {
  const label = name === 'deepseek' ? 'DeepSeek' : 'Tavily'
  try {
    await ElMessageBox.confirm(`确定清除 ${label} 密钥吗？清除后相关 AI 功能将停用。`, '确认清除', {
      type: 'warning',
      confirmButtonText: '确认清除',
      cancelButtonText: '取消'
    })
  } catch (e) {
    return
  }
  const res = await settingsApi.clearAiKey(name)
  if (res.code === 200) {
    ElMessage.success('密钥已清除')
    fetchStatus()
  } else {
    ElMessage.error(res.message || '清除失败')
  }
}

const formatTime = (value) => {
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleString('zh-CN', { hour12: false })
}

onMounted(fetchStatus)
</script>

<style scoped>
.ai-settings {
  max-width: 1100px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 20px;
  color: #333;
}

.notice {
  margin-bottom: 20px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.key-card {
  border-radius: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.current-key {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 18px;
}

.current-key .label {
  font-size: 13px;
  color: #909399;
}

.current-key code {
  font-size: 14px;
  color: #606266;
  letter-spacing: 1px;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.hint {
  margin-top: 14px;
  font-size: 12px;
  color: #a8abb2;
  line-height: 1.6;
}

.status-card {
  margin-top: 20px;
  font-size: 13px;
  color: #909399;
  display: flex;
  gap: 16px;
}

.status-label {
  color: #606266;
}

@media (max-width: 900px) {
  .cards {
    grid-template-columns: 1fr;
  }
}
</style>
