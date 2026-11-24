const commentService = require('../../utils/comment-service');

function starsText(rating) {
  const r = Math.max(0, Math.min(5, parseInt(rating, 10) || 0));
  if (!r) return '';
  return '★★★★★'.slice(0, r) + '☆☆☆☆☆'.slice(0, 5 - r);
}

function timeText(iso) {
  const raw = String(iso || '');
  if (!raw) return '';
  const date = new Date(raw);
  if (isNaN(date.getTime())) return raw.slice(0, 10);
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return Math.floor(diff / 60000) + '分钟前';
  if (diff < 24 * 60 * 60 * 1000) return Math.floor(diff / 3600000) + '小时前';
  if (diff < 7 * 24 * 60 * 60 * 1000) return Math.floor(diff / 86400000) + '天前';
  return raw.slice(0, 10).replace(/-/g, '/');
}

Component({
  properties: {
    targetType: { type: String, value: 'story' },
    targetId: { type: String, value: '' },
    targetName: { type: String, value: '' },
    showRating: { type: Boolean, value: false }
  },

  data: {
    comments: [],
    nickname: '',
    content: '',
    rating: 5,
    expanded: false,
    submitting: false,
    loaded: false
  },

  observers: {
    'targetType, targetId': function () {
      this.load();
    }
  },

  methods: {
    load() {
      const key = this.data.targetType + ':' + this.data.targetId;
      if (!this.data.targetId || this._loadedFor === key) return;
      this._loadedFor = key;
      this.setData({ loaded: false });
      commentService.list(this.data.targetType, this.data.targetId).then(comments => {
        this.setData({
          comments: comments.map(c => Object.assign({}, c, {
            timeText: timeText(c.createdAt),
            starsText: starsText(c.rating)
          })),
          loaded: true
        });
      });
    },
    toggleForm() {
      this.setData({ expanded: !this.data.expanded });
    },
    onNick(e) {
      this.setData({ nickname: e.detail.value });
    },
    onContent(e) {
      this.setData({ content: e.detail.value });
    },
    setRating(e) {
      this.setData({ rating: parseInt(e.currentTarget.dataset.rating, 10) });
    },
    submit() {
      const content = String(this.data.content || '').trim();
      if (!content) {
        wx.showToast({ title: '请输入评论内容', icon: 'none' });
        return;
      }
      if (this.data.submitting) return;
      this.setData({ submitting: true });
      commentService.add({
        targetType: this.data.targetType,
        targetId: this.data.targetId,
        targetName: this.data.targetName,
        nickname: this.data.nickname.trim() || '古港游客',
        content,
        rating: this.data.showRating ? this.data.rating : 0
      }).then(() => {
        this.setData({ content: '', expanded: false, submitting: false });
        this._loadedFor = null;
        this.load();
        wx.showToast({ title: '评论已发表', icon: 'success' });
      }).catch(() => {
        this.setData({ submitting: false });
        wx.showToast({ title: '评论失败，请重试', icon: 'none' });
      });
    }
  }
});
