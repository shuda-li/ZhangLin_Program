const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { users } = require('../data/mockData');
const wxUserDb = require('../data/wxUserDb');
const { code2Session } = require('../utils/wxApi');
const { RUNTIME_SECRET, authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_EXPIRES_IN = '24h';

// ═══ 小程序微信登录（静默，无需用户授权） ═══
router.post('/wx-login', async (req, res) => {
  const code = req.body && req.body.code;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ code: 400, message: '缺少微信登录凭证 code' });
  }

  let identity;
  let devMode = false;

  if (config.wxConfigured) {
    try {
      identity = await code2Session({
        appId: config.wxAppId,
        appSecret: config.wxAppSecret,
        code
      });
    } catch (error) {
      console.error('[wx-login] code2session 失败:', error.message);
      return res.status(502).json({ code: 502, message: '微信登录服务暂不可用，请稍后重试' });
    }
  } else {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ code: 503, message: '微信登录尚未配置' });
    }
    devMode = true;
    identity = { openid: config.wxDevOpenId, unionid: null };
  }

  try {
    const { user, isNewUser } = wxUserDb.upsertByOpenid(identity);
    const token = jwt.sign(
      { id: user.id, role: 'visitor' },
      RUNTIME_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    res.json({
      code: 200,
      message: isNewUser ? '登录并创建账号成功' : '登录成功',
      data: {
        token,
        user: wxUserDb.toPublic(user),
        isNewUser,
        devMode
      }
    });
  } catch (error) {
    console.error('[wx-login] 用户写入失败:', error.message);
    res.status(500).json({ code: 500, message: '登录失败，请稍后重试' });
  }
});

// ═══ 管理端用户名密码登录（保持不变） ═══
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);

  if (!user) {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }

  if (bcrypt.compareSync(password, user.password)) {
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, RUNTIME_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
          avatar: user.avatar
        }
      }
    });
  } else {
    return res.status(401).json({ code: 401, message: '用户名或密码错误' });
  }
});

router.post('/register', (req, res) => {
  const { username, password, nickname } = req.body;

  if (!username || !password || !nickname) {
    return res.status(400).json({ code: 400, message: '请填写完整信息' });
  }

  const exists = users.find(u => u.username === username);
  if (exists) {
    return res.status(400).json({ code: 400, message: '用户名已存在' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  const newUser = {
    id: String(Date.now()),
    username,
    password: hashedPassword,
    nickname,
    avatar: '',
    // 角色由服务端固定为 visitor，忽略客户端传入值，防止自助注册管理员
    role: 'visitor',
    status: 'active',
    createdAt: new Date().toISOString().split('T')[0],
    lastLogin: null
  };

  users.push(newUser);

  res.json({
    code: 200,
    message: '注册成功',
    data: {
      id: newUser.id,
      username: newUser.username,
      nickname: newUser.nickname,
      role: newUser.role
    }
  });
});

// 更新小程序用户头像昵称（仅微信用户；管理端账号资料不在本接口修改）
router.put('/profile', authenticate, (req, res) => {
  const wxUser = wxUserDb.findById(req.user.id);
  if (!wxUser) {
    return res.status(404).json({ code: 404, message: '微信用户不存在' });
  }
  if (wxUser.status !== 'active') {
    return res.status(403).json({ code: 403, message: '账号已被禁用' });
  }
  const body = req.body || {};
  try {
    const updated = wxUserDb.updateProfile(req.user.id, {
      nickname: body.nickname,
      avatarUrl: body.avatarUrl
    });
    res.json({ code: 200, message: '资料已更新', data: wxUserDb.toPublic(updated) });
  } catch (error) {
    res.status(400).json({ code: 400, message: error.message || '资料格式不正确' });
  }
});

// 兼容管理端账号与小程序微信账号
router.get('/profile', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.user.id);

  if (user) {
    return res.json({
      code: 200,
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });
  }

  const wxUser = wxUserDb.findById(req.user.id);
  if (!wxUser) {
    return res.status(401).json({ code: 401, message: '用户不存在' });
  }

  res.json({ code: 200, data: wxUserDb.toPublic(wxUser) });
});

module.exports = router;
