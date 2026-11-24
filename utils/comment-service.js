/**
 * 评论服务
 *
 * 设计：本地持久化为主，后端可选同步
 * - 小程序 API_BASE_URL 未配置时，评论保存在本地，功能完全可用
 * - 配置后端地址后，新评论会同步到后端，管理端即可查看/筛选/删除
 * - 列表读取时合并本地与后端数据（按 id 去重），避免网络异常导致评论丢失
 */
const api = require('./api');

const STORAGE_KEY = 'siteComments';
const VALID_TYPES = ['story', 'spot', 'route'];

function readLocal() {
  try {
    const value = wx.getStorageSync(STORAGE_KEY);
    return Array.isArray(value) ? value : [];
  } catch (_) {
    return [];
  }
}

function writeLocal(list) {
  try {
    wx.setStorageSync(STORAGE_KEY, list.slice(0, 500));
  } catch (_) {
    /* storage full, silently fail */
  }
}

function normalize(item) {
  if (!item || !item.id) return null;
  return {
    id: item.id,
    targetType: VALID_TYPES.includes(item.targetType) ? item.targetType : 'spot',
    targetId: String(item.targetId || ''),
    targetName: String(item.targetName || ''),
    nickname: String(item.nickname || '匿名游客'),
    content: String(item.content || ''),
    rating: Math.max(0, Math.min(5, parseInt(item.rating, 10) || 0)),
    images: Array.isArray(item.images) ? item.images.slice(0, 3) : [],
    createdAt: item.createdAt || new Date().toISOString(),
    status: item.status === 'hidden' ? 'hidden' : 'active'
  };
}

/**
 * 读取评论列表
 * @param {string} targetType story | spot | route
 * @param {string} targetId 目标标识
 * @returns {Promise<Array>}
 */
function list(targetType, targetId) {
  const local = readLocal()
    .map(normalize)
    .filter(c => c && c.status === 'active' && c.targetType === targetType && c.targetId === targetId);

  return api.request('/api/comments', {
    method: 'GET',
    data: { targetType, targetId, limit: 200 }
  }).then(result => {
    const remote = (result.success && result.data && Array.isArray(result.data.list))
      ? result.data.list.map(normalize).filter(Boolean)
      : [];
    const merged = new Map();
    remote.forEach(c => merged.set(c.id, c));
    local.forEach(c => merged.set(c.id, c));
    return Array.from(merged.values())
      .filter(c => c.status === 'active')
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  });
}

/**
 * 发表评论（本地立即生效，后端尽力同步）
 * @returns {Promise<Object>} 新建的评论
 */
function add(payload = {}) {
  const comment = normalize({
    id: 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
    targetType: payload.targetType,
    targetId: payload.targetId,
    targetName: payload.targetName,
    nickname: payload.nickname,
    content: String(payload.content || '').trim().slice(0, 500),
    rating: payload.rating,
    images: payload.images,
    createdAt: new Date().toISOString(),
    status: 'active'
  });

  if (!comment || !comment.targetId || !comment.content) {
    return Promise.reject(new Error('评论内容不能为空'));
  }

  const all = readLocal().map(normalize).filter(Boolean);
  all.unshift(comment);
  writeLocal(all);

  // 后端同步失败不影响用户发表体验
  api.request('/api/comments', { method: 'POST', data: comment }).catch(() => {});
  return Promise.resolve(comment);
}

module.exports = { list, add, readLocal, STORAGE_KEY };
