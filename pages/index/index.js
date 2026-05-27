const { scenicSpots, routePlans, homeStats, newHomeBanners, activityNews, cultureTimeline, todayData } = require('../../data/site.js')

function getTagClass(tag) {
  if (tag.indexOf('亲子') >= 0 || tag.indexOf('家庭') >= 0 || tag.indexOf('研学') >= 0) return 'tag-family'
  if (tag.indexOf('拍照') >= 0 || tag.indexOf('摄影') >= 0) return 'tag-photo'
  if (tag.indexOf('夜') >= 0) return 'tag-night'
  if (tag.indexOf('打卡') >= 0 || tag.indexOf('热门') >= 0) return 'tag-hot'
  return ''
}

function mapSpotsWithTags(spots) {
  return spots.map(function(spot) {
    return Object.assign({}, spot, {
      tagList: (spot.tags || []).map(function(tag) {
        return { text: tag, cssClass: getTagClass(tag) }
      })
    })
  })
}

Page({
  onReady: function() {
    var that = this
    var observer = wx.createIntersectionObserver(this, { observeAll: true })
    observer.relativeToViewport({ bottom: 60 }).observe('.scroll-fade', function(res) {
      if (res.intersectionRatio > 0) {
        that.setData({ ['anim_' + res.id]: true })
      }
    })
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
    this.startTypewriter()
  },

  startTypewriter: function() {
    var messages = [
      '我是古港文化助手阿樟，可以为你讲解红头船历史、推荐游玩路线和特色风物~',
      '樟林古港是海上丝绸之路的重要节点，想了解哪段故事？',
      '今日适合漫步古港遗址，体验侨乡建筑与工夫茶文化'
    ]
    var that = this
    var currentMsg = messages[Math.floor(Math.random() * messages.length)]
    var index = 0
    that.setData({ typewriterFull: currentMsg, typewriterText: '' })
    clearInterval(that._typeInterval)
    that._typeInterval = setInterval(function() {
      if (index < currentMsg.length) {
        index++
        that.setData({ typewriterText: currentMsg.slice(0, index) })
      } else {
        clearInterval(that._typeInterval)
      }
    }, 60)
  },

  onShareAppMessage: function() {
    return { title: '樟林归舟 — 深度整合红头船文化、侨乡文脉与古港遗址', path: '/pages/index/index' }
  },

  data: {
    homeBanners: newHomeBanners,
    homeStats: homeStats,
    featuredSpots: mapSpotsWithTags(scenicSpots.slice(0, 4)),
    popularSpots: mapSpotsWithTags(scenicSpots).map(function(_a) {
      var id = _a.id, name = _a.name, image = _a.image, summary = _a.summary, tagList = _a.tagList
      return ({ id: id, name: name, image: image, summary: summary, tagList: tagList })
    }),
    routePlans: routePlans,
    hotActivities: activityNews.slice(0, 2),
    quickServices: [
      { title: 'AI阿樟对话', icon: '💬', desc: '和阿樟聊天，了解古港故事', action: 'page', target: '/pages/ai-chat/ai-chat' },
      { title: '活动报名', icon: '🎯', desc: '查看近期活动并快速报名', action: 'page', target: '/pages/activity/activity' },
      { title: '音频讲解', icon: '🎧', desc: '进入景点详情开启讲解播放', action: 'detail', target: 'ship-museum' },
      { title: '导览路线', icon: '🗺️', desc: '查看半日游、一日游等推荐路线', action: 'tab', target: '/pages/guide/guide' }
    ],
    featureCards: [
      {
        title: '景点智能讲解',
        desc: '围绕红头船、古港遗址与侨乡建筑提供重点讲解内容。',
        action: 'detail',
        target: 'ship-museum'
      },
      {
        title: '全域游玩导览',
        desc: '按半日游、一日游、亲子研学等场景组织路线。',
        action: 'tab',
        target: '/pages/guide/guide'
      },
      {
        title: '地域文化科普',
        desc: '系统梳理红头船文化、侨乡文脉和古港建筑知识。',
        action: 'tab',
        target: '/pages/culture/culture'
      },
      {
        title: '特色风物推介',
        desc: '整合在地茶饮、文创手作与生活风物体验。',
        action: 'tab',
        target: '/pages/specialty/specialty'
      },
      {
        title: '活动资讯',
        desc: '查看近期讲解专场、夜游活动与亲子研学资讯。',
        action: 'page',
        target: '/pages/activity/activity'
      },
      {
        title: '我的页面',
        desc: '集中查看常用服务入口、活动提醒与出行建议。',
        action: 'tab',
        target: '/pages/profile/profile'
      }
    ],
    cultureTimeline: cultureTimeline,
    todayData: todayData,
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
  },

  handleActionTap: function(event) {
    var action = event.currentTarget.dataset.action
    var target = event.currentTarget.dataset.target
    if (action === 'tab') {
      wx.switchTab({ url: target })
      return
    }
    if (action === 'page') {
      wx.navigateTo({ url: target })
      return
    }
    wx.navigateTo({
      url: '/pages/scenic-detail/scenic-detail?id=' + target
    })
  },

  handleStatTap: function(event) {
    var target = event.currentTarget.dataset.target
    if (target.startsWith('/pages/')) {
      wx.switchTab({ url: target })
    } else {
      wx.pageScrollTo({ selector: '#' + target, duration: 300 })
    }
  },

  openSpot: function(event) {
    var id = event.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/scenic-detail/scenic-detail?id=' + id
    })
  },

  openGuide: function(event) {
    var routeId = event.currentTarget.dataset.routeId
    var app = getApp()
    app.globalData = app.globalData || {}
    app.globalData.activeRouteId = routeId
    wx.switchTab({ url: '/pages/guide/guide' })
  },

  openActivity: function() {
    wx.navigateTo({ url: '/pages/activity/activity' })
  },

  openAiGuide: function() {
    wx.navigateTo({ url: '/pages/ai-chat/ai-chat' })
  },

  open3DShip: function() {
    wx.navigateTo({ url: '/pages/ship-3d/ship-3d' })
  },

  previewImage: function(event) {
    var src = event.currentTarget.dataset.src
    var fs = wx.getFileSystemManager()
    fs.readFile({
      filePath: src,
      success: function(res) {
        var tempPath = wx.env.USER_DATA_PATH + '/preview_' + Date.now() + '.jpg'
        fs.writeFile({
          filePath: tempPath,
          data: res.data,
          success: function() {
            wx.previewImage({ current: tempPath, urls: [tempPath] })
          }
        })
      }
    })
  },

  onMarkerTap: function(event) {
    var markerId = event.detail.markerId
    var spotMap = { 1: 'ship-museum', 2: 'port-ruins', 3: 'historic-arcade', 4: 'overseas-memory' }
    var spotId = spotMap[markerId]
    if (spotId) {
      wx.navigateTo({ url: '/pages/scenic-detail/scenic-detail?id=' + spotId })
    }
  },

  onPageScroll: function(event) {
    this.setData({ showBackTop: event.scrollTop > 400 })
  },

  scrollToTop: function() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 })
  }
})