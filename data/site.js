const scenicSpots = [
  {
    id: 'ship-museum',
    name: '红头船文化展示点',
    category: '文化地标',
    image: '/assets/images/2.红头船.jpg',
    gallery: ['/assets/images/2.红头船.jpg', '/assets/images/2.红头船1.jpg', '/assets/images/0.古港导游图.jpg'],
    audioMeta: {
      narrator: '古港文化讲解员',
      duration: '03:20'
    },
    summary: '围绕船型工艺、海贸航线与出海故事，建立樟林古港文化认知的第一站。',
    duration: '40-60分钟',
    location: '古港核心游线',
    tags: ['智能讲解', '亲子研学', '文化打卡'],
    highlights: ['红头船贸易史', '船体结构展示', '侨乡航海故事'],
    audioUrl: '',
    audioGuide: [
      '红头船是潮汕地区极具辨识度的海贸船型，因船头与船尾多饰以朱红色而得名。',
      '樟林古港曾是粤东重要通商口岸，船只往来频繁，带动了侨乡文化与海贸文明的发展。',
      '参观时建议结合展陈中的航线图与故事板，理解"出海谋生"和"侨批家书"之间的联系。'
    ],
    tips: ['建议与文化科普页同步浏览', '适合30分钟以上深度参观']
  },
  {
    id: 'port-ruins',
    name: '古港遗址游览区',
    category: '历史遗址',
    image: '/assets/images/3.天后宫.jpg',
    gallery: ['/assets/images/3.天后宫.jpg', '/assets/images/3.天后宫1.jpg', '/assets/images/4.天后宫广场.jpg', '/assets/images/6.新兴街古码头.jpg', '/assets/images/7.古海堤.jpg', '/assets/images/8.樟林古港南粤古驿道纪念地.jpg'],
    audioMeta: {
      narrator: '遗址慢游讲解员',
      duration: '02:45'
    },
    summary: '通过遗址肌理和空间格局，感受古港码头、街巷与商贸活动的历史现场感。',
    duration: '30-45分钟',
    location: '沿河古港片区',
    tags: ['遗址漫游', '拍照推荐', '慢游体验'],
    highlights: ['古港空间脉络', '口岸发展记忆', '街区步行体验'],
    audioUrl: '',
    audioGuide: [
      '这里保留着古港发展留下的空间印记，是认识樟林港埠兴衰的重要窗口。',
      '从遗址周边的道路走向和建筑布局，可以大致推测当年码头、仓储与居住之间的组织关系。',
      '建议边走边结合导览路线查看打卡节点，更容易形成完整游览动线。'
    ],
    tips: ['雨天注意地面湿滑', '推荐上午或傍晚步行体验']
  },
  {
    id: 'historic-arcade',
    name: '侨乡古建筑群',
    category: '特色建筑',
    image: '/assets/images/9.林氏义祖祠.jpg',
    gallery: ['/assets/images/9.林氏义祖祠.jpg', '/assets/images/14.南盛里航拍.jpg'],
    audioMeta: {
      narrator: '建筑风貌讲解员',
      duration: '03:05'
    },
    summary: '集中展现潮汕传统民居、骑楼街巷与侨乡建筑审美，是拍照与建筑观察的热门点位。',
    duration: '45分钟',
    location: '古街建筑带',
    tags: ['建筑美学', '人文摄影', '街区漫步'],
    highlights: ['潮汕建筑装饰', '骑楼街景', '中西融合痕迹'],
    audioUrl: '',
    audioGuide: [
      '古建筑群是侨乡历史文脉的直观载体，屋脊、门楼、灰塑和街巷尺度都很有辨识度。',
      '不少建筑细部体现了本土营造技艺与外来审美的融合，也反映出侨乡开放的文化气质。',
      '观察屋檐、山墙和门额题字，能更容易发现建筑中的时代信息。'
    ],
    tips: ['尊重居民生活空间', '推荐搭配街区慢游路线']
  },
  {
    id: 'overseas-memory',
    name: '侨史记忆长廊',
    category: '文化地标',
    image: '/assets/images/1.文化长廊.jpg',
    gallery: ['/assets/images/1.文化长廊.jpg', '/assets/images/15.秦牧故居.jpg', '/assets/images/11.达祖家庙 1.jpg', '/assets/images/12.新兴街东门.jpg', '/assets/images/12.新兴街栈房.jpg', '/assets/images/20.哲谋广居.jpg', '/assets/images/20.起凤陈公祠大门.jpg'],
    audioMeta: {
      narrator: '侨乡故事讲解员',
      duration: '02:50'
    },
    summary: '以侨批、家书和人物故事为线索，串联侨乡家庭记忆与地方社会变迁。',
    duration: '25-35分钟',
    location: '文化展示步道',
    tags: ['侨乡故事', '文化阅读', '家庭共游'],
    highlights: ['侨批家书', '人物故事', '时代记忆'],
    audioUrl: '',
    audioGuide: [
      '侨史记忆长廊重在讲述"人"的故事，让游客从家庭叙事切入地方历史。',
      '侨批不仅是汇款凭证，也承载着跨海沟通的情感与责任，是侨乡文化的重要符号。',
      '建议在游览后回到文化科普页面继续查看专题内容，形成完整认知。'
    ],
    tips: ['适合家庭游客与学生团体', '可作为深度游的收束节点']
  }
];

