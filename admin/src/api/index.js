import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  profile: () => api.get('/auth/profile')
}

export const scenicApi = {
  list: (params) => api.get('/scenic', { params }),
  get: (id) => api.get(`/scenic/${id}`),
  add: (data) => api.post('/scenic', data),
  update: (id, data) => api.put(`/scenic/${id}`, data),
  delete: (id) => api.delete(`/scenic/${id}`),
  categories: () => api.get('/scenic/categories/list')
}

export const activityApi = {
  list: (params) => api.get('/activity', { params }),
  get: (id) => api.get(`/activity/${id}`),
  add: (data) => api.post('/activity', data),
  update: (id, data) => api.put(`/activity/${id}`, data),
  delete: (id) => api.delete(`/activity/${id}`),
  enroll: (id, data) => api.post(`/activity/${id}/enroll`, data),
  enrollments: (id) => api.get(`/activity/${id}/enrollments`),
  types: () => api.get('/activity/types/list')
}

export const userApi = {
  list: (params) => api.get('/user', { params }),
  get: (id) => api.get(`/user/${id}`),
  add: (data) => api.post('/user', data),
  update: (id, data) => api.put(`/user/${id}`, data),
  delete: (id) => api.delete(`/user/${id}`),
  roles: () => api.get('/user/roles/list'),
  status: (id, data) => api.put(`/user/${id}/status`, data)
}

export const statsApi = {
  overview: () => api.get('/stats/overview'),
  activities: () => api.get('/stats/activities'),
  users: () => api.get('/stats/users'),
  scenic: () => api.get('/stats/scenic'),
  daily: () => api.get('/stats/daily')
}

export const settingsApi = {
  getAiKeys: () => api.get('/settings/ai-keys'),
  updateAiKeys: (data) => api.put('/settings/ai-keys', data),
  clearAiKey: (name) => api.delete(`/settings/ai-keys/${name}`),
  verifyDeepSeek: () => api.post('/settings/ai-keys/verify')
}