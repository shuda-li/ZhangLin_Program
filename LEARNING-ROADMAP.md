# 樟林归舟 · 学习路线图

> 按你当前的起点（有 HTML/CSS 基础 + 接触过 AI 工具），**从零到能独立开发樟林归舟小程序**，大约需要 4-6 周（每天 4-6 小时）。下面按学习的先后顺序排列，标 ⭐ 的是必须掌握的，标 🔧 的是加分项。

---

## 第一阶段：微信小程序基础（第 1-2 周）

> 目标：能搭建一个小程序骨架，页面能跳转、数据能展示。

### 必须掌握的

- ⭐ **小程序项目结构**：`app.js` / `app.json` / `app.wxss` 三个全局文件的作用，`pages/` 目录下每个页面由 `.wxml` + `.wxss` + `.js` + `.json` 四个文件组成，理解它们各自管什么
- ⭐ **WXML 模板语法**：`wx:for` 列表渲染、`wx:if` 条件渲染、`{{ }}` 数据绑定、`bindtap` 事件绑定、`data-*` 传参。本质上是 HTML 的微信定制版，如果你会 HTML，1-2 天就能上手
- ⭐ **WXSS 样式**：支持大部分 CSS 特性（flexbox、position、margin/padding），新增 `rpx` 响应式像素单位（750rpx = 屏幕宽度），不支持部分 CSS3 特性（如 `backdrop-filter`）
- ⭐ **页面生命周期**：`onLoad`（页面加载）/ `onShow`（页面显示）/ `onReady`（初次渲染完成）/ `onHide`（页面隐藏），理解什么时候该在哪个函数里写什么逻辑
- ⭐ **页面跳转**：`wx.navigateTo`（进新页面，可返回）/ `wx.switchTab`（切 Tab 页）/ `wx.redirectTo`（替换当前页）/ `wx.navigateBack`（返回），四种跳转的区别和使用场景
- ⭐ **数据请求**：`wx.request` 发起网络请求，了解域名白名单配置（`request` 合法域名需要在后台设置）

### 学习资源