const userBadges = [
  { id: 'explorer', name: '红头船探索者', desc: '浏览3个以上景点', cond: 'spots >= 3', level: 1 },
  { id: 'photographer', name: '古港摄影师', desc: '收藏2个以上景点', cond: 'favs >= 2', level: 1 },
  { id: 'taste', name: '潮味体验官', desc: '报名1场以上活动', cond: 'acts >= 1', level: 1 },
  { id: 'scholar', name: '海丝文化学者', desc: '浏览全部4个景点', cond: 'spots >= 4', level: 2 },
  { id: 'traveler', name: '侨乡行者', desc: '景点+活动+收藏全部达成', cond: 'spots >= 4 && acts >= 1 && favs >= 2', level: 3 }
];

const journeyTips = [
  { title: '核心景点', desc: '红头船展示点、古港遗址、侨乡建筑群、侨史长廊' },
  { title: '推荐路线', desc: '古港半日轻游 · 人文深度一日游 · 亲子研学体验' },
  { title: '近期活动', desc: '周末讲解专场、古街夜游、亲子研学打卡任务' }
];

const profileAiTips = [
  { scene: 'less', text: '你刚开始探索樟林古港，推荐从红头船文化展示点开始，建立整体认知后再深入各专题。' },
  { scene: 'half', text: '你已经探索了部分景点，补充侨乡建筑群和侨史长廊可以让你的文化拼图更完整。' },
  { scene: 'full', text: '文化探索度很高！现在是体验潮汕工夫茶和古港小吃的最佳时机，给旅程加点烟火气。' }
];

const heritageItems = [
  { id: 'yingge', name: '英歌舞', desc: '潮汕传统民间舞蹈，以刚劲有力的集体舞蹈展现英雄气概，常在节庆与重大活动中表演。', image: '/assets/images/5.亥爷.jpg' },
  { id: 'chaozhou-opera', name: '潮剧', desc: '以潮汕方言演唱的传统戏曲，唱腔婉转、做工细腻，是国家级非物质文化遗产。', image: '/assets/images/1.文化长廊.jpg' },
  { id: 'gongfu-tea', name: '工夫茶艺', desc: '潮汕工夫茶以"讲究"著称，从选茶、冲水到品饮皆有章法，体现地方待客之道和生活美学。', image: '/assets/images/0.樟林古港石碑.jpg' },
  { id: 'woodcarving', name: '潮汕木雕', desc: '以精湛的透雕、浮雕技法闻名，常见于庙宇、祠堂与古宅装饰，是建筑文化的重要组成。', image: '/assets/images/20.锡庆堂大门.jpg' }
];

const overseasStories = [
  { title: '下南洋潮', subtitle: '清代潮人出海潮', desc: '清代中后期，大量潮汕人从樟林古港出发，乘红头船远赴东南亚谋生，形成规模空前的"下南洋"移民潮。' },
  { title: '侨批家书', subtitle: '跨越海洋的情感纽带', desc: '侨批是华侨寄回家乡的信件与汇款凭证，一纸家书承载着跨越海洋的牵挂与责任，是侨乡社会的情感基石。' },
  { title: '侨汇与建设', subtitle: '反哺家乡的力量', desc: '华侨汇款不仅支撑了家乡亲人的生活，更推动了学校、医院、道路等公共设施的建设，深刻改变了地方面貌。' },
  { title: '南洋归来', subtitle: '文化交融的见证', desc: '许多华侨归国后在樟林兴建中西合璧的建筑，将南洋的生活方式和审美带回故土，形成独特的侨乡风貌。' }
];

