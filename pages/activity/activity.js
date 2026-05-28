const { activityNews } = require('../../data/site.js')
const UserManager = require('../../utils/user.js')

const TAG_CLASS_MAP = {
  '讲解': 'tag-guide',
  '夜游': 'tag-night',
  '亲子': 'tag-family',
  '文化': 'tag-culture'
}

function mapActivitiesWithTagClass(list) {
  return list.map((item) => {
    return Object.assign({}, item, {
      tagClass: TAG_CLASS_MAP[item.tag] || '',
      isRegistered: UserManager.isRegistered(item.id)
    })
  })
}

Page({
  data: {
    activities: [],
    userInfo: null,
    isLoggedIn: false,
    activeTab: 'all', // all, registered
    myActivities: []
  },

  onLoad() {
    const app = getApp()
    if (app.globalData) {
      app.globalData.currentRoute = '/pages/activity/activity'
    }
    this.loadActivities()
  },

  onShow() {
    this.checkLoginStatus()
    this.loadActivities()
  },

  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = UserManager.isLoggedIn()
    const userInfo = UserManager.getUserInfo()
    this.setData({
      isLoggedIn,
      userInfo
    })
  },

  // 加载活动列表
  loadActivities() {
    const activities = mapActivitiesWithTagClass(activityNews)
    const myActivities = UserManager.getActiveRegistrations()
    
    this.setData({
      activities,
      myActivities
    })
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
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

  // 报名活动
  enrollActivity(e) {
    // 检查是否登录
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '报名活动需要先登录账号',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.handleLogin()
          }
        }
      })
      return
    }

    const id = e.currentTarget.dataset.id
    const activity = this.data.activities.find((a) => a.id === id)
    if (!activity) return

    if (activity.enrollCount >= activity.maxCount) {
      wx.showToast({ title: '名额已满，下次再来~', icon: 'none' })
      return
    }

    if (activity.isRegistered) {
      wx.showToast({ title: '已经报名过了', icon: 'none' })
      return
    }

    // 确认报名
    wx.showModal({
      title: '确认报名',
      content: `活动：${activity.title}\n时间：${activity.date} ${activity.time}\n地点：${activity.location}`,
      success: (res) => {
        if (res.confirm) {
          this.doEnroll(activity)
        }
      }
    })
  },

  // 执行报名
  doEnroll(activity) {
    const result = UserManager.registerActivity(activity)
    
    if (!result.success) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      return
    }

    // 更新活动报名人数
    const updatedActivities = this.data.activities.map((a) => {
      if (a.id === activity.id) {
        const newCount = a.enrollCount + 1
        return Object.assign({}, a, {
          enrollCount: newCount,
          status: newCount >= a.maxCount ? '已满' : a.status,
          isRegistered: true
        })
      }
      return a
    })

    this.setData({
      activities: updatedActivities,
      myActivities: result.registrations.filter(r => r.status === 'registered')
    })

    wx.showToast({
      title: '报名成功！',
      icon: 'success'
    })
  },

  // 取消报名
  cancelEnroll(e) {
    const id = e.currentTarget.dataset.id
    const activity = this.data.myActivities.find((a) => a.id === id)
    
    if (!activity) return

    wx.showModal({
      title: '确认取消',
      content: `确定要取消报名"${activity.title}"吗？`,
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          this.doCancel(id)
        }
      }
    })
  },

  // 执行取消
  doCancel(activityId) {
    const result = UserManager.cancelRegistration(activityId)
    
    if (!result.success) {
      wx.showToast({
        title: result.message,
        icon: 'none'
      })
      return
    }

    // 更新活动状态
    const updatedActivities = this.data.activities.map((a) => {
      if (a.id === activityId) {
        return Object.assign({}, a, {
          enrollCount: Math.max(0, a.enrollCount - 1),
          status: '报名中',
          isRegistered: false
        })
      }
      return a
    })

    this.setData({
      activities: updatedActivities,
      myActivities: result.registrations.filter(r => r.status === 'registered')
    })

    wx.showToast({
      title: '已取消报名',
      icon: 'success'
    })
  },

  // 查看活动详情
  viewActivityDetail(e) {
    const id = e.currentTarget.dataset.id
    const activity = this.data.activities.find((a) => a.id === id)
    if (!activity) return

    wx.showModal({
      title: activity.title,
      content: `${activity.description}\n\n时间：${activity.date} ${activity.time}\n地点：${activity.location}\n已报名：${activity.enrollCount}/${activity.maxCount}人`,
      showCancel: false,
      confirmText: '知道了'
    })
  }
})