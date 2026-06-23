// cloudfunctions/make-saveWork/index.js
// 保存作品记录

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const worksCollection = db.collection('works')

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { templateId, category, title, bodyText, imageUrl, sourceContentId } = event

  try {
    // 参数校验
    if (!title || title.trim().length === 0) {
      return { code: -1, data: null, message: '标题不能为空' }
    }

    if (!bodyText || bodyText.trim().length === 0) {
      return { code: -1, data: null, message: '正文不能为空' }
    }

    // 创建作品记录
    const workData = {
      openid: openid,
      template_id: templateId || '',
      category: category || 'sports',
      title: title.trim(),
      body_text: bodyText.trim(),
      image_url: imageUrl || '',
      source_content_id: sourceContentId || '',
      is_shared: false,
      share_count: 0,
      created_at: db.serverDate(),
      updated_at: db.serverDate()
    }

    const addResult = await worksCollection.add({ data: workData })

    return {
      code: 0,
      data: {
        workId: addResult.id,
        work: workData
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[make-saveWork] 错误:', err)
    return { code: -1, data: null, message: '保存作品失败: ' + err.message }
  }
}
