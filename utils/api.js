/**
 * 统一 API 请求封装
 * 后端地址通过 API_BASE_URL 配置；未配置时 AI 功能自动降级为本地知识库。
 * 生产环境请在小程序管理后台配置 request 合法域名。
 */

// 后端服务地址。开发期可填局域网 IP，例如 http://192.168.1.10:3000
// 生产环境应填 HTTPS 域名，并在微信公众平台配置为 request 合法域名。
const API_BASE_URL = '';

function getBaseUrl() {
  return API_BASE_URL.replace(/\/$/, '');
}

function isBackendConfigured() {
  return Boolean(getBaseUrl());
}

/**
 * 发起后端请求，返回 Promise<{success, data, error}>
 */
function request(path, options = {}) {
  return new Promise((resolve) => {
    if (!isBackendConfigured()) {
      resolve({ success: false, error: '后端服务未配置' });
      return;
    }
    const { method = 'POST', data = {}, timeout = 15000 } = options;
    wx.request({
      url: getBaseUrl() + path,
      method,
      timeout,
      header: { 'Content-Type': 'application/json' },
      data,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.data && res.data.code === 200) {
          resolve({ success: true, data: res.data.data });
        } else {
          resolve({ success: false, error: (res.data && res.data.message) || '请求失败' });
        }
      },
      fail: () => resolve({ success: false, error: '网络连接失败' })
    });
  });
}

/**
 * 通过后端代理调用 DeepSeek（密钥不落地前端）
 */
function chatWithAI(messages) {
  return request('/api/ai/chat', { method: 'POST', data: { messages } });
}

/**
 * 通过后端代理调用 Tavily（密钥不落地前端）
 */
function searchWithAI(query, options = {}) {
  return request('/api/ai/search', {
    method: 'POST',
    data: {
      query,
      search_depth: options.searchDepth || 'basic',
      max_results: options.maxResults || 3
    }
  });
}

/**
 * 获取内容聚合数据（公开只读）
 */
function getContentOverview() {
  return request('/api/content/overview', { method: 'GET' });
}

module.exports = {
  API_BASE_URL,
  getBaseUrl,
  isBackendConfigured,
  request,
  chatWithAI,
  searchWithAI,
  getContentOverview
};
