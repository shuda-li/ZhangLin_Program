Page({
  data: {},

  onLoad() {
    const app = getApp()
    if (app.globalData) {
      app.globalData.currentRoute = '/pages/culture/culture'
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  openAiChat(e) {
    const topic = e.currentTarget.dataset.topic
    wx.navigateTo({
      url: '/pages/ai-chat/ai-chat?topic=' + topic
    })
  }
})