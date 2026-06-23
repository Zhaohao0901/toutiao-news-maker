// pages/vip/vip.js - 会员中心逻辑
const api = require('../../utils/api')
const store = require('../../utils/store')
const { VIP_PACKAGES, VIP_BENEFITS } = require('../../utils/constants')

Page({
  data: {
    // VIP状态
    isVip: false,
    vipExpireDate: '',
    vipRemainingDays: 0,

    // VIP权益
    vipBenefits: VIP_BENEFITS,

    // 套餐列表
    vipPackages: VIP_PACKAGES,
    selectedPackageId: ''
  },

  onLoad() {
    console.log('[VIP] 页面加载')
    this.checkVipStatus()
  },

  onShow() {
    // 刷新VIP状态
    this.checkVipStatus()
  },

  /**
   * 检查VIP状态
   */
  checkVipStatus() {
    // 从Store读取
    const isVip = store.getState('isVip') || false
    const vipExpireDate = store.getState('vipExpireDate') || ''

    let vipRemainingDays = 0
    if (isVip && vipExpireDate) {
      const expire = new Date(vipExpireDate)
      const now = new Date()
      vipRemainingDays = Math.ceil((expire - now) / (1000 * 60 * 60 * 24))
    }

    this.setData({
      isVip: isVip,
      vipExpireDate: vipExpireDate ? vipExpireDate.split('T')[0] : '',
      vipRemainingDays: Math.max(0, vipRemainingDays)
    })
  },

  /**
   * 选择套餐
   */
  onPackageSelect(e) {
    const pkg = e.currentTarget.dataset.package
    this.setData({
      selectedPackageId: pkg.id
    })
  },

  /**
   * 开通/续费按钮点击
   */
  onVipAction() {
    if (!this.data.selectedPackageId) {
      wx.showToast({
        title: '请选择套餐',
        icon: 'none'
      })
      return
    }

    const pkg = this.data.vipPackages.find((p) => p.id === this.data.selectedPackageId)
    if (!pkg) {
      wx.showToast({
        title: '套餐信息错误',
        icon: 'none'
      })
      return
    }

    // 跳转到支付页
    wx.navigateTo({
      url: `/pages/pay/pay?type=vip&packageId=${pkg.id}&price=${pkg.price}`
    })
  },

  /**
   * 分享设置
   */
  onShareAppMessage() {
    return {
      title: '新闻工坊VIP会员 - 畅享所有模板',
      path: '/pages/vip/vip'
    }
  }
})
