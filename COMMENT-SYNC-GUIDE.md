# 小程序评论同步到后台管理端配置指南

本文档说明如何把小程序端用户发表的评论同步到后端服务，并在后台管理端查看、筛选与审核。

**当前默认状态**：小程序 `utils/api.js` 中的 `API_BASE_URL` 为空，评论仅保存在小程序本地（`wx.setStorageSync('siteComments', ...)`），功能可用但后台看不到。完成本指南配置后，**新发表**的评论会自动同步到后端并出现在管理端。

---

## 一、准备条件

| 条件 | 具体要求 | 检查方式 |
|------|----------|----------|
| 后端可运行 | Node.js 环境，`backend/` 目录已执行 `npm install` | `cd backend && node server.js` 无报错 |
| 后端配置文件 | 已复制 `backend/.env.example` 为 `backend/.env`，含 `JWT_SECRET`、`ADMIN_PASSWORD`；生产建议同时配置 `CORS_ORIGIN`、`KEY_STORE_SECRET` | 文件存在且无占位符值 |
| 可访问的后端地址 | 开发期可用局域网 `http://IP:3000`；生产必须为 **HTTPS 域名**且已完成 ICP 备案 | 浏览器访问 `<后端地址>/api/health` 返回 `{"status":"ok",...}` |
| 微信合法域名 | 生产环境需在微信公众平台将后端域名加入 **request 合法域名** | 公众平台 → 开发管理 → 开发设置 → 服务器域名 |
| 管理端可访问后端 | 开发环境由 Vite 代理转发；生产环境需由 Nginx 等反向代理 `/api` 到后端 | 管理端登录后评论管理页能加载统计数字 |
| 管理员账号 | 用户名 `admin`，密码取自 `.env` 的 `ADMIN_PASSWORD`；未配置时为开发默认值 `admin123` | 管理端登录页可成功登录 |

> 注意：小程序评论同步是「发表时尽力同步」机制（详见第四节）。配置只对新评论生效，配置前已保存在用户手机本地的历史评论不会自动补传。

---

## 二、配置流程

### 2.1 后端配置

1. 若尚无 `.env`，先复制示例文件：

   ```bash
   cp backend/.env.example backend/.env
   ```

   然后确认 `backend/.env` 至少包含以下项：

   ```ini
   PORT=3000
   JWT_SECRET=请替换为随机长字符串
   ADMIN_PASSWORD=请替换为管理员强密码
   CORS_ORIGIN=https://admin.example.com
   ```

   - `CORS_ORIGIN`：浏览器来源白名单，多个域名用英文逗号分隔。小程序的 `wx.request` 不携带 `Origin` 头，后端对其默认放行，因此该项主要影响**管理端浏览器**。
   - `KEY_STORE_SECRET`：AI 密钥加密主密钥，与评论同步无直接关系，但生产环境建议一并配置。

2. 启动后端服务：

   ```bash
   cd backend
   npm install
   node server.js
   ```

   看到 `服务器运行在 http://localhost:3000` 即表示启动成功。

3. 确认评论存储文件可写：`backend/data/comments.json`。后端以 JSON 文件持久化评论，部署时该文件所在目录必须有写权限；容器化部署需挂载持久卷，否则重启后评论丢失。

### 2.2 小程序端配置

1. 打开 `utils/api.js`，修改第 9 行的 `API_BASE_URL`：

   ```javascript
   // 开发期（局域网真机调试）
   const API_BASE_URL = 'http://192.168.1.10:3000';

   // 生产环境（必须 HTTPS，且已加入 request 合法域名）
   const API_BASE_URL = 'https://api.example.com';
   ```

   - 地址结尾不要带 `/`；代码中会自动去除尾部斜杠。
   - 留空 `''` 即回到「仅本地保存」模式。

2. 开发/真机调试阶段，在微信开发者工具中勾选：**详情 → 本地设置 → 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书**。此选项仅对开发者工具和体验版生效。

