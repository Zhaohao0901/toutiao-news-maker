// cloudfunctions/content-getContentDetail/index.js
// 内容详情查询 - 根据 content_id 查询 content 集合的单条记录详情

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command
const contentCollection = db.collection('content')

exports.main = async (event, context) => {
  try {
    const { content_id, contentId } = event
    // 兼容前端两种参数命名
    const targetId = content_id || contentId

    if (!targetId) {
      return { code: -1, data: null, message: '内容ID不能为空' }
    }

    let contentData = null

    // 优先按 _id 查询
    try {
      const docResult = await contentCollection.doc(targetId).get()
      if (docResult && docResult.data) {
        contentData = docResult.data
      }
    } catch (docErr) {
      // doc 查询失败（可能是 _id 不存在或格式不符），降级按自定义字段查询
      console.warn('[content-getContentDetail] doc查询失败，尝试字段查询:', docErr.message)
    }

    // 降级：按 content_id 字段查询
    if (!contentData) {
      const fieldQuery = await contentCollection.where({
        content_id: targetId
      }).limit(1).get()

      if (fieldQuery.data && fieldQuery.data.length > 0) {
        contentData = fieldQuery.data[0]
      }
    }

    if (!contentData) {
      return { code: -1, data: null, message: '内容不存在' }
    }

    return {
      code: 0,
      data: contentData,
      message: 'ok'
    }
  } catch (err) {
    console.error('[content-getContentDetail] 错误:', err)
    return { code: -1, data: null, message: '查询内容详情失败: ' + err.message }
  }
}
