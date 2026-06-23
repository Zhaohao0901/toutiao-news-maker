// cloudfunctions/points-adReward/index.js
// 广告激励积分

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const usersCollection = db.collection('users')
const pointsRecordsCollection = db.collection('points_records')

/** 广告奖励配置 */
const AD_REWARD_CONFIG = {
  REWARD_POINTS: 2,
  MAX_PER_DAY: 5
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { type } = event

  try {
    // 获取今天日期
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
    const todayEnd = todayStart + 24 * 3600 * 1000

    // 查询用户
    const userQuery = await usersCollection.where({ openid }).get()

    if (!userQuery.data || userQuery.data.length === 0) {
      return { code: -1, data: null, message: '用户不存在' }
    }

    const user = userQuery.data[0]

    // 查询今日广告奖励次数
    const todayAdCount = await pointsRecordsCollection.where({
      openid: openid,
      type: _.in(['ad_reward', 'share']),
      created_at: _.gte(todayStart).and(_.lt(todayEnd))
    }).count()

    if (todayAdCount.total >= AD_REWARD_CONFIG.MAX_PER_DAY) {
      return {
        code: -1,
        data: {
          points: 0,
          watchedTimes: todayAdCount.total,
          maxPerDay: AD_REWARD_CONFIG.MAX_PER_DAY
        },
        message: '今日广告奖励已达上限（最多' + AD_REWARD_CONFIG.MAX_PER_DAY + '次）'
      }
    }

    // 发放奖励
    const rewardType = type || 'ad_reward'
    const rewardPoints = AD_REWARD_CONFIG.REWARD_POINTS
    const balanceBefore = user.points_balance || 0
    const balanceAfter = balanceBefore + rewardPoints

    // 更新用户积分
    await usersCollection.doc(user._id).update({
      data: {
        points_balance: balanceAfter,
        updated_at: db.serverDate()
      }
    })

    // 记录积分流水
    await pointsRecordsCollection.add({
      data: {
        openid: openid,
        type: rewardType,
        amount: rewardPoints,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        description: rewardType === 'share' ? '分享奖励' : '广告激励积分',
        created_at: db.serverDate()
      }
    })

    return {
      code: 0,
      data: {
        // 前端期望字段名为 points（本次奖励积分数）
        points: rewardPoints,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        // 前端期望字段名为 watchedTimes（今日已观看次数）
        watchedTimes: todayAdCount.total + 1,
        maxPerDay: AD_REWARD_CONFIG.MAX_PER_DAY,
        type: rewardType
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[points-adReward] 错误:', err)
    return { code: -1, data: null, message: '广告奖励发放失败: ' + err.message }
  }
}
