// cloudfunctions/pay-createOrder/index.js
// 统一创建支付订单（生成微信支付参数）
//
// 入参格式（与前端调用方式一致）：
//   {
//     order_type: 'vip' | 'points',          // 订单类型
//     order_detail: {                          // 订单详情
//       // vip 类型时提供：
//       vip_type?: 'vip_month' | 'vip_quarter' | 'vip_year',
//       // points 类型时提供：
//       package_type?: 'points_30' | 'points_100' | 'points_300' | 'points_1000'
//     }
//   }
//
// 返回值中包含可直接传给 wx.requestPayment 的支付参数 paymentParams。

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const ordersCollection = db.collection('orders')

/** 积分套餐配置 */
const POINTS_PACKAGES_CONFIG = {
  'points_30': { points: 30, priceInFen: 300, name: '体验包' },
  'points_100': { points: 100, priceInFen: 800, name: '标准包' },
  'points_300': { points: 300, priceInFen: 1800, name: '超值包' },
  'points_1000': { points: 1000, priceInFen: 4800, name: '专业包' }
}

/** VIP套餐配置 */
const VIP_PACKAGES_CONFIG = {
  'vip_month': { name: '月卡', durationDays: 30, priceInFen: 1800 },
  'vip_quarter': { name: '季卡', durationDays: 90, priceInFen: 4200 },
  'vip_year': { name: '年卡', durationDays: 365, priceInFen: 12800 }
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  try {
    const { order_type, order_detail } = event

    // ===== 1. 参数校验 =====
    if (!order_type || (order_type !== 'vip' && order_type !== 'points')) {
      return { code: -1, data: null, message: '订单类型 order_type 不合法，应为 vip 或 points' }
    }

    if (!order_detail || typeof order_detail !== 'object') {
      return { code: -1, data: null, message: '订单详情 order_detail 不能为空' }
    }

    // 解析套餐信息
    let packageId = ''
    let packageInfo = null
    let orderDescription = ''

    if (order_type === 'vip') {
      packageId = order_detail.vip_type
      if (!packageId || !VIP_PACKAGES_CONFIG[packageId]) {
        return { code: -1, data: null, message: '无效的VIP套餐 vip_type' }
      }
      packageInfo = VIP_PACKAGES_CONFIG[packageId]
      orderDescription = '开通VIP-' + packageInfo.name + '(' + packageInfo.durationDays + '天)'
    } else {
      // order_type === 'points'
      packageId = order_detail.package_type
      if (!packageId || !POINTS_PACKAGES_CONFIG[packageId]) {
        return { code: -1, data: null, message: '无效的积分套餐 package_type' }
      }
      packageInfo = POINTS_PACKAGES_CONFIG[packageId]
      orderDescription = '购买积分-' + packageInfo.name + '(' + packageInfo.points + '分)'
    }

    const priceInFen = packageInfo.priceInFen

    if (!priceInFen || priceInFen <= 0) {
      return { code: -1, data: null, message: '支付金额无效' }
    }

    // ===== 2. 创建订单记录 =====
    const orderData = {
      openid: openid,
      type: order_type, // 'vip' | 'points'
      package_id: packageId,
      price_in_fen: priceInFen,
      description: orderDescription,
      status: 'pending',
      // 积分订单附带积分数量
      points_amount: order_type === 'points' ? packageInfo.points : 0,
      // VIP订单附带时长
      vip_duration_days: order_type === 'vip' ? packageInfo.durationDays : 0,
      created_at: db.serverDate(),
      updated_at: db.serverDate()
    }

    const addResult = await ordersCollection.add({ data: orderData })
    const orderId = addResult.id

    // ===== 3. 生成微信支付参数（云支付） =====
    const paymentParams = await createPaymentParams(orderId, orderDescription, priceInFen)

    // 更新订单状态为支付中
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
        orderType: order_type,
        packageId: packageId,
        paymentParams: paymentParams,
        priceInFen: priceInFen,
        description: orderDescription
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[pay-createOrder] 错误:', err)
    return { code: -1, data: null, message: '创建支付订单失败: ' + err.message }
  }
}

/**
 * 调用云开发云支付（CloudPay）生成微信支付参数
 *
 * 云开发环境下使用 cloud.cloudPay.unifiedOrder 或 cloud.cloudPay.requestPayment
 * 生成可用于 wx.requestPayment 的支付参数。
 *
 * @param {string} orderId - 订单ID（同时作为商户订单号）
 * @param {string} description - 订单描述
 * @param {number} priceInFen - 金额（分）
 * @returns {Promise<Object>} 可直接传给 wx.requestPayment 的支付参数
 */
async function createPaymentParams(orderId, description, priceInFen) {
  try {
    // 构造云支付统一下单请求体
    const unifiedOrderRes = await cloud.cloudPay.unifiedOrder({
      body: description,
      outTradeNo: orderId,
      spbillCreateIp: '127.0.0.1',
      subMchId: process.env.SUB_MCH_ID || '', // 子商户号，可在云开发环境变量中配置
      totalFee: priceInFen,
      envId: cloud.DYNAMIC_CURRENT_ENV,
      functionName: 'pay-payCallback' // 支付完成后回调的云函数
    })

    const paymentData = unifiedOrderRes && unifiedOrderRes.payment

    if (!paymentData) {
      throw new Error('云支付未返回支付参数')
    }

    // 返回可直接用于 wx.requestPayment 的参数
    return {
      timeStamp: String(paymentData.timeStamp),
      nonceStr: paymentData.nonceStr,
      package: paymentData.package, // 形如 'prepay_id=wx...'
      signType: paymentData.signType || 'MD5',
      paySign: paymentData.paySign
    }
  } catch (err) {
    console.error('[pay-createOrder] 云支付下单失败:', err)
    throw new Error('生成支付参数失败: ' + err.message)
  }
}
