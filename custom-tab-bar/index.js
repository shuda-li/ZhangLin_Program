Component({
  data: {
    selected: 0,
    list: [
      { pagePath: '/pages/index/index', text: '首页', iconPath: '/assets/tabbar/home.png', selectedIconPath: '/assets/tabbar/home-active.png' },
      { pagePath: '/pages/guide/guide', text: '导览', iconPath: '/assets/tabbar/guide.png', selectedIconPath: '/assets/tabbar/guide-active.png' },
      { pagePath: '/pages/culture/culture', text: '文化', iconPath: '/assets/tabbar/culture.png', selectedIconPath: '/assets/tabbar/culture-active.png' },
      { pagePath: '/pages/specialty/specialty', text: '风物', iconPath: '/assets/tabbar/specialty.png', selectedIconPath: '/assets/tabbar/specialty-active.png' },
      { pagePath: '/pages/profile/profile', text: '我的', iconPath: '/assets/tabbar/profile.png', selectedIconPath: '/assets/tabbar/profile-active.png' }
    ]
  },
  attached() {
    this.updateSelected()
  },
  methods: {
    updateSelected() {
      const app = getApp()
      const currentRoute = app.globalData && app.globalData.currentRoute || '/pages/index/index'
      const index = this.data.list.findIndex(item => item.pagePath === currentRoute)
      if (index !== -1) {
        this.setData({ selected: index })
      }
    },
    switchTab(e) {
      const index = e.currentTarget.dataset.index
      const pagePath = this.data.list[index].pagePath
      wx.switchTab({ url: pagePath })
      this.setData({ selected: index })
      if (getApp().globalData) {
        getApp().globalData.currentRoute = pagePath
      }
    }
  }
})