3. 正式版必须在微信公众平台配置 request 合法域名：

   - 路径：公众平台 → 开发管理 → 开发设置 → 服务器域名 → `request合法域名`
   - 填写后端 HTTPS 域名（不含路径），例如 `https://api.example.com`
   - 域名需已备案，且 TLS 证书有效

4. 重新编译小程序（改动 JS 常量需重新编译才生效）。

> 无需在小程序端配置任何密钥：评论接口为公开读写接口，不含敏感凭据。

### 2.3 后台管理端配置

1. **开发环境**：`admin/vite.config.js` 已内置代理，无需修改：

   ```javascript
   proxy: {
     '/api': { target: 'http://localhost:3000', changeOrigin: true }
   }
   ```

   启动方式：

   ```bash
   cd admin
   npm install
   npm run dev
   ```

2. **生产环境**：`admin/src/api/index.js` 中 `baseURL` 固定为 `/api`（相对路径），因此管理端静态文件必须与后端同源，或由反向代理转发。Nginx 示例：

   ```nginx
   server {
       listen 443 ssl;
       server_name admin.example.com;

       location / {
           root /path/to/admin/dist;
           try_files $uri $uri/ /index.html;
       }

       location /api/ {
           proxy_pass http://127.0.0.1:3000/api/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

   若管理端与后端使用不同域名，还需在后端 `.env` 的 `CORS_ORIGIN` 中加入管理端域名（如 `https://admin.example.com`）。

3. 构建管理端静态文件：

   ```bash
   cd admin
   npm run build
   ```

   产物在 `admin/dist/`。

4. 用管理员账号登录管理端，左侧菜单进入 **评论管理**（路由 `/comments`）。

---

## 三、字段映射

### 3.1 评论字段

| 字段 | 小程序提交值 | 后端处理 | 管理端展示 |
|------|--------------|----------|------------|
| `id` | `c_` + 时间戳 + 4 位随机串，小程序本地生成 | 按 id 幂等去重，同 id 不重复入库 | ID 列 |
| `targetType` | `story` / `spot` / `route` | 非合法值按 `spot` 处理 | 类型标签（风物故事/景点介绍/导览路线） |
| `targetId` | 对应内容标识 | 截断至 80 字符，必填 | 详情弹窗中「所属内容」括号内 |
| `targetName` | 内容标题 | 截断至 80 字符 | 所属内容列 |
| `nickname` | 用户昵称，空则「古港游客」 | 截断至 30 字符 | 昵称列 |
| `content` | 评论正文，前端去除首尾空格 | 去除首尾空格，最多 500 字 | 评论内容列 |
| `rating` | 风物故事/景点评价为 1–5；导览评论为 0 | 钳制到 0–5，0 表示未评分 | 评分列，0 显示「—」 |
| `images` | 图片路径数组，最多 3 张 | 最多保留 3 张 | 详情弹窗中的图片预览 |
| `createdAt` | 小程序本地 ISO 时间字符串 | 缺省时用服务器时间 | 发表时间列 |
| `status` | 固定 `active` | 屏蔽后为 `hidden` | 状态列 |

### 3.2 targetType 与 targetId 对应关系

| 评论入口 | targetType | targetId 来源 | 管理端看到的类型 |
|----------|------------|---------------|------------------|
| 风物故事详情弹层 | `story` | `storyItem.id` | 风物故事 |
| 景点详情页「写评价」 | `spot` | `scenicSpot.id` | 景点介绍 |
| 导览页「路线讨论」 | `route` | `activeRouteId` | 导览路线 |
| 导览页点位详情弹层 | `spot` | `activeRouteId + '-' + 点位序号` | 景点介绍 |

> 导览点位评论的 `targetId` 是「路线 ID + 序号」组合，管理端详情弹窗可同时看到 `targetName`（点位标题）和该组合 ID，据此定位具体点位。

### 3.3 后端接口

