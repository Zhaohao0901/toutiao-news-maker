// utils/share.js - 分享工具模块
const { SHARE_REWARD, ROUTES, CATEGORY_LIST } = require('./constants')
const api = require('./api')
const auth = require('./auth')
const formatter = require('./formatter')

/**
 * 生成通用分享配置
 * @param {Object} options - 分享选项
 * @param {string} [options.title] - 分享标题，默认'新闻工坊 - 今日头条新闻制作神器'
 * @param {string} [options.path] - 分享路径，默认首页路径
 * @param {string} [options.imageUrl] - 分享封面图URL
 * @returns {Object} 微信分享配置对象
 */
function generateShareConfig(options) {
  options = options || {}
  return {
    title: options.title || '新闻工坊 - 今日头条新闻制作神器',
    path: options.path || ROUTES.HOME,
    imageUrl: options.imageUrl || '/assets/images/share-cover.png'
  }
}

/**
 * 生成作品分享配置
 * @param {Object} work - 作品数据
 * @param {string} work._id - 作品ID
 * @param {string} work.title - 作品标题
 * @param {string} work.category - 题材分类
 * @param {string} work.image_url - 作品图片URL
 * @returns {Object}
 */
function generateWorkShareConfig(work) {
  if (!work) return generateShareConfig()

  const categoryLabel = formatter.getCategoryLabel(work.category)
  const shareTitle = work.title
    ? '【' + categoryLabel + '】' + work.title + ' - 新闻工坊'
    : '新闻工坊 - 今日头条新闻制作神器'

  return {
    title: shareTitle,
    path: ROUTES.MAKE + '?workId=' + work._id,
    imageUrl: work.image_url || '/assets/images/share-cover.png'
  }
}

/**
 * 生成题材分享配置
 * @param {string} categoryKey - 题材键名
 * @returns {Object}
 */
function generateCategoryShareConfig(categoryKey) {
  const categoryInfo = CATEGORY_LIST[categoryKey]
  if (!categoryInfo) return generateShareConfig()

  return {
    title: '新闻工坊' + categoryInfo.label + '题材库 - 热门新闻模板',
    path: ROUTES.CATEGORY + '?category=' + categoryKey,
    imageUrl: '/assets/images/share-cover.png'
  }
}

/**
 * 记录分享行为并发放奖励积分
 * @returns {Promise<Object>} { rewarded: boolean, points: number, message: string }
 */
async function recordShareReward() {
  try {
    const isLoggedIn = auth.isLoggedIn()
    if (!isLoggedIn) {
      return { rewarded: false, points: 0, message: '请先登录' }
    }

    // 调用云函数记录分享并发放奖励
    const result = await api.callCloudFuncSilent('points-adReward', {
      type: 'share',
      points: SHARE_REWARD.POINTS
    })

    if (result.code === 0 && result.data) {
      const rewardedPoints = result.data.points || SHARE_REWARD.POINTS
      // 更新本地积分余额
      if (result.data.balance_after) {
        auth.updatePointsBalance(result.data.balance_after)
      }
      return {
        rewarded: true,
        points: rewardedPoints,
        message: '分享成功，获得' + rewardedPoints + '积分！'
      }
    }

    return {
      rewarded: false,
      points: 0,
      message: result.message || '分享奖励发放失败'
    }
  } catch (err) {
    console.error('[Share] 分享奖励记录失败:', err)
    return { rewarded: false, points: 0, message: '奖励发放异常' }
  }
}

/**
 * 处理分享成功回调
 * @param {Object} res - wx.onShareAppMessage的成功回调参数
 */
function handleShareSuccess(res) {
  console.log('[Share] 分享成功:', res)

  // 异步发放奖励，不阻塞UI
  recordShareReward().then((rewardResult) => {
    if (rewardResult.rewarded) {
      wx.showToast({
        title: rewardResult.message,
        icon: 'none',
        duration: 2000
      })
    }
  })
}

/**
 * 处理分享失败回调
 * @param {Object} res - 分享失败参数
 */
function handleShareFail(res) {
  console.warn('[Share] 分享失败或取消:', res)
}

module.exports = {
  generateShareConfig,
  generateWorkShareConfig,
  generateCategoryShareConfig,
  recordShareReward,
  handleShareSuccess,
  handleShareFail
}