const exhibitionItems = [
  { title: '古港老地图', image: '/assets/images/0.古港导游图.jpg', label: '清代古港舆图' },
  { title: '红头船模型', image: '/assets/images/2.红头船.jpg', label: '广式红头船复原' },
  { title: '侨批原件', image: '/assets/images/15.秦牧故居.jpg', label: '华侨家书档案' },
  { title: '古港遗址航拍', image: '/assets/images/14.南盛里航拍.jpg', label: '今日古港全貌' },
  { title: '古建筑木雕', image: '/assets/images/20.锡庆堂大门.jpg', label: '潮汕木雕工艺' },
  { title: '码头石阶', image: '/assets/images/6.新兴街古码头.jpg', label: '古港码头遗存' }
];

const cultureAiQA = [
  { q: '红头船为什么叫红头船', a: '红头船因船头饰以朱红色而得名，是清代潮汕地区特有的远洋帆船。红色既便于海上辨识，也承载了趋吉避凶的民间信仰。樟林古港是红头船的主要始发港之一，见证了潮汕海贸的繁荣。' },
  { q: '侨批是什么', a: '侨批是海外华侨寄回家乡的信件与汇款凭证的合称。"批"即信件，侨批既是家书也是汇款单，记录了华侨在海外的奋斗和对家乡的牵挂，是研究侨乡历史的一手资料。' },
  { q: '古港建筑有什么特色', a: '樟林古港建筑融合了潮汕传统与南洋风格：屋脊灰塑精美、门楼装饰繁复、窗棂雕花细腻，部分建筑可见中西合璧的设计，体现了海贸交流带来的审美融合。' },
  { q: '什么是海丝文化', a: '海上丝绸之路是中国古代对外贸易与文化交流的重要通道。樟林古港作为粤东重要港口，是海丝网络中的关键节点，红头船往来于东南亚各埠，带动了商品、文化和人口的跨海流动。' }
];

