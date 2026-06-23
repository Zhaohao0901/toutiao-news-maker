// utils/formatter.js - 数据格式化工具

const { CATEGORY_LIST, COLORS } = require('./constants')

/**
 * 格式化时间戳为日期字符串
 * @param {number} timestamp - 毫秒级时间戳
 * @param {string} [format='YYYY-MM-DD'] - 格式模式
 * @returns {string}
 */
function formatDate(timestamp, format) {
  if (!timestamp) return ''

  format = format || 'YYYY-MM-DD'
  const date = new Date(timestamp)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化相对时间（如"3分钟前"）
 * @param {number} timestamp - 毫秒级时间戳
 * @returns {string}
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return ''

  const now = Date.now()
  const diff = now - timestamp

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day

  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return Math.floor(diff / minute) + '分钟前'
  } else if (diff < day) {
    return Math.floor(diff / hour) + '小时前'
  } else if (diff < week) {
    return Math.floor(diff / day) + '天前'
  } else if (diff < month) {
    return Math.floor(diff / week) + '周前'
  } else {
    return formatDate(timestamp, 'YYYY-MM-DD')
  }
}

/**
 * 格式化价格（分→元，带¥符号）
 * @param {number} priceInFen - 以分为单位的价格
 * @returns {string} 如 "¥18.00"
 */
function formatPrice(priceInFen) {
  if (priceInFen === undefined || priceInFen === null) return '¥0'
  const yuan = priceInFen / 100
  return '¥' + yuan.toFixed(yuan % 1 === 0 ? 0 : 2)
}

/**
 * 格式化积分数量
 * @param {number} points - 积分数值
 * @returns {string}
 */
function formatPoints(points) {
  if (points === undefined || points === null) return '0分'
  if (points >= 10000) {
    return (points / 10000).toFixed(1) + '万分'
  }
  return points + '分'
}

/**
 * 格式化VIP到期时间
 * @param {number} expireTimestamp - 到期时间戳
 * @returns {string} 如 "2025-12-31到期" 或 "已过期"
 */
function formatVipExpire(expireTimestamp) {
  if (!expireTimestamp) return '未开通'
  if (expireTimestamp <= Date.now()) return '已过期'
  const daysLeft = Math.ceil((expireTimestamp - Date.now()) / (24 * 3600 * 1000))
  if (daysLeft <= 1) return '明天到期'
  if (daysLeft <= 7) return daysLeft + '天后到期'
  return formatDate(expireTimestamp, 'YYYY-MM-DD') + '到期'
}

/**
 * 获取题材分类显示名
 * @param {string} categoryKey - 题材键名如 'sports'
 * @returns {string} 显示名如 '体育'
 */
function getCategoryLabel(categoryKey) {
  const item = CATEGORY_LIST[categoryKey]
  return item ? item.label : '未知'
}

/**
 * 获取题材分类图标
 * @param {string} categoryKey - 题材键名
 * @returns {string} emoji图标
 */
function getCategoryIcon(categoryKey) {
  const item = CATEGORY_LIST[categoryKey]
  return item ? item.icon : '📄'
}

/**
 * 获取题材分类颜色
 * @param {string} categoryKey - 题材键名
 * @returns {string} 颜色值
 */
function getCategoryColor(categoryKey) {
  const item = CATEGORY_LIST[categoryKey]
  return item ? item.color : COLORS.TEXT_SECONDARY
}

/**
 * 格式化浏览/制作次数
 * @param {number} count - 数量
 * @returns {string}
 */
function formatCount(count) {
  if (!count) return '0'
  if (count >= 10000) {
    return (count / 10000).toFixed(1) + '万'
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k'
  }
  return String(count)
}

/**
 * 格式化VIP套餐时长描述
 * @param {number} durationDays - 天数
 * @returns {string}
 */
function formatDuration(durationDays) {
  if (durationDays >= 365) {
    return '1年'
  }
  if (durationDays >= 90) {
    return '3个月'
  }
  if (durationDays >= 30) {
    return '1个月'
  }
  return durationDays + '天'
}

/**
 * 截断文本到指定长度
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @param {string} [suffix='...'] - 截断后缀
 * @returns {string}
 */
function truncateText(text, maxLength, suffix) {
  suffix = suffix || '...'
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + suffix
}

module.exports = {
  formatDate,
  formatRelativeTime,
  formatPrice,
  formatPoints,
  formatVipExpire,
  getCategoryLabel,
  getCategoryIcon,
  getCategoryColor,
  formatCount,
  formatDuration,
  truncateText
}
