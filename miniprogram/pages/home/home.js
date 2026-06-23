// pages/home/home.js - 首页逻辑
const api = require('../../utils/api')
const store = require('../../utils/store')
const { CATEGORY_KEYS } = require('../../utils/constants')

Page({
  data: {
    // 搜索相关
    searchKeyword: '',
    isSearching: false,
    
    // Banner
    banners: [],
    
    // 分类
    activeCategory: 'all',
    
    // 新闻列表
    newsList: [],
    page: 1,
    pageSize: 10,
    isLoading: false,
    noMore: false,
    
    // 通知
    hasNewNotification: false
  },

  onLoad() {
    console.log('[Home] 页面加载')
    this.loadBanners()
    this.loadNewsList(true)
  },

  onShow() {
    // 检查通知
    this._checkNotification()
  },

  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.setData({
      page: 1,
      noMore: false,
      isSearching: false,
      searchKeyword: ''
    })
    this.loadBanners()
    this.loadNewsList(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  /**
   * 触底加载更多
   */
  onReachBottom() {
    if (!this.data.noMore && !this.data.isLoading) {
      this.loadMoreNews()
    }
  },

  /**
   * 加载Banner数据
   */
  loadBanners() {
    api.callCloudFuncSilent('content-getBannerList', {})
      .then((result) => {
        if (result.code === 0 && result.data) {
          this.setData({
            banners: result.data.list || []
          })
        }
      })
      .catch((err) => {
        console.warn('[Home] 加载Banner失败:', err)
      })
  },

  /**
   * 加载新闻列表
   * @param {boolean} refresh - 是否刷新（重置列表）
   */
  loadNewsList(refresh = false) {
    if (this.data.isLoading) return Promise.resolve()

    this.setData({
      isLoading: true
    })

    const params = {
      category: this.data.activeCategory === 'all' ? '' : this.data.activeCategory,
      page: refresh ? 1 : this.data.page,
      pageSize: this.data.pageSize
    }

    return api.callCloudFunc('content-getContentList', params)
      .then((result) => {
        if (result.code === 0 && result.data) {
          const newList = result.data.list || []
          const total = result.data.total || 0

          this.setData({
            newsList: refresh ? newList : this.data.newsList.concat(newList),
            page: params.page + 1,
            noMore: this.data.newsList.length + newList.length >= total,
            isLoading: false
          })
        } else {
          throw new Error(result.message || '加载失败')
        }
      })
      .catch((err) => {
        console.error('[Home] 加载新闻列表失败:', err)
        this.setData({
          isLoading: false
        })

        if (refresh) {
          wx.showToast({
            title: '加载失败',
            icon: 'none'
          })
        }
      })
  },

  /**
   * 加载更多新闻
   */
  loadMoreNews() {
    this.loadNewsList(false)
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

    this._doSearch(keyword)
  },

  /**
   * 清除搜索
   */
  onClearSearch() {
    this.setData({
      searchKeyword: '',
      isSearching: false
    })
    this.loadNewsList(true)
  },

  /**
   * 执行搜索
   */
  _doSearch(keyword) {
    this.setData({
      isLoading: true
    })

    api.callCloudFunc('content-searchContent', {
      keyword: keyword,
      page: this.data.page,
      pageSize: this.data.pageSize
    })
      .then((result) => {
        if (result.code === 0 && result.data) {
          const newList = result.data.list || []
          const total = result.data.total || 0

          this.setData({
            newsList: this.data.page === 1 ? newList : this.data.newsList.concat(newList),
            page: this.data.page + 1,
            noMore: this.data.newsList.length + newList.length >= total,
            isLoading: false
          })
        } else {
          throw new Error(result.message || '搜索失败')
        }
      })
      .catch((err) => {
        console.error('[Home] 搜索失败:', err)
        this.setData({
          isLoading: false
        })
        wx.showToast({
          title: err.message || '搜索失败',
          icon: 'none'
        })
      })
  },

  /**
   * 分类切换
   */
  onCategoryChange(e) {
    const category = e.detail.category
    this.setData({
      activeCategory: category,
      page: 1,
      noMore: false,
      isSearching: false,
      searchKeyword: ''
    })
    this.loadNewsList(true)
  },

  /**
   * 新闻卡片点击
   */
  onNewsCardTap(e) {
    const item = e.detail.item
    // 跳转到制作页，携带content_id
    wx.navigateTo({
      url: `/pages/make/make?contentId=${item.id || item._id}`
    })
  },

  /**
   * Banner点击
   */
  onBannerTap(e) {
    const url = e.currentTarget.dataset.url
    if (url) {
      // 可以跳转外部链接或内部页面
      console.log('[Home] Banner点击:', url)
    }
  },

  /**
   * 通知按钮点击
   */
  onNotificationTap() {
    wx.showToast({
      title: '通知功能开发中',
      icon: 'none'
    })
  },

  /**
   * 检查通知
   */
  _checkNotification() {
    // TODO: 调用云函数检查是否有新通知
    this.setData({
      hasNewNotification: false
    })
  }
})
