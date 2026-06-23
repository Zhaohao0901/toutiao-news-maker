// cloudfunctions/vip-checkVipStatus/index.js
// 验证会员身份

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 查询用户信息
    const userQuery = await usersCollection.where({ openid }).get()

    if (!userQuery.data || userQuery.data.length === 0) {
      return { code: -1, data: null, message: '用户不存在' }
    }

    const user = userQuery.data[0]
    const isVip = user.is_vip || false
    const vipType = user.vip_type || ''
    const vipExpireAt = user.vip_expire_at || 0

    // 验证VIP是否有效（未过期）
    const now = Date.now()
    const vipActive = isVip && vipExpireAt > now

    // 如果VIP已过期但标记仍为true，需要更新状态
    if (isVip && vipExpireAt <= now && vipExpireAt > 0) {
      await usersCollection.doc(user._id).update({
        data: {
          is_vip: false,
          vip_type: '',
          updated_at: db.serverDate()
        }
      })
    }

    let daysLeft = 0
    if (vipActive) {
      daysLeft = Math.ceil((vipExpireAt - now) / (24 * 3600 * 1000))
    }

    return {
      code: 0,
      data: {
        is_vip: vipActive,
        vip_type: vipActive ? vipType : '',
        vip_expire_at: vipActive ? vipExpireAt : 0,
        days_left: daysLeft,
        points_balance: user.points_balance || 0
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[vip-checkVipStatus] 错误:', err)
    return { code: -1, data: null, message: '验证VIP身份失败: ' + err.message }
  }
}
