// cloudfunctions/user-login/index.js
// 微信登录 + 用户初始化

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const usersCollection = db.collection('users')

/**
 * 云函数入口 - 用户登录
 * @param {Object} event - 云函数调用参数
 * @param {string} event.action - 操作类型：silentLogin
 * @returns {Object} { code, data, message }
 */
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    switch (event.action) {
      case 'silentLogin':
        return await handleSilentLogin(openid)
      default:
        return { code: -1, data: null, message: '未知操作类型: ' + event.action }
    }
  } catch (err) {
    console.error('[user-login] 错误:', err)
    return { code: -1, data: null, message: '登录失败: ' + err.message }
  }
}

/**
 * 静默登录处理 - 查找或创建用户记录
 * @param {string} openid - 用户唯一标识
 * @returns {Object}
 */
async function handleSilentLogin(openid) {
  // 查询是否已有用户记录
  const userQuery = await usersCollection.where({ openid }).get()

  if (userQuery.data && userQuery.data.length > 0) {
    // 已有用户记录 - 更新最后登录时间
    const existingUser = userQuery.data[0]
    const userId = existingUser._id

    await usersCollection.doc(userId).update({
      data: {
        last_login_at: db.serverDate(),
        login_count: existingUser.login_count + 1
      }
    })

    // 返回用户信息
    const userInfo = {
      openid: openid,
      nickname: existingUser.nickname || '新闻工坊用户',
      avatar_url: existingUser.avatar_url || '',
      points_balance: existingUser.points_balance || 0,
      is_vip: existingUser.is_vip || false,
      vip_type: existingUser.vip_type || '',
      vip_expire_at: existingUser.vip_expire_at || 0,
      consecutive_sign_days: existingUser.consecutive_sign_days || 0,
      last_sign_date: existingUser.last_sign_date || '',
      total_make_count: existingUser.total_make_count || 0,
      created_at: existingUser.created_at
    }

    return {
      code: 0,
      data: { openid, userInfo },
      message: 'ok'
    }
  }

  // 新用户 - 初始化用户记录
  const newUserData = {
    openid: openid,
    nickname: '新闻工坊用户',
    avatar_url: '',
    points_balance: 10,           // 新用户赠送10积分
    is_vip: false,
    vip_type: '',
    vip_expire_at: 0,
    consecutive_sign_days: 0,
    last_sign_date: '',
    total_make_count: 0,
    login_count: 1,
    last_login_at: db.serverDate(),
    created_at: db.serverDate(),
    updated_at: db.serverDate()
  }

  const addResult = await usersCollection.add({ data: newUserData })

  const userInfo = {
    openid: openid,
    nickname: newUserData.nickname,
    avatar_url: newUserData.avatar_url,
    points_balance: newUserData.points_balance,
    is_vip: newUserData.is_vip,
    vip_type: newUserData.vip_type,
    vip_expire_at: newUserData.vip_expire_at,
    consecutive_sign_days: newUserData.consecutive_sign_days,
    last_sign_date: newUserData.last_sign_date,
    total_make_count: newUserData.total_make_count,
    created_at: newUserData.created_at
  }

  return {
    code: 0,
    data: { openid, userInfo },
    message: 'ok'
  }
}
