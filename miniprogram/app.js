// app.js - 小程序入口文件
const store = require('./utils/store')
const auth = require('./utils/auth')

App({
  /** 全局数据 */
  globalData: {
    openid: '',
    userInfo: null,
    systemInfo: null
  },

  /** 小程序启动时执行 */
  onLaunch() {
    // 获取系统信息
    this.globalData.systemInfo = wx.getSystemInfoSync()

    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'toutiao-news-maker-env',
        traceUser: true
      })
      console.log('[App] 云开发初始化成功')
    } else {
      console.warn('[App] 请使用 2.25.3 或以上版本的微信客户端以使用云开发')
    }

    // 初始化全局状态管理
    store.init()

    // 自动静默登录
    this.autoLogin()
  },

  onShow() {
    console.log('[App] App onShow')
  },

  onHide() {
    console.log('[App] App onHide')
  },

  /** 自动静默登录 */
  async autoLogin() {
    try {
      const loginResult = await auth.silentLogin()
      if (loginResult && loginResult.openid) {
        this.globalData.openid = loginResult.openid
        this.globalData.userInfo = loginResult.userInfo
        store.setState('openid', loginResult.openid)
        store.setState('userInfo', loginResult.userInfo)
        store.setState('isVip', loginResult.userInfo.is_vip || false)
        store.setState('pointsBalance', loginResult.userInfo.points_balance || 0)
        console.log('[App] 自动登录成功, openid:', loginResult.openid)
      }
    } catch (err) {
      console.error('[App] 自动登录失败:', err)
    }
  }
})