| 用途 | 方法与路径 | 鉴权 |
|------|------------|------|
| 公开读取评论 | `GET /api/comments?targetType=&targetId=&limit=` | 无 |
| 发表评论 | `POST /api/comments` | 无 |
| 管理端列表/筛选 | `GET /api/comments/admin/list` | Bearer Token（管理员） |
| 管理端统计 | `GET /api/comments/admin/stats` | Bearer Token（管理员） |
| 屏蔽/恢复 | `PUT /api/comments/admin/:id/status` | Bearer Token（管理员） |
| 删除 | `DELETE /api/comments/admin/:id` | Bearer Token（管理员） |

---

## 四、同步触发方式

### 4.1 发表时同步（单向、尽力而为）

小程序调用 `commentService.add()` 时：

1. **先写本地**：评论立即写入 `wx` 本地存储 `siteComments`，用户端马上显示，操作不阻塞。
2. **再发请求**：通过 `api.request` 向 `POST /api/comments` 发送请求。
3. **失败静默**：后端同步失败不会影响用户发表体验，也不会向用户提示同步失败。

**关键限制**：

- 这是 fire-and-forget 机制，**没有重试队列**。若请求失败（未配置地址、域名不合法、后端宕机、网络中断），该评论只存在于用户手机本地，之后不会自动补传。
- 配置 `API_BASE_URL` 之前产生的本地历史评论**不会自动同步**。如需迁移，可读取用户本地存储后逐条调用 `POST /api/comments`（按 `id` 幂等，重复提交不会重复入库）。

### 4.2 读取时合并（双向合并显示）

小程序调用 `commentService.list(targetType, targetId)` 时：

1. 从本地存储读取该目标的评论（仅 `active`）。
2. 请求 `GET /api/comments` 获取后端评论（仅 `active`）。
3. 按 `id` 合并去重（本地数据在冲突时覆盖远端数据），按 `createdAt` 倒序返回。

因此网络异常时用户仍能看到自己的评论，但可能出现「小程序可见、后台不可见」的差异。

### 4.3 审核状态同步

- 管理端屏蔽评论后，后端公开接口不再返回该评论（`status: hidden`）。
- 但用户本地存储中该评论仍为 `active`，且合并时本地数据覆盖远端，因此**用户手机本地仍可能显示该评论**。
- 彻底移除需用户清理小程序缓存（微信 → 发现 → 小程序 → 长按 → 删除/清除缓存），或后续版本增加服务端状态回写机制。

---

## 五、测试验证

按以下顺序验证，确认「小程序发表 → 后端落盘 → 管理端可见」全链路打通。

### 步骤 1：验证后端连通

```bash
curl http://localhost:3000/api/health
```

预期返回：`{"status":"ok","message":"樟林古港文旅API服务运行正常"}`。

### 步骤 2：小程序端发表测试评论

在微信开发者工具或真机上，任选一处入口发表评论：

- 风物故事详情 → 打开故事面板 → 评论
- 景点详情 → 写评价
- 导览页 → 路线讨论 / 点位详情评论

发表一条内容唯一的测试评论，例如：`同步测试-20261124-001`。小程序应提示「评论已发表」。

### 步骤 3：用接口确认后端已收到

```bash
curl "http://localhost:3000/api/comments?targetType=story&targetId=替换为目标ID&limit=20"
```

预期：`data.list` 中出现刚发表的评论，`id`、`content`、`nickname` 与小程序端一致。

> 若不知目标 ID，可直接查看后端数据文件：`backend/data/comments.json`。

### 步骤 4：管理端查看并确认同步结果

1. 登录管理端，进入 **评论管理**。
2. 点击右上角 **刷新统计**，确认「评论总数」较之前 +1，对应类型计数（风物/景点/路线）+1。
3. 在「关键词」输入测试评论内容（如 `同步测试-20261124-001`），点击 **查询**。
4. 列表中应出现该评论；核对类型标签、所属内容、昵称、评分、状态（正常）与发表时间。
5. 点击 **详情**，确认 `targetId` 与内容正文完整，图片（如有）可预览。
6. 可点 **屏蔽** 验证状态变更，再点 **恢复**；验证后建议点 **删除** 清理测试数据。

### 步骤 5：清理测试数据

