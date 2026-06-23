// pages/category/category.js - 题材库逻辑
const api = require('../../utils/api')
const { CATEGORY_KEYS, CATEGORY_LIST } = require('../../utils/constants')

Page({
  data: {
    // 分类列表
    categories: [],
    activeCategory: CATEGORY_KEYS[0] || 'sports',
    scrollIntoId: '',

    // 顶部Tab
    activeTab: 'featured', // featured, hot, latest

    // 搜索
    searchKeyword: '',
    isSearching: false,

    // 内容列表
    contentList: [],
    page: 1,
    pageSize: 10,
    isLoading: false,
    noMore: false
  },

  onLoad() {
    console.log('[Category] 页面加载')
    
    // 构建分类列表
    const categories = CATEGORY_KEYS.map((key) => CATEGORY_LIST[key])
    this.setData({
      categories: categories,
      scrollIntoId: 'nav-' + this.data.activeCategory
    })

    this.loadContentList(true)
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({
      page: 1,
      noMore: false
    })
    this.loadContentList(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 加载内容列表
   * @param {boolean} refresh - 是否刷新
   */
  loadContentList(refresh = false) {
    if (this.data.isLoading) return Promise.resolve()

    this.setData({
      isLoading: true
    })

    const params = {
      category: this.data.activeCategory,
      tab: this.data.activeTab,
      page: refresh ? 1 : this.data.page,
      pageSize: this.data.pageSize
    }

    // 如果是搜索模式，使用搜索接口
    const apiName = this.data.isSearching ? 'content-searchContent' : 'content-getContentList'
    if (this.data.isSearching) {
      params.keyword = this.data.searchKeyword
    }

    return api.callCloudFunc(apiName, params)
      .then((result) => {
        if (result.code === 0 && result.data) {
          const newList = result.data.list || []
          const total = result.data.total || 0

          this.setData({
            contentList: refresh ? newList : this.data.contentList.concat(newList),
            page: params.page + 1,
            noMore: this.data.contentList.length + newList.length >= total,
            isLoading: false
          })
        } else {
          throw new Error(result.message || '加载失败')
        }
      })
      .catch((err) => {
        console.error('[Category] 加载内容失败:', err)
        this.setData({
          isLoading: false
        })
      })
  },

  /**
   * 左侧分类点击
   */
  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      activeCategory: category,
      scrollIntoId: 'nav-' + category,
      page: 1,
      noMore: false,
      isSearching: false,
      searchKeyword: ''
    })
    this.loadContentList(true)
  },

  /**
   * 顶部Tab切换
   */
  onTabChange(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({
      activeTab: tab,
      page: 1,
      noMore: false
    })
    this.loadContentList(true)
  },

  /**
   * 搜索输入
   */
  onSearchInput(e) {
    this.setData({
      searchKeyword: e.detail.value
    })
  },

  /**
   * 搜索确认
   */
  onSearchConfirm() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      })
      return
    }

    this.setData({
      isSearching: true,
      page: 1,
      noMore: false
    })
    this.loadContentList(true)
  },

  /**
   * 清除搜索
   */
  onClearSearch() {
    this.setData({
      searchKeyword: '',
      isSearching: false
    })
    this.loadContentList(true)
  },

  /**
   * 触底加载更多
   */
  onScrollToLower() {
    if (!this.data.noMore && !this.data.isLoading) {
      this.loadContentList(false)
    }
  },

  /**
   * 内容卡片点击
   */
  onContentCardTap(e) {
    const item = e.detail.item
    // 跳转到制作页
    wx.navigateTo({
      url: `/pages/make/make?contentId=${item.id || item._id}`
    })
  }
})
