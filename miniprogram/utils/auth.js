// utils/auth.js - 登录鉴权模块
const api = require('./api')
const store = require('./store')

/**
 * 静默登录 - 使用wx.cloud获取openid并初始化/更新用户信息
 * @returns {Promise<{openid: string, userInfo: Object}>}
 */
async function silentLogin() {
  try {
    // 调用云函数获取openid和用户信息
    const result = await api.callCloudFunc('user-login', {
      action: 'silentLogin'
    })

    if (result.code === 0 && result.data) {
      const { openid, userInfo } = result.data

      // 更新全局数据
      store.setState('openid', openid)
      store.setState('userInfo', userInfo)
      store.setState('isVip', userInfo.is_vip || false)
      store.setState('pointsBalance', userInfo.points_balance || 0)

      return { openid, userInfo }
    }

    throw new Error(result.message || '登录失败')
  } catch (err) {
    console.error('[Auth] 静默登录失败:', err)
    throw err
  }
}

/**
 * 获取当前openid（优先从缓存获取）
 * @returns {Promise<string>}
 */
async function getOpenid() {
  // 先从Store缓存获取
  const cachedOpenid = store.getState('openid')
  if (cachedOpenid) {
    return cachedOpenid
  }

  // 缓存不存在则重新登录获取
  try {
    const loginResult = await silentLogin()
    return loginResult.openid
  } catch (err) {
    console.error('[Auth] 获取openid失败:', err)
    throw err
  }
}

/**
 * 检查VIP状态
 * @returns {Promise<{isVip: boolean, vipType: string, vipExpireAt: number}>}
 */
async function checkVip() {
  try {
    const result = await api.callCloudFunc('vip-checkVipStatus', {})
    if (result.code === 0 && result.data) {
      const vipInfo = result.data
      store.setState('isVip', vipInfo.is_vip)
      store.setState('userInfo', {
        ...store.getState('userInfo'),
        is_vip: vipInfo.is_vip,
        vip_type: vipInfo.vip_type,
        vip_expire_at: vipInfo.vip_expire_at
      })
      return vipInfo
    }
    throw new Error(result.message || 'VIP状态查询失败')
  } catch (err) {
    console.error('[Auth] 检查VIP状态失败:', err)
    throw err
  }
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
function isLoggedIn() {
  const openid = store.getState('openid')
  return !!openid
}

/**
 * 确保已登录，未登录则触发静默登录
 * @returns {Promise<string>} 返回openid
 */
async function ensureLoggedIn() {
  if (isLoggedIn()) {
    return store.getState('openid')
  }
  return getOpenid()
}

/**
 * 获取用户信息
 * @returns {Object|null}
 */
function getUserInfo() {
  return store.getState('userInfo')
}

/**
 * 获取积分余额
 * @returns {number}
 */
function getPointsBalance() {
  return store.getState('pointsBalance') || 0
}

/**
 * 更新积分余额到本地缓存
 * @param {number} newBalance
 */
function updatePointsBalance(newBalance) {
  store.setState('pointsBalance', newBalance)
  const userInfo = store.getState('userInfo')
  if (userInfo) {
    store.setState('userInfo', {
      ...userInfo,
      points_balance: newBalance
    })
  }
}

module.exports = {
  silentLogin,
  getOpenid,
  checkVip,
  isLoggedIn,
  ensureLoggedIn,
  getUserInfo,
  getPointsBalance,
  updatePointsBalance
}
