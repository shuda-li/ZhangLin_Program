const {
  cultureTopics,
  cultureTimeline,
  heritageItems,
  overseasStories,
  exhibitionItems,
  cultureAiQA
} = require('../../data/site');

Page({
  onShareAppMessage() {
    return { title: '樟林古港 — 海丝文化数字展馆：红头船、侨乡文脉与非遗传承', path: '/pages/culture/culture' };
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  data: {
    cultureTopics,
    cultureTimeline,
    heritageItems,
    overseasStories,
    exhibitionItems,
    cultureAiQA,
    activeTopicId: (cultureTopics && cultureTopics[0]) ? cultureTopics[0].id : '',
    activeTopic: (cultureTopics && cultureTopics[0]) ? cultureTopics[0] : { title: '', intro: '', sections: [], facts: [], image: '' },
    showAiAnswer: false,
    aiAnswer: '',
    bannerOffset: 0,
    showBackTop: false
  },

  switchTopic(event) {
    var id = event.currentTarget.dataset.id;
    var activeTopic = this.data.cultureTopics.find(function(t) { return t.id === id; });
    this.setData({ activeTopicId: id, activeTopic: activeTopic, showAiAnswer: false });
  },

  askAiCulture(event) {
    var q = event.currentTarget.dataset.q;
    var item = this.data.cultureAiQA.find(function(i) { return i.q === q; });
    if (item) {
      this.setData({ showAiAnswer: true, aiAnswer: item.a, aiQuestion: item.q });
    }
  },

  closeAiAnswer() {
    this.setData({ showAiAnswer: false });
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