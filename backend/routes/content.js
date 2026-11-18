/**
 * 内容聚合接口（公开，只读）
 * 把管理端维护的 mockData 映射为小程序前端兼容的数据结构。
 * 原则：文字类字段以管理端数据为准（Admin 可维护），
 *       图片/图集/讲解等复杂字段以 site.js 为准（保证资源存在、前端结构完整）。
 */
const express = require('express');
const path = require('path');
const { scenicSpots: managedSpots, activities: managedActivities } = require('../data/mockData');

// 复用前端 site.js 作为结构骨架与兜底（跨目录引用）
const site = require(path.join(__dirname, '..', '..', 'data', 'site'));

const router = express.Router();

function mergeScenic() {
  return site.scenicSpots.map((base) => {
    const managed = managedSpots.find((s) => s.id === base.id);
    if (!managed) return base;
    return {
      ...base,
      // Admin 可维护的文字字段覆盖前端结构
      name: managed.name || base.name,
      summary: managed.description || base.summary,
      location: managed.location || base.location,
      category: managed.category || base.category,
      openTime: managed.openTime || base.duration,
      ticketPrice: managed.ticketPrice || '',
      visits: managed.visits || 0,
      // 图片与图集始终用前端校验过的值，避免 Admin 填错导致加载失败
      image: base.image,
      gallery: base.gallery
    };
  });
}

function mergeActivities() {
  // 前端活动结构以 site.js 为准；若管理端有同名活动，同步名额与报名数
  return site.activityNews.map((base) => {
    const managed = managedActivities.find((a) => a.title === base.title || a.id === base.id);
    if (!managed) return base;
    return {
      ...base,
      capacity: managed.capacity != null ? managed.capacity : base.capacity,
      enrolled: managed.enrolled != null ? managed.enrolled : base.enrolled,
      description: managed.description || base.summary || base.description,
      image: base.image
    };
  });
}

router.get('/overview', (req, res) => {
  res.json({
    code: 200,
    data: {
      scenicSpots: mergeScenic(),
      activityNews: mergeActivities(),
      routePlans: site.routePlans,
      homeBanners: site.newHomeBanners,
      homeStats: site.homeStats,
      updatedAt: new Date().toISOString()
    }
  });
});

module.exports = router;
