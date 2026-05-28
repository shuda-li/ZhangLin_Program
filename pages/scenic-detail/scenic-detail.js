const { scenicSpots } = require('../../data/site.js')
const tts = require('../../utils/tts.js')
const UserManager = require('../../utils/user.js')

Page({
  data: {
    spot: null,
    isPlaying: false,
    audioLoading: false,
    featuresArray: [],
    fromScan: false,
    scanHint: '',
    isFavorited: false,
    isLoggedIn: false
  },

  onLoad(options) {
    const id = options.id || 'ship-museum'
    const autoplay = options.autoplay === '1' || options.autoplay === 'true'
    const fromScan = options.from === 'scan'
    const spot = scenicSpots.find((s) => s.id === id)

    if (spot) {
      const featuresArray = spot.features
        ? Object.keys(spot.features).map((key) => {
            return { label: key, value: spot.features[key] }
          })
        : []

      this.setData({
        spot,
        featuresArray,
        fromScan,
        scanHint: fromScan ? '欢迎现场扫码参观，阿樟为您讲解' : ''
      })

      // 检查登录和收藏状态
      this.checkUserStatus()

      if (autoplay && spot.audioScript) {
        setTimeout(() => {
          this.toggleAudio()
        }, 600)
      }
    }
  },

  onShow() {
    this.checkUserStatus()
  },

  onUnload() {
    tts.stop()
  },

  // 检查用户状态
  checkUserStatus() {
    const isLoggedIn = UserManager.isLoggedIn()
    const spot = this.data.spot
    const isFavorited = spot ? UserManager.isFavorited(spot.id) : false
    
    this.setData({
      isLoggedIn,
      isFavorited
    })
  },

  // 切换收藏
  toggleFavorite() {
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '收藏景点需要先登录账号',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.handleLogin()
          }
        }
      })
      return
    }

    const spot = this.data.spot
    if (!spot) return

    if (this.data.isFavorited) {
      // 取消收藏
      UserManager.removeFavorite(spot.id)
      this.setData({ isFavorited: false })
      wx.showToast({
        title: '已取消收藏',
        icon: 'none'
      })
    } else {
      // 添加收藏
      UserManager.addFavorite({
        id: spot.id,
        type: 'spot',
        name: spot.name,
        title: spot.name,
        image: spot.image,
        summary: spot.summary,
        description: spot.description,
        tags: spot.tags
      })
      this.setData({ isFavorited: true })
      wx.showToast({
        title: '收藏成功',
        icon: 'success'
      })
    }
  },

  // 登录
  handleLogin() {
    UserManager.login()
      .then(() => {
        this.checkUserStatus()
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

  goBack() {
    tts.stop()
    wx.navigateBack()
  },

  toggleAudio() {
    const spot = this.data.spot
    if (!spot || !spot.audioScript) return

    if (this.data.isPlaying) {
      tts.stop()
      this.setData({ isPlaying: false, audioLoading: false })
      return
    }

    this.setData({ audioLoading: true, isPlaying: true })
    tts.speak(spot.audioScript, { maxLen: 500 })
      .then((res) => {
        this.setData({ isPlaying: false, audioLoading: false })
        if (res && res.fallback) {
          tts.showTextNarration('阿樟·' + spot.name, spot.audioScript)
        }
      })
      .catch((err) => {
        this.setData({ isPlaying: false, audioLoading: false })
        tts.showTextNarration('阿樟·' + spot.name, spot.audioScript)
        if (err && err.message) {
          console.warn('讲解播放:', err.message)
        }
      })
  },

  openNavigation() {
    const spot = this.data.spot
    if (!spot || !spot.latitude) return
    wx.openLocation({
      latitude: spot.latitude,
      longitude: spot.longitude,
      name: spot.name,
      address: spot.location || '樟林古港',
      scale: 16
    })
  },

  startGuide() {
    tts.stop()
    wx.navigateTo({
      url: '/pages/ai-chat/ai-chat?topic=' + encodeURIComponent(this.data.spot.name)
    })
  }
})