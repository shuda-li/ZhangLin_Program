/**
 * 用户内容持久化（与 wx_users 同一个 SQLite 库）
 * - 收藏 / 足迹 / 活动报名按 (user_id, 目标 id) 唯一，重复写入幂等
 * - 合并策略：收藏与报名保留最早创建时间，足迹保留最近访问时间
 */
const { db } = require('./wxUserDb');

db.exec(`
  CREATE TABLE IF NOT EXISTS user_favorites (
    user_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_name TEXT NOT NULL DEFAULT '',
    target_image TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, target_id)
  );
  CREATE TABLE IF NOT EXISTS user_footprints (
    user_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_name TEXT NOT NULL DEFAULT '',
    target_image TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    visited_at TEXT NOT NULL,
    PRIMARY KEY (user_id, target_id)
  );
  CREATE TABLE IF NOT EXISTS user_registrations (
    user_id TEXT NOT NULL,
    activity_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL DEFAULT '',
    place TEXT NOT NULL DEFAULT '',
    image TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, activity_id)
  );
`);

const nowIso = () => new Date().toISOString();
const str = (value, max) => String(value == null ? '' : value).slice(0, max);

function toIso(value, fallback) {
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? fallback : d.toISOString();
  }
  if (typeof value === 'string' && value) {
    const ts = Date.parse(value);
    return isNaN(ts) ? fallback : new Date(ts).toISOString();
  }
  return fallback;
}

// ═══ 下行：转为小程序本地存储格式 ═══
function toFavoriteLocal(row) {
  return { id: row.target_id, name: row.target_name, image: row.target_image, summary: row.summary || '' };
}
function toFootprintLocal(row) {
  return {
    id: row.target_id,
    name: row.target_name,
    image: row.target_image,
    summary: row.summary || '',
    time: Date.parse(row.visited_at) || Date.now()
  };
}
function toRegistrationLocal(row) {
  return { id: row.activity_id, title: row.title, date: row.date, place: row.place, image: row.image };
}

function getAll(userId) {
  if (!userId) return { favorites: [], footprints: [], registrations: [] };
  return {
    favorites: db.prepare('SELECT * FROM user_favorites WHERE user_id = ? ORDER BY created_at DESC').all(userId).map(toFavoriteLocal),
    footprints: db.prepare('SELECT * FROM user_footprints WHERE user_id = ? ORDER BY visited_at DESC').all(userId).map(toFootprintLocal),
    registrations: db.prepare('SELECT * FROM user_registrations WHERE user_id = ? ORDER BY created_at DESC').all(userId).map(toRegistrationLocal)
  };
}

// ═══ upsert：保留最早创建时间 / 最近访问时间 ═══
const UPSERT_SQL = {
  favorite: `
    INSERT INTO user_favorites (user_id, target_id, target_name, target_image, summary, created_at)
    VALUES (@user_id, @target_id, @target_name, @target_image, @summary, @created_at)
    ON CONFLICT(user_id, target_id) DO UPDATE SET
      target_name = excluded.target_name,
      target_image = excluded.target_image,
      summary = excluded.summary,
      created_at = MIN(user_favorites.created_at, excluded.created_at)`,
  footprint: `
    INSERT INTO user_footprints (user_id, target_id, target_name, target_image, summary, visited_at)
    VALUES (@user_id, @target_id, @target_name, @target_image, @summary, @visited_at)
    ON CONFLICT(user_id, target_id) DO UPDATE SET
      target_name = excluded.target_name,
      target_image = excluded.target_image,
      summary = excluded.summary,
      visited_at = MAX(user_footprints.visited_at, excluded.visited_at)`,
  registration: `
    INSERT INTO user_registrations (user_id, activity_id, title, date, place, image, created_at)
    VALUES (@user_id, @activity_id, @title, @date, @place, @image, @created_at)
    ON CONFLICT(user_id, activity_id) DO UPDATE SET
      title = excluded.title,
      date = excluded.date,
      place = excluded.place,
      image = excluded.image,
      created_at = MIN(user_registrations.created_at, excluded.created_at)`
};

function normalizeItem(kind, item, userId) {
  if (!item) return null;
  if (kind === 'favorite') {
    const id = str(item.id || item.targetId, 80);
    if (!id) return null;
    return {
      user_id: userId,
      target_id: id,
      target_name: str(item.name || item.targetName, 80),
      target_image: str(item.image || item.targetImage, 500),
      summary: str(item.summary, 200),
      created_at: toIso(item.createdAt, nowIso())
    };
  }
  if (kind === 'footprint') {
    const id = str(item.id || item.targetId, 80);
    if (!id) return null;
    return {
      user_id: userId,
      target_id: id,
      target_name: str(item.name || item.targetName, 80),
      target_image: str(item.image || item.targetImage, 500),
      summary: str(item.summary, 200),
      visited_at: toIso(item.time || item.visitedAt, nowIso())
    };
  }
  if (kind === 'registration') {
    const id = str(item.id || item.activityId, 80);
    if (!id) return null;
    return {
      user_id: userId,
      activity_id: id,
      title: str(item.title, 120),
      date: str(item.date, 80),
      place: str(item.place, 80),
      image: str(item.image, 500),
      created_at: toIso(item.createdAt, nowIso())
    };
  }
  return null;
}

function itemId(kind, item) {
  if (!item) return '';
  if (kind === 'registration') return str(item.id || item.activityId, 80);
  return str(item.id || item.targetId, 80);
}

const upsertOne = db.transaction((kind, userId, item) => {
  const normalized = normalizeItem(kind, item, userId);
  if (!normalized || !UPSERT_SQL[kind]) return false;
  db.prepare(UPSERT_SQL[kind]).run(normalized);
  return true;
});

function removeOne(kind, userId, id) {
  if (!id || !['favorite', 'footprint', 'registration'].includes(kind)) return false;
  const table = kind === 'favorite' ? 'user_favorites' : kind === 'footprint' ? 'user_footprints' : 'user_registrations';
  const column = kind === 'registration' ? 'activity_id' : 'target_id';
  db.prepare(`DELETE FROM ${table} WHERE user_id = ? AND ${column} = ?`).run(userId, str(id, 80));
  // 删除幂等：云端本就没有该记录也视为成功，避免重试队列无法清空
  return true;
}

const mergeAll = db.transaction((userId, payload = {}) => {
  const groups = {
    favorite: Array.isArray(payload.favorites) ? payload.favorites : [],
    footprint: Array.isArray(payload.footprints) ? payload.footprints : [],
    registration: Array.isArray(payload.registrations) ? payload.registrations : []
  };
  Object.keys(groups).forEach((kind) => {
    groups[kind].slice(0, 200).forEach((item) => upsertOne(kind, userId, item));
  });
  return getAll(userId);
});

module.exports = {
  getAll,
  mergeAll,
  upsertOne,
  removeOne,
  itemId,
  VALID_KINDS: ['favorite', 'footprint', 'registration']
};
