// utils/store.js - 全局状态管理（发布订阅 + Storage持久化）

const STORAGE_KEY = 'toutiao_news_maker_store'

/** 内部状态对象 */
let _state = {}

/** 订阅者映射表：key → Set<callback> */
let _subscribers = {}

/**
 * 初始化Store，从Storage恢复持久化数据
 */
function init() {
  try {
    const saved = wx.getStorageSync(STORAGE_KEY)
    if (saved && typeof saved === 'object') {
      _state = saved
    }
  } catch (err) {
    console.error('[Store] 初始化读取Storage失败:', err)
    _state = {}
  }

  // 确保关键字段有默认值
  _state.openid = _state.openid || ''
  _state.userInfo = _state.userInfo || null
  _state.isVip = _state.isVip || false
  _state.pointsBalance = _state.pointsBalance || 0
  _state.signInToday = _state.signInToday || false
  _state.lastSignInDate = _state.lastSignInDate || ''
  _state.consecutiveDays = _state.consecutiveDays || 0
  _state.selectedCategory = _state.selectedCategory || 'sports'
  _state.selectedTemplateId = _state.selectedTemplateId || ''
  _state.editData = _state.editData || null

  console.log('[Store] 初始化完成, 状态:', Object.keys(_state))
  _persist()
}

/**
 * 获取状态值
 * @param {string} key - 状态键名
 * @returns {*} 状态值，若key不存在则返回undefined
 */
function getState(key) {
  if (key === undefined || key === null) {
    return _state
  }
  return _state[key]
}

/**
 * 设置状态值，并通知对应订阅者
 * @param {string} key - 状态键名
 * @param {*} value - 状态值
 */
function setState(key, value) {
  const oldValue = _state[key]
  _state[key] = value

  // 通知订阅者
  if (_subscribers[key] && _subscribers[key].size > 0) {
    _subscribers[key].forEach((callback) => {
      try {
        callback(value, oldValue, key)
      } catch (err) {
        console.error('[Store] 订阅者回调执行失败:', key, err)
      }
    })
  }

  // 持久化
  _persist()
}

/**
 * 批量设置状态值
 * @param {Object} updates - 键值对对象
 */
function setMultiple(updates) {
  if (!updates || typeof updates !== 'object') {
    return
  }
  Object.keys(updates).forEach((key) => {
    setState(key, updates[key])
  })
}

/**
 * 订阅状态变化
 * @param {string} key - 要订阅的状态键名
 * @param {Function} callback - 回调函数 (newValue, oldValue, key) => void
 * @returns {Function} 取消订阅的函数
 */
function subscribe(key, callback) {
  if (typeof callback !== 'function') {
    console.warn('[Store] subscribe的callback必须是函数')
    return () => {}
  }

  if (!_subscribers[key]) {
    _subscribers[key] = new Set()
  }
  _subscribers[key].add(callback)

  // 返回取消订阅函数
  return () => {
    unsubscribe(key, callback)
  }
}

/**
 * 取消订阅
 * @param {string} key - 状态键名
 * @param {Function} callback - 之前注册的回调函数
 */
function unsubscribe(key, callback) {
  if (!_subscribers[key]) {
    return
  }
  _subscribers[key].delete(callback)

  // 清理空的订阅集合
  if (_subscribers[key].size === 0) {
    delete _subscribers[key]
  }
}

/**
 * 清除所有订阅者
 */
function clearSubscribers() {
  _subscribers = {}
}

/**
 * 重置状态到默认值并清除持久化
 */
function reset() {
  _state = {}
  _subscribers = {}
  try {
    wx.removeStorageSync(STORAGE_KEY)
  } catch (err) {
    console.error('[Store] 重置Storage失败:', err)
  }
  init()
}

/** 持久化到Storage（内部方法） */
function _persist() {
  try {
    wx.setStorageSync(STORAGE_KEY, _state)
  } catch (err) {
    console.error('[Store] 持久化到Storage失败:', err)
  }
}

module.exports = {
  init,
  getState,
  setState,
  setMultiple,
  subscribe,
  unsubscribe,
  clearSubscribers,
  reset
}
