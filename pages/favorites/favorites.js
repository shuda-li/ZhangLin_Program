const UserManager = require('../../utils/user.js')

Page({
  data: {
    favorites: [],
    isLoggedIn: false
  },

  onLoad() {
    this.checkLoginStatus()
    this.loadFavorites()
  },

  onShow() {
    this.checkLoginStatus()
    this.loadFavorites()
  },

  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = UserManager.isLoggedIn()
    this.setData({ isLoggedIn })
  },

  // 加载收藏列表
  loadFavorites() {
    const favorites = UserManager.getFavorites()
    this.setData({ favorites })
  },

  // 登录
  handleLogin() {
    UserManager.login()
      .then(() => {
        this.setData({ isLoggedIn: true })
        this.loadFavorites()
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      })
      .catch(() => {
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      })
  },

  // 移除收藏
  removeFavorite(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.favorites.find(f => f.id === id)
    
    if (!item) return

    wx.showModal({
      title: '确认移除',
      content: `确定要从收藏中移除"${item.title || item.name}"吗？`,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          const favorites = UserManager.removeFavorite(id)
          this.setData({ favorites })
          wx.showToast({
            title: '已移除',
            icon: 'success'
          })
        }
      }
    })
  },

  // 查看详情
  viewDetail(e) {
    const { type, id } = e.currentTarget.dataset
    
    if (type === 'spot') {
      wx.navigateTo({
        url: '/pages/scenic-detail/scenic-detail?id=' + id
      })
    } else if (type === 'route') {
      wx.switchTab({
        url: '/pages/guide/guide'
      })
    }
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 去首页
  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})