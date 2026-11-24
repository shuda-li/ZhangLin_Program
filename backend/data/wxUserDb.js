/**
 * 小程序用户持久化（SQLite）
 * - 数据库文件位于 backend/data/zhanglin.db，已加入 .gitignore
 * - 身份锚点为 openid；unionid 可选（需绑定微信开放平台后才有）
 * - 仅存放必要个人信息，手机号字段预留但本期不采集
 * - P2：支持头像昵称更新、管理端分页查询与状态管理
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let Database;
try {
  Database = require('better-sqlite3');
} catch (error) {
  throw new Error('缺少 better-sqlite3 依赖，请在 backend 目录执行 npm install');
}

const DB_PATH = process.env.WX_DB_PATH || path.join(__dirname, 'zhanglin.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS wx_users (
    id TEXT PRIMARY KEY,
    openid TEXT NOT NULL UNIQUE,
    unionid TEXT UNIQUE,
    nickname TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    phone_enc TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL,
    last_login_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_wx_users_unionid ON wx_users(unionid);
  CREATE INDEX IF NOT EXISTS idx_wx_users_status ON wx_users(status);
`);

function nowIso() {
  return new Date().toISOString();
}

function maskOpenid(openid) {
  if (!openid) return '';
  if (openid.length <= 8) return openid.slice(0, 2) + '***';
  return openid.slice(0, 4) + '***' + openid.slice(-4);
}

function findByOpenid(openid) {
  if (!openid) return null;
  return db.prepare('SELECT * FROM wx_users WHERE openid = ?').get(openid) || null;
}

function findById(id) {
  if (!id) return null;
  return db.prepare('SELECT * FROM wx_users WHERE id = ?').get(id) || null;
}

/**
 * 按 openid 查找或创建用户，并刷新最后登录时间。
 * 返回 { user, isNewUser }。
 */
const upsertByOpenid = db.transaction(({ openid, unionid }) => {
  const existing = findByOpenid(openid);
  const timestamp = nowIso();

  if (existing) {
    const nextUnionid = unionid || existing.unionid;
    db.prepare('UPDATE wx_users SET unionid = ?, last_login_at = ? WHERE id = ?')
      .run(nextUnionid, timestamp, existing.id);
    return { user: findById(existing.id), isNewUser: false };
  }

  const user = {
    id: crypto.randomUUID(),
    openid,
    unionid: unionid || null,
    nickname: '',
    avatar_url: '',
    phone_enc: null,
    status: 'active',
    created_at: timestamp,
    last_login_at: timestamp
  };
  db.prepare(`
    INSERT INTO wx_users (id, openid, unionid, nickname, avatar_url, phone_enc, status, created_at, last_login_at)
    VALUES (@id, @openid, @unionid, @nickname, @avatar_url, @phone_enc, @status, @created_at, @last_login_at)
  `).run(user);
  return { user: findById(user.id), isNewUser: true };
});

/** 对外输出：不暴露 openid / unionid 原文，仅提供脱敏值 */
function toPublic(user) {
  if (!user) return null;
  return {
    id: user.id,
    nickname: user.nickname || '微信用户',
    avatarUrl: user.avatar_url || '',
    openidMasked: maskOpenid(user.openid),
    role: 'visitor',
    status: user.status,
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at
  };
}

/** 昵称与头像更新：只更新传入的字段，空字符串表示清空 */
function updateProfile(id, { nickname, avatarUrl } = {}) {
  if (!id || !findById(id)) return null;
  const sets = [];
  const params = { id };

  if (nickname !== undefined) {
    const clean = String(nickname == null ? '' : nickname).trim();
    if (clean.length > 32) throw new Error('昵称不能超过 32 个字符');
    sets.push('nickname = @nickname');
    params.nickname = clean.slice(0, 32);
  }
  if (avatarUrl !== undefined) {
    const clean = String(avatarUrl == null ? '' : avatarUrl).trim();
    if (clean.length > 500) throw new Error('头像地址过长');
    // 只允许站内相对路径或空值，避免存储外部可执行链接
    if (clean && !/^\/uploads\/[A-Za-z0-9_./-]+\.(jpg|jpeg|png|webp)(\?t=\d+)?$/i.test(clean)) {
      throw new Error('头像地址格式不合法');
    }
    sets.push('avatar_url = @avatarUrl');
    params.avatarUrl = clean;
  }

  if (sets.length) {
    db.prepare(`UPDATE wx_users SET ${sets.join(', ')} WHERE id = @id`).run(params);
  }
  return findById(id);
}

/** 管理端分页查询：支持昵称 / openid 关键词与状态筛选 */
function listUsers({ page = 1, limit = 10, status = '', keyword = '' } = {}) {
  const where = [];
  const params = {};
  if (status === 'active' || status === 'disabled') {
    where.push('status = @status');
    params.status = status;
  }
  if (keyword) {
    where.push('(nickname LIKE @keyword OR openid LIKE @keyword OR id LIKE @keyword)');
    params.keyword = '%' + String(keyword).slice(0, 80) + '%';
  }
  const clause = where.length ? ' WHERE ' + where.join(' AND ') : '';
  const total = db.prepare('SELECT COUNT(*) AS n FROM wx_users' + clause).get(params).n;
  const size = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const current = Math.max(parseInt(page, 10) || 1, 1);

  // better-sqlite3 不支持占位符替换 LIMIT 关键字，单独构造安全 SQL（size/page 已做整数校验）
  const list = db.prepare('SELECT * FROM wx_users' + clause +
    ' ORDER BY created_at DESC LIMIT ' + size + ' OFFSET ' + ((current - 1) * size)
  ).all(params);

  return {
    list,
    pagination: {
      page: current,
      limit: size,
      total,
      pages: Math.ceil(total / size)
    }
  };
}

function setStatus(id, status) {
  if (!['active', 'disabled'].includes(status)) return null;
  const user = findById(id);
  if (!user) return null;
  db.prepare('UPDATE wx_users SET status = ? WHERE id = ?').run(status, id);
  return findById(id);
}

function stats() {
  const row = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN status = 'disabled' THEN 1 ELSE 0 END) AS disabled,
      SUM(CASE WHEN nickname <> '' OR avatar_url <> '' THEN 1 ELSE 0 END) AS completed
    FROM wx_users
  `).get();
  return {
    total: row.total || 0,
    active: row.active || 0,
    disabled: row.disabled || 0,
    completed: row.completed || 0
  };
}

/** 用户内容数量（管理端列表展示，避免 N+1 查询由调用方按需取用） */
function contentCounts(userId) {
  if (!userId) return { favorites: 0, footprints: 0, registrations: 0 };
  return {
    favorites: db.prepare('SELECT COUNT(*) AS n FROM user_favorites WHERE user_id = ?').get(userId).n,
    footprints: db.prepare('SELECT COUNT(*) AS n FROM user_footprints WHERE user_id = ?').get(userId).n,
    registrations: db.prepare('SELECT COUNT(*) AS n FROM user_registrations WHERE user_id = ?').get(userId).n
  };
}

module.exports = {
  db,
  findByOpenid,
  findById,
  upsertByOpenid,
  updateProfile,
  listUsers,
  setStatus,
  stats,
  contentCounts,
  toPublic,
  maskOpenid
};
