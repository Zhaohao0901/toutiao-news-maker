// components/base/empty-state/empty-state.js - 空状态组件逻辑
Component({
  properties: {
    /** 空状态类型：news, search, template, points, works, favorite */
    type: {
      type: String,
      value: 'news'
    },
    /** 提示文字 */
    tip: {
      type: String,
      value: ''
    },
    /** 是否显示操作按钮 */
    showAction: {
      type: Boolean,
      value: false
    },
    /** 操作按钮文字 */
    actionText: {
      type: String,
      value: '去看看'
    }
  },

  methods: {
    /**
     * 操作按钮点击
     */
    onActionTap() {
      this.triggerEvent('action')
    }
  }
})
