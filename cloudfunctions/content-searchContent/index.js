// cloudfunctions/content-searchContent/index.js
// 全文搜索

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const contentCollection = db.collection('content')

const PAGE_SIZE = 10

exports.main = async (event, context) => {
  try {
    const { keyword, category, page, pageSize } = event

    if (!keyword || keyword.trim().length === 0) {
      return { code: -1, data: null, message: '请输入搜索关键词' }
    }

    const currentPage = page || 1
    const currentPageSize = pageSize || PAGE_SIZE
    const skipCount = (currentPage - 1) * currentPageSize
    const trimmedKeyword = keyword.trim()

    // 构建查询条件
    const whereCondition = {
      status: 'published'
    }

    if (category && category !== 'all') {
      whereCondition.category = category
    }

    // 使用正则表达式进行模糊搜索
    const regexPattern = new RegExp(trimmedKeyword, 'i')
    whereCondition.title = regexPattern

    // 计算总数
    const countResult = await contentCollection.where(whereCondition).count()
    const total = countResult.total

    // 搜索标题
    const titleResult = await contentCollection
      .where(whereCondition)
      .orderBy('sort_weight', 'desc')
      .skip(skipCount)
      .limit(currentPageSize)
      .get()

    // 如果标题搜索结果不足，补充搜索正文
    let finalList = titleResult.data || []
    if (finalList.length < currentPageSize) {
      const bodyWhereCondition = {
        status: 'published',
        body_text: regexPattern
      }
      if (category && category !== 'all') {
        bodyWhereCondition.category = category
      }

      const bodyResult = await contentCollection
        .where(bodyWhereCondition)
        .orderBy('sort_weight', 'desc')
        .limit(currentPageSize)
        .get()

      // 合并结果（去重）
      const existingIds = finalList.map((item) => item._id)
      const additionalItems = (bodyResult.data || []).filter(
        (item) => !existingIds.includes(item._id)
      )
      finalList = finalList.concat(additionalItems).slice(0, currentPageSize)
    }

    return {
      code: 0,
      data: {
        list: finalList,
        total: total,
        page: currentPage,
        pageSize: currentPageSize,
        keyword: trimmedKeyword,
        hasMore: total > skipCount + currentPageSize
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[content-searchContent] 错误:', err)
    return { code: -1, data: null, message: '搜索失败: ' + err.message }
  }
}
