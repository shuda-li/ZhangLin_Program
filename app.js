App({
  globalData: {
    brandName: '樟林归舟',
    serviceNotice: '当前版本为静态演示版，可直接在微信开发者工具中预览页面与交互。',
    activeRouteId: null,
    currentRoute: '/pages/index/index',
    userInfo: null,
    hasUserInfo: false,
    screenWidth: 375,
    screenHeight: 667,
    windowWidth: 375,
    windowHeight: 667,
    devicePixelRatio: 2
  },

  onLaunch() {
    const that = this;
    this.globalData.currentRoute = '/pages/index/index';

    try {
      if (typeof wx.getDeviceInfo === 'function') {
        const deviceInfo = wx.getDeviceInfo();
        if (deviceInfo && deviceInfo.screenWidth) {
          that.globalData.screenWidth = deviceInfo.screenWidth;
          that.globalData.screenHeight = deviceInfo.screenHeight;
          that.globalData.devicePixelRatio = deviceInfo.pixelRatio || 2;
        }
      }
      if (typeof wx.getWindowInfo === 'function') {
        const windowInfo = wx.getWindowInfo();
        if (windowInfo && windowInfo.windowWidth) {
          that.globalData.windowWidth = windowInfo.windowWidth;
          that.globalData.windowHeight = windowInfo.windowHeight;
        }
      }
    } catch (e) {
      console.warn('获取系统信息失败，使用默认值');
    }

    // 静默建立微信身份并合并本地数据；未配置后端或异常时保持游客模式，不阻塞启动
    var auth = require('./utils/auth');
    var sync = require('./utils/sync-service');
    auth.silentLogin().then(function(result) {
      if (result && result.success) {
        that.globalData.userInfo = result.data.user;
        that.globalData.hasUserInfo = true;
        return sync.mergeOnLogin();
      }
      return null;
    }).catch(function() { /* 合并失败不阻塞启动，队列会在下次登录重试 */ });
  }
});