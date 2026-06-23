// components/base/template-card/template-card.js - 模板卡片组件
Component({
  properties: {
    /** 模板数据对象 */
    template: {
      type: Object,
      value: {}
    },
    /** 是否选中 */
    selected: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    /**
     * 卡片点击
     */
    onCardTap() {
      this.triggerEvent('tap', { template: this.properties.template })
    }
  }
})
