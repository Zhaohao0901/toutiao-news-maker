// cloudfunctions/content-getContentList/index.js
// 内容列表查询（分页+题材筛选+排序）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const contentCollection = db.collection('content')

const PAGE_SIZE = 10

exports.main = async (event, context) => {
  try {
    const { category, page, pageSize, sortBy, sortDirection, isFeatured } = event
    const currentPage = page || 1
    const currentPageSize = pageSize || PAGE_SIZE
    const skipCount = (currentPage - 1) * currentPageSize

    // 构建查询条件
    let query = contentCollection

    const whereCondition = {}

    // 题材筛选
    if (category && category !== 'all') {
      whereCondition.category = category
    }

    // 是否精选
    if (isFeatured !== undefined) {
      whereCondition.is_featured = isFeatured
    }

    // 状态筛选（只返回已发布内容）
    whereCondition.status = 'published'

    query = query.where(whereCondition)

    // 排序
    const orderField = sortBy || 'sort_weight'
    const orderDirection = sortDirection || 'desc'
    query = query.orderBy(orderField, orderDirection)

    // 计算总数
    const countResult = await contentCollection.where(whereCondition).count()
    const total = countResult.total

    // 分页查询
    const result = await query
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
    console.error('[content-getContentList] 错误:', err)
    return { code: -1, data: null, message: '查询失败: ' + err.message }
  }
}
