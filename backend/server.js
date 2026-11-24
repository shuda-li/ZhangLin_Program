const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();
const PORT = config.port;

// 跨域白名单：配置为空或 * 时允许全部（仅开发期），生产应填写具体域名
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('该来源不在 CORS 白名单中'));
    }
  },
  credentials: true
};
app.use(cors(corsOptions));
// 放宽到 2mb 以容纳 base64 头像；上传路由内部另做 512KB 解码后大小校验
app.use(express.json({ limit: '2mb' }));

// 初始化种子用户密码（生成有效 bcrypt 哈希）
const { initializeUserPasswords } = require('./data/initUsers');
initializeUserPasswords();

const authRouter = require('./routes/auth');
const scenicRouter = require('./routes/scenic');
const activityRouter = require('./routes/activity');
const userRouter = require('./routes/user');
const statsRouter = require('./routes/stats');
const aiRouter = require('./routes/ai');
const contentRouter = require('./routes/content');
const settingsRouter = require('./routes/settings');
const commentsRouter = require('./routes/comments');
const userDataRouter = require('./routes/userData');
const uploadRouter = require('./routes/upload');
const wxUsersRouter = require('./routes/wxUsers');

// 用户上传的头像（站内静态资源，目录不入库）
// 挂载点含 avatars 一层，与返回的 /uploads/avatars/xxx 对齐；
// 不挂到 /data，避免数据库与评论文件被直接下载
app.use('/uploads/avatars', express.static(path.join(__dirname, 'data', 'avatars'), {
  maxAge: '1h',
  fallthrough: true
}));
app.use('/api/comments', commentsRouter);
app.use('/api/userdata', userDataRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/wx-users', wxUsersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/content', contentRouter);
app.use('/api/auth', authRouter);
app.use('/api/scenic', scenicRouter);
app.use('/api/activity', activityRouter);
app.use('/api/user', userRouter);
app.use('/api/stats', statsRouter);
app.use('/api/ai', aiRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '樟林古港文旅API服务运行正常' });
});

// CORS 拒绝等错误统一响应，避免堆栈泄露
app.use((err, req, res, next) => {
  res.status(err.status || 403).json({ code: err.status || 403, message: err.message || '请求被拒绝' });
});

if (!config.jwtConfigured) {
  console.warn('[安全警告] JWT_SECRET 未配置，鉴权功能将使用临时密钥，请勿用于生产环境');
}
if (!config.wxConfigured) {
  console.warn('[提示] 微信登录凭据未配置，将使用本地开发模拟 openid（仅非生产环境有效）');
}

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`API文档: http://localhost:${PORT}/api/health`);
});

module.exports = app;
