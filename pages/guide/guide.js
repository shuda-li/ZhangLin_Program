const { scenicSpots } = require('../../data/site.js')

Page({
  data: {
    activeTab: 'flow',
    spots: scenicSpots,
    flowNodes: [
      {
        id: 'ship-museum',
        name: '红头船文化展示点',
        icon: '🚢',
        time: '约 1.5 小时',
        location: '古港码头',
        active: true,
        description: '红头船是清代潮汕地区远洋帆船的典范，因船头涂朱红色而得名，见证了海上丝绸之路的繁荣。',
        tags: ['亲子', '拍照', '核心']
      },
      {
        id: 'port-ruins',
        name: '古港遗址游览区',
        icon: '🏛️',
        time: '约 1 小时',
        location: '古港核心区',
        active: false,
        description: '保存完整的清代港口遗址，包括古码头、石砌步道、货仓遗迹，是研究海丝贸易的活化石。',
        tags: ['历史', '考古']
      },
      {
        id: 'historic-arcade',
        name: '侨乡古建筑群',
        icon: '🏘️',
        time: '约 1.5 小时',
        location: '古港西街',
        active: false,
        description: '融合中西建筑风格的骑楼街区，包括陈氏大楼、黄氏家庙等代表性建筑，展现侨乡独特审美。',
        tags: ['建筑', '摄影']
      },
      {
        id: 'overseas-memory',
        name: '侨史记忆长廊',
        icon: '📜',
        time: '约 1 小时',
        location: '古港文化中心',
        active: false,
        description: '系统展示潮汕华侨移民史与侨胞贡献的室内展廊，通过实物、信件、照片还原历史细节。',
        tags: ['人文', '研学']
      }
    ],
    selectedNode: null,
    mapCenter: {
      latitude: 23.461,
      longitude: 116.780
    },
    markers: [
      { id: 1, latitude: 23.462, longitude: 116.781, width: 40, height: 40, iconPath: '/assets/icons/ship.png', title: '红头船文化展示点' },
      { id: 2, latitude: 23.460, longitude: 116.779, width: 40, height: 40, iconPath: '/assets/icons/ruins.png', title: '古港遗址' },
      { id: 3, latitude: 23.464, longitude: 116.783, width: 40, height: 40, iconPath: '/assets/icons/arcade.png', title: '侨乡古建筑群' },
      { id: 4, latitude: 23.459, longitude: 116.777, width: 40, height: 40, iconPath: '/assets/icons/memory.png', title: '侨史记忆长廊' }
    ]
  },

  onLoad() {
    const app = getApp()
    if (app.globalData) {
      app.globalData.currentRoute = '/pages/guide/guide'
    }
    const firstNode = this.data.flowNodes[0]
    this.setData({ selectedNode: firstNode })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  onNodeTap(e) {
    const id = e.currentTarget.dataset.id
    const nodes = this.data.flowNodes.map(n => ({
      ...n,
      active: n.id === id
    }))
    const selectedNode = nodes.find(n => n.id === id)
    this.setData({
      flowNodes: nodes,
      selectedNode
    })
  },

  onSpotTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/scenic-detail/scenic-detail?id=' + id
    })
  },

  onMarkerTap(e) {
    const markerId = e.detail.markerId
    const spotMap = { 1: 'ship-museum', 2: 'port-ruins', 3: 'historic-arcade', 4: 'overseas-memory' }
    const spotId = spotMap[markerId]
    if (spotId) {
      wx.navigateTo({ url: '/pages/scenic-detail/scenic-detail?id=' + spotId })
    }
  },

  navigateToSpot(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/scenic-detail/scenic-detail?id=' + id })
  },

  playAudio() {
    wx.showToast({ title: '播放讲解中...', icon: 'none' })
  }
})