/**
 * 小程序用户管理（管理员专用）
 * - 挂载于 /api/wx-users，与管理端账号的 /api/user 完全隔离
 * - 仅返回脱敏 openid；不提供删除，避免遗留无法追溯的评论与内容
 */
const express = require('express');
const wxUserDb = require('../data/wxUserDb');
const commentStore = require('../data/commentStore');
const { authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, adminOnly);

function commentCounts() {
  const counts = {};
  commentStore.list({}).forEach((c) => {
    if (c.userId) counts[c.userId] = (counts[c.userId] || 0) + 1;
  });
  return counts;
}

function decorate(user, comments) {
  return Object.assign({}, wxUserDb.toPublic(user), wxUserDb.contentCounts(user.id), {
    comments: comments[user.id] || 0,
    profileComplete: Boolean(user.nickname || user.avatar_url)
  });
}

router.get('/', (req, res) => {
  const { page, limit, status, keyword } = req.query;
  const result = wxUserDb.listUsers({ page, limit, status, keyword });
  const comments = commentCounts();
  res.json({
    code: 200,
    data: {
      list: result.list.map((u) => decorate(u, comments)),
      total: result.pagination.total,
      pagination: result.pagination,
      stats: wxUserDb.stats()
    }
  });
});

router.get('/stats', (req, res) => {
  res.json({ code: 200, data: wxUserDb.stats() });
});

router.put('/:id/status', (req, res) => {
  const status = req.body && req.body.status;
  const user = wxUserDb.setStatus(req.params.id, status);
  if (!user) return res.status(404).json({ code: 404, message: '用户不存在或状态无效' });
  res.json({ code: 200, message: '状态已更新', data: { status: user.status } });
});

module.exports = router;
