/**
 * 用户内容同步服务
 * - 本地优先：所有写操作先落本地 Storage，再入队异步同步
 * - 登录后全量合并：本地数据上行、云端数据下行，按 id 幂等去重
 * - 失败重试：仅保留服务端明确失败或网络失败的变更，下次启动/登录时重放
 */
const api = require('./api');
const auth = require('./auth');
const KEYS = require('./storage-keys');

const QUEUE_LIMIT = 200;
let flushTimer = null;
let flushing = false;

function readArray(key) {
  try {
    const value = wx.getStorageSync(key);
    return Array.isArray(value) ? value : [];
  } catch (_) {
    return [];
  }
}

function writeArray(key, list) {
  try { wx.setStorageSync(key, list); }
  catch (_) { /* storage full, silently fail */ }
}

function getQueue() {
  return readArray(KEYS.SYNC_QUEUE_KEY);
}

function ready() {
  return api.isBackendConfigured() && auth.isLoggedIn();
}

/** 入队；未登录或后端未配置时仅保留在队列，待登录后重放 */
function enqueue(change) {
  if (!change || !change.kind || !change.op) return;
  const queue = getQueue();
  queue.push(change);
  writeArray(KEYS.SYNC_QUEUE_KEY, queue.slice(-QUEUE_LIMIT));
  if (ready()) scheduleFlush();
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, 600);
}

/** 提交队列；只清除已成功项，失败项保留重试 */
function flush() {
  if (!ready() || flushing) return Promise.resolve({ success: false, reason: 'not-ready' });
  const queue = getQueue();
  if (!queue.length) return Promise.resolve({ success: true, applied: 0, failed: 0 });

  flushing = true;
  return api.request('/api/userdata/sync', { method: 'POST', data: { changes: queue } })
    .then((result) => {
      flushing = false;
      if (!result.success) return result;
      const failedIndexes = (result.data && Array.isArray(result.data.failedIndexes))
        ? result.data.failedIndexes
        : [];
      const retry = failedIndexes.map((i) => queue[i]).filter(Boolean);
      writeArray(KEYS.SYNC_QUEUE_KEY, retry);
      return result.data;
    })
    .catch(() => {
      flushing = false;
      return { success: false, error: '同步失败' };
    });
}

function collectLocal() {
  return {
    favorites: readArray(KEYS.FAVORITE_SPOTS_KEY),
    footprints: readArray(KEYS.RECENT_SPOTS_KEY),
    registrations: readArray(KEYS.ACTIVITY_REGISTRATIONS_KEY),
    comments: readArray(KEYS.SITE_COMMENTS_KEY)
  };
}

function applyCloud(data) {
  if (!data) return;
  if (Array.isArray(data.favorites)) writeArray(KEYS.FAVORITE_SPOTS_KEY, data.favorites.slice(0, 12));
  if (Array.isArray(data.footprints)) writeArray(KEYS.RECENT_SPOTS_KEY, data.footprints.slice(0, 8));
  if (Array.isArray(data.registrations)) writeArray(KEYS.ACTIVITY_REGISTRATIONS_KEY, data.registrations.slice(0, 10));
  if (Array.isArray(data.comments)) {
    const map = new Map();
    // 本地先写入（保留尚未提交的评论），云端后覆盖（管理员屏蔽状态为准）
    readArray(KEYS.SITE_COMMENTS_KEY).forEach((c) => { if (c && c.id) map.set(c.id, c); });
    data.comments.forEach((c) => { if (c && c.id) map.set(c.id, c); });
    writeArray(KEYS.SITE_COMMENTS_KEY, Array.from(map.values()).slice(0, 500));
  }
}

/** 登录成功后调用：先重放队列，再全量合并，最后用云端结果覆盖本地 */
function mergeOnLogin() {
  if (!ready()) return Promise.resolve({ success: false, reason: 'not-ready' });

  return Promise.resolve()
    .then(() => {
      const queue = getQueue();
      if (!queue.length) return null;
      return api.request('/api/userdata/sync', { method: 'POST', data: { changes: queue } });
    })
    .then(() => api.request('/api/userdata/merge', { method: 'POST', data: collectLocal() }))
    .then((result) => {
      if (!result || !result.success) return result || { success: false, error: '合并失败' };
      applyCloud(result.data);
      writeArray(KEYS.SYNC_QUEUE_KEY, []);
      return result;
    });
}

module.exports = {
  enqueue,
  flush,
  mergeOnLogin,
  collectLocal,
  getQueue,
  SYNC_QUEUE_KEY: KEYS.SYNC_QUEUE_KEY
};
