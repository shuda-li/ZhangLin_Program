const api = require('./api.js');

const localKnowledgeBase = {
  scenicSpots: {
    'ship-museum': {
      name: '红头船文化展示点',
      topics: ['红头船', '海贸', '造船', '侨乡', '出洋']
    },
    'port-ruins': {
      name: '古港遗址游览区',
      topics: ['古港', '码头', '遗址', '口岸', '商贸']
    },
    'historic-arcade': {
      name: '侨乡古建筑群',
      topics: ['建筑', '侨乡', '骑楼', '民居', '中西合璧']
    },
    'overseas-memory': {
      name: '侨史记忆长廊',
      topics: ['侨批', '家书', '华侨', '移民', '侨乡']
    }
  },
  cultureTopics: {
    'ship': '红头船与海贸记忆',
    'hometown': '侨乡历史文脉',
    'architecture': '古建筑与街巷风貌'
  },
  routePlans: {
    'half-day': '古港半日轻游',
    'one-day': '人文深度一日游',
    'family-study': '亲子研学体验线'
  }
};

function isZhanglinRelated(query) {
  const keywords = [
    '樟林', '古港', '红头船', '侨乡', '侨批', '潮汕', '汕头',
    '海丝', '海上丝绸之路', '古港遗址', '南盛里', '秦牧',
    '天后宫', '林氏义祖祠', '永定楼', '工夫茶', '英歌舞', '潮剧'
  ];
  const queryLower = query.toLowerCase();
  return keywords.some(keyword => queryLower.includes(keyword));
}

function buildZhanglinContext(context = {}) {
  let contextText = '樟林古港是位于汕头市澄海区的重要海丝文化遗址，以红头船文化、侨乡历史和古建筑群著称。';
  if (context.currentPage === 'scenic-detail' && context.scenicId) {
    const spot = localKnowledgeBase.scenicSpots[context.scenicId];
    if (spot) {
      contextText += `当前浏览的是【${spot.name}】，相关话题包括：${spot.topics.join('、')}。`;
    }
  }
  if (context.routeId) {
    const route = localKnowledgeBase.routePlans[context.routeId];
    if (route) {
      contextText += `当前规划路线：【${route}】。`;
    }
  }
  return contextText;
}

async function queryTavily(question, options = {}) {
  const {
    context = {},
    searchDepth = 'basic',
    maxResults = 3
  } = options;

  const zhanglinContext = buildZhanglinContext(context);
  const enhancedQuery = `${zhanglinContext} 问题：${question}`;

  // 经后端代理调用 Tavily，密钥不落地小程序端
  const result = await api.searchWithAI(enhancedQuery, { searchDepth, maxResults });

  if (!result.success || !result.data) {
    throw new Error(result.error || '搜索服务不可用');
  }

  const data = result.data;
  return {
    answer: data.answer || (data.results && data.results[0] && data.results[0].content) || '',
    results: data.results || [],
    relatedTopics: extractRelatedTopics(question)
  };
}

function extractRelatedTopics(question) {
  const topicMap = {
    '红头船': ['ship', '红头船与海贸记忆'],
    '海贸': ['ship', '红头船与海贸记忆'],
    '侨乡': ['hometown', '侨乡历史文脉'],
    '侨批': ['hometown', '侨乡历史文脉'],
    '家书': ['hometown', '侨乡历史文脉'],
    '建筑': ['architecture', '古建筑与街巷风貌'],
    '古建筑': ['architecture', '古建筑与街巷风貌']
  };

  const related = [];
  const questionLower = question.toLowerCase();

  for (const [keyword, topic] of Object.entries(topicMap)) {
    if (questionLower.includes(keyword)) {
      related.push({
        id: topic[0],
        title: topic[1]
      });
    }
  }

  return related.slice(0, 3);
}

