/**
 * 用户管理模块
 * 处理登录、用户信息、收藏、活动报名等
 */

const USER_KEY = 'user_info'
const FAVORITES_KEY = 'user_favorites'
const REGISTRATIONS_KEY = 'user_registrations'

const UserManager = {
  // 获取用户信息
  getUserInfo() {
    try {
      return wx.getStorageSync(USER_KEY) || null
    } catch (e) {
      return null
    }
  },

  // 设置用户信息
  setUserInfo(userInfo) {
    try {
      wx.setStorageSync(USER_KEY, userInfo)
      return true
    } catch (e) {
      return false
    }
  },

  // 清除用户信息
  clearUserInfo() {
    try {
      wx.removeStorageSync(USER_KEY)
      wx.removeStorageSync(FAVORITES_KEY)
      wx.removeStorageSync(REGISTRATIONS_KEY)
      return true
    } catch (e) {
      return false
    }
  },

  // 是否已登录
  isLoggedIn() {
    const user = this.getUserInfo()
    return !!(user && user.nickName)
  },

  // 微信登录
  login() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          const userInfo = {
            ...res.userInfo,
            loginTime: Date.now()
          }
          this.setUserInfo(userInfo)
          resolve(userInfo)
        },
        fail: (err) => {
          reject(err)
        }
      })
    })
  },

  // 获取收藏列表
  getFavorites() {
    try {
      return wx.getStorageSync(FAVORITES_KEY) || []
    } catch (e) {
      return []
    }
  },

  // 添加收藏
  addFavorite(item) {
    const favorites = this.getFavorites()
    const exists = favorites.find(f => f.id === item.id)
    if (!exists) {
      favorites.unshift({
        ...item,
        addTime: Date.now()
      })
      wx.setStorageSync(FAVORITES_KEY, favorites)
    }
    return favorites
  },

  // 移除收藏
  removeFavorite(itemId) {
    let favorites = this.getFavorites()
    favorites = favorites.filter(f => f.id !== itemId)
    wx.setStorageSync(FAVORITES_KEY, favorites)
    return favorites
  },

  // 是否已收藏
  isFavorited(itemId) {
    const favorites = this.getFavorites()
    return favorites.some(f => f.id === itemId)
  },

  // 获取活动报名列表
  getRegistrations() {
    try {
      return wx.getStorageSync(REGISTRATIONS_KEY) || []
    } catch (e) {
      return []
    }
  },

  // 报名活动
  registerActivity(activity) {
    const registrations = this.getRegistrations()
    const exists = registrations.find(r => r.id === activity.id)
    if (exists) {
      return { success: false, message: '已经报名过该活动' }
    }
    
    registrations.unshift({
      ...activity,
      registerTime: Date.now(),
      status: 'registered' // registered, cancelled, completed
    })
    wx.setStorageSync(REGISTRATIONS_KEY, registrations)
    return { success: true, registrations }
  },

  // 取消报名
  cancelRegistration(activityId) {
    let registrations = this.getRegistrations()
    const index = registrations.findIndex(r => r.id === activityId)
    if (index === -1) {
      return { success: false, message: '未找到报名记录' }
    }
    
    registrations[index].status = 'cancelled'
    registrations[index].cancelTime = Date.now()
    wx.setStorageSync(REGISTRATIONS_KEY, registrations)
    return { success: true, registrations }
  },

  // 获取已报名未取消的活动
  getActiveRegistrations() {
    const registrations = this.getRegistrations()
    return registrations.filter(r => r.status === 'registered')
  },

  // 是否已报名
  isRegistered(activityId) {
    const registrations = this.getRegistrations()
    return registrations.some(r => r.id === activityId && r.status === 'registered')
  }
}

module.exports = UserManager