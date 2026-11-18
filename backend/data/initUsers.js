/**
 * 种子用户密码初始化
 * 启动服务时用环境变量中的明文密码生成有效 bcrypt 哈希，替换 mockData 中的占位哈希。
 * 这样密码哈希不硬编码在代码里，生产环境通过 .env 注入。
 */
const bcrypt = require('bcryptjs');
const { users } = require('./mockData');
const config = require('../config');

// 开发期默认密码；生产必须通过 .env 的 ADMIN_PASSWORD 覆盖
const DEFAULT_PASSWORD = 'admin123';

function initializeUserPasswords() {
  const plain = config.isConfigured(config.adminPassword)
    ? config.adminPassword
    : DEFAULT_PASSWORD;

  const hash = bcrypt.hashSync(plain, 10);
  let changed = false;

  users.forEach((user) => {
    if (user.password !== hash) {
      user.password = hash;
      changed = true;
    }
  });

  if (!config.isConfigured(config.adminPassword)) {
    console.warn('[安全警告] ADMIN_PASSWORD 未配置，使用开发默认密码。生产环境请务必设置强密码。');
  }

  return changed;
}

module.exports = { initializeUserPasswords, DEFAULT_PASSWORD };
