// components/business/pay-dialog/pay-dialog.js - 支付确认弹窗逻辑
Component({
  properties: {
    /** 是否显示弹窗 */
    visible: {
      type: Boolean,
      value: false
    },
    /** 弹窗标题 */
    title: {
      type: String,
      value: '确认支付'
    },
    /** 积分消耗数量 */
    pointsCost: {
      type: Number,
      value: 0
    },
    /** 积分余额 */
    pointsBalance: {
      type: Number,
      value: 0
    }
  },

  data: {
    // 内部数据
  },

  methods: {
    /**
     * 点击蒙层
     */
    onMaskTap() {
      // 点击蒙层关闭弹窗
      this.onCancel()
    },

    /**
     * 阻止事件冒泡
     */
    preventBubble() {
      // 阻止点击事件冒泡到蒙层
    },

    /**
     * 取消按钮点击
     */
    onCancel() {
      this.triggerEvent('cancel')
    },

    /**
     * 确认按钮点击
     */
    onConfirm() {
      const { pointsCost, pointsBalance } = this.properties

      // 检查余额是否充足
      if (pointsBalance < pointsCost) {
        wx.showToast({
          title: '积分余额不足',
          icon: 'none'
        })
        return
      }

      this.triggerEvent('confirm', {
        pointsCost: pointsCost
      })
    }
  }
})
