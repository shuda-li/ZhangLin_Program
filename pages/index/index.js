const { scenicSpots, routePlans, homeStats, newHomeBanners, activityNews, cultureTimeline, todayData } = require('../../data/site.js')

function getTagClass(tag) {
  if (tag.indexOf('亲子') >= 0 || tag.indexOf('家庭') >= 0 || tag.indexOf('研学') >= 0) return 'tag-family'
  if (tag.indexOf('拍照') >= 0 || tag.indexOf('摄影') >= 0) return 'tag-photo'
  if (tag.indexOf('夜') >= 0) return 'tag-night'
  if (tag.indexOf('打卡') >= 0 || tag.indexOf('热门') >= 0) return 'tag-hot'
  return ''
}

function mapSpotsWithTags(spots) {
  return spots.map((spot) => {
    return Object.assign({}, spot, {
      tagList: (spot.tags || []).map((tag) => {
        return { text: tag, cssClass: getTagClass(tag) }
      })
    })
  })
}

// 数据缓存管理
const DataCache = {
  CACHE_KEY: 'home_data_cache',
  CACHE_DURATION: 5 * 60 * 1000, // 5分钟

  get() {
    try {
      const cache = wx.getStorageSync(this.CACHE_KEY)
      if (cache && Date.now() - cache.timestamp < this.CACHE_DURATION) {
        return cache.data
      }
    } catch (e) {
      console.error('读取缓存失败:', e)
    }
    return null
  },

  set(data) {
    try {
      wx.setStorageSync(this.CACHE_KEY, {
        data,
        timestamp: Date.now()
      })
    } catch (e) {
      console.error('写入缓存失败:', e)
    }
  },

  clear() {
    try {
      wx.removeStorageSync(this.CACHE_KEY)
    } catch (e) {
      console.error('清除缓存失败:', e)
    }
  }
}

