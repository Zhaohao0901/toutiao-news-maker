// components/base/category-nav/category-nav.js - 题材分类导航组件
const { CATEGORY_KEYS, CATEGORY_LIST } = require('../../utils/constants')

Component({
  properties: {
    /** 当前选中的分类 */
    activeCategory: {
      type: String,
      value: 'all'
    }
  },

  data: {
    categories: []
  },

  lifetimes: {
    attached() {
      // 构建分类列表
      const categories = CATEGORY_KEYS.map((key) => ({
        key: key,
        label: CATEGORY_LIST[key].label,
        icon: CATEGORY_LIST[key].icon
      }))
      
      this.setData({
        categories: categories
      })
    }
  },

  methods: {
    /**
     * 分类点击
     */
    onCategoryTap(e) {
      const category = e.currentTarget.dataset.category
      this.triggerEvent('change', { category: category })
    }
  }
})
