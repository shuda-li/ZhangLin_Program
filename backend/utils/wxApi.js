/**
 * 微信登录凭证校验（jscode2session）
 * 零依赖 HTTPS GET；AppSecret 只存在于服务端，不下发前端。
 */
const https = require('https');

function code2Session({ appId, appSecret, code }) {
  const url = 'https://api.weixin.qq.com/sns/jscode2session?appid=' +
    encodeURIComponent(appId) +
    '&secret=' + encodeURIComponent(appSecret) +
    '&js_code=' + encodeURIComponent(code) +
    '&grant_type=authorization_code';

  return new Promise((resolve, reject) => {
    const request = https.get(url, { timeout: 10000 }, (response) => {
      let chunks = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { chunks += chunk; });
      response.on('end', () => {
        try {
          const data = JSON.parse(chunks);
          if (data.errcode) {
            reject(new Error('微信接口返回错误 ' + data.errcode + ': ' + (data.errmsg || '')));
            return;
          }
          if (!data.openid) {
            reject(new Error('微信接口未返回 openid'));
            return;
          }
          resolve({ openid: data.openid, unionid: data.unionid || null });
        } catch (error) {
          reject(new Error('微信接口返回数据解析失败'));
        }
      });
    });

    request.setTimeout(10000, () => request.destroy(new Error('微信接口请求超时')));
    request.on('error', reject);
  });
}

module.exports = { code2Session };
