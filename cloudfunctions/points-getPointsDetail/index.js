// cloudfunctions/points-getPointsDetail/index.js
// 积分流水明细

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const pointsRecordsCollection = db.collection('points_records')

const PAGE_SIZE = 20

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { page, pageSize, type } = event

  try {
    const currentPage = page || 1
    const currentPageSize = pageSize || PAGE_SIZE
    const skipCount = (currentPage - 1) * currentPageSize

    // 构建查询条件
    const whereCondition = { openid: openid }

    if (type) {
      whereCondition.type = type
    }

    // 计算总数
    const countResult = await pointsRecordsCollection.where(whereCondition).count()
    const total = countResult.total

    // 查询明细列表
    const result = await pointsRecordsCollection
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
    console.error('[points-getPointsDetail] 错误:', err)
    return { code: -1, data: null, message: '获取积分明细失败: ' + err.message }
  }
}
