const { scenicSpots } = require('../../data/site.js')
const geo = require('../../utils/geo.js')
const dev = require('../../utils/dev.js')

const MARKER_ID_MAP = {
  1: 'ship-museum',
  2: 'port-ruins',
  3: 'historic-arcade',
  4: 'overseas-memory'
}

const MARKER_ICONS = {
  'ship-museum': '/assets/icons/ship.png',
  'port-ruins': '/assets/icons/ruins.png',
  'historic-arcade': '/assets/icons/arcade.png',
  'overseas-memory': '/assets/icons/memory.png'
}

const FLOW_NODES_BASE = [
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
]

function buildMarkers(spotsWithDistance) {
  const markerIndex = { 'ship-museum': 1, 'port-ruins': 2, 'historic-arcade': 3, 'overseas-memory': 4 }
  return spotsWithDistance.map((spot) => {
    const calloutText = spot.distanceText
      ? spot.name + '\n距您 ' + spot.distanceText
      : spot.name
    return {
      id: markerIndex[spot.id],
      latitude: spot.latitude,
      longitude: spot.longitude,
      width: 40,
      height: 40,
      iconPath: MARKER_ICONS[spot.id] || '/assets/icons/ship.png',
      title: spot.name,
      callout: {
        content: calloutText,
        padding: 8,
        borderRadius: 8,
        display: 'BYCLICK',
        bgColor: spot.isNearby ? '#8b3a1a' : '#ffffff',
        color: spot.isNearby ? '#ffffff' : '#333333'
      }
    }
  })
}

Page({
  data: {
    activeTab: 'flow',
    spots: scenicSpots,
    spotsSorted: scenicSpots,
    flowNodes: FLOW_NODES_BASE,
    selectedNode: null,
    locationReady: false,
    isDevtools: false,
    locationTip: '正在获取您的位置…',
    nearestSpot: null,
    mapCenter: { latitude: 23.461, longitude: 116.780 },
    markers: buildMarkers(scenicSpots)
  },

  onLoad() {
    const app = getApp()
    if (app.globalData) {
      app.globalData.currentRoute = '/pages/guide/guide'
    }
    this.setData({ isDevtools: dev.isDevtools() })
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 })
    }
    const firstNode = this.data.flowNodes[0]
    if (!this.data.selectedNode) {
      this.setData({ selectedNode: firstNode })
    }
    this._nearbyNotified = this._nearbyNotified || {}
    this.refreshLocation()
  },

  refreshLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: (res) => {
        this.applyUserLocation(res.latitude, res.longitude)
      },
      fail: () => {
        const tip = dev.isDevtools()
          ? '模拟器：请点右侧「模拟位置」，或菜单 工具→位置信息 设置坐标'
          : '未开启定位，可在设置中授权后查看距离'
        this.setData({
          locationReady: false,
          locationTip: tip
        })
      }
    })
  },

  useMockLocation() {
    const mock = dev.ZHANGLIN_MOCK
    this._nearbyNotified = {}
    this.applyUserLocation(mock.latitude, mock.longitude)
    this.setData({
      locationTip: '模拟器 · 已模拟您在「' + mock.label + '」附近'
    })
  },

  applyUserLocation(userLat, userLng) {
    const spotsSorted = geo.sortSpotsByDistance(scenicSpots, userLat, userLng).map((s) => {
      return Object.assign({}, s, {
        isNearby: s.distanceMeters <= geo.ARRIVE_RADIUS_METERS
      })
    })

    const flowNodes = this.data.flowNodes.map((node) => {
      const spot = scenicSpots.find((s) => s.id === node.id)
      if (!spot) return node
      const meters = geo.getDistanceMeters(userLat, userLng, spot.latitude, spot.longitude)
      return Object.assign({}, node, {
        distanceText: geo.formatDistance(meters),
        isNearby: meters <= geo.ARRIVE_RADIUS_METERS
      })
    })

    const nearest = spotsSorted[0]
    const selectedId = this.data.selectedNode && this.data.selectedNode.id
    const selectedNode = flowNodes.find((n) => n.id === selectedId) || flowNodes[0]

    this.setData({
      locationReady: true,
      locationTip: '已定位 · 按距离为您排序',
      spotsSorted,
      flowNodes,
      selectedNode,
      nearestSpot: nearest && nearest.isNearby ? nearest : null,
      mapCenter: { latitude: userLat, longitude: userLng },
      markers: buildMarkers(spotsSorted)
    })

    if (nearest && nearest.isNearby && !this._nearbyNotified[nearest.id]) {
      this._nearbyNotified[nearest.id] = true
      wx.showModal({
        title: '您已到达附近',
        content: '您距离「' + nearest.name + '」约 ' + nearest.distanceText + '，是否收听阿樟讲解？',
        confirmText: '收听讲解',
        cancelText: '稍后',
        success: (r) => {
          if (r.confirm) {
            this.goSpotDetail(nearest.id, true)
          }
        }
      })
    }
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
    if (tab === 'map' && !this.data.locationReady) {
      this.refreshLocation()
    }
  },

  onNodeTap(e) {
    const id = e.currentTarget.dataset.id
    const nodes = this.data.flowNodes.map((n) => {
      return Object.assign({}, n, { active: n.id === id })
    })
    const selectedNode = nodes.find((n) => n.id === id)
    this.setData({ flowNodes: nodes, selectedNode })
  },

  goSpotDetail(id, autoplay) {
    let url = '/pages/scenic-detail/scenic-detail?id=' + id
    if (autoplay) url += '&autoplay=1'
    wx.navigateTo({ url })
  },

  onSpotTap(e) {
    this.goSpotDetail(e.currentTarget.dataset.id, false)
  },

  onMarkerTap(e) {
    const spotId = MARKER_ID_MAP[e.detail.markerId]
    if (spotId) {
      this.goSpotDetail(spotId, false)
    }
  },

  navigateToSpot(e) {
    this.goSpotDetail(e.currentTarget.dataset.id, false)
  },

  playAudio() {
    const node = this.data.selectedNode
    if (node) {
      this.goSpotDetail(node.id, true)
    }
  },

  openNavigation(e) {
    const id = e.currentTarget.dataset.id
    const spot = scenicSpots.find((s) => s.id === id)
    if (!spot || !spot.latitude) return
    wx.openLocation({
      latitude: spot.latitude,
      longitude: spot.longitude,
      name: spot.name,
      address: spot.location || '樟林古港',
      scale: 16
    })
  },

  onNearestTap() {
    const spot = this.data.nearestSpot
    if (spot) {
      this.goSpotDetail(spot.id, true)
    }
  }
})