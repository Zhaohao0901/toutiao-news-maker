// components/base/news-card/news-card.js - 新闻卡片组件逻辑
const { CATEGORY_LIST } = require('../../utils/constants')
const formatter = require('../../utils/formatter')

Component({
  properties: {
    /** 新闻数据对象 */
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
    'item': function(item) {
      if (!item) return
      
      this.setData({
        categoryLabel: CATEGORY_LIST[item.category] ? CATEGORY_LIST[item.category].label : '未知',
        viewCount: formatter.formatCount(item.view_count || item.viewCount || 0)
      })
    }
  },

  lifetimes: {
    attached() {
      // 初始化
      if (this.properties.item && this.properties.item.category) {
        this.setData({
          categoryLabel: CATEGORY_LIST[this.properties.item.category] 
            ? CATEGORY_LIST[this.properties.item.category].label 
            : '未知',
          viewCount: formatter.formatCount(this.properties.item.view_count || 0)
        })
      }
    }
  },

  methods: {
    /**
     * 卡片点击
     */
    onCardTap() {
      this.triggerEvent('tap', { item: this.properties.item })
    }
  }
})
