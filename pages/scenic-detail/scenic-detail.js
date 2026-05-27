const { scenicSpots } = require('../../data/site.js')

Page({
  data: {
    spot: null,
    isPlaying: false,
    featuresArray: []
  },

  onLoad(options) {
    const id = options.id || 'ship-museum'
    const spot = scenicSpots.find(s => s.id === id)
    if (spot) {
      const featuresArray = spot.features ? Object.entries(spot.features).map(([key, value]) => ({
        label: key,
        value: value
      })) : []
      this.setData({
        spot: spot,
        featuresArray: featuresArray
      })
    }
  },

  goBack() {
    wx.navigateBack()
  },

  toggleAudio() {
    this.setData({ isPlaying: !this.data.isPlaying })
    if (this.data.isPlaying) {
      wx.showToast({ title: '开始播放讲解', icon: 'none' })
    }
  },

  startGuide() {
    wx.navigateTo({ url: '/pages/ai-chat/ai-chat?topic=' + this.data.spot.name })
  }
})