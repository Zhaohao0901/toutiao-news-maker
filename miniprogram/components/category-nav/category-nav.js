// components/category-nav/category-nav.js - 题材分类导航组件
const { CATEGORY_KEYS, CATEGORY_LIST } = require('../../utils/constants')

Component({
  properties: {
    /** 当前选中的题材分类键名 */
    activeCategory: {
      type: String,
      value: 'all'
    }
  },

  data: {
    categories: [],
    scrollIntoId: 'nav-all'
  },

  lifetimes: {
    attached() {
      // 构建分类列表
      const categories = CATEGORY_KEYS.map((key) => CATEGORY_LIST[key])
      this.setData({ categories })
    }
  },

  observers: {
    'activeCategory': function (activeCategory) {
      // 滚动到选中项
      this.setData({
        scrollIntoId: 'nav-' + (activeCategory || 'all')
      })
    }
  },

  methods: {
    /** 分类项点击事件 */
    onCategoryTap(e) {
      const category = e.currentTarget.dataset.category
      this.triggerEvent('change', { category: category })
    }
  }
})
