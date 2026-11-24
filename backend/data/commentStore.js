/**
 * 评论存储（仅后端使用）
 *
 * - 评论落盘于 backend/data/comments.json，重启不丢失
 * - 小程序端在未配置后端地址时使用本地存储兜底，配置后通过 API 同步至此
 * - 管理员可通过 /api/comments/admin/* 查看、筛选、删除评论
 */
const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, 'comments.json');
const VALID_TYPES = ['story', 'spot', 'route'];

function emptyStore() {
  return { version: 1, comments: [] };
}

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return emptyStore();
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.comments)) return emptyStore();
    return parsed;
  } catch (err) {
    console.error('[CommentStore] 读取评论文件失败:', err.message);
    return emptyStore();
  }
}

function writeStore(store) {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[CommentStore] 写入评论文件失败:', err.message);
    return false;
  }
}

function normalizeType(type) {
  return VALID_TYPES.includes(type) ? type : 'spot';
}

/** 条件查询：targetType / targetId / keyword / status / 时间范围 */
function list(filters = {}) {
  const { targetType, targetId, keyword, status, startDate, endDate, userId } = filters;
  let comments = readStore().comments.slice();
  if (userId) comments = comments.filter(c => c.userId === userId);
  if (targetType) comments = comments.filter(c => c.targetType === normalizeType(targetType));
  if (targetId) comments = comments.filter(c => c.targetId === targetId);
  if (status) comments = comments.filter(c => c.status === status);
  if (keyword) {
    const kw = String(keyword).toLowerCase();
    comments = comments.filter(c =>
      String(c.content || '').toLowerCase().includes(kw) ||
      String(c.nickname || '').toLowerCase().includes(kw) ||
      String(c.targetName || '').toLowerCase().includes(kw)
    );
  }
  if (startDate) comments = comments.filter(c => (c.createdAt || '') >= startDate);
  if (endDate) comments = comments.filter(c => (c.createdAt || '') <= endDate);
  return comments.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

/** 新增评论；返回新建评论 */
function add(payload = {}) {
  const store = readStore();
  const comment = {
    id: payload.id || ('c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6)),
    userId: payload.userId ? String(payload.userId).slice(0, 80) : '',
    targetType: normalizeType(payload.targetType),
    targetId: String(payload.targetId || '').slice(0, 80),
    targetName: String(payload.targetName || '').slice(0, 80),
    nickname: String(payload.nickname || '匿名游客').slice(0, 30),
    content: String(payload.content || '').trim().slice(0, 500),
    rating: Math.max(0, Math.min(5, parseInt(payload.rating, 10) || 0)),
    images: Array.isArray(payload.images) ? payload.images.slice(0, 3) : [],
    createdAt: payload.createdAt || new Date().toISOString(),
    status: 'active'
  };
  if (!comment.targetId || !comment.content) return null;
  // 幂等：同一 id 已存在则直接返回
  if (store.comments.some(c => c.id === comment.id)) return comment;
  store.comments.unshift(comment);
  store.comments = store.comments.slice(0, 1000);
  return writeStore(store) ? comment : null;
}

/** 删除评论（硬删除） */
function remove(id) {
  const store = readStore();
  const before = store.comments.length;
  store.comments = store.comments.filter(c => c.id !== id);
  if (store.comments.length === before) return false;
  return writeStore(store);
}

/** 修改状态（用于屏蔽 / 恢复） */
function setStatus(id, status) {
  const store = readStore();
  const target = store.comments.find(c => c.id === id);
  if (!target) return false;
  target.status = status === 'hidden' ? 'hidden' : 'active';
  return writeStore(store);
}

function stats() {
  const comments = readStore().comments;
  return {
    total: comments.length,
    active: comments.filter(c => c.status === 'active').length,
    hidden: comments.filter(c => c.status === 'hidden').length,
    story: comments.filter(c => c.targetType === 'story').length,
    spot: comments.filter(c => c.targetType === 'spot').length,
    route: comments.filter(c => c.targetType === 'route').length
  };
}

module.exports = { VALID_TYPES, list, add, remove, setStatus, stats };
