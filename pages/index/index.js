const {
  scenicSpots,
  routePlans,
  homeStats,
  newHomeBanners,
  activityNews,
  cultureTimeline
} = require('../../data/site');
const dataService = require('../../utils/data-service');

Page({
  data: {
    homeBanners: newHomeBanners,
    homeStats,
    popularSpots: scenicSpots.map(function(spot) {
      return { id: spot.id, name: spot.name, image: spot.image };
    }),
    routePlans: routePlans.slice(0, 3),
    hotActivities: activityNews.slice(0, 1),
    cultureTimeline,
    quickServices: [
      { title: '活动报名', icon: 'ui-icon-calendar', action: 'page', target: '/pages/activity/activity' },
      { title: '景点收藏', icon: 'ui-icon-bookmark', action: 'tab', target: '/pages/profile/profile' },
      { title: '音频讲解', icon: 'ui-icon-headphone', action: 'detail', target: 'ship-museum' },
      { title: '导览路线', icon: 'ui-icon-route', action: 'tab', target: '/pages/guide/guide' }
    ],
    mapMarkers: [
      { id: 1, latitude: 23.4550, longitude: 116.7805, width: 30, height: 30, title: '红头船文化展示点' },
      { id: 2, latitude: 23.4535, longitude: 116.7818, width: 30, height: 30, title: '古港遗址游览区' },
      { id: 3, latitude: 23.4562, longitude: 116.7792, width: 30, height: 30, title: '侨乡古建筑群' },
      { id: 4, latitude: 23.4545, longitude: 116.7800, width: 30, height: 30, title: '侨史记忆长廊' }
    ],
    showBackTop: false
  },

  async onLoad() {
    await this.refreshFromServer(false);
  },

  // 从服务端拉取管理端维护的内容；失败时静默使用本地数据
  async refreshFromServer(force) {
    const result = await dataService.getOverview(Boolean(force));
    if (result.source === 'local') return;
    const d = result.data;
    const patch = {};
    if (Array.isArray(d.scenicSpots) && d.scenicSpots.length) {
      patch.popularSpots = d.scenicSpots.map(function (spot) {
        return { id: spot.id, name: spot.name, image: spot.image };
      });
    }
    if (Array.isArray(d.routePlans) && d.routePlans.length) {
      patch.routePlans = d.routePlans.slice(0, 3);
    }
    if (Array.isArray(d.activityNews) && d.activityNews.length) {
      patch.hotActivities = d.activityNews.slice(0, 1);
    }
    if (Array.isArray(d.homeBanners) && d.homeBanners.length) {
      patch.homeBanners = d.homeBanners;
    }
    if (Object.keys(patch).length) this.setData(patch);
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onShareAppMessage() {
    return { title: '樟林归舟 — 红头船文化与古港导览', path: '/pages/index/index' };
  },

  handleActionTap(event) {
    const { action, target } = event.currentTarget.dataset;
    if (action === 'tab') {
      wx.switchTab({ url: target });
      return;
    }
    if (action === 'page') {
      wx.navigateTo({ url: target });
      return;
    }
    wx.navigateTo({ url: `/pages/scenic-detail/scenic-detail?id=${target}` });
  },

  handleStatTap(event) {
    const { target } = event.currentTarget.dataset;
    if (target.startsWith('/pages/')) {
      wx.switchTab({ url: target });
    } else {
      wx.pageScrollTo({ selector: '#' + target, duration: 300 });
    }
  },

  openSpot(event) {
    const { id } = event.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/scenic-detail/scenic-detail?id=${id}` });
  },

  openGuide(event) {
    const routeId = event && event.currentTarget && event.currentTarget.dataset.routeId;
    if (routeId) {
      const app = getApp();
      app.globalData.activeRouteId = routeId;
    }
    wx.switchTab({ url: '/pages/guide/guide' });
  },

  openActivity() {
    wx.navigateTo({ url: '/pages/activity/activity' });
  },

  openAiGuide() {
    wx.navigateTo({ url: '/pages/ai-chat/ai-chat' });
  },

  aiQuickAsk(event) {
    const q = event.currentTarget.dataset.q;
    wx.navigateTo({ url: '/pages/ai-chat/ai-chat?question=' + encodeURIComponent(q) });
  },

  onMarkerTap(event) {
    const spotMap = { 1: 'ship-museum', 2: 'port-ruins', 3: 'historic-arcade', 4: 'overseas-memory' };
    const spotId = spotMap[event.detail.markerId];
    if (spotId) {
      wx.navigateTo({ url: '/pages/scenic-detail/scenic-detail?id=' + spotId });
    }
  },

  onPageScroll(event) {
    const show = event.scrollTop > 400;
    if (show !== this.data.showBackTop) {
      this.setData({ showBackTop: show });
    }
  },

  async onPullDownRefresh() {
    await this.refreshFromServer(true);
    wx.stopPullDownRefresh();
  },

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  }
});
