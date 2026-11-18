const { specialtyItems } = require('../../data/site');

const categories = ['全部'].concat(
  specialtyItems.reduce(function(result, item) {
    if (!result.includes(item.category)) { result.push(item.category); }
    return result;
  }, [])
);

function getAiTip(hour) {
  if (hour >= 14 && hour < 17) return { icon: 'ui-icon-leaf', text: '午后时光最适合体验工夫茶，慢下来感受潮汕待客之道。古港周边多家茶空间正在等你去坐坐。' };
  if (hour >= 11 && hour < 14) return { icon: 'ui-icon-bulb', text: '正午时分，蚝烙的香气飘满古港老街。来一份外酥内嫩的蚝烙，配上一碗牛肉丸汤，便是最地道的樟林午餐。' };
  if (hour >= 17 && hour < 20) return { icon: 'ui-icon-sun', text: '傍晚是挑选伴手礼的好时机，木雕摆件和侨批主题文创正在文创馆等你。带一份古港记忆回家。' };
  return { icon: 'ui-icon-sun', text: '早上从一杯工夫茶开始，午后寻味蚝烙和茶配，傍晚带一件木雕文创回家——这是属于你的樟林风物一日。' };
}

Page({
  onShareAppMessage() {
    return { title: '樟林古港 — 特色风物推介：工夫茶、点心、侨乡手作与非遗传承', path: '/pages/specialty/specialty' };
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
  },

  data: {
    categories,
    activeCategory: '全部',
    specialtyItems,
    visibleItems: specialtyItems,
    aiTip: getAiTip(new Date().getHours()),
    todayPicks: ['蚝烙与古港小吃', '潮汕工夫茶体验', '潮式点心与古港茶配'],
    showStory: false,
    storyItem: null,
    bannerOffset: 0,
    showBackTop: false
  },

  switchCategory(event) {
    var category = event.currentTarget.dataset.category;
    var visibleItems = category === '全部'
      ? this.data.specialtyItems
      : this.data.specialtyItems.filter(function(item) { return item.category === category; });
    this.setData({ activeCategory: category, visibleItems: visibleItems, showStory: false });
  },

  openStory(event) {
    var id = event.currentTarget.dataset.id;
    var item = this.data.specialtyItems.find(function(i) { return i.id === id; });
    if (item) {
      this.setData({ showStory: true, storyItem: item });
    }
  },

  closeStory() {
    this.setData({ showStory: false, storyItem: null });
  },

  previewImage(event) {
    var src = event.currentTarget.dataset.src;
    var fs = wx.getFileSystemManager();
    fs.readFile({
      filePath: src,
      success: function(res) {
        var tempPath = wx.env.USER_DATA_PATH + '/preview_' + Date.now() + '.jpg';
        fs.writeFile({
          filePath: tempPath,
          data: res.data,
          success: function() {
            wx.previewImage({ current: tempPath, urls: [tempPath] });
          }
        });
      }
    });
  },

  onPageScroll(event) {
    this.setData({
      showBackTop: event.scrollTop > 400,
      bannerOffset: Math.min(event.scrollTop * 0.3, 60)
    });
  },

  scrollToTop() {
    wx.pageScrollTo({ scrollTop: 0, duration: 300 });
  }
});