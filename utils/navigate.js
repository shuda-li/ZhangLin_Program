/**
 * 统一导航工具
 * 解决页面跳转失灵的常见问题：
 * 1. navigateTo 跳转 tabBar 页面会静默失败 → 自动改用 switchTab
 * 2. navigateTo 页面栈超过 10 层会失败 → 自动降级 redirectTo
 * 3. 目标页不存在或跳转失败 → 给出明确提示，不再"点了没反应"
 */

// 与 app.json 的 tabBar.list 保持一致
const TAB_PAGES = [
  '/pages/index/index',
  '/pages/guide/guide',
  '/pages/culture/culture',
  '/pages/specialty/specialty',
  '/pages/profile/profile'
];

const MAX_DEPTH = 10;

function isTabPage(url) {
  const path = String(url || '').split('?')[0];
  return TAB_PAGES.indexOf(path) !== -1;
}

function normalizeUrl(url) {
  if (!url) return '';
  return url.charAt(0) === '/' ? url : '/' + url;
}

function currentPagesCount() {
  try {
    return getCurrentPages().length;
  } catch (e) {
    return 1;
  }
}

function failTip(url) {
  wx.showToast({
    title: '页面打开失败，请重试',
    icon: 'none',
    duration: 1500
  });
  console.warn('[导航] 跳转失败:', url);
}

/**
 * 智能跳转：自动选择 switchTab / navigateTo / redirectTo
 */
function go(url, options = {}) {
  const target = normalizeUrl(url);
  if (!target) return;

  if (isTabPage(target)) {
    wx.switchTab({
      url: target,
      fail: () => failTip(target)
    });
    return;
  }

  if (currentPagesCount() >= MAX_DEPTH) {
    // 栈满时重定向，避免 navigateTo 静默失败
    wx.redirectTo({
      url: target,
      fail: () => failTip(target)
    });
    return;
  }

  wx.navigateTo({
    url: target,
    events: options.events,
    success: (res) => {
      if (typeof options.onSuccess === 'function') options.onSuccess(res);
    },
    fail: () => {
      // navigateTo 失败的兜底：尝试 redirectTo
      wx.redirectTo({
        url: target,
        fail: () => failTip(target)
      });
    }
  });
}

/**
 * 返回上一页；若已在首页栈底则返回首页 tab
 */
function back(delta = 1) {
  if (currentPagesCount() <= 1) {
    wx.switchTab({ url: '/pages/index/index' });
    return;
  }
  wx.navigateBack({ delta });
}

module.exports = { go, back, isTabPage, TAB_PAGES };
