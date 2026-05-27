const aiLlm = require('../../utils/ai-llm.js')

Page({
  data: {
    messages: [],
    inputText: '',
    scrollTop: 0,
    showLoading: false,
    inputFocused: false
  },

  onLoad: function() {
    this.restoreHistory()
  },

  onShow: function() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  onUnload: function() {
    this.saveHistory()
  },

  restoreHistory: function() {
    try {
      const history = wx.getStorageSync('ai_chat_history')
      if (history && history.length > 0) {
        this.setData({ messages: history })
      }
    } catch (e) {
      console.error('恢复聊天历史失败:', e)
    }
  },

  saveHistory: function() {
    try {
      const messages = this.data.messages.slice(-50)
      wx.setStorageSync('ai_chat_history', messages)
      aiLlm.setMessages(messages.filter(m => m.role !== 'system'))
    } catch (e) {
      console.error('保存聊天历史失败:', e)
    }
  },

  goBack: function() {
    this.saveHistory()
    wx.navigateBack()
  },

  clearChat: function() {
    wx.showModal({
      title: '清空对话',
      content: '确定要清空所有对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ messages: [] })
          aiLlm.clearHistory()
          wx.removeStorageSync('ai_chat_history')
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  onInput: function(e) {
    this.setData({ inputText: e.detail.value })
  },

  sendMessage: function() {
    const text = this.data.inputText.trim()
    if (!text) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      time: this.formatTime(new Date())
    }

    const messages = [...this.data.messages, userMessage]
    this.setData({
      messages: messages,
      inputText: '',
      showLoading: true
    })

    this.scrollToBottom()

    aiLlm.chat(text).then((result) => {
      this.setData({ showLoading: false })

      if (result.success) {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.message,
          time: this.formatTime(new Date())
        }
        this.setData({
          messages: [...this.data.messages, aiMessage]
        })
        this.scrollToBottom()
      } else {
        wx.showToast({
          title: result.error || 'AI回复失败',
          icon: 'none'
        })
      }
    })
  },

  askQuestion: function(e) {
    const q = e.currentTarget.dataset.q
    this.setData({ inputText: q, inputFocused: true })
    this.sendMessage()
  },

  scrollToBottom: function() {
    setTimeout(() => {
      this.setData({ scrollTop: this.data.messages.length * 1000 })
    }, 100)
  },

  formatTime: function(date) {
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${hour}:${minute}`
  }
})