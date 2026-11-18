const { activityNews } = require('../../data/site');
const dataService = require('../../utils/data-service');
const nav = require('../../utils/navigate');
const {
  isRegisteredActivity,
  registerActivity,
  unregisterActivity
} = require('../../utils/storage');

const categories = ['全部'].concat(
  activityNews.reduce((result, item) => {
    if (!result.includes(item.category)) {
      result.push(item.category);
    }
    return result;
  }, [])
);

Page({
  onShareAppMessage() {
    return { title: '樟林古港 — 活动资讯：讲解专场、夜游体验、亲子研学持续更新', path: '/pages/activity/activity' };
  },

  data: {
    loading: true,
    heroImage: '/assets/images/temple.jpg',
    categories,
    activeCategory: '全部',
    activityNews: []
  },

  onShow() {
    this.refreshActivities();
  },

  onPullDownRefresh() {
    this.refreshActivities();
    wx.showToast({ title: '已刷新', icon: 'success', duration: 1000 });
    setTimeout(() => wx.stopPullDownRefresh(), 1200);
  },

  async refreshActivities(category = this.data.activeCategory) {
    // 优先使用服务端数据，失败回退本地
    let source = activityNews;
    const result = await dataService.getOverview(false);
    if (result.source !== 'local' && Array.isArray(result.data.activityNews) && result.data.activityNews.length) {
      source = result.data.activityNews;
    }

    const filtered = category === '全部'
      ? source
      : source.filter((item) => item.category === category);

    const formatted = filtered.map((item) => ({
      ...item,
      remaining: Math.max((item.capacity || 0) - (item.enrolled || 0), 0),
      registered: isRegisteredActivity(item.id)
    }));

    this.setData({
      activeCategory: category,
      activityNews: formatted
    });
    setTimeout(() => this.setData({ loading: false }), 500);
  },

  previewPoster(event) {
    const { image } = event.currentTarget.dataset;
    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: image,
      success: (res) => {
        const tempPath = `${wx.env.USER_DATA_PATH}/poster_${Date.now()}.jpg`;
        fs.writeFile({
          filePath: tempPath,
          data: res.data,
          success: () => {
            wx.previewImage({ current: tempPath, urls: [tempPath] });
          }
        });
      }
    });
  },

  previewImage(event) {
    const { src } = event.currentTarget.dataset;
    const fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: src,
      success: (res) => {
        const tempPath = `${wx.env.USER_DATA_PATH}/preview_${Date.now()}.jpg`;
        fs.writeFile({
          filePath: tempPath,
          data: res.data,
          success: () => {
            wx.previewImage({ current: tempPath, urls: [tempPath] });
          }
        });
      }
    });
  },

  switchCategory(event) {
    const { category } = event.currentTarget.dataset;
    this.refreshActivities(category);
  },

  register(event) {
    const { id } = event.currentTarget.dataset;
    const activity = activityNews.find((item) => item.id === id);
    const alreadyReg = isRegisteredActivity(id);
    if (alreadyReg) {
      unregisterActivity(id);
      wx.showToast({ title: '已取消报名', icon: 'none' });
      this.refreshActivities();
      return;
    }
    const result = registerActivity(activity);
    wx.showToast({
      title: result.alreadyRegistered ? '你已报名该活动' : '报名成功',
      icon: 'none'
    });
    this.refreshActivities();
  },

  openGuide() {
    nav.go('/pages/guide/guide');
  },

  openProfile() {
    nav.go('/pages/profile/profile');
  }
});
