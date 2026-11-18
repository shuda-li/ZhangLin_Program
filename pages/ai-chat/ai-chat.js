const AILLM = require('../../utils/ai-llm');

Page({
  data: {
    messages: [],
    inputText: '',
    scrollToId: '',
    inputFocused: false
  },

  aiLLM: null,

  onLoad(options) {
    this.aiLLM = new AILLM();
    this.initChat();
    
    if (options.question) {
      setTimeout(() => {
        this.setData({
          inputText: decodeURIComponent(options.question)
        });
        this.sendMessage();
      }, 500);
    }
  },

  initChat() {
    const welcomeMsg = {
      id: '1',
      role: 'ai',
      content: '你好！我是阿樟，樟林古港的智能导览助手。有什么可以帮到你的吗？'
    };
    this.setData({
      messages: [welcomeMsg],
      scrollToId: 'msg-1'
    });
  },

  goBack() {
    wx.navigateBack();
  },

  onInput(e) {
    this.setData({
      inputText: e.detail.value
    });
  },

  quickAsk(e) {
    const question = e.currentTarget.dataset.q;
    this.setData({
      inputText: question
    });
    this.sendMessage();
  },

  async sendMessage() {
    const text = this.data.inputText.trim();
    if (!text) return;

    const userMsgId = Date.now().toString();
    const userMsg = {
      id: userMsgId,
      role: 'user',
      content: text
    };

    const newMessages = [...this.data.messages, userMsg];
    this.setData({
      messages: newMessages,
      inputText: '',
      scrollToId: 'msg-' + userMsgId
    });

    setTimeout(() => {
      const loadingId = (Date.now() + 1).toString();
      const loadingMsg = {
        id: loadingId,
        role: 'ai',
        content: '',
        isLoading: true
      };
      this.setData({
        messages: [...newMessages, loadingMsg],
        scrollToId: 'msg-' + loadingId
      });
    }, 100);

    try {
      const result = await this.aiLLM.chat(text);
      
      if (result.success) {
        const aiMsgId = (Date.now() + 2).toString();
        const aiMsg = {
          id: aiMsgId,
          role: 'ai',
          content: result.content
        };
        this.setData({
          messages: [...newMessages, aiMsg],
          scrollToId: 'msg-' + aiMsgId
        });
      } else {
        const errorMsgId = (Date.now() + 2).toString();
        const errorMsg = {
          id: errorMsgId,
          role: 'ai',
          content: result.error || '抱歉，阿樟暂时遇到了一点问题。请稍后再试，或者咨询现场工作人员。'
        };
        this.setData({
          messages: [...newMessages, errorMsg],
          scrollToId: 'msg-' + errorMsgId
        });
      }
    } catch (error) {
      console.error('AI对话出错:', error);
      const errorMsgId = (Date.now() + 2).toString();
      const errorMsg = {
        id: errorMsgId,
        role: 'ai',
        content: '抱歉，阿樟暂时遇到了一点问题。请稍后再试，或者咨询现场工作人员。'
      };
      this.setData({
        messages: [...newMessages, errorMsg],
        scrollToId: 'msg-' + errorMsgId
      });
    }
  }
});
