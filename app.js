App({
  globalData: {
    currentRoute: '/pages/index/index',
    userInfo: null,
    hasUserInfo: false
  },

  onLaunch() {
    this.globalData.currentRoute = '/pages/index/index'
  },

  onError(error) {
    console.error('应用异常:', error)
  }
})