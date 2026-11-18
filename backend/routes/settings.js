/**
 * 管理端 - AI 密钥设置
 *
 * 所有接口均需管理员（admin）权限；密钥明文绝不通过接口返回，
 * 只返回是否已配置与脱敏字符串。密钥加密后由 keyStore 落盘保存。
 */
const express = require('express');
const { authenticate, adminOnly } = require('../middleware/auth');
const keyStore = require('../data/keyStore');
const httpsPost = require('../utils/httpsPost');

const router = express.Router();

// 整个设置路由仅限管理员
router.use(authenticate, adminOnly);

const PLACEHOLDER = /^请替换|^your[-_]|^change[-_]|^sk-请|^tvly-请|^$/i;

function validateKey(name, value) {
  if (value === '' || value === null || value === undefined) return { ok: true, value: '' };
  const text = String(value).trim();
  if (!text) return { ok: true, value: '' };
  if (PLACEHOLDER.test(text)) return { ok: false, message: '请输入真实密钥，不能使用示例占位符' };
  if (/\s/.test(text)) return { ok: false, message: '密钥不能包含空白字符' };
  if (text.length < 8 || text.length > 300) return { ok: false, message: '密钥长度不合法' };
  if (name === 'deepseek' && !/^sk-/i.test(text)) {
    return { ok: false, message: 'DeepSeek 密钥应以 sk- 开头' };
  }
  if (name === 'tavily' && !/^tvly-/i.test(text)) {
    return { ok: false, message: 'Tavily 密钥应以 tvly- 开头' };
  }
  return { ok: true, value: text };
}

/** GET /api/settings/ai-keys 查看脱敏状态 */
router.get('/ai-keys', (req, res) => {
  res.json({ code: 200, data: keyStore.getStatus() });
});

/** PUT /api/settings/ai-keys 更新密钥 body: { deepseek?, tavily? } */
router.put('/ai-keys', (req, res) => {
  const body = req.body || {};
  const updates = {};

  for (const name of keyStore.KEY_NAMES) {
    if (!Object.prototype.hasOwnProperty.call(body, name)) continue;
    const check = validateKey(name, body[name]);
    if (!check.ok) {
      return res.status(400).json({ code: 400, message: `${name} 密钥无效：${check.message}` });
    }
    updates[name] = check.value;
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ code: 400, message: '没有可更新的密钥字段' });
  }

  try {
    Object.keys(updates).forEach((name) => keyStore.setKey(name, updates[name]));
  } catch (err) {
    return res.status(500).json({ code: 500, message: '密钥保存失败，请检查后端存储权限' });
  }

  res.json({ code: 200, data: keyStore.getStatus(), message: '密钥已保存（加密存储）' });
});

/** DELETE /api/settings/ai-keys/:name 清除指定密钥 */
router.delete('/ai-keys/:name', (req, res) => {
  const name = req.params.name;
  if (!keyStore.KEY_NAMES.includes(name)) {
    return res.status(400).json({ code: 400, message: '不支持的密钥类型' });
  }
  keyStore.setKey(name, '');
  res.json({ code: 200, data: keyStore.getStatus(), message: '密钥已清除' });
});

/**
 * POST /api/settings/ai-keys/verify 验证 DeepSeek 密钥可用性
 * 仅管理员可调用；不返回密钥，只返回可用状态。
 */
router.post('/ai-keys/verify', async (req, res) => {
  const key = keyStore.getKey('deepseek');
  if (!key) {
    return res.status(400).json({ code: 400, message: '尚未配置 DeepSeek 密钥' });
  }

  try {
    const result = await httpsPost(
      'https://api.deepseek.com/chat/completions',
      { Authorization: `Bearer ${key}` },
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: '请只回复“ok”两个字。' }],
        max_tokens: 5,
        stream: false
      },
      10000
    );
    if (result.statusCode >= 200 && result.statusCode < 300) {
      return res.json({ code: 200, data: { valid: true }, message: '密钥可用' });
    }
    if (result.statusCode === 401 || result.statusCode === 403) {
      return res.json({ code: 200, data: { valid: false }, message: '密钥无效或权限不足' });
    }
    return res.json({ code: 200, data: { valid: false }, message: '验证请求失败，请稍后重试' });
  } catch (err) {
    return res.json({ code: 200, data: { valid: false }, message: '无法连接 AI 服务：' + err.message });
  }
});

module.exports = router;
