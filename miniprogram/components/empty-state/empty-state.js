// components/empty-state/empty-state.js - 空状态占位组件

Component({
  properties: {
    /** 空状态图标emoji */
    iconEmoji: {
      type: String,
      value: '📭'
    },
    /** 空状态图标图片 */
    iconImage: {
      type: String,
      value: ''
    },
    /** 空状态标题文字 */
    title: {
      type: String,
      value: '暂无数据'
    },
    /** 空状态描述文字 */
    description: {
      type: String,
      value: ''
    },
    /** 操作按钮文字 */
    actionText: {
      type: String,
      value: ''
    },
    /** 操作按钮类型 */
    actionType: {
      type: String,
      value: 'primary'
    }
  },

  data: {},

  methods: {
    /** 操作按钮点击 */
    onActionTap() {
      this.triggerEvent('action')
    }
  }
})
