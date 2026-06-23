// cloudfunctions/make-checkPoints/index.js
// 积分余额检查

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { requiredPoints, isVipTemplate } = event

  try {
    // 查询用户信息
    const userQuery = await usersCollection.where({ openid }).get()

    if (!userQuery.data || userQuery.data.length === 0) {
      return { code: -1, data: null, message: '用户不存在' }
    }

    const user = userQuery.data[0]
    const isVip = user.is_vip || false
    const pointsBalance = user.points_balance || 0
    const required = requiredPoints || 2

    // VIP用户免费
    if (isVip) {
      return {
        code: 0,
        data: {
          sufficient: true,
          pointsBalance: pointsBalance,
          requiredPoints: 0,
          isVip: true,
          message: 'VIP会员免费使用'
        },
        message: 'ok'
      }
    }

    // VIP模板需要VIP身份
    if (isVipTemplate) {
      return {
        code: 0,
        data: {
          sufficient: false,
          pointsBalance: pointsBalance,
          requiredPoints: required,
          isVip: false,
          needVip: true,
          message: '此模板需要VIP会员'
        },
        message: 'ok'
      }
    }

    // 检查积分余额
    const sufficient = pointsBalance >= required

    return {
      code: 0,
      data: {
        sufficient: sufficient,
        pointsBalance: pointsBalance,
        requiredPoints: required,
        isVip: false,
        needVip: false,
        message: sufficient ? '积分充足' : '积分不足，需要' + required + '分'
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[make-checkPoints] 错误:', err)
    return { code: -1, data: null, message: '积分检查失败: ' + err.message }
  }
}
