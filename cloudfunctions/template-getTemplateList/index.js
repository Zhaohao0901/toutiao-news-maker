// cloudfunctions/template-getTemplateList/index.js
// 模板列表查询

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const templatesCollection = db.collection('templates')

exports.main = async (event, context) => {
  try {
    const { category, isVip, page, pageSize } = event
    const currentPage = page || 1
    const currentPageSize = pageSize || 20
    const skipCount = (currentPage - 1) * currentPageSize

    // 构建查询条件
    const whereCondition = {
      status: 'published'
    }

    if (category && category !== 'all') {
      whereCondition.category = category
    }

    if (isVip !== undefined) {
      whereCondition.is_vip = isVip
    }

    // 计算总数
    const countResult = await templatesCollection.where(whereCondition).count()
    const total = countResult.total

    // 查询列表
    const result = await templatesCollection
      .where(whereCondition)
      .orderBy('sort_weight', 'desc')
      .skip(skipCount)
      .limit(currentPageSize)
      .field({
        _id: true,
        category: true,
        name: true,
        cover_image: true,
        is_vip: true,
        sort_weight: true,
        description: true,
        use_count: true
      })
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
    console.error('[template-getTemplateList] 错误:', err)
    return { code: -1, data: null, message: '获取模板列表失败: ' + err.message }
  }
}
