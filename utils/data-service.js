/**
 * 数据服务层
 * 统一策略：API 优先 → 本地缓存 → site.js 静态兜底。
 * 目标：管理端维护的数据可同步到小程序；后端不可用时小程序完全照常工作。
 */
const site = require('../data/site');
const api = require('./api');

const CACHE_KEY = 'content_overview_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 分钟

function readCache() {
  try {
    const cached = wx.getStorageSync(CACHE_KEY);
    if (cached && cached.updatedAt && (Date.now() - cached.savedAt < CACHE_TTL)) {
      return cached.data;
    }
  } catch (e) {}
  return null;
}

function writeCache(data) {
  try {
    wx.setStorageSync(CACHE_KEY, { data, savedAt: Date.now(), updatedAt: data.updatedAt });
  } catch (e) {}
}

/**
 * 获取内容总览。
 * @param {boolean} forceRefresh 是否强制走网络（下拉刷新时用）
 * @returns {Promise<{data, source}>} source: network | cache | local
 */
async function getOverview(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = readCache();
    if (cached) return { data: cached, source: 'cache' };
  }

  if (api.isBackendConfigured()) {
    const result = await api.getContentOverview();
    if (result.success && result.data && Array.isArray(result.data.scenicSpots)) {
      writeCache(result.data);
      return { data: result.data, source: 'network' };
    }
  }

  // 本地兜底：结构与后端 overview 保持一致
  return {
    data: {
      scenicSpots: site.scenicSpots,
      activityNews: site.activityNews,
      routePlans: site.routePlans,
      homeBanners: site.newHomeBanners,
      homeStats: site.homeStats,
      updatedAt: ''
    },
    source: 'local'
  };
}

module.exports = { getOverview, readCache };
