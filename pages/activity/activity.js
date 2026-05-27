const { activityNews } = require('../../data/site.js')

Page({
  data: {
    activities: activityNews
  },

  onLoad() {
    const app = getApp()
    if (app.globalData) {
      app.globalData.currentRoute = '/pages/activity/activity'
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 })
    }
  },

  enrollActivity(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: '报名成功！', icon: 'success' })
  }
})