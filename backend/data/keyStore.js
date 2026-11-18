/**
 * AI 密钥安全存储（仅后端使用）
 *
 * 设计要点：
 * - 密钥由管理员在管理后台输入，绝不写入代码、前端或版本库
 * - 落盘前使用 AES-256-GCM 加密，密文保存在 backend/data/.ai-keys.json
 * - 该文件已加入 .gitignore，且设置 0600 权限（Windows 下尽力而为）
 * - 加密主密钥优先取 KEY_STORE_SECRET，其次 JWT_SECRET；两者都未配置时使用
 *   进程级随机密钥（重启后已存密钥不可解密，管理员需重新输入，属安全降级）
 * - 对外只提供脱敏状态，明文密钥不会通过任何接口返回
 */
require('../config'); // 确保 .env 已加载到 process.env
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_PATH = path.join(__dirname, '.ai-keys.json');
const KEY_NAMES = ['deepseek', 'tavily'];

const MASTER_SECRET =
  process.env.KEY_STORE_SECRET ||
  process.env.JWT_SECRET ||
  crypto.randomBytes(32).toString('hex');
const ENC_KEY = crypto.scryptSync(MASTER_SECRET, 'zhanglin-ai-keys-v1', 32);

function emptyStore() {
  return { version: 1, keys: {}, updatedAt: null };
}

function readStore() {
  try {
    if (!fs.existsSync(STORE_PATH)) return emptyStore();
    const parsed = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    if (!parsed || parsed.version !== 1 || !parsed.keys || typeof parsed.keys !== 'object') {
      return emptyStore();
    }
    return parsed;
  } catch (err) {
    console.error('[KeyStore] 读取密钥文件失败:', err.message);
    return emptyStore();
  }
}

function writeStore(store) {
  store.updatedAt = new Date().toISOString();
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), { mode: 0o600 });
  } catch (err) {
    console.error('[KeyStore] 写入密钥文件失败:', err.message);
    throw err;
  }
}

function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return {
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: encrypted.toString('base64')
  };
}

function decrypt(payload) {
  try {
    if (!payload || !payload.iv || !payload.tag || !payload.data) return '';
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, Buffer.from(payload.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'));
    return Buffer.concat([
      decipher.update(Buffer.from(payload.data, 'base64')),
      decipher.final()
    ]).toString('utf8');
  } catch (err) {
    // 主密钥变更或文件损坏：视为未配置，绝不回退读取明文
    return '';
  }
}

function normalizeName(name) {
  return KEY_NAMES.includes(name) ? name : '';
}

/** 读取明文密钥（仅后端内部调用，禁止写日志或返回给前端） */
function getKey(name) {
  const key = normalizeName(name);
  if (!key) return '';
  const store = readStore();
  return store.keys[key] ? decrypt(store.keys[key]) : '';
}

function hasKey(name) {
  return Boolean(getKey(name));
}

/** 设置或清空密钥：value 为 falsy 时删除 */
function setKey(name, value) {
  const key = normalizeName(name);
  if (!key) return false;
  const store = readStore();
  if (value === '' || value === null || value === undefined) {
    delete store.keys[key];
  } else {
    store.keys[key] = encrypt(String(value).trim());
  }
  writeStore(store);
  return true;
}

function mask(value) {
  if (!value) return '';
  const text = String(value);
  if (text.length <= 8) return text.slice(0, 2) + '****';
  return text.slice(0, 4) + '****' + text.slice(-4);
}

/** 返回可安全下发给管理端的脱敏状态 */
function getStatus() {
  const store = readStore();
  const result = {};
  KEY_NAMES.forEach((name) => {
    const plain = store.keys[name] ? decrypt(store.keys[name]) : '';
    result[name] = {
      configured: Boolean(plain),
      masked: mask(plain)
    };
  });
  result.updatedAt = store.updatedAt || null;
  return result;
}

module.exports = {
  KEY_NAMES,
  getKey,
  hasKey,
  setKey,
  getStatus
};
