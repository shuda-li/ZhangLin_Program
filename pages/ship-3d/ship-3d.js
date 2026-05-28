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
    const diff = this.data.currentX - this.data.startX
    const len = this.data.shipImages.length
    let newIndex = this.data.currentIndex

    if (diff > 50) {
      newIndex = (this.data.currentIndex + 1) % len
    } else if (diff < -50) {
      newIndex = (this.data.currentIndex - 1 + len) % len
    }

    if (newIndex !== this.data.currentIndex) {
      this.setData({ currentIndex: newIndex })
      this.updateCurrentImage()
    }
  },

  setImage(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ currentIndex: index })
    this.updateCurrentImage()
  },

  updateCurrentImage() {
    this.setData({
      currentImage: this.data.shipImages[this.data.currentIndex]
    })
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  showDetail() {
    wx.navigateTo({ url: '/pages/scenic-detail/scenic-detail?id=ship-museum' })
  }
})