const routePlans = [
  {
    id: 'half-day',
    name: '古港半日轻游',
    duration: '约4小时',
    suitable: '首次到访游客',
    description: '围绕文化认知、遗址漫步和建筑打卡组织动线，节奏轻松，适合短时停留。',
    stops: [
      { time: '09:00', title: '游客服务点集合', detail: '查看今日开放信息，领取电子导览建议。' },
      { time: '09:30', title: '红头船文化展示点', detail: '先建立对古港海贸文化的总体认知。' },
      { time: '10:30', title: '古港遗址游览区', detail: '沿步行线体验古港空间格局。' },
      { time: '11:20', title: '侨乡古建筑群', detail: '慢游古街并拍照记录建筑细节。' },
      { time: '12:00', title: '特色风物补给', detail: '前往风物页推荐点选择茶饮和伴手礼。' }
    ],
    transport: '步行',
    difficulty: '轻松'
  },
  {
    id: 'one-day',
    name: '人文深度一日游',
    duration: '约7小时',
    suitable: '文化爱好者',
    description: '把景点讲解、侨乡故事和地方风物串成完整体验，适合想深入了解樟林古港的游客。',
    stops: [
      { time: '09:00', title: '首页推荐线路签到', detail: '查看导览建议，确认今日目标线路。' },
      { time: '09:30', title: '红头船文化展示点', detail: '重点听取海贸与船型专题讲解。' },
      { time: '10:40', title: '侨史记忆长廊', detail: '结合侨批故事理解侨乡历史脉络。' },
      { time: '12:00', title: '古街午间休憩', detail: '就近选择地方风味补给点。' },
      { time: '14:00', title: '古港遗址游览区', detail: '下午时段适合慢节奏步行观察。' },
      { time: '15:00', title: '侨乡古建筑群', detail: '通过建筑装饰细节感受时代变化。' },
      { time: '16:10', title: '文化科普专题回看', detail: '在小程序内继续查看专题内容与知识点。' }
    ],
    transport: '步行',
    difficulty: '中等'
  },
  {
    id: 'family-study',
    name: '亲子研学体验线',
    duration: '约5小时',
    suitable: '亲子家庭、研学团队',
    description: '内容以知识获取和互动观察为主，兼顾趣味性与可理解性。',
    stops: [
      { time: '09:20', title: '服务页任务开启', detail: '浏览今日适合亲子体验的点位。' },
      { time: '10:00', title: '红头船文化展示点', detail: '围绕船、海和贸易故事进行启蒙讲解。' },
      { time: '11:00', title: '侨史记忆长廊', detail: '从家书故事理解"家"和"远方"的关系。' },
      { time: '12:00', title: '本土风物体验', detail: '结合地方饮食与手作内容建立生活感受。' },
      { time: '14:00', title: '古建筑观察任务', detail: '寻找屋脊、门楼、装饰纹样等建筑元素。' }
    ],
    transport: '步行',
    difficulty: '轻松'
  },
  {
    id: 'night-photo',
    name: '古港夜游光影线',
    duration: '约3小时',
    suitable: '摄影爱好者、夜游体验者',
    description: '以黄昏至夜晚时段为线索，串联建筑灯光、街巷夜景与夜间文化氛围。',
    stops: [
      { time: '17:30', title: '古港遗址日落观景', detail: '黄昏光线下的古港轮廓与水面倒影，适合航拍摄影。' },
      { time: '18:20', title: '侨乡建筑灯光漫步', detail: '建筑灯影与街巷氛围，感受古港夜间静谧美感。' },
      { time: '19:10', title: '古街夜色体验', detail: '步行古街夜市区段，体验夜间在地生活气息。' },
      { time: '20:00', title: '夜间茶叙收尾', detail: '在古港周边茶空间结束夜游，搭配地方风味小点。' }
    ],
    transport: '步行',
    difficulty: '轻松'
  },
  {
    id: 'photo-spots',
    name: '人文摄影打卡线',
    duration: '约5小时',
    suitable: '摄影爱好者、内容创作者',
    description: '精选古港最具画面感的拍摄点位，涵盖建筑细节、街巷纵深与自然光影。',
    stops: [
      { time: '08:00', title: '晨光古港遗址', detail: '清晨低角度阳光穿过遗址区，光影层次丰富，适合人文纪实拍摄。' },
      { time: '09:30', title: '侨乡古建筑群特写', detail: '聚焦门楼灰塑、屋脊装饰和窗格纹样，注重细节构图。' },
      { time: '11:00', title: '古街纵深构图', detail: '街巷透视与生活场景结合，捕捉在地人文氛围。' },
      { time: '14:30', title: '红头船展示点全景', detail: '下午光线适合拍摄红头船整体造型与水域倒影。' },
      { time: '16:00', title: '夕照侨史长廊', detail: '金色斜阳穿过长廊形成光影韵律，适合收尾大片。' }
    ],
    transport: '步行',
    difficulty: '中等'
  },
  {
    id: 'food-trail',
    name: '在地风味寻访线',
    duration: '约4小时',
    suitable: '美食爱好者、休闲游客',
    description: '以工夫茶、潮式点心和地方小吃为线索，把味觉体验融入古港慢游。',
    stops: [
      { time: '10:00', title: '古港早茶体验', detail: '在古港周边茶楼体验潮式早茶，搭配经典点心。' },
      { time: '11:30', title: '侨乡小吃探索', detail: '沿古街寻找地方小吃摊点，品尝蚝烙、粿条等在地风味。' },
      { time: '14:00', title: '工夫茶艺体验', detail: '进入茶空间学习工夫茶冲泡流程，感受潮汕待客之道。' },
      { time: '15:30', title: '伴手礼选购', detail: '挑选红头船主题茶配礼盒与地方特产带回家。' }
    ],
    transport: '步行',
    difficulty: '轻松'
  }
];

const nearbyServices = [
  { name: '公共卫生间', dist: '游客中心旁' },
  { name: '停车场', dist: '入口东侧 200m' },
  { name: '茶饮补给', dist: '古街沿线' },
  { name: '游客服务中心', dist: '古港入口处' },
  { name: '伴手礼商店', dist: '步行街中段' },
  { name: '免费Wi-Fi', dist: '景区全覆盖' }
];

