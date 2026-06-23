// components/points-card/points-card.js - 积分余额展示卡片组件
const { SIGN_REWARD, POINTS_COST } = require('../../utils/constants')

Component({
  properties: {
    /** 积分余额 */
    pointsBalance: {
      type: Number,
      value: 0
    },
    /** 是否VIP */
    isVip: {
      type: Boolean,
      value: false
    },
    /** 是否显示进度条 */
    showProgress: {
      type: Boolean,
      value: false
    },
    /** 是否显示快捷操作 */
    showActions: {
      type: Boolean,
      value: true
    },
    /** 是否显示积分变动动画 */
    isAnimating: {
      type: Boolean,
      value: false
    }
  },

  data: {
    progressPercent: 0,
    progressText: ''
  },

  observers: {
    'pointsBalance': function (balance) {
      // 计算进度条（以100分为满值参考）
      const maxRef = 100
      const percent = Math.min(Math.floor((balance / maxRef) * 100), 100)
      const text = balance >= maxRef
        ? '积分充足'
        : '距离' + maxRef + '分还需' + (maxRef - balance) + '分'

      this.setData({
        progressPercent: percent,
        progressText: text
      })
    }
  },

  methods: {
    /** 签到点击 */
    onSignIn() {
      this.triggerEvent('signin')
    },

    /** 看广告点击 */
    onWatchAd() {
      this.triggerEvent('watchAd')
    },

    /** 购买积分点击 */
    onBuyPoints() {
      this.triggerEvent('buyPoints')
    }
  }
})
