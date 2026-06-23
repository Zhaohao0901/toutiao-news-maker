// cloudfunctions/content-getFavorites/index.js
// 用户收藏列表查询 - 根据 openid 查询 favorites 集合的列表，
// 并关联查询对应的 content / templates 详情。

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const favoritesCollection = db.collection('favorites')
const contentCollection = db.collection('content')
const templatesCollection = db.collection('templates')

const PAGE_SIZE = 10

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { page, pageSize } = event

  try {
    const currentPage = page || 1
    const currentPageSize = pageSize || PAGE_SIZE
    const skipCount = (currentPage - 1) * currentPageSize

    // 查询当前用户的收藏列表
    const whereCondition = { openid: openid }

    const countResult = await favoritesCollection.where(whereCondition).count()
    const total = countResult.total

    const listResult = await favoritesCollection
      .where(whereCondition)
      .orderBy('created_at', 'desc')
      .skip(skipCount)
      .limit(currentPageSize)
      .get()

    const favoritesList = listResult.data || []

    // 关联查询对应的 content / templates 详情
    const enrichedFavorites = []

    for (let i = 0; i < favoritesList.length; i++) {
      const favorite = favoritesList[i]
      const targetId = favorite.target_id || favorite.content_id || favorite.template_id || ''
      const targetType = favorite.target_type || favorite.type || 'content'

      let detail = null

      if (targetId) {
        try {
          if (targetType === 'template') {
            // 关联查询模板详情
            try {
              const tplDoc = await templatesCollection.doc(targetId).get()
              detail = tplDoc.data
            } catch (docErr) {
              const tplFieldQuery = await templatesCollection.where({
                template_id: targetId
              }).limit(1).get()
              detail = (tplFieldQuery.data && tplFieldQuery.data[0]) || null
            }
          } else {
            // 默认关联查询内容详情
            try {
              const contentDoc = await contentCollection.doc(targetId).get()
              detail = contentDoc.data
            } catch (docErr) {
              const contentFieldQuery = await contentCollection.where({
                content_id: targetId
              }).limit(1).get()
              detail = (contentFieldQuery.data && contentFieldQuery.data[0]) || null
            }
          }
        } catch (detailErr) {
          console.warn('[content-getFavorites] 关联查询详情失败:', targetId, detailErr.message)
          detail = null
        }
      }

      enrichedFavorites.push({
        id: favorite._id,
        _id: favorite._id,
        openid: favorite.openid,
        target_id: targetId,
        target_type: targetType,
        created_at: favorite.created_at,
        // 关联详情（统一输出 content 详情结构，便于前端展示与跳转）
        content: detail,
        // 兼容前端直接读取 id / title / cover 等字段
        title: detail ? (detail.title || '') : '',
        body: detail ? (detail.body || detail.body_text || '') : '',
        cover_image: detail ? (detail.cover_image || detail.cover || '') : '',
        category: detail ? (detail.category || '') : '',
        // 统一对外 id，供前端跳转 make 页使用
        contentId: targetId
      })
    }

    return {
      code: 0,
      data: {
        list: enrichedFavorites,
        total: total,
        page: currentPage,
        pageSize: currentPageSize,
        hasMore: total > skipCount + currentPageSize
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[content-getFavorites] 错误:', err)
    return { code: -1, data: null, message: '获取收藏列表失败: ' + err.message }
  }
}
