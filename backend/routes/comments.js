/**
 * 评论接口
 * - 公开：按目标查看、发表评论
 * - 管理员：查看全部、筛选、屏蔽/恢复、删除
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const store = require('../data/commentStore');
const { RUNTIME_SECRET, authenticate, adminOnly } = require('../middleware/auth');

const router = express.Router();

// 可选鉴权：已登录用户的公开评论自动绑定 userId，游客仍可匿名发表
function currentUserId(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  try {
    const decoded = jwt.verify(header.slice(7), RUNTIME_SECRET);
    return decoded.id || '';
  } catch (_) {
    return '';
  }
}

// 公开读取：仅返回正常状态评论
router.get('/', (req, res) => {
  const { targetType, targetId, limit } = req.query;
  let list = store.list({ targetType, targetId, status: 'active' });
  if (limit) list = list.slice(0, Math.max(1, parseInt(limit, 10) || 50));
  res.json({ code: 200, data: { list, total: list.length } });
});

// 公开发表
router.post('/', (req, res) => {
  const { targetType, targetId, targetName, nickname, content, rating, images, id, createdAt } = req.body || {};
  if (!store.VALID_TYPES.includes(targetType)) {
    return res.status(400).json({ code: 400, message: '评论目标类型无效' });
  }
  if (!targetId || !String(targetId).trim()) {
    return res.status(400).json({ code: 400, message: '缺少评论目标' });
  }
  const text = String(content || '').trim();
  if (!text) return res.status(400).json({ code: 400, message: '评论内容不能为空' });
  if (text.length > 500) return res.status(400).json({ code: 400, message: '评论内容最多500字' });

  const comment = store.add({
    id,
    userId: currentUserId(req),
    targetType, targetId, targetName, nickname,
    content: text, rating, images, createdAt
  });
  if (!comment) return res.status(500).json({ code: 500, message: '评论保存失败' });
  res.json({ code: 200, data: comment });
});

// ═══ 管理员接口 ═══
router.get('/admin/list', authenticate, adminOnly, (req, res) => {
  const { targetType, targetId, keyword, status, startDate, endDate, page = 1, limit = 10 } = req.query;
  const all = store.list({ targetType, targetId, keyword, status, startDate, endDate });
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const start = (pageNum - 1) * pageSize;
  res.json({
    code: 200,
    data: {
      list: all.slice(start, start + pageSize),
      total: all.length,
      pagination: { page: pageNum, limit: pageSize, total: all.length, pages: Math.ceil(all.length / pageSize) }
    }
  });
});

router.get('/admin/stats', authenticate, adminOnly, (req, res) => {
  res.json({ code: 200, data: store.stats() });
});

router.put('/admin/:id/status', authenticate, adminOnly, (req, res) => {
  const ok = store.setStatus(req.params.id, req.body && req.body.status);
  if (!ok) return res.status(404).json({ code: 404, message: '评论不存在' });
  res.json({ code: 200, message: '状态已更新' });
});

router.delete('/admin/:id', authenticate, adminOnly, (req, res) => {
  const ok = store.remove(req.params.id);
  if (!ok) return res.status(404).json({ code: 404, message: '评论不存在' });
  res.json({ code: 200, message: '评论已删除' });
});

module.exports = router;
