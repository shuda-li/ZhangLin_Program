# 樟林归舟 - 微信小程序

樟林古港文旅服务小程序，为游客提供智能导览、AI问答、景点讲解、路线规划等服务。

## 功能特色

- 🗺️ **智慧导览地图** - 展示古港景点分布与实时位置
- 🎧 **AI 导览助手** - 智能问答，持续对话解答旅游问题
- 🚢 **3D 红头船展示** - 多角度查看红头船模型
- 📍 **主题路线规划** - 半日游、一日游、亲子研学等推荐路线
- 📚 **文化知识科普** - 红头船文化、侨乡文脉、古港建筑
- 🍵 **特色风物推介** - 工夫茶、潮汕美食、文创手作

## 项目结构

```
ZhangLin_Program/
├── pages/                    # 页面文件
│   ├── index/              # 首页
│   ├── guide/              # 导览页
│   ├── culture/            # 文化页
│   ├── specialty/          # 风物页
│   ├── activity/          # 活动页
│   ├── profile/           # 我的页面
│   ├── scenic-detail/     # 景点详情页
│   ├── ship-3d/           # 3D红头船展示页
│   └── ai-chat/           # AI对话页
├── data/                    # 数据文件
│   ├── scenic-spots.js    # 景点数据
│   ├── routes.js          # 路线数据
│   ├── activities.js      # 活动数据
│   └── ...
├── utils/                  # 工具模块
│   └── ai-llm.js          # AI对话模块
├── admin/                  # 后台管理界面
└── backend/                # 后端服务
```

## 本地配置

### 1. API 密钥配置

本项目使用 DeepSeek API 实现 AI 对话功能。请按以下步骤配置：

1. 复制 `utils/config.js.example` 为 `utils/config.js`
2. 在 `config.js` 中填入你的 API 密钥：

```javascript
module.exports = {
  DEEPSEEK_API_KEY: 'your-api-key-here',
  TAVILY_API_KEY: 'your-tavily-key-here'  // 可选
}
```

⚠️ **注意**：`utils/config.js` 已添加到 `.gitignore`，不会上传到仓库。

### 2. 图片资源

项目所需的图片资源分为两类：

**必选图片**（需要自行添加到 `assets/images/` 目录）：
- 红头船展示图片
- 景点照片
- 古港地图等

**可选图片**（本地照片目录）：
- `zhanglin_picture/` - 包含樟林古港的实地照片，用于开发和测试
- 此目录已添加到 `.gitignore`，不会上传到仓库

### 3. 数据库配置（可选）

如果启用后台管理功能，需要：

1. 创建 PostgreSQL 数据库
2. 配置 `backend/db/connection.js` 中的数据库连接信息

## 安装运行

### 小程序

1. 克隆仓库
2. 使用微信开发者工具打开项目
3. 配置 `utils/config.js`（参考上方说明）
4. 添加必要的图片资源到 `assets/images/`
5. 编译运行

### 后台管理（可选）

```bash
cd admin
npm install
npm run dev
```

### 后端服务（可选）

```bash
cd backend
npm install
npm start
```

## 技术栈

- **前端**：微信小程序原生开发
- **AI**：DeepSeek API (deepseek-v4-flash 模型)
- **后台**：Vue 3 + Vite
- **后端**：Node.js + Express + PostgreSQL

## 注意事项

- 本项目为参加竞赛的文旅小程序作品
- API 密钥需要自行申请，建议使用费用较低的 `deepseek-v4-flash` 模型
- 图片资源需要自行准备或使用占位图
- `zhanglin_picture/` 目录包含本地开发使用的照片，已排除不上传

## License

MIT License
