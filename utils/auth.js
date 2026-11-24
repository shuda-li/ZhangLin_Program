/**
 * 小程序登录态管理
 * - 静默登录：wx.login 取 code，交后端换取 openid 与本系统 JWT
 * - 未配置后端或网络异常时静默降级为游客，不阻塞页面
 * - P0 仅建立身份；头像昵称授权与本地数据合并留待后续阶段
 */
const api = require('./api');

const TOKEN_KEY = 'zl_wx_token';
const USER_KEY = 'zl_wx_user';

let pendingLogin = null;

function getToken() {
  try { return wx.getStorageSync(TOKEN_KEY) || ''; }
  catch (_) { return ''; }
}

function getCachedUser() {
  try { return wx.getStorageSync(USER_KEY) || null; }
  catch (_) { return null; }
}

function setSession(token, user) {
  try {
    wx.setStorageSync(TOKEN_KEY, token);
    wx.setStorageSync(USER_KEY, user || null);
  } catch (_) { /* storage full, silently fail */ }
}

function clearSession() {
  try {
    wx.removeStorageSync(TOKEN_KEY);
    wx.removeStorageSync(USER_KEY);
  } catch (_) { /* ignore */ }
}

function isLoggedIn() {
  return Boolean(getToken() && getCachedUser());
}

function fetchLoginCode() {
  return new Promise((resolve, reject) => {
    if (typeof wx.login !== 'function') {
      reject(new Error('当前环境不支持微信登录'));
      return;
    }
    wx.login({
      timeout: 10000,
      success: (res) => {
        if (res && res.code) resolve(res.code);
        else reject(new Error('获取微信登录凭证失败'));
      },
      fail: () => reject(new Error('微信登录调用失败'))
    });
  });
}

function postWxLogin(code) {
  return new Promise((resolve) => {
    wx.request({
      url: api.getBaseUrl() + '/api/auth/wx-login',
      method: 'POST',
      timeout: 15000,
      header: { 'Content-Type': 'application/json' },
      data: { code },
      success: (res) => {
        const body = res.data;
        const ok = res.statusCode >= 200 && res.statusCode < 300 && body && body.code === 200;
        if (ok && body.data && body.data.token) {
          resolve({ success: true, data: body.data });
        } else {
          resolve({ success: false, error: (body && body.message) || '登录失败' });
        }
      },
      fail: () => resolve({ success: false, error: '网络连接失败' })
    });
  });
}

/** 静默登录；并发调用共用同一个请求，失败不抛异常 */
function silentLogin() {
  if (!api.isBackendConfigured()) {
    return Promise.resolve({ success: false, error: '后端服务未配置' });
  }
  if (pendingLogin) return pendingLogin;

  pendingLogin = fetchLoginCode()
    .then((code) => postWxLogin(code))
    .then((result) => {
      if (result.success) setSession(result.data.token, result.data.user);
      return result;
    })
    .catch((error) => ({ success: false, error: error.message || '登录失败' }))
    .then((result) => {
      pendingLogin = null;
      return result;
    });

  return pendingLogin;
}

/** 有本地登录态则直接返回，否则尝试静默登录 */
function ensureLogin() {
  if (isLoggedIn()) return Promise.resolve({ success: true, cached: true });
  return silentLogin();
}

function logout() {
  clearSession();
  return Promise.resolve({ success: true });
}

/** 更新头像昵称资料，成功后同步本地缓存 */
function updateProfile(payload) {
  return api.request('/api/auth/profile', { method: 'PUT', data: payload || {} })
    .then((result) => {
      if (result && result.success && result.data) {
        const current = getCachedUser() || {};
        setSession(getToken(), Object.assign({}, current, result.data));
      }
      return result;
    });
}

function compressImage(filePath) {
  return new Promise((resolve) => {
    if (typeof wx.compressImage !== 'function') { resolve(filePath); return; }
    wx.compressImage({
      src: filePath,
      quality: 70,
      success: (res) => resolve((res && res.tempFilePath) || filePath),
      fail: () => resolve(filePath)
    });
  });
}

function readBase64(filePath) {
  return new Promise((resolve, reject) => {
    try {
      wx.getFileSystemManager().readFile({
        filePath,
        encoding: 'base64',
        success: (res) => resolve(res.data || ''),
        fail: () => reject(new Error('读取头像文件失败'))
      });
    } catch (error) {
      reject(new Error('读取头像文件失败'));
    }
  });
}

function imageExtOf(base64) {
  if (base64.indexOf('/9j/') === 0) return 'jpeg';
  if (base64.indexOf('iVBOR') === 0) return 'png';
  if (base64.indexOf('UklGR') === 0) return 'webp';
  return '';
}

/** 压缩并上传头像，返回 { success, data: { avatarUrl } } */
function uploadAvatar(filePath) {
  if (!filePath) return Promise.resolve({ success: false, error: '请选择头像' });
  return compressImage(filePath)
    .then(readBase64)
    .then((base64) => {
      const ext = imageExtOf(base64);
      if (!ext) throw new Error('仅支持 JPG / PNG / WebP 头像');
      return api.request('/api/upload/avatar', {
        method: 'POST',
        data: { image: 'data:image/' + ext + ';base64,' + base64 },
        timeout: 30000
      });
    })
    .then((result) => {
      if (result && result.success && result.data) {
        const current = getCachedUser() || {};
        const next = Object.assign({}, current, result.data.user || {});
        setSession(getToken(), next);
        return { success: true, data: { avatarUrl: result.data.avatarUrl }, user: next };
      }
      return result;
    })
    .catch((error) => ({ success: false, error: error.message || '头像上传失败' }));
}

module.exports = {
  TOKEN_KEY,
  USER_KEY,
  getToken,
  getCachedUser,
  setSession,
  clearSession,
  isLoggedIn,
  silentLogin,
  ensureLogin,
  logout,
  updateProfile,
  uploadAvatar
};
