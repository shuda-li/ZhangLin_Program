const { scenicSpots } = require('../../data/site');
const dataService = require('../../utils/data-service');
const commentService = require('../../utils/comment-service');
const {
  addRecentSpot, isFavoriteSpot, toggleFavoriteSpot,
  toggleLikeSpot, isLikedSpot
} = require('../../utils/storage');

function decorateReviews(rawReviews) {
  return rawReviews.map(r => ({
    ...r,
    starsText: '★★★★★'.slice(0, r.rating) + '☆☆☆☆☆'.slice(0, 5 - r.rating),
    timeText: (r.createdAt || '').slice(0, 10)
  }));
}

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
    submittingReview: false,
    // 评价面板（bottom sheet）
    panelHeight: 0,        // 当前高度(px)，随拖拽变化
    panelBottomPad: 0,     // 底部安全区(px)
    panelExpanded: false,  // 是否已展开为全屏
    panelDragging: false,  // 是否正在拖拽
    panelSnapping: false   // 松手吸附中（启用高度过渡）
  },

  onLoad(options) {
    const scenicSpot = (scenicSpots || []).find((item) => item.id === options.id) || scenicSpots[0];
    addRecentSpot(scenicSpot);
    this.setData({
      scenicSpot,
      gallery: scenicSpot.gallery || [scenicSpot.image],
      isFavorite: isFavoriteSpot(scenicSpot.id),
      isLiked: isLikedSpot(scenicSpot.id),
      reviews: [],
      durationText: scenicSpot.audioMeta ? scenicSpot.audioMeta.duration : '00:00'
    });
    commentService.list('spot', scenicSpot.id).then(reviews => {
      this.setData({ reviews: decorateReviews(reviews) });
    });
    wx.setNavigationBarTitle({ title: scenicSpot.name });
    this._spotId = scenicSpot.id;
    setTimeout(() => this.setData({ loading: false }), 400);
    this.refreshFromServer();
  },

  // 用管理端维护的内容覆盖当前景点（按 id 匹配），失败时保持本地数据
  async refreshFromServer() {
    const result = await dataService.getOverview(false);
    if (result.source === 'local' || !Array.isArray(result.data.scenicSpots)) return;
    const fresh = result.data.scenicSpots.find((s) => s.id === this._spotId);
    if (!fresh) return;
    // 图片/图集沿用本地已校验资源，仅覆盖文字与运营字段
    const base = this.data.scenicSpot || {};
    this.setData({
      scenicSpot: Object.assign({}, base, {
        name: fresh.name || base.name,
        summary: fresh.summary || base.summary,
        location: fresh.location || base.location,
        duration: fresh.openTime || base.duration,
        image: base.image,
        gallery: base.gallery
      })
    });
    wx.setNavigationBarTitle({ title: this.data.scenicSpot.name });
  },

  onShareAppMessage() {
    const name = this.data.scenicSpot ? this.data.scenicSpot.name : '樟林古港景点';
    return { title: `樟林古港 — ${name}`, path: `/pages/scenic-detail/scenic-detail?id=${this.data.scenicSpot ? this.data.scenicSpot.id : ''}` };
  },

  onUnload() {
    this.clearAudioTimer();
    this.destroyAudio();
    if (this._snapTimer) { clearTimeout(this._snapTimer); this._snapTimer = null; }
  },
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
  // 依据可视区计算面板尺寸（半屏 / 全屏 / 底部安全区），与页面滚动位置无关
  computePanelMetrics() {
    let windowHeight = 0;
    let safeBottom = 0;
    try {
      const sys = wx.getSystemInfoSync();
      windowHeight = sys.windowHeight || 0;
      if (sys.safeArea && typeof sys.screenHeight === 'number') {
        safeBottom = Math.max(0, Math.round(sys.screenHeight - sys.safeArea.bottom));
      }
    } catch (e) {
      windowHeight = 0;
    }
    if (!windowHeight) windowHeight = 667; // 极旧环境兜底
    const full = windowHeight;
    const half = Math.max(280, Math.round(windowHeight * 0.72));
    this._panelMetrics = { half, full };
    return { half, full, safeBottom };
  },
  openReview() {
    const m = this.computePanelMetrics();
    // 单次 setData，避免高度从 0 跳变造成闪烁
    this.setData({
      showReviewPanel: true,
      panelHeight: m.half,
      panelBottomPad: m.safeBottom,
      panelExpanded: false,
      panelDragging: false,
      panelSnapping: false,
      reviewRating: 5,
      reviewContent: '',
      reviewImages: []
    });
  },
  closeReview() {
    if (this._snapTimer) { clearTimeout(this._snapTimer); this._snapTimer = null; }
    this.setData({ showReviewPanel: false, panelDragging: false, panelSnapping: false });
  },
  // 视口尺寸变化（横竖屏 / 分屏）时按当前展开状态重算
  onResize() {
    if (!this.data.showReviewPanel) return;
    const m = this.computePanelMetrics();
    this.setData({
      panelBottomPad: m.safeBottom,
      panelHeight: this.data.panelExpanded ? m.full : m.half
    });
  },
  onHandleTouchStart(e) {
    const t = (e.touches && e.touches[0]) || {};
    this._dragStartY = t.clientY || 0;
    this._dragStartHeight = this.data.panelHeight;
    this._dragLastY = this._dragStartY;
    this._dragLastTime = Date.now();
    this._dragVelocity = 0;
    if (this._snapTimer) { clearTimeout(this._snapTimer); this._snapTimer = null; }
    this.setData({ panelDragging: true, panelSnapping: false });
  },
  onHandleTouchMove(e) {
    if (!this.data.panelDragging || !this._panelMetrics) return;
    const t = (e.touches && e.touches[0]) || {};
    const y = t.clientY || 0;
    const { half, full } = this._panelMetrics;
    // 向上拖动 clientY 变小 => delta 为正 => 面板变高
    const delta = this._dragStartY - y;
    let h = this._dragStartHeight + delta;
    // 上限全屏；下限允许拖到半屏的 55%，用于下滑关闭
    h = Math.max(half * 0.55, Math.min(h, full));
    const now = Date.now();
    const dt = Math.max(1, now - this._dragLastTime);
    this._dragVelocity = (this._dragLastY - y) / dt; // px/ms，正数表示向上
    this._dragLastY = y;
    this._dragLastTime = now;
    this.setData({ panelHeight: Math.round(h) });
  },
  onHandleTouchEnd() {
    if (!this.data.panelDragging || !this._panelMetrics) return;
    this.setData({ panelDragging: false });
    const { half, full } = this._panelMetrics;
    const cur = this.data.panelHeight;
    const v = this._dragVelocity || 0;
    const expandLine = half + (full - half) * 0.4;
    let height, expanded;
    if (v > 0.3 || cur >= expandLine) {
      // 向上滑或越过阈值：展开全屏
      height = full; expanded = true;
    } else if (v < -0.3 || cur <= half * 0.62) {
      // 向下滑：全屏先回到半屏；半屏则关闭
      if (this.data.panelExpanded) {
        height = half; expanded = false;
      } else {
        this.closeReview();
        return;
      }
    } else if (this.data.panelExpanded) {
      height = full; expanded = true;
    } else {
      height = half; expanded = false;
    }
    // 松手后启用高度过渡，平滑吸附到目标状态
    this.setData({ panelHeight: height, panelExpanded: expanded, panelSnapping: true });
    if (this._snapTimer) clearTimeout(this._snapTimer);
    this._snapTimer = setTimeout(() => {
      this.setData({ panelSnapping: false });
      this._snapTimer = null;
    }, 340);
  },
  // 阻止点击面板内部时冒泡关闭面板（wxml catchtap="dummy"）
  dummy() {},
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
    commentService.add({
      targetType: 'spot',
      targetId: this.data.scenicSpot.id,
      targetName: this.data.scenicSpot.name,
      nickname: '古港游客',
      rating: this.data.reviewRating,
      content: this.data.reviewContent.trim(),
      images: this.data.reviewImages
    }).then(() => {
      return commentService.list('spot', this.data.scenicSpot.id);
    }).then(reviews => {
      this.setData({ reviews: decorateReviews(reviews), showReviewPanel: false, submittingReview: false });
      wx.showToast({ title: '评价成功', icon: 'success' });
    }).catch(() => {
      this.setData({ submittingReview: false });
      wx.showToast({ title: '评价失败', icon: 'none' });
    });
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
