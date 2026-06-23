// components/template-card/template-card.js - 模板预览卡片组件
const formatter = require('../../utils/formatter')
const { POINTS_COST } = require('../../utils/constants')

Component({
  properties: {
    /** 模板数据对象 */
    template: {
      type: Object,
      value: {}
    },
    /** 默认封面图 */
    defaultCover: {
      type: String,
      value: '/assets/images/template-default.png'
    }
  },

  data: {
    categoryLabel: '',
    useCount: '0',
    costText: '2积分'
  },

  observers: {
    'template': function (template) {
      if (!template) return
      this.setData({
        categoryLabel: formatter.getCategoryLabel(template.category),
        useCount: formatter.formatCount(template.use_count),
        costText: template.is_vip ? 'VIP免费' : (POINTS_COST.NORMAL_TEMPLATE + '积分')
      })
    }
  },

  methods: {
    /** 卡片点击事件 */
    onCardTap() {
      this.triggerEvent('tap', { template: this.properties.template })
    }
  }
})
