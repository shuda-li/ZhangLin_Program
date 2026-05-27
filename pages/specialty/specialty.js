Page({
  data: {
    activeCategory: 'tea',
    teaItems: [
      { id: 1, name: '凤凰单丛', desc: '潮汕乌龙茶代表，香气高扬', price: 68, location: '古港茶庄', image: '/assets/images/tea.jpg' },
      { id: 2, name: '鸭屎香', desc: '银花香型单丛，独特香气', price: 58, location: '古港茶庄', image: '/assets/images/tea.jpg' }
    ],
    snackItems: [
      { id: 1, name: '潮汕牛肉火锅', desc: '新鲜牛肉，手打丸子', price: 88, location: '古港食府', image: '/assets/images/food.jpg' },
      { id: 2, name: '蚝烙', desc: '鲜蚝配薯粉浆，煎至金黄', price: 35, location: '古港小吃街', image: '/assets/images/food.jpg' }
    ],
    creativeItems: [
      { id: 1, name: '红头船模型', desc: '手工制作，收藏价值', price: 168, location: '文创商店', image: '/assets/images/model.jpg' },
      { id: 2, name: '侨批书签', desc: '仿古侨批设计', price: 38, location: '文创商店', image: '/assets/images/bookmark.jpg' }
    ],
    handcraftItems: [
      { id: 1, name: '手拉壶体验', desc: '潮汕朱泥壶制作', price: 128, location: '手作坊', image: '/assets/images/pottery.jpg' },
      { id: 2, name: '嵌瓷体验', desc: '潮汕传统建筑装饰工艺', price: 98, location: '手作坊', image: '/assets/images/mosaic.jpg' }
    ]
  },

  onLoad() {
    const app = getApp()
    if (app.globalData) {
      app.globalData.currentRoute = '/pages/specialty/specialty'
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 })
    }
  },

  switchCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ activeCategory: category })
  },

  get currentItems() {
    const map = {
      tea: this.data.teaItems,
      snack: this.data.snackItems,
      creative: this.data.creativeItems,
      handcraft: this.data.handcraftItems
    }
    return map[this.data.activeCategory] || []
  },

  showDetail(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: item.name,
      content: item.desc + '\n\n地点：' + item.location + '\n价格：' + (item.price > 0 ? '¥' + item.price : '免费'),
      showCancel: false
    })
  }
})