// cloudfunctions/vip-subscribeVip/index.js
// 会员开通（创建订单 + 调用云支付生成真实支付参数）
//
// 入参：{ packageId: 'vip_month' | 'vip_quarter' | 'vip_year' }
// 返回：{ orderId, paymentParams, ... }  其中 paymentParams 可直接用于 wx.requestPayment

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const usersCollection = db.collection('users')
const ordersCollection = db.collection('orders')

/** VIP套餐配置 */
const VIP_PACKAGES_CONFIG = {
  'vip_month': { name: '月卡', durationDays: 30, priceInFen: 1800 },
  'vip_quarter': { name: '季卡', durationDays: 90, priceInFen: 4200 },
  'vip_year': { name: '年卡', durationDays: 365, priceInFen: 12800 }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { packageId } = event

  try {
    // 校验套餐ID
    if (!packageId || !VIP_PACKAGES_CONFIG[packageId]) {
      return { code: -1, data: null, message: '无效的VIP套餐' }
    }

    const packageInfo = VIP_PACKAGES_CONFIG[packageId]

    // 查询用户当前VIP状态（用于续期计算）
    const userQuery = await usersCollection.where({ openid }).get()

    if (!userQuery.data || userQuery.data.length === 0) {
      return { code: -1, data: null, message: '用户不存在' }
    }

    const user = userQuery.data[0]

    // 计算VIP到期时间（从当前到期时间或现在开始续期）
    const now = Date.now()
    let baseTime = now
    if (user.is_vip && user.vip_expire_at && user.vip_expire_at > now) {
      // 当前VIP未过期，从当前到期时间续期
      baseTime = user.vip_expire_at
    }
    const vipExpireAt = baseTime + packageInfo.durationDays * 24 * 3600 * 1000

    const orderDescription = '开通VIP-' + packageInfo.name + '(' + packageInfo.durationDays + '天)'

    // 1. 创建订单记录
    const orderData = {
      openid: openid,
      type: 'vip',
      package_id: packageId,
      vip_duration_days: packageInfo.durationDays,
      price_in_fen: packageInfo.priceInFen,
      vip_expire_at: vipExpireAt,
      description: orderDescription,
      status: 'pending',
      created_at: db.serverDate(),
      updated_at: db.serverDate()
    }

    const addResult = await ordersCollection.add({ data: orderData })
    const orderId = addResult.id

    // 2. 调用云支付（CloudPay）统一下单，生成真实微信支付参数
    const paymentParams = await createPaymentParams(orderId, orderDescription, packageInfo.priceInFen)

    // 3. 更新订单状态为支付中
    await ordersCollection.doc(orderId).update({
      data: {
        status: 'paying',
        prepay_id: paymentParams.package || '',
        updated_at: db.serverDate()
      }
    })

    return {
      code: 0,
      data: {
        orderId: orderId,
        packageId: packageId,
        vipName: packageInfo.name,
        durationDays: packageInfo.durationDays,
        priceInFen: packageInfo.priceInFen,
        vipExpireAt: vipExpireAt,
        paymentParams: paymentParams,
        status: 'paying'
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[vip-subscribeVip] 错误:', err)
    return { code: -1, data: null, message: '开通VIP失败: ' + err.message }
  }
}

/**
 * 调用云开发云支付（CloudPay）生成微信支付参数
 * @param {string} orderId - 订单ID（同时作为商户订单号）
 * @param {string} description - 订单描述
 * @param {number} priceInFen - 金额（分）
 * @returns {Promise<Object>} 可直接传给 wx.requestPayment 的支付参数
 */
async function createPaymentParams(orderId, description, priceInFen) {
  try {
    const unifiedOrderRes = await cloud.cloudPay.unifiedOrder({
      body: description,
      outTradeNo: orderId,
      spbillCreateIp: '127.0.0.1',
      subMchId: process.env.SUB_MCH_ID || '',
      totalFee: priceInFen,
      envId: cloud.DYNAMIC_CURRENT_ENV,
      functionName: 'pay-payCallback'
    })

    const paymentData = unifiedOrderRes && unifiedOrderRes.payment

    if (!paymentData) {
      throw new Error('云支付未返回支付参数')
    }

    return {
      timeStamp: String(paymentData.timeStamp),
      nonceStr: paymentData.nonceStr,
      package: paymentData.package,
      signType: paymentData.signType || 'MD5',
      paySign: paymentData.paySign
    }
  } catch (err) {
    console.error('[vip-subscribeVip] 云支付下单失败:', err)
    throw new Error('生成支付参数失败: ' + err.message)
  }
}