Page({
  onLoad() {
    const win = wx.getWindowInfo()
    const menu = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = win.statusBarHeight || 20
    const navPaddingTop = menu.top > 0 ? menu.top : statusBarHeight + 8
    const navPaddingRight = win.windowWidth - menu.left + 8
    
    this.setData({
      navPaddingTop,
      navPaddingRight,
      loading: true
    })

    // 尝试从缓存加载数据
    const cachedData = DataCache.get()
    if (cachedData) {
      this.setData({
        ...cachedData,
        loading: false
      })
      this.startTypewriter()
    } else {
      // 模拟加载数据
      this.loadData()
    }
  },

  loadData() {
    // 模拟异步数据加载
    setTimeout(() => {
      const data = {
        homeBanners: newHomeBanners,
        homeStats,
        featuredSpots: mapSpotsWithTags(scenicSpots.slice(0, 4)),
        popularSpots: mapSpotsWithTags(scenicSpots).map(({ id, name, image, summary, tagList }) => ({
          id, name, image, summary, tagList
        })),
        routePlans,
        hotActivities: activityNews.slice(0, 2),
        quickServices: [
          { title: 'AI阿樟对话', icon: '💬', desc: '和阿樟聊天，了解古港故事', action: 'page', target: '/pages/ai-chat/ai-chat' },
          { title: '活动报名', icon: '🎯', desc: '查看近期活动并快速报名', action: 'page', target: '/pages/activity/activity' },
          { title: '音频讲解', icon: '🎧', desc: '进入景点详情开启讲解播放', action: 'detail', target: 'ship-museum' },
          { title: '导览路线', icon: '🗺️', desc: '查看半日游、一日游等推荐路线', action: 'tab', target: '/pages/guide/guide' }
        ],
        featureCards: [
          { title: '景点智能讲解', desc: '围绕红头船、古港遗址与侨乡建筑提供重点讲解内容。', action: 'detail', target: 'ship-museum' },
          { title: '全域游玩导览', desc: '按半日游、一日游、亲子研学等场景组织路线。', action: 'tab', target: '/pages/guide/guide' },
          { title: '地域文化科普', desc: '系统梳理红头船文化、侨乡文脉和古港建筑知识。', action: 'tab', target: '/pages/culture/culture' },
          { title: '特色风物推介', desc: '整合在地茶饮、文创手作与生活风物体验。', action: 'tab', target: '/pages/specialty/specialty' },
          { title: '活动资讯', desc: '查看近期讲解专场、夜游活动与亲子研学资讯。', action: 'page', target: '/pages/activity/activity' },
          { title: '我的页面', desc: '集中查看常用服务入口、活动提醒与出行建议。', action: 'tab', target: '/pages/profile/profile' }
        ],
        cultureTimeline,
        todayData,
        mapMarkers: [
          { id: 1, latitude: 23.462, longitude: 116.781, width: 30, height: 30, title: '红头船展示点', callout: { content: '红头船文化展示点', padding: 8, borderRadius: 8, display: 'ALWAYS', bgColor: '#8b3a1a', color: '#fff' } },
          { id: 2, latitude: 23.460, longitude: 116.779, width: 30, height: 30, title: '古港遗址', callout: { content: '古港遗址游览区', padding: 8, borderRadius: 8, display: 'ALWAYS', bgColor: '#8b3a1a', color: '#fff' } },
          { id: 3, latitude: 23.464, longitude: 116.783, width: 30, height: 30, title: '侨乡建筑群', callout: { content: '侨乡古建筑群', padding: 8, borderRadius: 8, display: 'ALWAYS', bgColor: '#8b3a1a', color: '#fff' } },
          { id: 4, latitude: 23.459, longitude: 116.777, width: 30, height: 30, title: '侨史记忆长廊', callout: { content: '侨史记忆长廊', padding: 8, borderRadius: 8, display: 'ALWAYS', bgColor: '#8b3a1a', color: '#fff' } }
        ],
        shipFeatures: [
          { icon: '🚢', label: '船型', value: '广式红头船' },
          { icon: '📏', label: '船长', value: '约 28 米' },
          { icon: '🌊', label: '航线', value: '东南亚多埠' },
          { icon: '📜', label: '年代', value: '清朝鼎盛期' }
        ],
        showBackTop: false,
        typewriterText: '',
        typewriterFull: '',
        anim_sf_ship: true,
        anim_sf_quick: true,
        anim_sf_timeline: true,
        anim_sf_dashboard: true
      }
      
      this.setData({
        ...data,
        loading: false,
        refreshing: false
      })
      
      DataCache.set(data)
      this.startTypewriter()
    }, 800)
  },

  onReady() {
    const observer = wx.createIntersectionObserver(this, { observeAll: true })
    observer.relativeToViewport({ bottom: 60 }).observe('.scroll-fade', (res) => {
      if (res.intersectionRatio > 0) {
        this.setData({ ['anim_' + res.id]: true })
      }
    })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    if (!this.data.loading) {
      this.startTypewriter()
    }
  },

  onHide() {
    clearInterval(this._typeInterval)
    this._typeInterval = null
  },

  onUnload() {
    clearInterval(this._typeInterval)
    this._typeInterval = null
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ refreshing: true })
    DataCache.clear()
    this.loadData()
    wx.showToast({
      title: '刷新成功',
      icon: 'success'
    })
  },

  startTypewriter() {
    const messages = [
      '我是古港文化助手阿樟，可以为你讲解红头船历史、推荐游玩路线和特色风物~',
      '樟林古港是海上丝绸之路的重要节点，想了解哪段故事？',
      '今日适合漫步古港遗址，体验侨乡建筑与工夫茶文化'
    ]
    const currentMsg = messages[Math.floor(Math.random() * messages.length)]
    let index = 0
    this.setData({ typewriterFull: currentMsg, typewriterText: '' })
    clearInterval(this._typeInterval)
    this._typeInterval = setInterval(() => {
      if (index < currentMsg.length) {
        index++
        this.setData({ typewriterText: currentMsg.slice(0, index) })
      } else {
        clearInterval(this._typeInterval)
        this._typeInterval = null
      }
    }, 60)
  },

  onShareAppMessage() {
    return { title: '樟林归舟 — 深度整合红头船文化、侨乡文脉与古港遗址', path: '/pages/index/index' }
  },

  handleActionTap(event) {
    const { action, target } = event.currentTarget.dataset
    if (action === 'tab') {
      wx.switchTab({ url: target })
      return
    }
    if (action === 'page') {
      wx.navigateTo({ url: target })
      return
    }
    wx.navigateTo({ url: '/pages/scenic-detail/scenic-detail?id=' + target })
  },

  handleStatTap(event) {
    const { target } = event.currentTarget.dataset
    if (target.startsWith('/pages/')) {
      wx.switchTab({ url: target })
    } else {
      wx.pageScrollTo({ selector: '#' + target, duration: 300 })
    }
  },

  openSpot(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({ url: '/pages/scenic-detail/scenic-detail?id=' + id })
  },

  openGuide(event) {
    const routeId = event.currentTarget.dataset.routeId
    const app = getApp()
    app.globalData = app.globalData || {}
    app.globalData.activeRouteId = routeId
    wx.switchTab({ url: '/pages/guide/guide' })
  },

  openActivity() {
    wx.navigateTo({ url: '/pages/activity/activity' })
  },

  openAiGuide() {
    wx.navigateTo({ url: '/pages/ai-chat/ai-chat' })
  },

  open3DShip() {
    wx.navigateTo({ url: '/pages/ship-3d/ship-3d' })
  },

  previewImage(event) {
    const src = event.currentTarget.dataset.src
    wx.previewImage({ current: src, urls: [src] })
  },

  onMarkerTap(event) {
    const markerId = event.detail.markerId
    const spotMap = { 1: 'ship-museum', 2: 'port-ruins', 3: 'historic-arcade', 4: 'overseas-memory' }
    const spotId = spotMap[markerId]
    if (spotId) {
      wx.navigateTo({ url: '/pages/scenic-detail/scenic-detail?id=' + spotId })
    }
  },

  onPageScroll(event) {
    this.setData({ showBackTop: event.scrollTop > 400 })
  },

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  }
})