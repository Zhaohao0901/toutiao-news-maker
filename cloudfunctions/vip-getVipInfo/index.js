// cloudfunctions/vip-getVipInfo/index.js
// 会员信息+权益

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

    // 检查VIP是否过期
    const now = Date.now()
    let vipActive = isVip && vipExpireAt > now
    let daysLeft = 0

    if (vipActive) {
      daysLeft = Math.ceil((vipExpireAt - now) / (24 * 3600 * 1000))
    }

    // VIP权益列表
    const benefits = [
      { icon: '🎯', title: '模板免费', description: '所有模板无限免费使用' },
      { icon: '✨', title: 'AI改写免费', description: 'AI智能改写功能免费使用' },
      { icon: '🏷', title: '去除水印', description: '生成图片去除VIP水印' },
      { icon: '📦', title: '更多素材', description: '独家VIP素材库权限' },
      { icon: '⚡', title: '优先体验', description: '新功能优先体验资格' }
    ]

    // VIP套餐列表
    const packages = [
      {
        id: 'vip_month',
        name: '月卡',
        durationDays: 30,
        priceInFen: 1800,
        priceYuan: '¥18',
        originalPrice: '¥30',
        discount: '6折',
        description: '30天畅享所有模板',
        isRecommended: false
      },
      {
        id: 'vip_quarter',
        name: '季卡',
        durationDays: 90,
        priceInFen: 4200,
        priceYuan: '¥42',
        originalPrice: '¥90',
        discount: '4.7折',
        description: '90天畅享所有模板',
        isRecommended: true
      },
      {
        id: 'vip_year',
        name: '年卡',
        durationDays: 365,
        priceInFen: 12800,
        priceYuan: '¥128',
        originalPrice: '¥360',
        discount: '3.5折',
        description: '365天畅享所有模板',
        isRecommended: false
      }
    ]

    return {
      code: 0,
      data: {
        isVip: vipActive,
        vipType: vipType,
        vipExpireAt: vipExpireAt,
        daysLeft: daysLeft,
        benefits: benefits,
        packages: packages,
        pointsBalance: user.points_balance || 0
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[vip-getVipInfo] 错误:', err)
    return { code: -1, data: null, message: '获取VIP信息失败: ' + err.message }
  }
}
