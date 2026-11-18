/**
 * AI 代理路由
 * 作用：把 DeepSeek / Tavily 的 API 调用与密钥收敛到后端，
 * 前端不再持有任何第三方 API Key。
 * 密钥来源：管理员在管理后台输入，由 keyStore 加密存储（不再使用环境变量）。
 */
const express = require('express');
const keyStore = require('../data/keyStore');
const httpsPost = require('../utils/httpsPost');

const router = express.Router();

const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';
const TAVILY_URL = 'https://api.tavily.com/search';

// 简易内存限流：同一 IP 每分钟最多 N 次请求，防止密钥被恶意刷取
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 20;
const rateStore = new Map();

function rateLimit(req) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateStore.get(ip);

  if (!record || now - record.windowStart > RATE_WINDOW_MS) {
    rateStore.set(ip, { windowStart: now, count: 1 });
    return true;
  }

  if (record.count >= RATE_MAX) {
    return false;
  }

  record.count += 1;
  return true;
}

// 定期清理过期记录，避免内存增长
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateStore) {
    if (now - record.windowStart > RATE_WINDOW_MS) rateStore.delete(ip);
  }
}, RATE_WINDOW_MS).unref();

function serviceUnavailable(res, name) {
  return res.status(503).json({
    code: 503,
    message: `${name} 服务尚未配置密钥，请管理员在后台「AI 密钥设置」中输入`
  });
}

/**
 * POST /api/ai/chat
 * body: { messages: [{role, content}], model?, temperature?, max_tokens? }
 * 后端从 keyStore 读取管理员配置的密钥，前端只传对话内容。
 */
router.post('/chat', async (req, res) => {
  if (!rateLimit(req)) {
    return res.status(429).json({ code: 429, message: '请求过于频繁，请稍后再试' });
  }

  const deepseekKey = keyStore.getKey('deepseek');
  if (!deepseekKey) {
    return serviceUnavailable(res, 'AI 问答');
  }

  const messages = req.body && req.body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ code: 400, message: 'messages 不能为空' });
  }

  // 基本输入校验：限制条数、角色与内容长度，避免被用作任意 token 消耗器
  const sanitized = messages.slice(-20).map((m) => ({
    role: ['system', 'user', 'assistant'].includes(m && m.role) ? m.role : 'user',
    content: String((m && m.content) || '').slice(0, 4000)
  }));

  try {
    const result = await httpsPost(
      DEEPSEEK_URL,
      { Authorization: `Bearer ${deepseekKey}` },
      {
        model: 'deepseek-chat',
        messages: sanitized,
        temperature: 0.7,
        max_tokens: 500
      }
    );

    if (result.statusCode < 200 || result.statusCode >= 300) {
      console.error('[AI Proxy] DeepSeek 返回错误:', result.statusCode, result.data);
      return res.status(502).json({ code: 502, message: 'AI 服务暂时不可用' });
    }

    return res.json({ code: 200, data: result.data });
  } catch (error) {
    console.error('[AI Proxy] DeepSeek 调用失败:', error.message);
    return res.status(502).json({ code: 502, message: 'AI 服务连接失败' });
  }
});

/**
 * POST /api/ai/search
 * body: { query, search_depth?, max_results? }
 * Tavily 联网搜索代理（密钥可选）。
 */
router.post('/search', async (req, res) => {
  if (!rateLimit(req)) {
    return res.status(429).json({ code: 429, message: '请求过于频繁，请稍后再试' });
  }

  const tavilyKey = keyStore.getKey('tavily');
  if (!tavilyKey) {
    return serviceUnavailable(res, '联网搜索');
  }

  const query = req.body && req.body.query;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ code: 400, message: 'query 不能为空' });
  }

  try {
    const result = await httpsPost(
      TAVILY_URL,
      {},
      {
        api_key: tavilyKey,
        query: query.slice(0, 1000),
        search_depth: req.body.search_depth === 'advanced' ? 'advanced' : 'basic',
        max_results: Math.min(Number(req.body.max_results) || 3, 10),
        include_answer: true,
        include_raw_content: false
      }
    );

    if (result.statusCode < 200 || result.statusCode >= 300) {
      console.error('[AI Proxy] Tavily 返回错误:', result.statusCode, result.data);
      return res.status(502).json({ code: 502, message: '搜索服务暂时不可用' });
    }

    return res.json({ code: 200, data: result.data });
  } catch (error) {
    console.error('[AI Proxy] Tavily 调用失败:', error.message);
    return res.status(502).json({ code: 502, message: '搜索服务连接失败' });
  }
});

module.exports = router;
