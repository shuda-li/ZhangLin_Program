/**
 * 后端配置（零依赖）
 * 优先读取 process.env；若未设置则从同目录 .env 文件加载。
 * .env 不入库，密钥只存在于部署环境。
 */
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // 去除包裹引号
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // 不覆盖已通过进程注入的环境变量
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

const PLACEHOLDER_PATTERN = /^请替换|^your[-_]|^change[-_]|^$/i;

function isConfigured(value) {
  return Boolean(value) && !PLACEHOLDER_PATTERN.test(String(value).trim());
}

const rawOrigin = process.env.CORS_ORIGIN || '*';

module.exports = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || '',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  corsOrigins: rawOrigin.split(',').map((s) => s.trim()).filter(Boolean),
  isConfigured,
  // JWT 密钥未配置时给出明确告警，避免继续使用硬编码弱密钥
  jwtConfigured: isConfigured(process.env.JWT_SECRET)
};