const cultureTopics = [
  {
    id: 'ship',
    title: '红头船与海贸记忆',
    image: '/assets/images/2.红头船.jpg',
    intro: '红头船是樟林古港最具代表性的文化符号之一，也是理解地方海贸史的入口。',
    sections: [
      '红头船名称醒目、辨识度高，常被视作潮汕商贸精神与海洋文化的重要象征。',
      '船只往返于不同港埠之间，带动货物流通、人员迁移和文化交流，塑造了侨乡开放格局。',
      '在当代文旅场景中，红头船文化既是历史记忆，也是面向游客传播地方精神的核心媒介。'
    ],
    facts: ['关键词：海贸、航线、移民、通商', '适合搭配红头船展示点讲解内容一起阅读']
  },
  {
    id: 'hometown',
    title: '侨乡历史文脉',
    image: '/assets/images/1.文化长廊.jpg',
    intro: '侨乡文化关乎人与地方的双向联结，既体现在出洋故事中，也保留在家书、建筑和生活方式里。',
    sections: [
      '樟林古港的兴起与海上贸易密切相关，许多家庭的命运也因此与海外世界发生连接。',
      '侨批、汇款、家书和口述故事，共同构成侨乡社会的情感网络与历史档案。',
      '理解侨乡历史，不只是理解远行，也是在理解地方社会如何在交流中持续生长。'
    ],
    facts: ['建议游客关注"侨批""家书""汇兑"这些线索', '适合亲子与研学用户阅读']
  },
  {
    id: 'architecture',
    title: '古建筑与街巷风貌',
    image: '/assets/images/9.林氏义祖祠.jpg',
    intro: '街区风貌和古建筑细节保存了地方营造技艺，也反映出侨乡社会开放包容的文化气质。',
    sections: [
      '潮汕传统建筑讲究空间礼序、装饰寓意和工艺细节，是地方文化最直观的物质载体。',
      '在侨乡地区，一些建筑还能看到中西融合的元素，体现出海贸交流带来的审美变化。',
      '游客可通过观察门楼、灰塑、屋脊和窗格纹样，建立更具现场感的建筑认知。'
    ],
    facts: ['推荐与古建筑群打卡线路同步使用', '适合摄影和建筑爱好者']
  }
];

