const {
  scenicSpots,
  routePlans,
  homeStats,
  newHomeBanners,
  activityNews,
  cultureTimeline
} = require('../../data/site');
const dataService = require('../../utils/data-service');
const nav = require('../../utils/navigate');

Page({
  data: {
    homeBanners: newHomeBanners,
    homeStats,
    popularSpots: scenicSpots.map(function(spot) {
      return { id: spot.id, name: spot.name, image: spot.image };
    }),
    routePlans: routePlans.slice(0, 3),
    featuredRoute: routePlans[0] || null,
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
    showBackTop: false,
    showMore: false,
    expandedGroups: { culture: false, activity: false, map: false },
    // 折叠区渲染高度（px）。teaser 默认展示（auto），其余默认收起（0）
    foldHeight: { more: 0, culture: 0, activity: 0, map: 0, teaser: 'auto' }
  },

  FOLD_DURATION: 320,

  // ═══ 折叠动画控制器 ═══
  // 测量内容自然高度：内容常驻渲染，测量的是 .fold-inner 的真实高度，
  // 不受父级 height 裁剪影响，因此可适配任意内容高度与窄屏换行。
  _measureFold(key) {
    return new Promise((resolve) => {
      this.createSelectorQuery()
        .select('#fold-inner-' + key)
        .boundingClientRect((rect) => resolve(rect ? Math.ceil(rect.height) : 0))
        .exec();
    });
  },

  // 写入单个折叠区高度；直接返回 Promise 便于串行控制
  _setFoldHeight(key, value) {
    return new Promise((resolve) => {
      const patch = {};
      patch['foldHeight.' + key] = value;
      this.setData(patch, resolve);
    });
  },

  // 展开：先量高并落到具体 px 触发过渡；过渡结束后固定为 auto，
  // 从而使窄屏换行、内容动态增减时高度自适应，不出现裁切。
  _foldOpen(key) {
    const timerKey = '_foldTimer_' + key;
    if (this[timerKey]) { clearTimeout(this[timerKey]); this[timerKey] = null; }
    this._measureFold(key).then((h) => {
      // 快速连点保护：若期间目标状态已变为收起，放弃本次展开
      if (this._isFoldClosed(key)) return;
      return this._setFoldHeight(key, h > 0 ? h : 'auto').then(() => {
        this[timerKey] = setTimeout(() => {
          this[timerKey] = null;
          this._setFoldHeight(key, 'auto');
        }, this.FOLD_DURATION + 20);
      });
    });
  },

  // 收起：若当前为 auto 需先固定为实测 px（auto 无法产生过渡），
  // 下一帧再置 0，确保过渡生效；动画中反点会从当前高度平滑回落。
  _foldClose(key) {
    const timerKey = '_foldTimer_' + key;
    if (this[timerKey]) { clearTimeout(this[timerKey]); this[timerKey] = null; }
    const current = this.data.foldHeight[key];
    const settle = () => {
      if (this._isFoldOpen(key)) return;
      this._setFoldHeight(key, 0);
    };
    if (current === 'auto' || current === 0) {
      this._measureFold(key).then((h) => {
        if (this._isFoldOpen(key)) return;
        this._setFoldHeight(key, h > 0 ? h : 0).then(() => {
          this[timerKey] = setTimeout(() => {
            this[timerKey] = null;
            settle();
          }, 20);
        });
      });
    } else {
      settle();
    }
  },

  // 目标状态判定：more/teaser 由 showMore 派生，分组由 expandedGroups 决定
  _isFoldOpen(key) {
    if (key === 'more' || key === 'teaser') return key === 'more' ? this.data.showMore : !this.data.showMore;
    return Boolean(this.data.expandedGroups[key]);
  },
  _isFoldClosed(key) { return !this._isFoldOpen(key); },


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
      patch.featuredRoute = d.routePlans[0];
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

  onUnload() {
    ['more', 'culture', 'activity', 'map', 'teaser'].forEach((key) => {
      const timer = this['_foldTimer_' + key];
      if (timer) clearTimeout(timer);
      this['_foldTimer_' + key] = null;
    });
  },

  // ═══ 首页分组收纳交互 ═══
  toggleMore() {
    const showMore = !this.data.showMore;
    this.setData({ showMore });
    // teaser 与 more 此消彼长，两个过渡同时进行，视觉上无缝衔接
    if (showMore) { this._foldClose('teaser'); this._foldOpen('more'); }
    else { this._foldClose('more'); this._foldOpen('teaser'); }
  },

  toggleGroup(event) {
    const key = event.currentTarget.dataset.group;
    if (!key || !(key in this.data.expandedGroups)) return;
    const groups = Object.assign({}, this.data.expandedGroups);
    groups[key] = !groups[key];
    this.setData({ expandedGroups: groups });
    if (groups[key]) this._foldOpen(key); else this._foldClose(key);
  },

  // 收起态下的分类入口：展开「更多发现」并直接打开目标分组
  openMoreGroup(event) {
    const key = event.currentTarget.dataset.group;
    if (!key || !(key in this.data.expandedGroups)) return;
    const groups = Object.assign({}, this.data.expandedGroups);
    groups[key] = true;
    this.setData({ showMore: true, expandedGroups: groups });
    this._foldClose('teaser');
    this._foldOpen('more');
    this._foldOpen(key);
  },

  // 视口变化（横竖屏/分屏）时，已展开且固定为 auto 的区域自动适应；
  // 动画进行中的区域重新量高校正，避免窄屏换行后高度偏小被裁切。
  onResize() {
    ['more', 'culture', 'activity', 'map', 'teaser'].forEach((key) => {
      if (!this._isFoldOpen(key)) return;
      if (this.data.foldHeight[key] === 'auto') return;
      this._measureFold(key).then((h) => {
        if (this._isFoldOpen(key) && h > 0) this._setFoldHeight(key, h);
      });
    });
  },

  handleActionTap(event) {
    const { action, target } = event.currentTarget.dataset;
    if (action === 'detail') {
      nav.go(`/pages/scenic-detail/scenic-detail?id=${target}`);
      return;
    }
    // tab / page 统一交给导航工具判断，自动选择 switchTab 或 navigateTo
    nav.go(target);
  },

  handleStatTap(event) {
    const { target } = event.currentTarget.dataset;
    if (target.startsWith('/pages/')) {
      nav.go(target);
    } else {
      wx.pageScrollTo({ selector: '#' + target, duration: 300 });
    }
  },

  openSpot(event) {
    const { id } = event.currentTarget.dataset;
    nav.go(`/pages/scenic-detail/scenic-detail?id=${id}`);
  },

  openGuide(event) {
    const routeId = event && event.currentTarget && event.currentTarget.dataset.routeId;
    if (routeId) {
      const app = getApp();
      app.globalData.activeRouteId = routeId;
    }
    nav.go('/pages/guide/guide');
  },

  openActivity() {
    nav.go('/pages/activity/activity');
  },

  openAiGuide() {
    nav.go('/pages/ai-chat/ai-chat');
  },

  aiQuickAsk(event) {
    const q = event.currentTarget.dataset.q;
    nav.go('/pages/ai-chat/ai-chat?question=' + encodeURIComponent(q));
  },

  onMarkerTap(event) {
    const spotMap = { 1: 'ship-museum', 2: 'port-ruins', 3: 'historic-arcade', 4: 'overseas-memory' };
    const spotId = spotMap[event.detail.markerId];
    if (spotId) {
      nav.go('/pages/scenic-detail/scenic-detail?id=' + spotId);
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
