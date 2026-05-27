Page({
  data: {
    shipImages: [
      '/assets/images/red-ship.jpg',
      '/assets/images/red-ship.jpg',
      '/assets/images/red-ship.jpg'
    ],
    currentIndex: 0,
    currentImage: '/assets/images/red-ship.jpg',
    startX: 0,
    currentX: 0,
    activeTab: 'info'
  },

  onLoad() {},

  goBack() {
    wx.navigateBack()
  },

  onTouchStart(e) {
    this.setData({ startX: e.touches[0].clientX })
  },

  onTouchMove(e) {
    this.setData({ currentX: e.touches[0].clientX })
  },

  onTouchEnd() {
    var diff = this.data.currentX - this.data.startX
    if (diff > 50) {
      var newIndex = (this.data.currentIndex + 1) % this.data.shipImages.length
      this.setData({ currentIndex: newIndex })
      this.updateCurrentImage()
    } else if (diff < -50) {
      var newIndex = (this.data.currentIndex - 1 + this.data.shipImages.length) % this.data.shipImages.length
      this.setData({ currentIndex: newIndex })
      this.updateCurrentImage()
    }
  },

  setImage(e) {
    var index = e.currentTarget.dataset.index
    this.setData({ currentIndex: index })
    this.updateCurrentImage()
  },

  updateCurrentImage() {
    this.setData({
      currentImage: this.data.shipImages[this.data.currentIndex]
    })
  },

  switchTab(e) {
    var tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  showDetail() {
    wx.navigateTo({ url: '/pages/scenic-detail/scenic-detail?id=ship-museum' })
  }
})