- 管理端删除该评论后，检查 `backend/data/comments.json` 中不再包含该条。
- 小程序端测试评论仍在本地显示属正常现象（见 4.3 节），如需清除可在开发者工具中清除 `siteComments` 存储。

### 步骤 6：真机复核（生产环境必做）

1. 确认公众平台 request 合法域名已配置并发布新版。
2. 用真机预览/体验版发表评论，重复步骤 3–5。
3. 若真机失败而开发者工具成功，优先检查合法域名与 HTTPS 证书（见异常排查第 2 项）。

---

## 六、常见异常排查

| 现象 | 可能原因 | 排查与处理 |
|------|----------|------------|
| 小程序提示发表成功，后台无数据 | `API_BASE_URL` 仍为空 | 检查 `utils/api.js` 第 9 行；修改后需重新编译小程序 |
| 开发者工具可同步，真机不可 | 未配置 request 合法域名，或域名非 HTTPS/证书无效 | 公众平台配置合法域名；真机调试时确认域名已生效；检查 TLS 证书链 |
| 请求被拒，控制台报域名不合法 | 使用了 IP、端口或自签证书 | 生产必须使用已备案的 HTTPS 域名；开发期可勾选「不校验合法域名」 |
| 后端无收到请求 | 后端未启动 / 端口被占用 / 防火墙拦截 | 访问 `/api/health`；检查 `netstat -ano | findstr :3000`；检查云服务器安全组 |
| 管理端统计接口 401 | Token 过期或管理员密码变更 | 重新登录管理端；确认 `.env` 的 `ADMIN_PASSWORD` 与登录密码一致 |
| 管理端列表为空但统计有数 | 筛选条件未清空（类型/状态/关键词/时间范围） | 点击「重置」后重新查询；注意时间范围筛选使用 ISO 字符串比较 |
| 管理端接口 403，提示来源不在白名单 | 后端 `CORS_ORIGIN` 未包含管理端域名 | 在 `.env` 的 `CORS_ORIGIN` 加入管理端域名，重启后端；仅影响浏览器访问 |
| 生产管理端 `/api` 返回 404 | 未配置反向代理，静态站点无法转发 API | 按 2.3 节配置 Nginx `location /api/` 代理到后端 |
| 后端日志出现写入评论文件失败 | `comments.json` 目录无写权限或磁盘满 | 检查文件权限与磁盘空间；容器部署需挂载持久卷 |
| 发表返回 400「评论目标类型无效」 | `targetType` 非 `story`/`spot`/`route` | 检查调用方传参；小程序端合法值见 3.2 节 |
| 发表返回 400「评论内容不能为空」 | 内容为空或超过 500 字 | 检查前端校验；后端同样做长度校验 |
| 配置前发表的评论未出现在后台 | 同步只在发表时触发，无补传机制 | 手动逐条调用 `POST /api/comments`（按 id 幂等），或后续版本实现补传队列 |
| 后台已屏蔽，小程序仍显示 | 本地存储覆盖远端状态 | 用户清理小程序缓存；这是当前设计的已知限制（见 4.3 节） |
| 后端重启后评论丢失 | `comments.json` 未持久化（如容器无卷） | 确认文件存在且可写；容器部署挂载数据卷，并纳入备份策略 |

---

## 附：相关文件速查

| 文件 | 作用 |
|------|------|
| `utils/api.js` | 后端地址 `API_BASE_URL` 与统一请求封装 |
| `utils/comment-service.js` | 评论本地读写、后端同步与合并逻辑 |
| `components/comment-board/index.js` | 评论组件，提交时组装字段 |
| `backend/routes/comments.js` | 公开与管理端评论接口 |
| `backend/data/commentStore.js` | 评论存储与筛选逻辑 |
| `backend/data/comments.json` | 评论数据落盘文件 |
| `backend/config.js` | 端口、CORS、JWT 等配置读取 |
| `admin/src/api/index.js` | 管理端评论 API 封装 |
| `admin/src/views/CommentList.vue` | 评论管理页面 |