function getPredefinedAnswer(question) {
  const qaPairs = [
    {
      q: '红头船为什么叫红头船',
      a: '红头船因船头和船尾涂成朱红色而得名，是清代潮汕地区特有的远洋帆船。红色便于海上辨识，也承载了趋吉避凶的民间信仰。樟林古港是红头船的主要始发港之一，见证了潮汕海贸的繁荣历史。'
    },
    {
      q: '樟林古港在哪里',
      a: '樟林古港位于汕头市澄海区，是明清时期粤东地区重要的对外贸易港口，也是海上丝绸之路的重要节点之一。这里曾是红头船的主要停泊地和出海港。'
    },
    {
      q: '侨批是什么',
      a: '侨批是海外华侨寄回家乡的信件与汇款凭证的合称。"批"即潮汕话中的信件。侨批既是汇款单据也是家书，承载着华侨在海外的奋斗经历和对家乡亲人的牵挂，是研究侨乡历史的珍贵资料。'
    },
    {
      q: '古港建筑有什么特色',
      a: '樟林古港建筑融合了潮汕传统与南洋风格：屋脊灰塑精美、门楼装饰繁复、窗棂雕花细腻。部分建筑可见中西合璧的设计，如骑楼、柱廊等，体现了海贸交流带来的审美融合与文化碰撞。'
    },
    {
      q: '什么是海丝文化',
      a: '海上丝绸之路是中国古代对外贸易与文化交流的重要通道。樟林古港作为粤东重要港口，是海丝网络中的关键节点。红头船往来于东南亚各埠，带动了商品、文化和人口的跨海流动，形成了独特的海丝文化。'
    },
    {
      q: '南盛里在哪里',
      a: '南盛里是樟林古港侨乡古建筑群的代表区域，位于古港核心游览线路上。这里保留着大量中西合璧的华侨民居和祠堂建筑，是了解侨乡建筑美学和文化的重要窗口。'
    },
    {
      q: '秦牧是谁',
      a: '秦牧（1914-1992）是著名的潮汕籍文学家，出生于樟林古港。他的作品以散文为主，代表作包括《艺海拾贝》《潮汐和船》等。秦牧故居位于樟林古港，是重要的文化地标和侨乡记忆的象征。'
    },
    {
      q: '天后宫供奉的是谁',
      a: '天后宫供奉的是妈祖娘娘，是潮汕沿海地区常见的民间信仰建筑。妈祖是海神，保佑出海渔民和商旅平安。樟林古港的天后宫是古港遗址游览区的重要景点之一。'
    },
    {
      q: '工夫茶怎么泡',
      a: '潮汕工夫茶讲究"关公巡城、韩信点兵"的冲泡手法：先温壶，再高冲低斟；茶汤分到多个小杯中，依次轮转，确保浓淡均匀。品饮时先闻香再入口，感受茶汤的甘醇与回甘。'
    },
    {
      q: '有什么好玩的路线',
      a: '推荐三条主题路线：①古港半日轻游（约4小时），适合首次到访游客；②人文深度一日游（约7小时），适合文化爱好者；③亲子研学体验线（约5小时），适合亲子家庭。您可以根据时间和兴趣选择！'
    }
  ];

  const questionLower = question.toLowerCase().trim();

  for (const pair of qaPairs) {
    if (questionLower.includes(pair.q.toLowerCase().split('是')[0].trim()) ||
        pair.q.toLowerCase().includes(questionLower)) {
      return pair.a;
    }
  }

  return null;
}

async function askAI(question, options = {}) {
  const { context = {}, useLocalFirst = true } = options;

  if (useLocalFirst && !isZhanglinRelated(question)) {
    const localAnswer = getPredefinedAnswer(question);
    if (localAnswer) {
      return {
        answer: localAnswer,
        source: 'local',
        relatedTopics: extractRelatedTopics(question)
      };
    }
  }

  if (isZhanglinRelated(question)) {
    try {
      const tavilyResult = await queryTavily(question, { context });
      return {
        ...tavilyResult,
        source: 'tavily'
      };
    } catch (error) {
      console.error('Tavily API 调用失败:', error);
      const localAnswer = getPredefinedAnswer(question);
      if (localAnswer) {
        return {
          answer: localAnswer,
          source: 'local-fallback',
          relatedTopics: extractRelatedTopics(question)
        };
      }
      return {
        answer: '抱歉，阿樟暂时无法回答这个问题。建议您查看小程序内的文化科普内容，或者咨询现场工作人员。',
        source: 'error',
        relatedTopics: []
      };
    }
  }

  return {
    answer: '阿樟目前主要了解樟林古港相关的文化历史信息。您可以问我关于红头船、侨乡文化、古港建筑、游览路线等方面的问题！',
    source: 'scope',
    relatedTopics: []
  };
}

module.exports = {
  askAI,
  queryTavily,
  isZhanglinRelated,
  buildZhanglinContext,
  getPredefinedAnswer,
  localKnowledgeBase
};