const specialtyItems = [
  {
    id: 'tea',
    name: '潮汕工夫茶体验',
    category: '在地风味',
    image: '/assets/images/0.樟林古港石碑.jpg',
    description: '以泡茶、闻香、品饮为核心的地方待客方式，适合作为慢游中的休憩体验。',
    recommend: '下午时段体验更放松',
    story: '潮汕工夫茶讲究"和、敬、精、乐"，从选水、温壶到高冲低斟，每一个步骤都蕴含着对客人的尊重和对生活的讲究。樟林古港作为侨乡，工夫茶更是连接海内外潮人的文化纽带。',
    tags: ['茶文化', '社交体验', '轻休闲'],
    bestTime: '14:00-17:00',
    crowdLevel: '适中'
  },
  {
    id: 'pastry',
    name: '潮式点心与古港茶配',
    category: '在地风味',
    image: '/assets/images/12.新兴街栈房.jpg',
    description: '结合地方点心与茶饮补给，适合短时游览中的能量补充和伴手礼挑选。',
    recommend: '适合半日游收尾补给',
    story: '樟林人离不开茶配。从酥糖、豆条到芋泥糕，每一味茶配都承载着潮汕糕点匠人的手作温度。古港人常说"无茶配不成茶"，点心与工夫茶共同构成了樟林人日常生活的滋味底色。',
    tags: ['伴手礼', '美食推荐', '游客补给'],
    bestTime: '全天',
    crowdLevel: '热门'
  },
  {
    id: 'craft',
    name: '侨乡手作与文创',
    category: '文创纪念',
    image: '/assets/images/2.红头船.jpg',
    description: '提炼红头船、古港建筑和侨乡故事元素，形成更适合游客带走的文化纪念品。',
    recommend: '适合亲子游客选购纪念',
    story: '红头船木雕模型、古港建筑明信片、侨批主题书签……每一件文创背后都有一段樟林故事。手作匠人们将海丝记忆与潮汕工艺融合，让游客把古港文化"带回家"。',
    tags: ['文创', '红头船元素', '纪念收藏'],
    bestTime: '全天',
    crowdLevel: '热门'
  },
  {
    id: 'life',
    name: '潮汕生活风物观察',
    category: '民俗体验',
    image: '/assets/images/12.新兴街东门.jpg',
    description: '从饮食、器物和街区日常切入，帮助游客理解樟林古港的生活质感与地方气息。',
    recommend: '建议结合街区步行慢慢体验',
    story: '走进樟林古街，你会发现生活的细节无处不在：门口晾晒的鱼干、沿街飘来的卤味香、老铺子里叮叮当当的修壶声……这些看似平凡的日常，却是最真实的樟林生活图景。',
    tags: ['生活方式', '民俗观察', '街巷体验'],
    bestTime: '全天',
    crowdLevel: '适中'
  },
  {
    id: 'oyster-omelet',
    name: '蚝烙与古港小吃',
    category: '在地风味',
    image: '/assets/images/3.天后宫.jpg',
    description: '以蚝烙为代表的潮汕街头小吃，外酥内嫩，搭配鱼露蘸食，是古港最地道的美食记忆。',
    recommend: '午餐或下午茶时段最佳',
    story: '蚝烙是潮汕美食的一张名片。古港附近的蚝烙店多由三代传承，新鲜蚝仔裹上番薯粉浆，在平底锅中煎至金黄，外皮酥脆、内馅鲜嫩，搭配一杯工夫茶，便是最地道的樟林味道。',
    tags: ['街头美食', '必吃推荐', '地方特色'],
    bestTime: '11:00-15:00',
    crowdLevel: '热门'
  },
  {
    id: 'woodcraft',
    name: '潮汕木雕工艺',
    category: '文创纪念',
    image: '/assets/images/1.文化长廊.jpg',
    description: '国家级非遗技艺，以多层透雕和浮雕著称，常见于庙宇斗拱与古宅花窗的装饰细节中。',
    recommend: '文化爱好者必看，可选购小型木雕摆件',
    story: '潮汕木雕与东阳木雕、福建木雕并称中国三大木雕流派。樟林古港的古建筑中随处可见木雕精品，花鸟虫鱼、戏曲人物、吉祥纹样被匠人一刀刀赋予了生命。如今，小尺寸的木雕摆件已成为最受欢迎的文旅伴手礼之一。',
    tags: ['非遗工艺', '收藏鉴赏', '文化传承'],
    bestTime: '全天',
    crowdLevel: '适中'
  }
];

const homeStats = [
  { label: '推荐景点', value: '4+', target: 'featured-section' },
  { label: '主题线路', value: '6', target: 'route-section' },
  { label: '文化专题', value: '3', target: '/pages/culture/culture' },
  { label: '风物推荐', value: '6', target: '/pages/specialty/specialty' }
];

const homeBanners = [
  {
    id: 'banner-aerial',
    image: '/assets/images/14.南盛里航拍.jpg',
    title: '走进百年古港街巷',
    subtitle: '从航拍视角快速建立樟林古港整体印象',
    action: 'tab',
    target: '/pages/guide/guide'
  },
  {
    id: 'banner-ship',
    image: '/assets/images/2.红头船.jpg',
    title: '红头船文化沉浸讲解',
    subtitle: '优先推荐首次到访游客从红头船故事开始',
    action: 'detail',
    target: 'ship-museum'
  },
  {
    id: 'banner-culture',
    image: '/assets/images/1.文化长廊.jpg',
    title: '侨乡故事与地方记忆',
    subtitle: '结合文化科普与侨史长廊形成完整游览认知',
    action: 'tab',
    target: '/pages/culture/culture'
  }
];

