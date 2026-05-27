Page({
  data: {},

  onLoad() {
    const app = getApp()
    if (app.globalData) {
      app.globalData.currentRoute = '/pages/profile/profile'
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
  },

  openAiChat() {
    wx.navigateTo({ url: '/pages/ai-chat/ai-chat' })
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  }
})