const UserManager = require('../../utils/user.js')

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    favoriteCount: 0,
    registrationCount: 0
  },

  onLoad() {
    const app = getApp()
    if (app.globalData) {
      app.globalData.currentRoute = '/pages/profile/profile'
    }
    this.loadUserData()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }
    this.loadUserData()
  },

  // 加载用户数据
  loadUserData() {
    const isLoggedIn = UserManager.isLoggedIn()
    const userInfo = UserManager.getUserInfo()
    const favorites = UserManager.getFavorites()
    const registrations = UserManager.getActiveRegistrations()
    
    this.setData({
      isLoggedIn,
      userInfo,
      favoriteCount: favorites.length,
      registrationCount: registrations.length
    })
  },

  // 登录
  handleLogin() {
    UserManager.login()
      .then((userInfo) => {
        this.setData({
          isLoggedIn: true,
          userInfo
        })
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      })
      .catch((err) => {
        console.error('登录失败:', err)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          UserManager.clearUserInfo()
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            favoriteCount: 0,
            registrationCount: 0
          })
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  // 查看收藏
  viewFavorites() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '查看收藏需要先登录账号',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.handleLogin()
          }
        }
      })
      return
    }
    wx.navigateTo({ url: '/pages/favorites/favorites' })
  },

  // 查看我的报名
  viewMyRegistrations() {
    wx.navigateTo({ url: '/pages/activity/activity' })
  },

  openAiChat() {
    wx.navigateTo({ url: '/pages/ai-chat/ai-chat' })
  },

  navigateTo(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      wx.navigateTo({ url })
    }
  },

  callService() {
    wx.makePhoneCall({ phoneNumber: '400-000-0000' })
  },

  showAbout() {
    wx.showModal({
      title: '关于樟林归舟',
      content: '樟林归舟是一款专注于樟林古港文化旅游的小程序，提供景点讲解、路线导览、文化活动等一站式服务。\n\n版本：v1.0.0',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})