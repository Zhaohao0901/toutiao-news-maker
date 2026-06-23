// cloudfunctions/points-buyPoints/index.js
// 购买积分（创建订单 + 调用云支付生成真实支付参数）
//
// 入参：{ packageId: 'points_30' | 'points_100' | 'points_300' | 'points_1000' }
// 返回：{ orderId, paymentParams, ... }  其中 paymentParams 可直接用于 wx.requestPayment

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

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { packageId } = event

  try {
    // 校验套餐ID
    if (!packageId || !POINTS_PACKAGES_CONFIG[packageId]) {
      return { code: -1, data: null, message: '无效的积分套餐' }
    }

    const packageInfo = POINTS_PACKAGES_CONFIG[packageId]
    const orderDescription = '购买积分-' + packageInfo.name + '(' + packageInfo.points + '分)'

    // 1. 创建订单记录
    const orderData = {
      openid: openid,
      type: 'points',
      package_id: packageId,
      points_amount: packageInfo.points,
      price_in_fen: packageInfo.priceInFen,
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
        points: packageInfo.points,
        priceInFen: packageInfo.priceInFen,
        name: packageInfo.name,
        paymentParams: paymentParams,
        status: 'paying'
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[points-buyPoints] 错误:', err)
    return { code: -1, data: null, message: '创建积分购买订单失败: ' + err.message }
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
    console.error('[points-buyPoints] 云支付下单失败:', err)
    throw new Error('生成支付参数失败: ' + err.message)
  }
}
