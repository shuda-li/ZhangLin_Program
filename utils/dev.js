/** 开发/模拟器辅助（未上线小程序本地调试用） */

const ZHANGLIN_MOCK = {
  latitude: 23.462,
  longitude: 116.781,
  label: '红头船文化展示点（模拟）'
}

function isDevtools() {
  try {
    const info = wx.getSystemInfoSync()
    return info.platform === 'devtools'
  } catch (e) {
    return false
  }
}

module.exports = {
  isDevtools,
  ZHANGLIN_MOCK
}