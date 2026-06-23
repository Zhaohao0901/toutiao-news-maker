// utils/api.js - 云函数统一调用封装

/**
 * 调用云函数
 * @param {string} name - 云函数名称（如 'user-login', 'content-getContentList'）
 * @param {Object} data - 传递给云函数的参数对象
 * @returns {Promise<Object>} 云函数返回的结果 { code, data, message }
 */
function callCloudFunc(name, data) {
  if (!name) {
    return Promise.reject({
      code: -1,
      data: null,
      message: '云函数名称不能为空'
    })
  }

  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: name,
      data: data || {},
      success: (res) => {
        const result = res.result || {}
        // 云函数统一返回格式：{ code, data, message }
        if (result.code === 0) {
          resolve(result)
        } else {
          console.warn('[API] 云函数返回业务错误:', name, result)
          reject({
            code: result.code || -1,
            data: result.data || null,
            message: result.message || '操作失败'
          })
        }
      },
      fail: (err) => {
        console.error('[API] 云函数调用失败:', name, err)
        reject({
          code: -1,
          data: null,
          message: err.errMsg || '网络请求失败，请稍后重试'
        })
      }
    })
  })
}

/**
 * 调用云函数（静默模式 - 不弹出错误提示）
 * @param {string} name - 云函数名称
 * @param {Object} data - 参数对象
 * @returns {Promise<Object>}
 */
function callCloudFuncSilent(name, data) {
  return callCloudFunc(name, data).catch((err) => {
    console.warn('[API] 静默调用失败:', name, err)
    return err
  })
}

/**
 * 批量调用多个云函数（并行）
 * @param {Array<{name: string, data: Object}>} tasks - 调用任务列表
 * @returns {Promise<Array<Object>>} 所有结果数组
 */
function callCloudFuncBatch(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return Promise.resolve([])
  }
  const promises = tasks.map((task) => callCloudFunc(task.name, task.data))
  return Promise.allSettled(promises).then((results) => {
    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value
      }
      return {
        code: -1,
        data: null,
        message: result.reason?.message || '调用失败'
      }
    })
  })
}

/**
 * 显示加载中并调用云函数
 * @param {string} name - 云函数名称
 * @param {Object} data - 参数对象
 * @param {string} [title='加载中...'] - 加载提示文字
 * @returns {Promise<Object>}
 */
function callCloudFuncWithLoading(name, data, title) {
  wx.showLoading({
    title: title || '加载中...',
    mask: true
  })
  return callCloudFunc(name, data)
    .then((result) => {
      wx.hideLoading()
      return result
    })
    .catch((err) => {
      wx.hideLoading()
      // 显示错误Toast
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none',
        duration: 2000
      })
      throw err
    })
}

module.exports = {
  callCloudFunc,
  callCloudFuncSilent,
  callCloudFuncBatch,
  callCloudFuncWithLoading
}
