// cloudfunctions/make-consumePoints/index.js
// 积分扣除

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const usersCollection = db.collection('users')
const pointsRecordsCollection = db.collection('points_records')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { amount, type, description } = event

  try {
    // 参数校验
    const consumeAmount = amount || 2
    if (consumeAmount <= 0) {
      return { code: -1, data: null, message: '扣除积分数量必须大于0' }
    }

    const consumeType = type || 'make_normal'
    const consumeDescription = description || '制作新闻'

    // 查询用户
    const userQuery = await usersCollection.where({ openid }).get()

    if (!userQuery.data || userQuery.data.length === 0) {
      return { code: -1, data: null, message: '用户不存在' }
    }

    const user = userQuery.data[0]
    const userId = user._id

    // VIP用户免费
    if (user.is_vip) {
      return {
        code: 0,
        data: {
          consumed: 0,
          balance_before: user.points_balance,
          balance_after: user.points_balance,
          isVip: true,
          message: 'VIP会员免费使用'
        },
        message: 'ok'
      }
    }

    // 检查余额
    if (user.points_balance < consumeAmount) {
      return {
        code: -1,
        data: {
          balance_before: user.points_balance,
          required: consumeAmount,
          insufficient: true
        },
        message: '积分不足'
      }
    }

    const balanceBefore = user.points_balance
    const balanceAfter = balanceBefore - consumeAmount

    // 更新用户积分
    await usersCollection.doc(userId).update({
      data: {
        points_balance: balanceAfter,
        total_make_count: _.inc(1),
        updated_at: db.serverDate()
      }
    })

    // 记录积分流水
    await pointsRecordsCollection.add({
      data: {
        openid: openid,
        type: consumeType,
        amount: -consumeAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: consumeDescription,
        created_at: db.serverDate()
      }
    })

    return {
      code: 0,
      data: {
        consumed: consumeAmount,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        isVip: false,
        message: '积分扣除成功'
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[make-consumePoints] 错误:', err)
    return { code: -1, data: null, message: '积分扣除失败: ' + err.message }
  }
}
