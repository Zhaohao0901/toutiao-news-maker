// components/business/step-progress/step-progress.js - 步骤进度条组件逻辑
Component({
  properties: {
    /** 当前步骤索引（从0开始） */
    currentStep: {
      type: Number,
      value: 0
    },
    /** 步骤名称数组 */
    steps: {
      type: Array,
      value: ['选模板', '编辑内容', '实时预览', '生成分享']
    }
  },

  data: {
    // 内部数据
  },

  methods: {
    /**
     * 步骤点击事件
     * 允许回退到已完成的步骤，不允许跳转到未完成的步骤
     */
    onStepTap(e) {
      const index = e.currentTarget.dataset.index
      const currentStep = this.properties.currentStep
      
      // 只允许点击已完成的步骤或当前步骤的前一步
      if (index <= currentStep) {
        this.triggerEvent('stepchange', { step: index })
      } else {
        wx.showToast({
          title: '请按顺序完成步骤',
          icon: 'none',
          duration: 1500
        })
      }
    }
  }
})
