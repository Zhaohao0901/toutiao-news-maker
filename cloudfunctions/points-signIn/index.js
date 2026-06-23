// cloudfunctions/points-signIn/index.js
// 每日签到（连续签到奖励计算）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const usersCollection = db.collection('users')
const pointsRecordsCollection = db.collection('points_records')

/** 签到奖励配置 */
const SIGN_REWARD_CONFIG = {
  BASE_POINTS: 3,
  CONSECUTIVE_BONUS: [
    { days: 3, bonus: 2 },
    { days: 7, bonus: 5 },
    { days: 15, bonus: 10 },
    { days: 30, bonus: 20 }
  ]
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    // 获取今天日期字符串（YYYY-MM-DD）
    const today = new Date()
    const todayStr = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0')

    // 查询用户
    const userQuery = await usersCollection.where({ openid }).get()

    if (!userQuery.data || userQuery.data.length === 0) {
      return { code: -1, data: null, message: '用户不存在' }
    }

    const user = userQuery.data[0]
    const userId = user._id

    // 检查今天是否已签到
    if (user.last_sign_date === todayStr) {
      return {
        code: -1,
        data: {
          alreadySigned: true,
          consecutiveDays: user.consecutive_sign_days || 0
        },
        message: '今天已经签到过了'
      }
    }

    // 计算连续签到天数
    const yesterday = new Date(today.getTime() - 24 * 3600 * 1000)
    const yesterdayStr = yesterday.getFullYear() + '-' +
      String(yesterday.getMonth() + 1).padStart(2, '0') + '-' +
      String(yesterday.getDate()).padStart(2, '0')

    let consecutiveDays = 1
    if (user.last_sign_date === yesterdayStr) {
      // 昨天签到了，连续天数+1
      consecutiveDays = (user.consecutive_sign_days || 0) + 1
    }
    // 如果昨天没签到，连续天数重置为1

    // 计算奖励积分
    let rewardPoints = SIGN_REWARD_CONFIG.BASE_POINTS
    let bonusPoints = 0
    let bonusReason = ''

    // 检查连续签到奖励
    for (let i = SIGN_REWARD_CONFIG.CONSECUTIVE_BONUS.length - 1; i >= 0; i--) {
      const bonusRule = SIGN_REWARD_CONFIG.CONSECUTIVE_BONUS[i]
      if (consecutiveDays >= bonusRule.days) {
        bonusPoints = bonusRule.bonus
        bonusReason = '连续签到' + bonusRule.days + '天奖励'
        break
      }
    }

    rewardPoints += bonusPoints

    // 更新用户数据
    const balanceBefore = user.points_balance || 0
    const balanceAfter = balanceBefore + rewardPoints

    await usersCollection.doc(userId).update({
      data: {
        points_balance: balanceAfter,
        consecutive_sign_days: consecutiveDays,
        last_sign_date: todayStr,
        updated_at: db.serverDate()
      }
    })

    // 记录积分流水（基础签到）
    await pointsRecordsCollection.add({
      data: {
        openid: openid,
        type: 'sign_in',
        amount: SIGN_REWARD_CONFIG.BASE_POINTS,
        balance_before: balanceBefore,
        balance_after: balanceAfter - bonusPoints,
        description: '每日签到奖励',
        created_at: db.serverDate()
      }
    })

    // 如果有连续签到奖励，额外记录
    if (bonusPoints > 0) {
      await pointsRecordsCollection.add({
        data: {
          openid: openid,
          type: 'sign_in_bonus',
          amount: bonusPoints,
          balance_before: balanceAfter - bonusPoints,
          balance_after: balanceAfter,
          description: bonusReason,
          created_at: db.serverDate()
        }
      })
    }

    return {
      code: 0,
      data: {
        // 前端期望字段名为 points（本次签到获得的总积分，含连续奖励）
        points: rewardPoints,
        basePoints: SIGN_REWARD_CONFIG.BASE_POINTS,
        bonusPoints: bonusPoints,
        bonusReason: bonusReason,
        consecutiveDays: consecutiveDays,
        balance_before: balanceBefore,
        balance_after: balanceAfter,
        alreadySigned: false
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[points-signIn] 错误:', err)
    return { code: -1, data: null, message: '签到失败: ' + err.message }
  }
}
