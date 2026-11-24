/**
 * 头像上传（仅小程序登录用户）
 * - 接收压缩后的 base64 图片，落盘到 data/avatars，返回可访问站内路径
 * - 目录不入库；仅允许 jpg/png/webp，并做魔数校验，避免伪装文件
 */
const express = require('express');
const fs = require('fs');
const path = require('path');
const wxUserDb = require('../data/wxUserDb');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const AVATAR_DIR = process.env.WX_AVATAR_DIR || path.join(__dirname, '..', 'data', 'avatars');
const MAX_BYTES = 512 * 1024;
fs.mkdirSync(AVATAR_DIR, { recursive: true });

function detectExt(buffer) {
  if (buffer.length > 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length > 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'png';
  if (buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return '';
}

router.post('/avatar', authenticate, (req, res) => {
  const image = req.body && req.body.image;
  if (typeof image !== 'string' || !image) {
    return res.status(400).json({ code: 400, message: '缺少图片数据' });
  }

  const match = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/i);
  if (!match) {
    return res.status(400).json({ code: 400, message: '仅支持 JPG / PNG / WebP 图片' });
  }

  let buffer;
  try {
    buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  } catch (error) {
    return res.status(400).json({ code: 400, message: '图片数据解析失败' });
  }
  if (!buffer.length || buffer.length > MAX_BYTES) {
    return res.status(413).json({ code: 413, message: '图片不能超过 512KB，请压缩后再上传' });
  }
  const ext = detectExt(buffer);
  if (!ext || ext !== match[1].toLowerCase().replace('jpeg', 'jpg')) {
    return res.status(400).json({ code: 400, message: '图片格式与内容不一致' });
  }

  const user = wxUserDb.findById(req.user.id);
  if (!user) return res.status(401).json({ code: 401, message: '用户不存在' });
  if (user.status !== 'active') return res.status(403).json({ code: 403, message: '账号已被禁用' });

  // 文件名仅由服务端生成的 uuid 与白名单扩展名组成，杜绝路径注入
  const target = path.join(AVATAR_DIR, user.id + '.' + ext);
  try {
    fs.readdirSync(AVATAR_DIR).forEach((name) => {
      if (name.startsWith(user.id + '.') && path.join(AVATAR_DIR, name) !== target) {
        fs.unlinkSync(path.join(AVATAR_DIR, name));
      }
    });
    fs.writeFileSync(target, buffer);
  } catch (error) {
    console.error('[upload] 头像写入失败:', error.message);
    return res.status(500).json({ code: 500, message: '头像保存失败' });
  }

  const avatarUrl = '/uploads/avatars/' + user.id + '.' + ext + '?t=' + Date.now();
  wxUserDb.updateProfile(user.id, { avatarUrl });
  res.json({
    code: 200,
    data: { avatarUrl, user: wxUserDb.toPublic(wxUserDb.findById(user.id)) }
  });
});

module.exports = router;
