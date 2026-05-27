App({
  globalData: {
    currentRoute: '/pages/index/index',
    userInfo: null,
    hasUserInfo: false
  },
  onLaunch() {
    this.globalData.currentRoute = '/pages/index/index'
  }
})