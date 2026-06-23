// pages/profile/profile.js - 个人中心逻辑
const api = require('../../utils/api')
const store = require('../../utils/store')

Page({
  data: {
    // 用户信息
    userInfo: null,
    userId: '',
    isVip: false,

    // 积分余额
    pointsBalance: 0,

    // 作品
    worksCount: 0,
    recentWorks: [],
    worksExpanded: false, // 作品列表是否展开（页面内展示，不再跳转独立作品页）

    // 收藏
    favorites: []
  },

  onLoad() {
    console.log('[Profile] 页面加载')
    this.loadUserInfo()
  },

  onShow() {
    // 每次显示刷新数据
    this.loadUserInfo()
    this.loadWorks()
    this.loadFavorites()
  },

  /**
   * 加载用户信息
   */
  loadUserInfo() {
    const userInfo = store.getState('userInfo') || null
    const isVip = store.getState('isVip') || false
    const pointsBalance = store.getState('pointsBalance') || 0

    this.setData({
      userInfo: userInfo,
      userId: userInfo ? (userInfo.openid || '') : '',
      isVip: isVip,
      pointsBalance: pointsBalance
    })
  },

  /**
   * 加载作品列表
   */
  loadWorks() {
    // 展开状态时加载更多条目，收起状态时仅加载预览条目
    const pageSize = this.data.worksExpanded ? 50 : 6
    api.callCloudFuncSilent('make-getMyWorks', {
      page: 1,
      pageSize: pageSize
    })
      .then((result) => {
        if (result.code === 0 && result.data) {
          this.setData({
            worksCount: result.data.total || 0,
            recentWorks: result.data.list || []
          })
        }
      })
      .catch((err) => {
        console.warn('[Profile] 加载作品失败:', err)
      })
  },

  /**
   * 加载收藏列表
   */
  loadFavorites() {
    api.callCloudFuncSilent('content-getFavorites', {
      page: 1,
      pageSize: 10
    })
      .then((result) => {
        if (result.code === 0 && result.data) {
          this.setData({
            favorites: result.data.list || []
          })
        }
      })
      .catch((err) => {
        console.warn('[Profile] 加载收藏失败:', err)
      })
  },

  /**
   * 编辑资料
   */
  onEditProfile() {
    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none'
    })
  },

  /**
   * 积分入口点击
   */
  onPointsTap() {
    wx.navigateTo({
      url: '/pages/points/points'
    })
  },

  /**
   * VIP入口点击
   */
  onVipTap() {
    wx.navigateTo({
      url: '/pages/vip/vip'
    })
  },

  /**
   * 作品入口点击 - 在当前页面内展开/收起作品列表，不再跳转独立作品页
   */
  onWorksTap() {
    const nextExpanded = !this.data.worksExpanded
    this.setData({
      worksExpanded: nextExpanded
    })
    // 切换展开状态后重新加载（调整分页大小）
    this.loadWorks()
  },

  /**
   * 作品点击 - 跳转到制作页重新编辑（基于作品内容）
   */
  onWorkTap(e) {
    const work = e.currentTarget.dataset.work
    if (!work) return
    // 携带作品信息跳转制作页继续编辑
    wx.navigateTo({
      url: '/pages/make/make'
    })
  },

  /**
   * 收藏点击
   */
  onFavoriteTap(e) {
    const item = e.detail.item
    // 跳转到制作页
    wx.navigateTo({
      url: `/pages/make/make?contentId=${item.id || item._id}`
    })
  },

  /**
   * 收藏查看全部
   */
  onFavoritesTap() {
    wx.showToast({
      title: '收藏列表开发中',
      icon: 'none'
    })
  },

  /**
   * 联系客服
   */
  onCustomerService() {
    // 小程序客服功能
    wx.showModal({
      title: '联系客服',
      content: '客服工作时间：9:00-18:00\n客服微信：xxxxx',
      showCancel: false
    })
  },

  /**
   * 隐私政策 - 使用弹窗展示，不再跳转 webview
   */
  onPrivacyTap() {
    wx.showModal({
      title: '隐私政策',
      content: '我们重视您的隐私。本小程序仅收集为提供服务所必需的信息（如昵称、头像等），不会未经授权向第三方共享或出售您的个人信息。详细信息请参考小程序内置隐私协议说明。',
      showCancel: true,
      confirmText: '我知道了',
      cancelText: '关闭',
      success: () => {}
    })
  },

  /**
   * 退出登录 - 清除本地状态后停留在个人中心页（重新触发登录流程）
   */
  onLogoutTap() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除Store
          store.reset()

          // 重新加载当前个人中心页面，触发未登录状态展示
          wx.reLaunch({
            url: '/pages/profile/profile'
          })
        }
      }
    })
  },

  /**
   * 注销账号
   */
  onDeleteAccount() {
    wx.showModal({
      title: '注销账号',
      content: '注销后所有数据将无法恢复，是否继续？',
      confirmColor: '#E8002D',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '注销功能开发中',
            icon: 'none'
          })
        }
      }
    })
  },

  /**
   * 分享设置
   */
  onShareAppMessage() {
    return {
      title: '新闻工坊 - 一键生成新闻图片',
      path: '/pages/home/home'
    }
  }
})
