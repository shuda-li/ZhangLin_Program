# 安全整改说明（务必阅读）

## 背景

项目早期曾在以下位置硬编码真实 API 密钥，且已推送到 GitHub 历史中：

- `utils/config.js`（提交 `40f7204` 等）
- `utils/config.js.example`

涉及的密钥：

- **DeepSeek API Key**：`sk-e0275...c1f9`（已在历史中泄露）

## 一、必须立即执行的人工步骤（代码无法自动完成）

### 1. 吊销并轮换密钥（最高优先级）

1. 登录 [DeepSeek 开放平台](https://platform.deepseek.com/) → API Keys 管理页
2. **删除**泄露的旧密钥 `sk-e0275...c1f9`
3. 重新创建一个新的 API Key
4. 将新密钥**只**配置到后端的 `.env`（见下一步），**不要**写回任何前端文件

> 只要旧密钥未吊销，任何人都可用它产生费用。此步骤无法由代码替代。

### 2. 配置后端环境变量并录入 AI 密钥

```bash
cd backend
cp .env.example .env
```

编辑 `.env`，填写真实值（**不再包含任何 AI 密钥**）：

```
JWT_SECRET=<用 openssl rand -hex 32 生成的随机串>
ADMIN_PASSWORD=<管理员初始密码>
KEY_STORE_SECRET=<另一串随机串，用于加密 AI 密钥>
CORS_ORIGIN=https://你的小程序后端域名
```

`.env` 已被 `.gitignore` 排除，不会入库。

然后启动后端、用管理员账号登录管理后台，进入「AI 密钥设置」，输入新生成的 DeepSeek Key（Tavily Key 选填）。密钥会经 AES-256-GCM 加密后保存到 `backend/data/.ai-keys.json`，该文件已加入 `.gitignore`，绝不会入库；后台接口只返回脱敏信息（如 `sk-ab12****wxyz`）。

> 注意：`KEY_STORE_SECRET` 一旦变更，已保存的密钥将无法解密，需要重新到后台输入。请妥善备份该值。

### 3. 清理 Git 历史中的密钥（视协作情况决定）

> 注意：这会重写提交历史。若有其他协作者，需提前沟通，并让所有人重新克隆。

使用 `git filter-repo`（推荐）：

```bash
# 1. 准备替换文件：把 config.js 与 config.js.example 中密钥改为占位符
# 2. 执行历史清理
git filter-repo --path utils/config.js --path utils/config.js.example --invert-paths

# 或按内容替换密钥（把 <旧密钥> 换成完整的泄露密钥）
git filter-repo --replace-text <(echo "<旧密钥>==>REDACTED")

# 3. 强制推送
git push origin --force --all
git push origin --force --tags
```

同时建议到 GitHub 仓库 Settings → Security 申请清理缓存的旧提交视图。

## 二、代码层面已完成的整改

- 前端新增 `utils/api.js` 统一请求层，`ai-llm.js` / `ai-service.js` 不再持有任何密钥
- 后端新增 `routes/ai.js` 代理端点，密钥改为从管理后台加密存储读取，含输入校验与限流
- 新增 `backend/data/keyStore.js`：密钥 AES-256-GCM 加密落盘至 `.ai-keys.json`（不入库），仅管理员可读写，接口只返回脱敏状态
- 新增 `backend/routes/settings.js` 与管理后台「AI 密钥设置」页：管理员可输入、更换、验证、清除密钥
- 后端新增 `config.js` 环境变量加载器，`JWT_SECRET` 不再硬编码
- `project.config.json` 关闭 `uploadWithSourceMap`
- `utils/config.js` 从版本库移除并加入 `.gitignore`，`config.js.example` 改为占位符
- 密钥完全移除出环境变量：`config.js`、`.env.example` 不再含 `DEEPSEEK_API_KEY` / `TAVILY_API_KEY`

## 三、上线前检查清单

- [ ] 旧 DeepSeek 密钥已吊销
- [ ] 新密钥已由管理员在管理后台「AI 密钥设置」输入，且未写入任何前端文件
- [ ] `KEY_STORE_SECRET` 已配置并妥善备份（变更会导致密钥需重新输入）
- [ ] 小程序管理后台已配置后端 request 合法域名（HTTPS）
- [ ] `utils/api.js` 中 `API_BASE_URL` 已填写后端地址
- [ ] 后端 `.env` 中 `JWT_SECRET` 已改为高强度随机串
- [ ] Git 历史密钥已清理（如需）
