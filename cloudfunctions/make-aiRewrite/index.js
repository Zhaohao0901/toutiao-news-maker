// cloudfunctions/make-aiRewrite/index.js
// AI改写代理 - 调用外部AI接口进行文本改写

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const _ = db.command

// AI改写API配置（需在云开发环境中配置）
const AI_API_CONFIG = {
  apiUrl: 'https://api.example.com/v1/rewrite',  // 需替换为实际AI API地址
  apiKey: ''  // 从云开发环境变量获取
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { title, bodyText, category, style } = event

  try {
    // 参数校验
    if (!title || title.trim().length === 0) {
      return { code: -1, data: null, message: '标题不能为空' }
    }

    if (!bodyText || bodyText.trim().length === 0) {
      return { code: -1, data: null, message: '正文不能为空' }
    }

    // 检查用户身份和积分
    const usersCollection = db.collection('users')
    const userQuery = await usersCollection.where({ openid }).get()

    if (!userQuery.data || userQuery.data.length === 0) {
      return { code: -1, data: null, message: '用户不存在' }
    }

    const user = userQuery.data[0]

    // VIP用户免费使用AI改写
    if (!user.is_vip) {
      // 检查积分是否足够（AI改写消耗5分）
      if (user.points_balance < 5) {
        return {
          code: -1,
          data: { pointsBalance: user.points_balance, required: 5 },
          message: '积分不足，AI改写需要5积分'
        }
      }

      // 扣除积分
      const balanceBefore = user.points_balance
      const balanceAfter = balanceBefore - 5

      await usersCollection.doc(user._id).update({
        data: {
          points_balance: balanceAfter,
          updated_at: db.serverDate()
        }
      })

      // 记录积分流水
      const pointsRecordsCollection = db.collection('points_records')
      await pointsRecordsCollection.add({
        data: {
          openid: openid,
          type: 'ai_rewrite',
          amount: -5,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          description: 'AI智能改写',
          created_at: db.serverDate()
        }
      })
    }

    // 调用AI改写API
    const rewriteStyle = style || 'news'
    const aiResult = await callAiRewriteApi(title.trim(), bodyText.trim(), rewriteStyle, category)

    return {
      code: 0,
      data: {
        // 前端期望直接返回 title 与 bodyText（改写后的标题与正文）
        title: aiResult.rewritten_title,
        bodyText: aiResult.rewritten_body,
        original_title: title.trim(),
        original_body: bodyText.trim(),
        style: rewriteStyle,
        isVip: user.is_vip || false,
        pointsConsumed: user.is_vip ? 0 : 5,
        balance_after: user.is_vip ? user.points_balance : (user.points_balance - 5)
      },
      message: 'ok'
    }
  } catch (err) {
    console.error('[make-aiRewrite] 错误:', err)
    return { code: -1, data: null, message: 'AI改写失败: ' + err.message }
  }
}

/**
 * 调用AI改写API
 * @param {string} title - 原始标题
 * @param {string} bodyText - 原始正文
 * @param {string} style - 改写风格
 * @param {string} category - 题材分类
 * @returns {Object} { rewritten_title, rewritten_body }
 */
async function callAiRewriteApi(title, bodyText, style, category) {
  // 实际项目中需对接真实AI API（如OpenAI、百度千帆等）
  // 此处先实现基础改写逻辑作为兜底方案

  try {
    // 尝试调用外部API
    const apiKey = process.env.AI_API_KEY || AI_API_CONFIG.apiKey
    if (apiKey) {
      const axios = require('axios')
      const response = await axios.post(AI_API_CONFIG.apiUrl, {
        title: title,
        body: bodyText,
        style: style,
        category: category,
        max_length: 500
      }, {
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 25000
      })

      if (response.data && response.data.rewritten_title && response.data.rewritten_body) {
        return {
          rewritten_title: response.data.rewritten_title,
          rewritten_body: response.data.rewritten_body
        }
      }
    }
  } catch (apiErr) {
    console.warn('[make-aiRewrite] 外部API调用失败，使用兜底改写:', apiErr.message)
  }

  // 兜底：基础文本改写（添加新闻风格修饰）
  const stylePrefixMap = {
    news: '【快讯】',
    breaking: '【突发】',
    exclusive: '【独家】',
    deep: '【深度】',
    hot: '【热点】'
  }

  const prefix = stylePrefixMap[style] || '【资讯】'
  const rewrittenTitle = prefix + title
  const rewrittenBody = bodyText + '\n\n（新闻工坊AI智能改写）'

  return {
    rewritten_title: rewrittenTitle,
    rewritten_body: rewrittenBody
  }
}
