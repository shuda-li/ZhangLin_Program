/**
 * 零依赖 HTTPS POST 工具（兼容未内置 fetch 的 Node 版本）
 * 返回 { statusCode, data }，data 为解析后的 JSON；非 JSON 响应会抛错。
 */
const https = require('https');

function httpsPost(url, headers, body, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    let urlObj;
    try {
      urlObj = new URL(url);
    } catch (e) {
      reject(new Error('无效的 AI 服务地址'));
      return;
    }
    const payload = JSON.stringify(body);
    const req = https.request(
      {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'POST',
        headers: Object.assign(
          { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          headers || {}
        )
      },
      (res) => {
        let chunks = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { chunks += chunk; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(chunks) });
          } catch (e) {
            reject(new Error('AI 服务返回非 JSON 数据'));
          }
        });
      }
    );
    req.setTimeout(timeoutMs, () => req.destroy(new Error('AI 服务请求超时')));
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = httpsPost;
