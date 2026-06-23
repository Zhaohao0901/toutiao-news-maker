// pages/pay/pay.js - 支付页面逻辑
const api = require('../../utils/api')
const store = require('../../utils/store')
const { VIP_PACKAGES, POINTS_PACKAGES } = require('../../utils/constants')

Page({
  data: {
    // 支付类型
    payType: 'points', // points, vip
    packageId: '',
    price: 0,

    // 套餐信息
    packageInfo: null,

    // 支付方式
    selectedMethod: 'wechat',

    // 支付状态
    isPaying: false,
    showResult: false,
    paySuccess: false,
    successDesc: '',
    failDesc: ''
  },

  onLoad(options) {
    console.log('[Pay] 页面加载, 参数:', options)
    
    const { type, packageId, price } = options

    this.setData({
      payType: type || 'points',
      packageId: packageId || '',
      price: price || 0
    })

    // 加载套餐信息
    this.loadPackageInfo()
  },

  /**
   * 加载套餐信息
   */
  loadPackageInfo() {
    const { payType, packageId } = this.data
    
    let packageInfo = null
    if (payType === 'points') {
      packageInfo = POINTS_PACKAGES.find((p) => p.id === packageId)
    } else if (payType === 'vip') {
      packageInfo = VIP_PACKAGES.find((p) => p.id === packageId)
    }

    if (packageInfo) {
      this.setData({
        packageInfo: packageInfo,
        price: packageInfo.price
      })
    }
  },

  /**
   * 选择支付方式
   */
  onMethodSelect(e) {
    const method = e.currentTarget.dataset.method
    this.setData({
      selectedMethod: method
    })
  },

  /**
   * 支付按钮点击
   */
  onPayTap() {
    if (this.data.isPaying) return

    const { payType, packageId, price, selectedMethod } = this.data

    if (selectedMethod !== 'wechat') {
      wx.showToast({
        title: '暂不支持该支付方式',
        icon: 'none'
      })
      return
    }

    this.setData({
      isPaying: true
    })

    // 构造与 pay-createOrder 云函数一致的入参格式：
    // { order_type: 'vip'|'points', order_detail: { vip_type | package_type } }
    const orderDetail = {}
    if (payType === 'vip') {
      orderDetail.vip_type = packageId
    } else {
      orderDetail.package_type = packageId
    }

    // 调用云函数创建订单并获取支付参数
    api.callCloudFunc('pay-createOrder', {
      order_type: payType,
      order_detail: orderDetail
    })
      .then((result) => {
        if (result.code === 0 && result.data) {
          const { orderId, paymentParams } = result.data
          
          // 调用微信支付
          this._requestWechatPayment(orderId, paymentParams)
        } else {
          throw new Error(result.message || '创建订单失败')
        }
      })
      .catch((err) => {
        console.error('[Pay] 创建订单失败:', err)
        this.setData({
          isPaying: false,
          showResult: true,
          paySuccess: false,
          failDesc: err.message || '支付失败，请重试'
        })
      })
  },

  /**
   * 请求微信支付
   */
  _requestWechatPayment(orderId, paymentParams) {
    wx.requestPayment({
      ...paymentParams,
      success: () => {
        // 支付成功，通知后端
        this._onPaymentSuccess(orderId)
      },
      fail: (err) => {
        console.error('[Pay] 微信支付失败:', err)
        this.setData({
          isPaying: false,
          showResult: true,
          paySuccess: false,
          failDesc: err.errMsg.includes('cancel') ? '支付已取消' : '支付失败，请重试'
        })
      }
    })
  },

  /**
   * 支付成功处理
   */
  _onPaymentSuccess(orderId) {
    api.callCloudFunc('pay-payCallback', {
      orderId: orderId,
      status: 'success'
    })
      .then((result) => {
        this.setData({
          isPaying: false,
          showResult: true,
          paySuccess: true,
          successDesc: this._getSuccessDesc()
        })

        // 更新本地状态
        this._updateLocalState()
      })
      .catch((err) => {
        console.error('[Pay] 支付回调失败:', err)
        // 即使回调失败，也视为支付成功（用户体验优先）
        this.setData({
          isPaying: false,
          showResult: true,
          paySuccess: true,
          successDesc: this._getSuccessDesc()
        })
        this._updateLocalState()
      })
  },

  /**
   * 获取成功提示
   */
  _getSuccessDesc() {
    const { payType, packageInfo } = this.data
    if (payType === 'points') {
      return `成功充值${packageInfo.points}积分，已到账`
    } else if (payType === 'vip') {
      return `成功开通${packageInfo.name}，${packageInfo.durationDays}天VIP已生效`
    }
    return '支付成功'
  },

  /**
   * 更新本地状态
   */
  _updateLocalState() {
    const { payType, packageInfo } = this.data

    if (payType === 'points') {
      // 更新积分余额
      const newBalance = (store.getState('pointsBalance') || 0) + packageInfo.points
      store.setState('pointsBalance', newBalance)
    } else if (payType === 'vip') {
      // 更新VIP状态
      const expireDate = new Date()
      expireDate.setDate(expireDate.getDate() + packageInfo.durationDays)
      
      store.setState('isVip', true)
      store.setState('vipExpireDate', expireDate.toISOString())
    }

    // 通知上一页刷新
    const pages = getCurrentPages()
    if (pages.length >= 2) {
      const prevPage = pages[pages.length - 2]
      if (prevPage.loadUserData) {
        prevPage.loadUserData()
      }
    }
  },

  /**
   * 结果确认按钮点击
   */
  onResultConfirm() {
    if (this.data.paySuccess) {
      // 支付成功，返回上一页
      wx.navigateBack()
    } else {
      // 支付失败，关闭结果弹窗，允许重新支付
      this.setData({
        showResult: false
      })
    }
  }
})
