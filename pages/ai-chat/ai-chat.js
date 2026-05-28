const aiLlm = require('../../utils/ai-llm.js')
const tts = require('../../utils/tts.js')

Page({
  data: {
    messages: [],
    inputText: '',
    scrollTop: 0,
    showLoading: false,
    inputFocused: false,
    voiceEnabled: false,
    voiceAvailable: false,
    speakingId: null
  },

  onLoad(options) {
    this.restoreHistory()
    tts.checkPluginAvailable().then((ok) => {
      this.setData({
        voiceAvailable: ok,
        voiceEnabled: ok
      })
    })
    if (options.topic) {
      this.setData({
        inputText: '请介绍一下' + decodeURIComponent(options.topic)
      })
    }
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 })
    }
  },

  onUnload() {
    this.saveHistory()
    tts.stop()
  },

  restoreHistory() {
    try {
      const history = wx.getStorageSync('ai_chat_history')
      if (history && history.length > 0) {
        this.setData({ messages: history })
      }
    } catch (e) {
      console.error('恢复聊天历史失败:', e)
    }
  },

  saveHistory() {
    try {
      const messages = this.data.messages.slice(-50)
      wx.setStorageSync('ai_chat_history', messages)
      aiLlm.setMessages(messages.filter((m) => m.role !== 'system'))
    } catch (e) {
      console.error('保存聊天历史失败:', e)
    }
  },

  goBack() {
    this.saveHistory()
    tts.stop()
    wx.navigateBack()
  },

  clearChat() {
    wx.showModal({
      title: '清空对话',
      content: '确定要清空所有对话记录吗？',
      success: (res) => {
        if (res.confirm) {
          tts.stop()
          this.setData({ messages: [], speakingId: null })
          aiLlm.clearHistory()
          wx.removeStorageSync('ai_chat_history')
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  toggleVoice() {
    if (!this.data.voiceAvailable) {
      wx.showModal({
        title: '语音未开启',
        content: '请先在 mp.weixin.qq.com 添加「同声传译」插件，将 app.plugin.json.example 合并进 app.json，并在 config.js 设置 USE_WECHAT_TTS: true',
        showCancel: false
      })
      return
    }
    const next = !this.data.voiceEnabled
    if (!next) tts.stop()
    this.setData({
      voiceEnabled: next,
      speakingId: null
    })
    wx.showToast({
      title: next ? '语音播报已开启' : '语音播报已关闭',
      icon: 'none'
    })
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  sendMessage() {
    const text = this.data.inputText.trim()
    if (!text) return

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      time: this.formatTime(new Date())
    }

    const messages = this.data.messages.concat([userMessage])
    this.setData({
      messages,
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
          messages: this.data.messages.concat([aiMessage])
        })
        this.scrollToBottom()
        if (this.data.voiceEnabled) {
          this.speakMessage(aiMessage.id, result.message)
        }
      } else {
        wx.showToast({
          title: result.error || 'AI回复失败',
          icon: 'none'
        })
      }
    })
  },

  speakMessage(messageId, text, showTextIfFallback) {
    tts.stop()
    this.setData({ speakingId: messageId })
    tts.speak(text, { maxLen: 400 })
      .then((res) => {
        this.setData({ speakingId: null })
        if (res && res.fallback && showTextIfFallback) {
          tts.showTextNarration('阿樟回复', text)
        }
      })
      .catch(() => {
        this.setData({ speakingId: null })
        if (showTextIfFallback) {
          tts.showTextNarration('阿樟回复', text)
        }
      })
  },

  onSpeakTap(e) {
    const id = e.currentTarget.dataset.id
    const msg = this.data.messages.find((m) => m.id === id)
    if (!msg) return
    if (this.data.speakingId === id) {
      tts.stop()
      this.setData({ speakingId: null })
      return
    }
    this.speakMessage(id, msg.content, true)
  },

  askQuestion(e) {
    const q = e.currentTarget.dataset.q
    this.setData({ inputText: q, inputFocused: true })
    this.sendMessage()
  },

  scrollToBottom() {
    setTimeout(() => {
      this.setData({ scrollTop: this.data.messages.length * 1000 })
    }, 100)
  },

  formatTime(date) {
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return hour + ':' + minute
  }
})