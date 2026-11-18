const SYSTEM_PROMPT = `你是「阿樟」— 樟林古港文旅小程序的AI旅游管家。你的使命是为每一位来到樟林古港的游客提供一站式、温暖且深入的文化旅游服务。

## 核心身份
- **名字**: 阿樟
- **性格**: 热情但不喧闹，博学但不炫技，亲切但不越界。像一个在古港土生土长、见过世面的老邻居，用真诚的方式向八方来客讲述这片土地的故事。
- **语言风格**: 自然口语化表达，像朋友聊天一样。多用短句，偶尔穿插潮汕谚语或方言词汇（但随即用普通话解释），给人亲切感和在地感。
- **核心信条**: 不编造、不敷衍、不尬聊。清楚的就讲明白，不清楚的就诚实告知并引导用户通过其他渠道获取信息。

## 樟林古港知识库

### 核心景点
1. **红头船文化展示点**: 展示红头船历史、海贸文化，是樟林古港的标志性景点
2. **古港遗址游览区**: 保留古码头、石碑等历史遗迹，感受古港昔日繁华
3. **侨乡古建筑群**: 南盛里、林氏义祖祠、永定楼等中西合璧建筑
4. **侨史记忆长廊**: 展示侨批、家书等华侨历史记忆

### 推荐路线
- **古港半日轻游**: 约4小时，红头船→古港遗址→侨乡建筑群
- **人文深度一日游**: 约7小时，深度体验文化历史
- **亲子研学体验线**: 约5小时，适合家庭游客

### 特色文化
- **红头船**: 清代潮汕特有远洋帆船，因船头涂朱红色而得名
- **侨批**: 海外华侨寄回家乡的信件与汇款凭证
- **工夫茶**: 潮汕特色茶文化，讲究冲泡技艺
- **英歌舞**: 潮汕传统民俗舞蹈

## 回答原则
1. 优先回答樟林古港相关的问题
2. 对于其他问题，尽力帮助用户，但说明你的专长是古港文化
3. 回答要简洁友好，控制在100-200字
4. 如果用户问天气、交通等实时信息，告诉用户你可以帮忙查询`;

class AILLM {
  constructor() {
    this.apiKey = '';
    this.apiUrl = 'https://api.deepseek.com/chat/completions';
    // deepseek-chat = DeepSeek-V3 通用对话模型（原 deepseek-v4-flash 不存在）
    this.model = 'deepseek-chat';
    this.messages = [];
    this.maxHistory = 20;
    
    try {
      const config = require('./config.js');
      this.apiKey = config.DEEPSEEK_API_KEY;
    } catch (e) {
      console.log('配置文件未找到，API密钥将为空');
    }
  }

  addMessage(role, content) {
    this.messages.push({ role, content });
    if (this.messages.length > this.maxHistory) {
      this.messages = this.messages.slice(-this.maxHistory);
    }
  }

  clearHistory() {
    this.messages = [];
  }

  async chat(userMessage) {
    if (!this.apiKey) {
      try {
        const config = require('./config.js');
        this.apiKey = config.DEEPSEEK_API_KEY;
      } catch (e) {
        return { success: false, error: '请配置 DeepSeek API Key' };
      }
    }

    this.addMessage('user', userMessage);

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...this.messages.slice(-this.maxHistory)
    ];

    try {
      const result = await this._callAPI(messages);
      const aiMessage = result.choices[0].message.content;
      this.addMessage('assistant', aiMessage);
      return { success: true, content: aiMessage };
    } catch (error) {
      console.error('AI对话出错:', error);
      return { success: false, error: '抱歉，阿樟暂时遇到了一点问题。请稍后再试，或者咨询现场工作人员。' };
    }
  }

  _callAPI(messages) {
    return new Promise((resolve, reject) => {
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
          temperature: 0.7,
          max_tokens: 500
        },
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            resolve(res.data);
          } else {
            console.error('DeepSeek API错误:', res);
            reject(new Error('DeepSeek API请求失败: ' + res.statusCode));
          }
        },
        fail: (err) => {
          console.error('DeepSeek API调用失败:', err);
          reject(err);
        }
      });
    });
  }
}

function chatWithAI(messages, userMessage, toolCallback) {
  const llm = new AILLM();
  return llm.chat(userMessage);
}

module.exports = AILLM;
module.exports.chatWithAI = chatWithAI;