const activityNews = [
  {
    id: 'weekend-tour',
    category: '讲解导览',
    title: '周末古港沉浸式讲解专场',
    date: '每周六 10:00',
    place: '红头船文化展示点',
    status: '报名中',
    image: '/assets/images/2.红头船.jpg',
    capacity: 30,
    enrolled: 18,
    summary: '围绕红头船、古港海贸和侨乡故事展开 60 分钟沉浸式讲解，适合首次来访游客。'
  },
  {
    id: 'night-walk',
    category: '夜游活动',
    title: '古街夜游与建筑灯影体验',
    date: '每周六 19:30',
    place: '侨乡古建筑群',
    status: '限时开放',
    image: '/assets/images/9.林氏义祖祠.jpg',
    capacity: 40,
    enrolled: 26,
    summary: '结合夜间街巷氛围，串联古建筑风貌、拍照点位和游客休闲动线。'
  },
  {
    id: 'study-family',
    category: '亲子研学',
    title: '亲子研学打卡任务',
    date: '节假日全天',
    place: '古港全域线路',
    status: '持续进行',
    image: '/assets/images/0.古港导游图.jpg',
    capacity: 50,
    enrolled: 33,
    summary: '通过任务卡形式引导亲子家庭识别红头船、古码头、门楼装饰等重点元素。'
  },
  {
    id: 'folk-market',
    category: '市集体验',
    title: '侨乡风物快闪市集',
    date: '本月 25 日 14:00',
    place: '南盛里周边',
    status: '即将开启',
    image: '/assets/images/14.南盛里航拍.jpg',
    capacity: 60,
    enrolled: 41,
    summary: '集合在地茶饮、文创、特色点心与文化展示，适合作为游程收尾体验。'
  }
];

const profileStats = [
  { label: '已浏览景点', value: '4' },
  { label: '推荐活动', value: '4' },
  { label: '收藏线路', value: '3' }
];

const profileServices = [
  { id: 'activity', title: '活动资讯', desc: '查看近期导览、夜游与研学活动安排。', type: 'page', target: '/pages/activity/activity' },
  { id: 'culture', title: '文化专题', desc: '继续浏览红头船、侨乡文脉与古港建筑内容。', type: 'tab', target: '/pages/culture/culture' },
  { id: 'specialty', title: '特色风物', desc: '快速查看在地茶饮、文创与伴手礼推荐。', type: 'tab', target: '/pages/specialty/specialty' },
  { id: 'guide', title: '我的路线', desc: '回到智慧导览页继续规划半日游或一日游路线。', type: 'tab', target: '/pages/guide/guide' }
];

const cultureTimeline = [
  { year: '明朝', event: '开港通商', detail: '樟林港兴起为闽粤重要港口' },
  { year: '清初', event: '海禁迁界', detail: '沿海居民内迁，港口一度衰落' },
  { year: '康熙', event: '复界复兴', detail: '取消海禁，红头船贸易兴起' },
  { year: '雍正', event: '鼎盛时期', detail: '樟林成为粤东第一大港' },
  { year: '近代', event: '侨乡形成', detail: '大批潮汕人下南洋谋生' },
  { year: '当代', event: '文旅复兴', detail: '古港遗址保护与文旅开发' },
  { year: '未来', event: '数字文旅', detail: 'AI导览 · 智慧服务 · 文化传承' }
];

const todayData = [
  { label: '可游览景点', value: '10+', sub: '含古港遗址与建筑群' },
  { label: '推荐路线', value: '6条', sub: '半日/全日/亲子研学/夜游/摄影/风味' },
  { label: '文化专题', value: '3组', sub: '红头船·侨乡·建筑' },
  { label: '近期活动', value: '4场', sub: '讲解专场·夜游体验' }
];

const newHomeBanners = [
  { id: '1', image: '/assets/images/2.红头船.jpg', title: '千年古港', subtitle: '海丝文化 · 红头船传奇', desc: '探索樟林古港红头船文化与侨乡历史', action: 'detail', target: 'ship-museum' },
  { id: '2', image: '/assets/images/3.天后宫.jpg', title: '古港遗址', subtitle: '明清海丝 · 重要节点', desc: '漫步古港遗址，感受千年商贸繁华', action: 'detail', target: 'port-ruins' },
  { id: '3', image: '/assets/images/14.南盛里航拍.jpg', title: '侨乡建筑', subtitle: '中西合璧 · 建筑瑰宝', desc: '领略侨乡古建筑的独特美学魅力', action: 'detail', target: 'historic-arcade' }
];

module.exports = {
  scenicSpots, routePlans, cultureTopics, specialtyItems,
  homeStats, homeBanners, activityNews, profileStats,
  profileServices, cultureTimeline, todayData, newHomeBanners,
  nearbyServices, heritageItems, overseasStories, exhibitionItems,
  cultureAiQA, userBadges, journeyTips, profileAiTips
};
