// utils/validator.js - 输入校验工具

/**
 * 校验标题输入
 * @param {string} title - 新闻标题
 * @returns {{ valid: boolean, message: string }}
 */
function validateTitle(title) {
  if (!title || typeof title !== 'string') {
    return { valid: false, message: '标题不能为空' }
  }

  const t = title.trim()

  if (t.length === 0) {
    return { valid: false, message: '标题不能为空' }
  }

  if (t.length > 30) {
    return { valid: false, message: '标题不能超过30个字符' }
  }

  if (t.length < 2) {
    return { valid: false, message: '标题至少2个字符' }
  }

  return { valid: true, message: '' }
}

/**
 * 校验正文内容
 * @param {string} body - 新闻正文
 * @returns {{ valid: boolean, message: string }}
 */
function validateBody(body) {
  if (!body || typeof body !== 'string') {
    return { valid: false, message: '正文不能为空' }
  }

  const t = body.trim()

  if (t.length === 0) {
    return { valid: false, message: '正文不能为空' }
  }

  if (t.length > 500) {
    return { valid: false, message: '正文不能超过500个字符' }
  }

  if (t.length < 10) {
    return { valid: false, message: '正文至少10个字符' }
  }

  return { valid: true, message: '' }
}

/**
 * 校验搜索关键词
 * @param {string} keyword - 搜索关键词
 * @returns {{ valid: boolean, message: string }}
 */
function validateSearchKeyword(keyword) {
  if (!keyword || typeof keyword !== 'string') {
    return { valid: false, message: '请输入搜索关键词' }
  }

  const t = keyword.trim()

  if (t.length === 0) {
    return { valid: false, message: '请输入搜索关键词' }
  }

  if (t.length > 50) {
    return { valid: false, message: '关键词不能超过50个字符' }
  }

  // 检查是否包含特殊字符
  const specialCharsRegex = /[<>{}[\]\\^$|~`]/g
  if (specialCharsRegex.test(t)) {
    return { valid: false, message: '关键词不能包含特殊字符' }
  }

  return { valid: true, message: '' }
}

/**
 * 校验题材分类
 * @param {string} category - 题材键名
 * @returns {{ valid: boolean, message: string }}
 */
function validateCategory(category) {
  const validCategories = [
    'sports', 'car', 'agriculture', 'finance', 'tech',
    'international', 'house', 'entertainment', 'food'
  ]

  if (!category) {
    return { valid: false, message: '请选择题材分类' }
  }

  if (!validCategories.includes(category)) {
    return { valid: false, message: '无效的题材分类' }
  }

  return { valid: true, message: '' }
}

/**
 * 校验积分余额是否足够
 * @param {number} currentBalance - 当前积分余额
 * @param {number} requiredPoints - 需要消耗的积分
 * @returns {{ valid: boolean, message: string }}
 */
function validatePointsBalance(currentBalance, requiredPoints) {
  if (typeof currentBalance !== 'number' || currentBalance < 0) {
    return { valid: false, message: '积分余额数据异常' }
  }

  if (typeof requiredPoints !== 'number' || requiredPoints <= 0) {
    return { valid: false, message: '所需积分数据异常' }
  }

  if (currentBalance < requiredPoints) {
    return {
      valid: false,
      message: '积分不足，需要' + requiredPoints + '积分，当前仅有' + currentBalance + '积分'
    }
  }

  return { valid: true, message: '' }
}

/**
 * 校验昵称
 * @param {string} nickname - 用户昵称
 * @returns {{ valid: boolean, message: string }}
 */
function validateNickname(nickname) {
  if (!nickname || typeof nickname !== 'string') {
    return { valid: false, message: '昵称不能为空' }
  }

  const t = nickname.trim()

  if (t.length === 0) {
    return { valid: false, message: '昵称不能为空' }
  }

  if (t.length > 20) {
    return { valid: false, message: '昵称不能超过20个字符' }
  }

  return { valid: true, message: '' }
}

/**
 * 校验手机号
 * @param {string} phone - 手机号码
 * @returns {{ valid: boolean, message: string }}
 */
function validatePhone(phone) {
  if (!phone) {
    return { valid: false, message: '手机号不能为空' }
  }

  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(phone)) {
    return { valid: false, message: '请输入正确的手机号' }
  }

  return { valid: true, message: '' }
}

/**
 * 校验图片URL
 * @param {string} imageUrl - 图片URL或云文件ID
 * @returns {{ valid: boolean, message: string }}
 */
function validateImageUrl(imageUrl) {
  if (!imageUrl) {
    return { valid: true, message: '' } // 图片可选
  }

  if (typeof imageUrl !== 'string') {
    return { valid: false, message: '图片路径格式错误' }
  }

  // 支持云文件ID格式（cloud://xxx）和普通URL
  if (imageUrl.startsWith('cloud://') || imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return { valid: true, message: '' }
  }

  return { valid: false, message: '图片路径格式不正确' }
}

/**
 * 批量校验 - 返回第一个失败的结果
 * @param {Array<{valid: boolean, message: string}>} results - 校验结果数组
 * @returns {{ valid: boolean, message: string }}
 */
function validateAll(results) {
  for (let i = 0; i < results.length; i++) {
    if (!results[i].valid) {
      return results[i]
    }
  }
  return { valid: true, message: '' }
}

/**
 * 显示校验错误Toast
 * @param {{ valid: boolean, message: string }} validationResult
 * @returns {boolean} 是否通过校验
 */
function showToastIfInvalid(validationResult) {
  if (!validationResult.valid) {
    wx.showToast({
      title: validationResult.message,
      icon: 'none',
      duration: 2000
    })
    return false
  }
  return true
}

module.exports = {
  validateTitle,
  validateBody,
  validateSearchKeyword,
  validateCategory,
  validatePointsBalance,
  validateNickname,
  validatePhone,
  validateImageUrl,
  validateAll,
  showToastIfInvalid
}
