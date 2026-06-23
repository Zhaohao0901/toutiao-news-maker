// cloudfunctions/template-getTemplateDetail/index.js
// 模板详情查询（含layout_config）

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const templatesCollection = db.collection('templates')

exports.main = async (event, context) => {
  try {
    const { templateId } = event

    if (!templateId) {
      return { code: -1, data: null, message: '模板ID不能为空' }
    }

    const result = await templatesCollection.doc(templateId).get()

    if (!result.data) {
      return { code: -1, data: null, message: '模板不存在' }
    }

    return {
      code: 0,
      data: result.data,
      message: 'ok'
    }
  } catch (err) {
    console.error('[template-getTemplateDetail] 错误:', err)
    return { code: -1, data: null, message: '获取模板详情失败: ' + err.message }
  }
}
