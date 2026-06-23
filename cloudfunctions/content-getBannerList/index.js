// cloudfunctions/content-getBannerList/index.js
// Banner数据查询

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const bannerCollection = db.collection('banners')

exports.main = async (event, context) => {
  try {
    const result = await bannerCollection
      .where({
        status: 'active'
      })
      .orderBy('sort_weight', 'desc')
      .limit(5)
      .get()

    return {
      code: 0,
      data: {
        list: result.data || []
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[content-getBannerList] 错误:', err)
    return { code: -1, data: null, message: '获取Banner失败: ' + err.message }
  }
}
