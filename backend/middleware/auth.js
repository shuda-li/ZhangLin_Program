/**
 * 统一鉴权中间件
 * - authenticate: 校验 JWT，挂载 req.user
 * - requireRole(...roles): 在 authenticate 之后校验角色
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const wxUserDb = require('../data/wxUserDb');

// 生产环境未配置 JWT_SECRET 时，使用一次性随机密钥（重启失效），避免硬编码弱密钥
const RUNTIME_SECRET = config.jwtConfigured
  ? config.jwtSecret
  : require('crypto').randomBytes(32).toString('hex');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录或缺少访问令牌' });
  }

  try {
    const decoded = jwt.verify(token, RUNTIME_SECRET);
    // 被禁用的小程序用户：旧令牌在过期前也要立即失效
    if (decoded.role === 'visitor') {
      const wxUser = wxUserDb.findById(decoded.id);
      if (wxUser && wxUser.status !== 'active') {
        return res.status(403).json({ code: 403, message: '账号已被禁用' });
      }
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: '令牌无效或已过期' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未登录' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '没有权限执行此操作' });
    }
    next();
  };
}

module.exports = {
  authenticate,
  requireRole,
  RUNTIME_SECRET,
  adminOnly: requireRole('admin'),
  staffOnly: requireRole('admin', 'guide')
};
