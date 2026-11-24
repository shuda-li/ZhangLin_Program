/**
 * 评论服务
 *
 * 设计：本地持久化为主，后端同步为辅
 * - 未配置后端或游客状态：评论保存在本地，功能完全可用
 * - 已登录：新评论进入同步队列写入后端并绑定 userId，管理端可识别来源
 * - 列表读取时合并本地与后端数据（按 id 去重），云端状态优先（含屏蔽状态）
 */
const api = require('./api');
const auth = require('./auth');
const sync = require('./sync-service');
const KEYS = require('./storage-keys');

const STORAGE_KEY = KEYS.SITE_COMMENTS_KEY;
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
    .filter(c => c && c.targetType === targetType && c.targetId === targetId);

  return api.request('/api/comments', {
    method: 'GET',
    data: { targetType, targetId, limit: 200 }
  }).then(result => {
    const remote = (result.success && result.data && Array.isArray(result.data.list))
      ? result.data.list.map(normalize).filter(Boolean)
      : [];
    const merged = new Map();
    local.forEach(c => merged.set(c.id, c));
    // 云端优先：管理员屏蔽状态能覆盖本地缓存
    remote.forEach(c => merged.set(c.id, c));
    return Array.from(merged.values())
      .filter(c => c.status === 'active')
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  });
}

/**
 * 发表评论（本地立即生效，云端异步同步）
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

  if (auth.isLoggedIn()) {
    // 已登录：走同步队列，后端会绑定 userId
    sync.enqueue({ kind: 'comment', op: 'add', item: comment });
  } else {
    // 游客：保留原有匿名同步，管理端仍可见但无用户归属
    api.request('/api/comments', { method: 'POST', data: comment }).catch(() => {});
  }
  return Promise.resolve(comment);
}

module.exports = { list, add, readLocal, STORAGE_KEY };
