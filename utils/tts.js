/**
 * 语音讲解：优先微信同声传译插件；未授权时自动降级为文字讲解
 */
const dev = require('./dev.js')
let innerAudio = null
let speaking = false
let pluginChecked = false
let pluginAvailable = false
let fallbackNotified = false

function getConfig() {
  try {
    return require('./config.js')
  } catch (e) {
    return {}
  }
}

function isVoiceEnabledInConfig() {
  const cfg = getConfig()
  return cfg.USE_WECHAT_TTS === true
}

function getPlugin() {
  if (!isVoiceEnabledInConfig()) return null
  try {
    return requirePlugin('WechatSI')
  } catch (e) {
    return null
  }
}

function checkPluginAvailable() {
  if (!isVoiceEnabledInConfig()) {
    pluginChecked = true
    pluginAvailable = false
    return Promise.resolve(false)
  }
  if (pluginChecked) {
    return Promise.resolve(pluginAvailable)
  }
  const plugin = getPlugin()
  if (!plugin || typeof plugin.textToSpeech !== 'function') {
    pluginChecked = true
    pluginAvailable = false
    return Promise.resolve(false)
  }
  return new Promise((resolve) => {
    plugin.textToSpeech({
      lang: 'zh_CN',
      content: '测试',
      success: (res) => {
        pluginChecked = true
        pluginAvailable = res.retcode === 0
        resolve(pluginAvailable)
      },
      fail: () => {
        pluginChecked = true
        pluginAvailable = false
        resolve(false)
      }
    })
  })
}

function isVoiceAvailable() {
  return pluginAvailable && isVoiceEnabledInConfig()
}

function getInnerAudio() {
  if (!innerAudio) {
    innerAudio = wx.createInnerAudioContext()
    innerAudio.obeyMuteSwitch = false
  }
  return innerAudio
}

function stop() {
  speaking = false
  const audio = getInnerAudio()
  audio.stop()
}

function playFile(filePath) {
  return new Promise((resolve, reject) => {
    const audio = getInnerAudio()
    audio.stop()
    audio.offEnded()
    audio.offError()
    audio.src = filePath
    audio.onEnded(() => {
      speaking = false
      resolve({ fallback: false })
    })
    audio.onError((err) => {
      speaking = false
      reject(err)
    })
    audio.play()
    speaking = true
  })
}

function notifyFallbackOnce() {
  if (fallbackNotified) return
  fallbackNotified = true
  const tip = dev.isDevtools()
    ? '当前为文字讲解（公众平台添加「同声传译」插件后可开语音）'
    : '当前为文字讲解模式'
  wx.showToast({ title: tip, icon: 'none', duration: 3000 })
}

function showTextNarration(title, text) {
  let content = (text || '').trim()
  if (content.length > 800) {
    content = content.slice(0, 800) + '…'
  }
  wx.showModal({
    title: title || '阿樟文字讲解',
    content,
    showCancel: false,
    confirmText: '知道了'
  })
}

/**
 * @returns {Promise<{fallback?: boolean, text?: string}>}
 */
function speak(text, options) {
  options = options || {}
  const maxLen = options.maxLen || 480
  let content = (text || '').replace(/\s+/g, ' ').trim()
  if (!content) {
    return Promise.reject(new Error('无朗读内容'))
  }
  if (content.length > maxLen) {
    content = content.slice(0, maxLen) + '。详情请看文字回复。'
  }

  stop()

  return checkPluginAvailable().then((ok) => {
    if (!ok) {
      notifyFallbackOnce()
      return { fallback: true, text: content }
    }

    const plugin = getPlugin()
    return new Promise((resolve, reject) => {
      plugin.textToSpeech({
        lang: 'zh_CN',
        content,
        success: (res) => {
          if (res.retcode === 0 && res.filename) {
            playFile(res.filename).then(resolve).catch(reject)
          } else {
            pluginAvailable = false
            notifyFallbackOnce()
            resolve({ fallback: true, text: content })
          }
        },
        fail: () => {
          pluginAvailable = false
          notifyFallbackOnce()
          resolve({ fallback: true, text: content })
        }
      })
    })
  })
}

module.exports = {
  speak,
  stop,
  isSpeaking() { return speaking },
  isVoiceAvailable,
  checkPluginAvailable,
  showTextNarration
}