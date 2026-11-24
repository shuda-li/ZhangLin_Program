/**
 * 小程序用户内容同步
 * - 挂载于 /api/userdata，避免与管理员路由 /api/user 的 adminOnly 冲突
 * - 全量合并：登录后把本地数据上行，返回云端全量结果覆盖本地
 * - 增量同步：本地写操作入队后批量提交，单条幂等
 */
const express = require('express');
const userDataDb = require('../data/userDataDb');
const commentStore = require('../data/commentStore');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function commentsOfUser(userId) {
  return commentStore.list({ userId }).map((c) => ({
    id: c.id,
    targetType: c.targetType,
    targetId: c.targetId,
    targetName: c.targetName,
    nickname: c.nickname,
    content: c.content,
    rating: c.rating,
    images: c.images,
    createdAt: c.createdAt,
    status: c.status
  }));
}

function payloadOf(userId) {
  return Object.assign({}, userDataDb.getAll(userId), { comments: commentsOfUser(userId) });
}

function mergeComments(userId, list) {
  (Array.isArray(list) ? list : []).slice(0, 200).forEach((c) => {
    if (!c || !c.id) return;
    commentStore.add({
      id: c.id,
      userId,
      targetType: c.targetType,
      targetId: c.targetId,
      targetName: c.targetName,
      nickname: c.nickname,
      content: c.content,
      rating: c.rating,
      images: c.images,
      createdAt: c.createdAt
    });
  });
}

router.post('/merge', (req, res) => {
  const payload = req.body || {};
  try {
    userDataDb.mergeAll(req.user.id, payload);
    mergeComments(req.user.id, payload.comments);
    res.json({ code: 200, data: payloadOf(req.user.id) });
  } catch (error) {
    console.error('[userdata] 合并失败:', error.message);
    res.status(500).json({ code: 500, message: '数据合并失败' });
  }
});

router.get('/data', (req, res) => {
  res.json({ code: 200, data: payloadOf(req.user.id) });
});

router.post('/sync', (req, res) => {
  const body = req.body || {};
  const changes = Array.isArray(body.changes) ? body.changes : [];
  let applied = 0;
  const failedIndexes = [];
  const markFailed = (index) => { failedIndexes.push(index); };

  changes.slice(0, 100).forEach((change, index) => {
    if (!change) { markFailed(index); return; }
    const kind = change.kind;
    const op = change.op;
    const item = change.item || {};

    if (kind === 'comment') {
      if (op === 'add' && commentStore.add(Object.assign({}, item, { userId: req.user.id }))) applied += 1;
      else markFailed(index);
      return;
    }

    if (!userDataDb.VALID_KINDS.includes(kind)) { markFailed(index); return; }
    if (op === 'remove') {
      const id = change.id || userDataDb.itemId(kind, item);
      if (userDataDb.removeOne(kind, req.user.id, id)) applied += 1;
      else markFailed(index);
    } else if (op === 'add' || op === 'upsert') {
      if (userDataDb.upsertOne(kind, req.user.id, item)) applied += 1;
      else markFailed(index);
    } else {
      markFailed(index);
    }
  });

  res.json({ code: 200, data: { applied, failed: failedIndexes.length, failedIndexes } });
});

module.exports = router;
