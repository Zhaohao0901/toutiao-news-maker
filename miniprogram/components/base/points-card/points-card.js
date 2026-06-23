// components/base/points-card/points-card.js - 积分余额卡片组件
const store = require('../../utils/store')

Component({
  properties: {
    /** 积分数值 */
    points: {
      type: Number,
      value: 0
    },
    /** 是否显示VIP角标 */
    showVipBadge: {
      type: Boolean,
      value: false
    }
  },

  data: {
    isVip: false
  },

  lifetimes: {
    attached() {
      // 从Store读取VIP状态
      const isVip = store.getState('isVip') || false
      this.setData({
        isVip: isVip
      })
    }
  },

  observers: {
    'showVipBadge': function(show) {
      if (show) {
        const isVip = store.getState('isVip') || false
        this.setData({
          isVip: isVip
        })
      }
    }
  },

  methods: {
    /**
     * 签到按钮点击
     */
    onSignIn() {
      this.triggerEvent('signin')
    },

    /**
     * 充值按钮点击
     */
    onRecharge() {
      this.triggerEvent('recharge')
    }
  }
})
