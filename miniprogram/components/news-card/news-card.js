// components/news-card/news-card.js - 左图右文新闻卡片组件
const formatter = require('../../utils/formatter')
const { CATEGORY_LIST } = require('../../utils/constants')

Component({
  properties: {
    /** 新闻内容数据对象 */
    item: {
      type: Object,
      value: {}
    },
    /** 默认封面图 */
    defaultCover: {
      type: String,
      value: '/assets/images/default-cover.png'
    }
  },

  data: {
    categoryLabel: '',
    viewCount: '0'
  },

  observers: {
    'item': function (item) {
      if (!item) return
      this.setData({
        categoryLabel: formatter.getCategoryLabel(item.category),
        viewCount: formatter.formatCount(item.view_count)
      })
    }
  },

  methods: {
    /** 卡片点击事件 */
    onCardTap() {
      this.triggerEvent('tap', { item: this.properties.item })
    }
  }
})
