const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-v4-flash'

const SYSTEM_PROMPT = `你是「阿樟」，樟林古港AI旅游助手。

你是阿樟 — 樟林古港的文化旅游向导。你的使命是为每一位来到樟林古港的游客提供贴心、深入的文化旅游服务。你不仅是讲解员，更是游客在古港旅程中的好朋友、文化翻译和生活顾问。

你的特点：
- 热情但不过分，有学识但不卖弄，友好但不唐突
- 像在古港长大的老邻居，见多识广，用地道的语言向游客讲述这片土地的故事
- 自然口语化的表达方式，主要用短句，偶尔穿插潮汕谚语或方言词汇（但会立即用普通话解释）
- 在语音模式下，确保每条回复适合阅读，控制在30-60秒内读完

你的能力范围：
1. 智能景点讲解：提供古港四大核心景点（红头船文化展示点、古港遗址游览区、侨乡古建筑群、侨史记忆长廊）的深入讲解
2. 游览路线规划：基于游客的时间、兴趣和体力，推荐三条主题路线（半日轻游、一日深度文化游、亲子研学游）
3. 文化旅游科普：回答关于红头船航海贸易、侨乡文化背景、古港建筑等方面的后续问题
4. 特色本地推荐：介绍潮汕工夫茶、当地小吃、侨乡文创产品等
5. 活动信息引导：告知近期活动安排，引导用户查看详情和报名
6. 实用信息解答：提供游览时间、交通建议、注意事项、最佳拍照点等实用建议
7. 个性化记录：记住游客在对话中表达的偏好，主动调整后续推荐

你不能做的事：
- 虚构知识库中没有的景点、路线、活动等信息
- 提供医疗、法律、金融等专业咨询
- 发表涉及政治敏感性、历史争议或地域歧视的言论
- 处理需要后台权限的投诉、取消等操作（引导用户联系人工客服）
- 跨会话记忆历史（仅保留当前会话上下文）

回复原则：
- 先给结论或直接回答，再补充细节，最后给出可操作的建议
- 善用"现场感"描述，比如：你现在站在古港码头，脚下的石板是200年前的...
- 适时引导用户到特定位置后再召唤你讲解
- 在语音模式下控制回复长度

记住：你就是阿樟，樟林古港的AI旅游助手！🌊🚢`

class AiLlm {
  constructor() {
    this.apiKey = ''
    this.apiUrl = DEEPSEEK_API_URL
    this.model = DEEPSEEK_MODEL
    this.messages = []
    this.maxHistory = 20
  }

  setApiKey(key) {
    this.apiKey = key
  }

  setMessages(messages) {
    this.messages = messages
  }

  getMessages() {
    return this.messages
  }

  addMessage(role, content) {
    this.messages.push({ role, content })
    if (this.messages.length > this.maxHistory) {
      this.messages.shift()
    }
  }

  clearHistory() {
    this.messages = []
  }

  async chat(userMessage) {
    if (!this.apiKey) {
      try {
        const config = require('./config.js')
        this.apiKey = config.DEEPSEEK_API_KEY
      } catch (e) {
        return { success: false, error: '请配置 DeepSeek API Key' }
      }
    }

    this.addMessage('user', userMessage)

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...this.messages.slice(-this.maxHistory)
    ]

    try {
      const response = await new Promise((resolve, reject) => {
        wx.request({
          url: this.apiUrl,
          method: 'POST',
          header: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          data: {
            model: this.model,
            messages: messages,
            stream: false
          },
          success: resolve,
          fail: reject
        })
      })

      if (response.statusCode === 200 && response.data.choices && response.data.choices[0]) {
        const assistantMessage = response.data.choices[0].message.content
        this.addMessage('assistant', assistantMessage)
        return { success: true, message: assistantMessage }
      }

      const apiErr = response.data && response.data.error && response.data.error.message
      console.error('API错误:', response)
      if (response.statusCode === 401) {
        return { success: false, error: 'API Key 无效，请检查 utils/config.js' }
      }
      return { success: false, error: apiErr || `请求失败 (${response.statusCode})` }
    } catch (error) {
      console.error('AI对话错误:', error)
      const msg = (error && error.errMsg) || (error && error.message) || ''
      if (msg.indexOf('url not in domain list') !== -1) {
        return { success: false, error: '未配置合法域名，请在公众平台添加 api.deepseek.com' }
      }
      return { success: false, error: msg || '网络请求失败' }
    }
  }
}

module.exports = new AiLlm()