// cloudfunctions/pay-payCallback/index.js
// 支付回调处理
//
// 微信支付回调（云支付 / 普通微信支付）返回的标准字段名为 `status`，
// 取值为 'SUCCESS' / 'FAIL' 等。本云函数统一使用该标准字段名进行判断。
// 同时为兼容历史调用与大小写差异，做了字段兜底处理。

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const usersCollection = db.collection('users')
const ordersCollection = db.collection('orders')
const pointsRecordsCollection = db.collection('points_records')

/** 积分套餐配置 */
const POINTS_PACKAGES_CONFIG = {
  'points_30': { points: 30 },
  'points_100': { points: 100 },
  'points_300': { points: 300 },
  'points_1000': { points: 1000 }
}

/** VIP套餐配置 */
const VIP_PACKAGES_CONFIG = {
  'vip_month': { name: '月卡', durationDays: 30 },
  'vip_quarter': { name: '季卡', durationDays: 90 },
  'vip_year': { name: '年卡', durationDays: 365 }
}

exports.main = async (event, context) => {
  // 兼容微信支付回调标准字段 `status`，并兜底 `payStatus`（历史字段）与 `returnCode`
  const { orderId, status, payStatus, returnCode } = event

  try {
    if (!orderId) {
      return { code: -1, data: null, message: '订单ID不能为空' }
    }

    // 查询订单
    let orderInfo
    try {
      const orderQuery = await ordersCollection.doc(orderId).get()
      orderInfo = orderQuery.data
    } catch (err) {
      return { code: -1, data: null, message: '订单不存在' }
    }

    // 确保订单未处理过
    if (orderInfo.status === 'paid' || orderInfo.status === 'completed') {
      return {
        code: 0,
        data: { orderId: orderId, status: orderInfo.status },
        message: '订单已处理'
      }
    }

    const openid = orderInfo.openid

    // 统一判断支付状态：优先使用微信支付标准字段 status，
    // 兼容 SUCCESS/FAIL 大小写，以及历史字段 payStatus、returnCode。
    const normalizedStatus = (status || payStatus || returnCode || '').toString().toUpperCase()
    const isPaymentSuccess = normalizedStatus === 'SUCCESS'

    // 根据支付状态处理
    if (isPaymentSuccess) {
      // 支付成功 - 更新订单状态
      await ordersCollection.doc(orderId).update({
        data: {
          status: 'paid',
          paid_at: db.serverDate(),
          updated_at: db.serverDate()
        }
      })

      // 根据订单类型发放权益
      if (orderInfo.type === 'points') {
        await handlePointsPurchase(openid, orderInfo)
      } else if (orderInfo.type === 'vip') {
        await handleVipPurchase(openid, orderInfo)
      }

      return {
        code: 0,
        data: {
          orderId: orderId,
          status: 'paid',
          type: orderInfo.type
        },
        message: '支付成功'
      }
    } else {
      // 支付失败 - 更新订单状态
      await ordersCollection.doc(orderId).update({
        data: {
          status: 'failed',
          updated_at: db.serverDate()
        }
      })

      return {
        code: 0,
        data: { orderId: orderId, status: 'failed' },
        message: '支付失败'
      }
    }
  } catch (err) {
    console.error('[pay-payCallback] 错误:', err)
    return { code: -1, data: null, message: '支付回调处理失败: ' + err.message }
  }
}

/**
 * 处理积分购买
 * @param {string} openid
 * @param {Object} orderInfo
 */
async function handlePointsPurchase(openid, orderInfo) {
  const packageId = orderInfo.package_id
  const packageConfig = POINTS_PACKAGES_CONFIG[packageId]

  if (!packageConfig) {
    console.error('[pay-payCallback] 未知积分套餐:', packageId)
    return
  }

  const pointsToAdd = packageConfig.points

  // 查询用户
  const userQuery = await usersCollection.where({ openid }).get()
  if (!userQuery.data || userQuery.data.length === 0) return

  const user = userQuery.data[0]
  const balanceBefore = user.points_balance || 0
  const balanceAfter = balanceBefore + pointsToAdd

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
      type: 'purchase',
      amount: pointsToAdd,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      description: '购买积分-' + packageId + '(' + pointsToAdd + '分)',
      order_id: orderInfo._id,
      created_at: db.serverDate()
    }
  })
}

/**
 * 处理VIP购买
 * @param {string} openid
 * @param {Object} orderInfo
 */
async function handleVipPurchase(openid, orderInfo) {
  const packageId = orderInfo.package_id
  const packageConfig = VIP_PACKAGES_CONFIG[packageId]

  if (!packageConfig) {
    console.error('[pay-payCallback] 未知VIP套餐:', packageId)
    return
  }

  const durationDays = orderInfo.vip_duration_days || packageConfig.durationDays

  // 查询用户
  const userQuery = await usersCollection.where({ openid }).get()
  if (!userQuery.data || userQuery.data.length === 0) return

  const user = userQuery.data[0]
  const now = Date.now()

  // 计算VIP到期时间（续期逻辑）
  let baseTime = now
  if (user.is_vip && user.vip_expire_at && user.vip_expire_at > now) {
    baseTime = user.vip_expire_at
  }
  const vipExpireAt = baseTime + durationDays * 24 * 3600 * 1000

  // 更新用户VIP状态
  await usersCollection.doc(user._id).update({
    data: {
      is_vip: true,
      vip_type: packageId,
      vip_expire_at: vipExpireAt,
      updated_at: db.serverDate()
    }
  })

  // 更新订单状态为完成
  await ordersCollection.doc(orderInfo._id).update({
    data: {
      status: 'completed',
      vip_expire_at: vipExpireAt,
      updated_at: db.serverDate()
    }
  })
}
