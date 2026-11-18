const { scenicSpots } = require('../../data/site');
const {
  addRecentSpot, isFavoriteSpot, toggleFavoriteSpot,
  toggleLikeSpot, isLikedSpot,
  addReview, getReviews
} = require('../../utils/storage');

Page({
  data: {
    loading: true,
    scenicSpot: null,
    gallery: [],
    isFavorite: false,
    isLiked: false,
    likeCount: 0,
    reviews: [],
    // 音频
    isAudioPlaying: false,
    activeAudioIndex: 0,
    audioProgress: 0,
    currentTimeText: '00:00',
    durationText: '00:00',
    audioMode: 'script',
    // 评价
    showReviewPanel: false,
    reviewRating: 5,
    reviewContent: '',
    reviewImages: [],
    submittingReview: false
  },

  onLoad(options) {
    const scenicSpot = (scenicSpots || []).find((item) => item.id === options.id) || scenicSpots[0];
    addRecentSpot(scenicSpot);
    const rawReviews = getReviews(scenicSpot.id);
    const reviews = rawReviews.map(r => ({
      ...r,
      starsText: '★★★★★'.slice(0, r.rating) + '☆☆☆☆☆'.slice(0, 5 - r.rating),
      timeText: (r.createdAt || '').slice(0, 10)
    }));
    this.setData({
      scenicSpot,
      gallery: scenicSpot.gallery || [scenicSpot.image],
      isFavorite: isFavoriteSpot(scenicSpot.id),
      isLiked: isLikedSpot(scenicSpot.id),
      reviews,
      durationText: scenicSpot.audioMeta ? scenicSpot.audioMeta.duration : '00:00'
    });
    wx.setNavigationBarTitle({ title: scenicSpot.name });
    setTimeout(() => this.setData({ loading: false }), 400);
  },

  onShareAppMessage() {
    const name = this.data.scenicSpot ? this.data.scenicSpot.name : '樟林古港景点';
    return { title: `樟林古港 — ${name}`, path: `/pages/scenic-detail/scenic-detail?id=${this.data.scenicSpot ? this.data.scenicSpot.id : ''}` };
  },

  onUnload() { this.clearAudioTimer(); this.destroyAudio(); },
  clearAudioTimer() { if (this.audioTimer) { clearInterval(this.audioTimer); this.audioTimer = null; } },
  destroyAudio() { if (this.innerAudioContext) { this.innerAudioContext.destroy(); this.innerAudioContext = null; } },

  // ═══ 点赞 ═══
  toggleLike() {
    const result = toggleLikeSpot(this.data.scenicSpot.id);
    const likeText = result.liked ? '已点赞' : '已取消点赞';
    this.setData({ isLiked: result.liked, likeCount: result.count });
    wx.showToast({ title: likeText, icon: 'none', duration: 1000 });
  },

  // ═══ 评价 ═══
  openReview() {
    this.setData({ showReviewPanel: true, reviewRating: 5, reviewContent: '', reviewImages: [] });
  },
  closeReview() {
    this.setData({ showReviewPanel: false });
  },
  setRating(e) {
    this.setData({ reviewRating: parseInt(e.currentTarget.dataset.rating) });
  },
  onReviewInput(e) {
    this.setData({ reviewContent: e.detail.value });
  },
  chooseReviewImage() {
    const that = this;
    const max = 3 - this.data.reviewImages.length;
    if (max <= 0) { wx.showToast({ title: '最多上传3张图片', icon: 'none' }); return; }
    wx.chooseMedia({
      count: max, mediaType: ['image'], sizeType: ['compressed'],
      success(res) {
        const paths = res.tempFiles.map(f => f.tempFilePath);
        that.setData({ reviewImages: that.data.reviewImages.concat(paths).slice(0, 3) });
      }
    });
  },
  removeReviewImage(e) {
    const idx = e.currentTarget.dataset.index;
    const images = this.data.reviewImages.slice();
    images.splice(idx, 1);
    this.setData({ reviewImages: images });
  },
  submitReview() {
    if (!this.data.reviewContent.trim()) { wx.showToast({ title: '请输入评价内容', icon: 'none' }); return; }
    if (this.data.submittingReview) return;
    this.setData({ submittingReview: true });
    try {
      const raw = addReview(this.data.scenicSpot.id, {
        nickname: '古港游客',
        rating: this.data.reviewRating,
        content: this.data.reviewContent.trim(),
        images: this.data.reviewImages
      });
      const reviews = raw.map(r => ({
        ...r,
        starsText: '★★★★★'.slice(0, r.rating) + '☆☆☆☆☆'.slice(0, 5 - r.rating),
        timeText: (r.createdAt || '').slice(0, 10)
      }));
      this.setData({ reviews, showReviewPanel: false, submittingReview: false });
      wx.showToast({ title: '评价成功', icon: 'success' });
    } catch (e) {
      this.setData({ submittingReview: false });
      wx.showToast({ title: '评价失败', icon: 'none' });
    }
  },

  // ═══ 音频 ═══
  switchAudioMode(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === this.data.audioMode) return;
    this.clearAudioTimer();
    if (this.innerAudioContext) { this.innerAudioContext.stop(); }
    this.setData({ audioMode: mode, isAudioPlaying: false, audioProgress: 0, currentTimeText: '00:00' });
  },
  ensureAudioContext() {
    if (this.innerAudioContext) return;
    const context = wx.createInnerAudioContext();
    context.src = this.data.scenicSpot.audioUrl || '';
    context.obeyMuteSwitch = false;
    context.onPlay(() => { this.setData({ isAudioPlaying: true }); });
    context.onPause(() => { this.setData({ isAudioPlaying: false }); });
    context.onTimeUpdate(() => {
      const now = Date.now();
      if (this.lastAudioUpdate && now - this.lastAudioUpdate < 250) return;
      this.lastAudioUpdate = now;
      const duration = Math.max(1, Math.floor(context.duration || 0));
      const current = Math.floor(context.currentTime || 0);
      this.setData({
        currentTimeText: this.formatTime(current),
        durationText: this.formatTime(duration),
        audioProgress: Math.min(100, Math.round((current / duration) * 100))
      });
    });
    context.onEnded(() => { this.setData({ isAudioPlaying: false, audioProgress: 100 }); });
    this.innerAudioContext = context;
  },
  formatTime(sec) { return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; },
  toggleAudioGuide() {
    if (this.data.audioMode === 'audio') {
      if (!this.data.scenicSpot.audioUrl) { wx.showToast({ title: '音频资源制作中，敬请期待', icon: 'none' }); return; }
      this.ensureAudioContext();
      if (this.data.isAudioPlaying) { this.innerAudioContext.pause(); } else { this.innerAudioContext.play(); }
      return;
    }
    if (this.data.isAudioPlaying) { this.clearAudioTimer(); this.setData({ isAudioPlaying: false }); wx.showToast({ title: '已暂停', icon: 'none' }); return; }
    const total = this.data.scenicSpot.audioGuide.length;
    this.clearAudioTimer();
    this.setData({ isAudioPlaying: true, activeAudioIndex: 0, audioProgress: total ? Math.round(100/total) : 0, currentTimeText: '00:00', durationText: this.data.scenicSpot.audioMeta ? this.data.scenicSpot.audioMeta.duration : '00:00' });
    this.audioTimer = setInterval(() => {
      const ni = this.data.activeAudioIndex + 1;
      if (ni >= total) {
        this.clearAudioTimer();
        this.setData({ isAudioPlaying: false, activeAudioIndex: total - 1, audioProgress: 100, currentTimeText: this.data.durationText });
        wx.showToast({ title: '讲解完成', icon: 'none' });
        return;
      }
      this.setData({ activeAudioIndex: ni, audioProgress: Math.round(((ni+1)/total)*100), currentTimeText: this.formatTime(ni*60) });
    }, 2600);
  },
  nextParagraph() {
    if (this.data.audioMode === 'audio') { wx.showToast({ title: '音频模式下请用播放控制', icon: 'none' }); return; }
    const total = this.data.scenicSpot.audioGuide.length;
    const ni = Math.min(this.data.activeAudioIndex + 1, total - 1);
    this.setData({ activeAudioIndex: ni, audioProgress: Math.round(((ni+1)/total)*100), currentTimeText: this.formatTime(ni*60) });
  },

  // ═══ 收藏 ═══
  toggleFavorite() {
    const isFavorite = toggleFavoriteSpot(this.data.scenicSpot);
    this.setData({ isFavorite });
    wx.showToast({ title: isFavorite ? '已收藏' : '已取消', icon: 'none' });
  },

  // ═══ 图片预览 ═══
  previewGallery(event) {
    const urls = this.data.gallery;
    const current = (event && event.currentTarget && event.currentTarget.dataset.current) || this.data.scenicSpot.image;
    const fs = wx.getFileSystemManager(); let done = 0; const tmp = [];
    urls.forEach((url, i) => {
      fs.readFile({ filePath: url, success: (res) => {
        const p = `${wx.env.USER_DATA_PATH}/g_${i}_${Date.now()}.jpg`;
        fs.writeFile({ filePath: p, data: res.data, success: () => { tmp[i] = p; done++; if (done === urls.length) { wx.previewImage({ current: tmp[Math.max(0, urls.indexOf(current))], urls: tmp }); } } });
      }, fail: () => { done++; if (done === urls.length && tmp.filter(Boolean).length) { wx.previewImage({ urls: tmp.filter(Boolean) }); } } });
    });
  }
});