- 官方文档：[developers.weixin.qq.com/miniprogram/dev/framework/](https://developers.weixin.qq.com/miniprogram/dev/framework/) — 直接看「框架」「组件」「API」三个章节
- 实践路线：跟着官方快速上手教程做一个小 demo（不需要做完整项目，理解结构即可）
- **检验标准**：做一个 2 页的小程序（首页 + 详情页），点击首页卡片能跳转到详情页并传递数据

---

## 第二阶段：自定义组件与复杂 UI（第 2-3 周）

> 目标：能写自定义 TabBar、卡片流、弹层、加载态等复杂交互组件。

### 必须掌握的

- ⭐ **自定义组件**：`Component({ properties, data, methods })` 的定义与使用，理解 `properties`（父传子）和 `this.triggerEvent`（子传父）的数据流向
- ⭐ **自定义 TabBar**：樟林归舟用的是自定义 TabBar（非原生），需要理解 `app.json` 中 `tabBar.custom: true` + 在根目录创建 `custom-tab-bar/` 文件夹 + 每个 Tab 页的 `onShow` 中调用 `this.getTabBar().setData({ selected: index })` 同步选中状态
- ⭐ **常见 UI 组件实现**：图片轮播/横滑画廊（`scroll-view` + `scroll-x`）、模态弹层（`wx:if` + 遮罩层 + 动画）、卡片流布局（`flex-wrap`）、加载态（`wx:if` 切换骨架屏/数据）、空状态（数据为空时的提示页面）
- 🔧 **动画与交互**：`wx.createAnimation` 基础动画 API、CSS `transition` 过渡动画、图片灯箱效果（点击放大 + 遮罩 + 点击关闭）
- 🔧 **性能优化**：`setData` 只传变化的数据（不要全量刷新）、列表用 `wx:key` 提高 diff 效率、图片懒加载 `lazy-load`

### 学习资源

- 官方组件文档：每个组件都看一遍用法（`scroll-view`、`swiper`、`image` 的 `mode` 属性尤其重要）
- 实践：把第一阶段的 2 页 demo 加上 TabBar、加一个弹层、加一个横滑图片列表
- **检验标准**：实现一个带自定义 TabBar 的 3 页小程序，Tab 切换正常，每页有独立的内容和交互

---

## 第三阶段：AI API 集成（第 3-4 周）

> 目标：能在小程序里调用 DeepSeek API，实现多轮对话、流式输出、角色扮演。

### 必须掌握的

- ⭐ **HTTP 请求与异步编程**：理解 `Promise` / `async/await`、`wx.request` 的回调与 Promise 封装、`try/catch` 错误处理
- ⭐ **DeepSeek API 调用**：Chat Completions 接口的请求格式（`model` / `messages` / `temperature` / `max_tokens`）、响应解析（`choices[0].message.content`）、鉴权方式（`Authorization: Bearer sk-xxx`）
- ⭐ **System Prompt 设计**：樟林归舟「阿樟」用了五层约束——身份（古港老邻居）+ 性格（热情不喧闹）+ 语言风格（口语+潮汕词）+ 知识边界（核心景点/路线/文化）+ 回答原则（优先古港/诚实告知/字数控制）。学习如何通过 Prompt 控制 AI 的回复质量
- ⭐ **多轮对话管理**：维护一个 `messages[]` 数组，每次用户发消息时 `push` 进去，发送请求时把整个数组传给 API，超过历史上限（如 20 轮）时滑动窗口裁剪最早的记录
- 🔧 **流式输出 (Streaming)**：`stream: true` + 逐 token 解析 SSE 响应，让用户看到 AI 「一个字一个字打出来」的效果，体验比等待完整回复好很多
- 🔧 **错误降级**：API 超时/密钥失效/网络异常时的友好提示（而非白屏或报错堆栈），例如「阿樟暂时遇到了一点问题，请稍后再试」

### 学习资源

- [DeepSeek API 文档](https://platform.deepseek.com/api-docs/) — 读 Chat Completions 接口
- 搜索「DeepSeek API 小程序调用」看实战文章
- **检验标准**：在小程序中实现一个简单的 AI 聊天页面——能发消息、能收到回复、能滚动查看历史记录

---

## 第四阶段：后端与部署（第 4-5 周）

> 目标：搭建一个简单的后端来保护 API Key，把小程序跑在真机上。

### 必须掌握的

- ⭐ **为什么需要后端代理**：小程序的 API Key 如果直接写在前端代码里，任何人都能通过抓包拿到。需要用后端作为中间层——小程序 → 后端 → DeepSeek API，Key 只存在后端
- ⭐ **Node.js + Express 基础**：路由（`app.get` / `app.post`）、中间件（`express.json()`）、`fetch` 或 `axios` 转发请求、`cors` 允许小程序域名访问
- ⭐ **微信开发者工具**：真机预览（扫码在手机上跑）、真机调试（手机上操作 + 电脑上看日志）、上传 → 体验版发布 → 生成体验二维码
- ⭐ **包体管理**：微信小程序主包限制 2MB。大图片要用 Python/Pillow 压缩（600-800px 宽 + JPEG Quality 50-70），非代码文件（`.git`、文档、素材原图）通过 `packOptions.ignore` 排除
- 🔧 **小程序后台配置**：服务器域名白名单（request 合法域名）、业务域名配置、成员管理（开发者/体验者添加）

### 学习资源

- Express 官方入门教程（5 分钟看懂路由和中间件）
- 搜索「微信小程序 + Express 搭建后端」看完整实战文章
- **检验标准**：手机扫码能打开小程序，AI 聊天功能正常（请求不报 401/500）

---

## 第五阶段：上线前准备（第 5-6 周）

### 必须掌握的

- ⭐ **Git 版本管理**：`git init` / `git add` / `git commit` / `git push`，基本操作熟练即可
- ⭐ **代码规范**：变量命名有意义、函数职责单一、注释写清楚为什么（不是写做了什么）
- 🔧 **小程序审核**：提交审核前检查——无测试数据残留、无死链、功能完整、隐私合规

---

## 建议学习顺序

```
第 1 周  微信小程序基础（WXML/WXSS/JS/页面跳转/数据绑定）
第 2 周  自定义组件 + 复杂 UI（TabBar/弹层/卡片流/横滑/动画）
第 3 周  JavaScript 异步编程 + DeepSeek API 调用 + System Prompt 设计
第 4 周  多轮对话 + 流式输出 + Node.js/Express 后端代理
第 5 周  真机调试 + 包体优化 + 图片压缩 + 后端部署
第 6 周  Git + 代码整理 + 审核提交
```

---

## 不要求但会让简历好看的能力

| 能力 | 为什么加分 | 在樟林项目中怎么体现 |
|------|-----------|-------------------|
| Python 脚本 | 自动化 > 手工，体现工程思维 | 图片批量压缩、路径替换、包体验证 |
| Prompt Engineering | AI 产品核心能力 | 66 行 System Prompt 五层约束设计 |
| UI 设计基础 | 全栈闭环 | 暖色古风主题、色彩系统、字号层级 |
| 图片处理 (Pillow) | 工程化能力 | 42 张照片 429MB → 1.5MB |
| Markdown 写作 | 文档能力 | README、技术文档、项目复盘 |

---

## 推荐学习平台

- **微信开放文档**：developers.weixin.qq.com — 最权威，直接看
- **B 站**：搜索「微信小程序入门」「小程序聊天机器人」「DeepSeek API 小程序」— 跟着视频敲一遍
- **GitHub**：搜索 `wechat-mini-program` `deepseek` `ai-chat` 看开源项目源码
- **DeepSeek 平台**：platform.deepseek.com — API 文档 + 在线 Playground 测试 Prompt 效果

---

## 总结：你最少需要掌握什么

如果时间紧张，**底线清单**（掌握这 6 项就能做出来）：

1. 微信小程序页面结构 + WXML/WXSS/JS 基础
2. `wx.request` 发起网络请求
3. DeepSeek Chat Completions API 调用格式
4. 维护一个 `messages[]` 数组做多轮对话
5. Node.js + Express 写一个 API 代理（保护 Key）
6. 微信开发者工具真机预览 + 上传

其他的（自定义 TabBar、流式输出、包体优化、图片压缩）可以边做边学，不需要全学完才开始动手。
