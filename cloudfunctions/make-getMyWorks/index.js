// cloudfunctions/make-getMyWorks/index.js
// 我的作品列表

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const worksCollection = db.collection('works')

const PAGE_SIZE = 10

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { page, pageSize } = event

  try {
    const currentPage = page || 1
    const currentPageSize = pageSize || PAGE_SIZE
    const skipCount = (currentPage - 1) * currentPageSize

    // 查询我的作品
    const whereCondition = { openid: openid }

    const countResult = await worksCollection.where(whereCondition).count()
    const total = countResult.total

    const result = await worksCollection
      .where(whereCondition)
      .orderBy('created_at', 'desc')
      .skip(skipCount)
      .limit(currentPageSize)
      .get()

    return {
      code: 0,
      data: {
        list: result.data || [],
        total: total,
        page: currentPage,
        pageSize: currentPageSize,
        hasMore: total > skipCount + currentPageSize
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[make-getMyWorks] 错误:', err)
    return { code: -1, data: null, message: '获取作品列表失败: ' + err.message }
  }
}
