// pages/points/points.js - 积分中心逻辑
const api = require('../../utils/api')
const store = require('../../utils/store')
const { POINTS_PACKAGES, SIGN_REWARD } = require('../../utils/constants')

Page({
  data: {
    // 积分余额
    pointsBalance: 0,

    // 签到状态
    consecutiveDays: 0,
    signedToday: false,

    // 广告观看次数
    adWatchedToday: 0,

    // 积分套餐
    pointsPackages: POINTS_PACKAGES,

    // 积分明细
    pointsHistory: [],
    isLoadingHistory: false
  },

  onLoad() {
    console.log('[Points] 页面加载')
    this.loadUserData()
    this.loadPointsHistory()
  },

  onShow() {
    // 刷新用户数据
    this.loadUserData()
  },

  /**
   * 加载用户数据
   */
  loadUserData() {
    // 从Store读取
    const pointsBalance = store.getState('pointsBalance') || 0
    const lastSignInDate = store.getState('lastSignInDate') || ''
    const consecutiveDays = store.getState('consecutiveDays') || 0

    // 检查今天是否已签到
    const today = new Date().toISOString().split('T')[0]
    const signedToday = lastSignInDate === today

    this.setData({
      pointsBalance: pointsBalance,
      consecutiveDays: consecutiveDays,
      signedToday: signedToday
    })
  },

  /**
   * 加载积分明细
   */
  loadPointsHistory() {
    this.setData({
      isLoadingHistory: true
    })

    api.callCloudFunc('points-getPointsDetail', {
      page: 1,
      pageSize: 50
    })
      .then((result) => {
        if (result.code === 0 && result.data) {
          const history = (result.data.list || []).map((item) => ({
            id: item._id || item.id,
            typeLabel: this._formatType(item.type),
            timeLabel: this._formatTime(item.created_at),
            amount: item.amount
          }))

          this.setData({
            pointsHistory: history,
            isLoadingHistory: false
          })
        } else {
          throw new Error(result.message || '加载失败')
        }
      })
      .catch((err) => {
        console.error('[Points] 加载积分明细失败:', err)
        this.setData({
          isLoadingHistory: false
        })
      })
  },

  /**
   * 签到成功回调
   */
  onSignInSuccess(e) {
    const { points, consecutiveDays } = e.detail

    this.setData({
      pointsBalance: this.data.pointsBalance + points,
      consecutiveDays: consecutiveDays,
      signedToday: true
    })

    // 刷新积分明细
    this.loadPointsHistory()
  },

  /**
   * 广告奖励成功回调
   */
  onAdRewardSuccess(e) {
    const { points, watchedTimes } = e.detail

    this.setData({
      pointsBalance: this.data.pointsBalance + points,
      adWatchedToday: watchedTimes
    })

    // 刷新积分明细
    this.loadPointsHistory()
  },

  /**
   * 选择积分套餐
   */
  onPackageSelect(e) {
    const pkg = e.currentTarget.dataset.package
    
    // 跳转到支付页
    wx.navigateTo({
      url: `/pages/pay/pay?type=points&packageId=${pkg.id}&price=${pkg.price}`
    })
  },

  /**
   * 格式化类型
   */
  _formatType(type) {
    const typeMap = {
      'sign_in': '每日签到',
      'ad_reward': '广告奖励',
      'consume': '消费支出',
      'buy': '购买充值',
      'share_reward': '分享奖励'
    }
    return typeMap[type] || type
  },

  /**
   * 格式化时间
   */
  _formatTime(timestamp) {
    if (!timestamp) return ''
    
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date

    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return Math.floor(diff / 60000) + '分钟前'
    } else if (diff < 86400000) {
      return Math.floor(diff / 3600000) + '小时前'
    } else {
      return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    }
  }
})
