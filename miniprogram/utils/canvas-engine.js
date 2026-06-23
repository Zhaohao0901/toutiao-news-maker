// utils/canvas-engine.js - 图片生成核心模块
// Canvas引擎 - 在Canvas上渲染新闻图片并保存

const { COLORS } = require('./constants')

/**
 * 在Canvas上渲染预览图
 * @param {Object} layout_config - 模板布局配置
 * @param {Object} edit_data - 编辑数据 { title, body_text, image_url }
 * @param {string} canvasId - Canvas元素的id
 * @param {Object} componentInstance - 页面/组件实例（用于wx.createCanvasContext）
 * @returns {Promise<string>} 临时文件路径
 */
function renderPreview(layout_config, edit_data, canvasId, componentInstance) {
  return new Promise((resolve, reject) => {
    if (!layout_config || !edit_data || !canvasId || !componentInstance) {
      reject(new Error('参数不完整'))
      return
    }

    const ctx = wx.createCanvasContext(canvasId, componentInstance)
    const canvasWidth = layout_config.canvas_width || 1080
    const canvasHeight = layout_config.canvas_height || 1920

    // 1. 绘制背景
    drawBackground(ctx, layout_config, canvasWidth, canvasHeight)

    // 2. 绘制标题区域
    drawTitleArea(ctx, layout_config.title_area, edit_data.title, canvasWidth)

    // 3. 绘制正文区域
    drawBodyArea(ctx, layout_config.body_area, edit_data.body_text, canvasWidth)

    // 4. 绘制图片区域（如有图片URL则加载绘制，否则绘制占位）
    drawImageArea(ctx, layout_config.image_area, edit_data.image_url)

    // 5. 绘制水印区域
    drawWatermark(ctx, layout_config.watermark_area)

    // 6. 执行绘制并导出
    ctx.draw(false, () => {
      // 等待绘制完成后导出临时文件
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: canvasId,
          width: canvasWidth,
          height: canvasHeight,
          destWidth: canvasWidth,
          destHeight: canvasHeight,
          success: (res) => {
            resolve(res.tempFilePath)
          },
          fail: (err) => {
            console.error('[CanvasEngine] 导出预览图失败:', err)
            reject(new Error('导出预览图失败: ' + err.errMsg))
          }
        }, componentInstance)
      }, 300) // 留出绘制完成的时间
    })
  })
}

/**
 * 生成完整高清图片
 * @param {Object} layout_config - 模板布局配置
 * @param {Object} edit_data - 编辑数据
 * @param {boolean} watermark_flag - 是否包含水印（VIP用户可去除）
 * @param {Object} componentInstance - 页面/组件实例
 * @returns {Promise<string>} 临时文件路径
 */
function generateFullImage(layout_config, edit_data, watermark_flag, componentInstance) {
  return new Promise((resolve, reject) => {
    if (!layout_config || !edit_data) {
      reject(new Error('参数不完整'))
      return
    }

    // 使用隐藏的高清Canvas
    const canvasId = 'fullImageCanvas'
    const ctx = wx.createCanvasContext(canvasId, componentInstance)
    const canvasWidth = layout_config.canvas_width || 1080
    const canvasHeight = layout_config.canvas_height || 1920

    // 1. 绘制背景
    drawBackground(ctx, layout_config, canvasWidth, canvasHeight)

    // 2. 绘制标题（高清模式字体稍大）
    drawTitleArea(ctx, layout_config.title_area, edit_data.title, canvasWidth)

    // 3. 绘制正文
    drawBodyArea(ctx, layout_config.body_area, edit_data.body_text, canvasWidth)

    // 4. 绘制图片（高清）
    drawImageArea(ctx, layout_config.image_area, edit_data.image_url)

    // 5. 水印（根据flag决定是否绘制）
    if (watermark_flag) {
      drawWatermark(ctx, layout_config.watermark_area)
    }

    // 6. 绘制完成后导出高清图
    ctx.draw(false, () => {
      setTimeout(() => {
        wx.canvasToTempFilePath({
          canvasId: canvasId,
          width: canvasWidth,
          height: canvasHeight,
          destWidth: canvasWidth * 2, // 2倍高清
          destHeight: canvasHeight * 2,
          fileType: 'png',
          quality: 1,
          success: (res) => {
            resolve(res.tempFilePath)
          },
          fail: (err) => {
            console.error('[CanvasEngine] 导出高清图失败:', err)
            reject(new Error('导出高清图失败: ' + err.errMsg))
          }
        }, componentInstance)
      }, 500) // 高清绘制需要更多时间
    })
  })
}

/**
 * 保存图片到手机相册
 * @param {string} canvasTempFilePath - Canvas导出的临时文件路径
 * @returns {Promise<boolean>}
 */
function saveToAlbum(canvasTempFilePath) {
  return new Promise((resolve, reject) => {
    // 先获取保存相册授权
    wx.getSetting({
      success: (settingRes) => {
        if (settingRes.authSetting['scope.writePhotosAlbum']) {
          // 已授权，直接保存
          doSaveToAlbum(canvasTempFilePath, resolve, reject)
        } else {
          // 未授权，请求授权
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              doSaveToAlbum(canvasTempFilePath, resolve, reject)
            },
            fail: () => {
              // 授权失败
              wx.showModal({
                title: '提示',
                content: '需要您授权保存图片到相册',
                confirmText: '去授权',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting({
                      success: (openRes) => {
                        if (openRes.authSetting['scope.writePhotosAlbum']) {
                          doSaveToAlbum(canvasTempFilePath, resolve, reject)
                        } else {
                          reject(new Error('用户拒绝授权'))
                        }
                      }
                    })
                  } else {
                    reject(new Error('用户拒绝授权'))
                  }
                }
              })
            }
          })
        }
      },
      fail: () => {
        reject(new Error('获取设置失败'))
      }
    })
  })
}

/**
 * 执行保存到相册
 * @param {string} filePath
 * @param {Function} resolve
 * @param {Function} reject
 */
function doSaveToAlbum(filePath, resolve, reject) {
  wx.saveImageToPhotosAlbum({
    filePath: filePath,
    success: () => {
      wx.showToast({
        title: '已保存到相册',
        icon: 'success',
        duration: 1500
      })
      resolve(true)
    },
    fail: (err) => {
      console.error('[CanvasEngine] 保存到相册失败:', err)
      reject(new Error('保存到相册失败: ' + err.errMsg))
    }
  })
}

// ========== 绘制辅助函数 ==========

/**
 * 绘制背景
 * @param {Object} ctx - Canvas上下文
 * @param {Object} layout_config - 布局配置
 * @param {number} width - Canvas宽度
 * @param {number} height - Canvas高度
 */
function drawBackground(ctx, layout_config, width, height) {
  const bgColor = layout_config.background_color || COLORS.CARD_WHITE

  // 如果背景色为transparent则不绘制
  if (bgColor === 'transparent') {
    ctx.clearRect(0, 0, width, height)
  } else {
    ctx.setFillStyle(bgColor)
    ctx.fillRect(0, 0, width, height)
  }
}

/**
 * 绘制标题区域
 * @param {Object} ctx - Canvas上下文
 * @param {Object} titleArea - 标题区域配置
 * @param {string} titleText - 标题文本
 * @param {number} canvasWidth - Canvas宽度
 */
function drawTitleArea(ctx, titleArea, titleText, canvasWidth) {
  if (!titleArea) return

  const text = titleText || '新闻标题'
  const x = titleArea.x || 80
  const y = titleArea.y || 120
  const maxWidth = titleArea.width || (canvasWidth - 160)
  const fontSize = titleArea.font_size || 48
  const fontColor = titleArea.font_color || COLORS.DARK_BLACK
  const fontWeight = titleArea.font_weight || 'bold'
  const maxLines = titleArea.max_lines || 2
  const lineHeight = titleArea.line_height || fontSize * 1.3

  // 绘制标题区域背景（如有）
  if (titleArea.background_color && titleArea.background_color !== 'transparent') {
    ctx.setFillStyle(titleArea.background_color)
    const padding = titleArea.padding || { top: 0, bottom: 0, left: 0, right: 0 }
    ctx.fillRect(
      x - padding.left,
      y - padding.top,
      maxWidth + padding.left + padding.right,
      maxLines * lineHeight + padding.top + padding.bottom
    )
  }

  // 设置字体
  ctx.setFillStyle(fontColor)
  ctx.setFontSize(fontSize)
  if (fontWeight === 'bold') {
    // 微信Canvas没有font-weight属性，用粗体字体替代
    ctx.font = 'bold ' + fontSize + 'px sans-serif'
  }

  // 绘制多行标题
  const lines = wrapText(ctx, text, maxWidth, maxLines)
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * lineHeight)
  }
}

/**
 * 绘制正文区域
 * @param {Object} ctx - Canvas上下文
 * @param {Object} bodyArea - 正文区域配置
 * @param {string} bodyText - 正文文本
 * @param {number} canvasWidth - Canvas宽度
 */
function drawBodyArea(ctx, bodyArea, bodyText, canvasWidth) {
  if (!bodyArea) return

  const text = bodyText || ''
  const x = bodyArea.x || 80
  const y = bodyArea.y || 340
  const maxWidth = bodyArea.width || (canvasWidth - 160)
  const fontSize = bodyArea.font_size || 30
  const fontColor = bodyArea.font_color || '#333333'
  const maxLines = bodyArea.max_lines || 12
  const lineHeight = bodyArea.line_height || fontSize * 1.5

  // 绘制正文区域背景
  if (bodyArea.background_color && bodyArea.background_color !== 'transparent') {
    ctx.setFillStyle(bodyArea.background_color)
    ctx.fillRect(x, y, maxWidth, maxLines * lineHeight)
  }

  // 设置字体
  ctx.setFillStyle(fontColor)
  ctx.setFontSize(fontSize)

  // 绘制多行正文
  if (text.length > 0) {
    const lines = wrapText(ctx, text, maxWidth, maxLines)
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x, y + i * lineHeight)
    }
  }
}

/**
 * 绘制图片区域
 * @param {Object} ctx - Canvas上下文
 * @param {Object} imageArea - 图片区域配置
 * @param {string} imageUrl - 图片URL或云文件ID
 */
function drawImageArea(ctx, imageArea, imageUrl) {
  if (!imageArea) return

  const x = imageArea.x || 80
  const y = imageArea.y || 1200
  const width = imageArea.width || 920
  const height = imageArea.height || 500
  const bgColor = imageArea.background_color || COLORS.BG_GRAY
  const borderRadius = imageArea.border_radius || 0

  // 绘制占位背景
  if (borderRadius > 0) {
    drawRoundedRect(ctx, x, y, width, height, borderRadius, bgColor)
  } else {
    ctx.setFillStyle(bgColor)
    ctx.fillRect(x, y, width, height)
  }

  // 如果有图片URL，加载并绘制
  if (imageUrl) {
    // 获取图片信息（支持云文件ID和普通URL）
    wx.getImageInfo({
      src: imageUrl,
      success: (imgInfo) => {
        // 计算图片缩放和居中定位
        const imgWidth = imgInfo.width
        const imgHeight = imgInfo.height
        const scale = Math.min(width / imgWidth, height / imgHeight)
        const drawWidth = imgWidth * scale
        const drawHeight = imgHeight * scale
        const offsetX = x + (width - drawWidth) / 2
        const offsetY = y + (height - drawHeight) / 2

        if (borderRadius > 0) {
          // 带圆角的图片绘制
          ctx.save()
          drawRoundedRectPath(ctx, x, y, width, height, borderRadius)
          ctx.clip()
          ctx.drawImage(imgInfo.path, offsetX, offsetY, drawWidth, drawHeight)
          ctx.restore()
        } else {
          ctx.drawImage(imgInfo.path, offsetX, offsetY, drawWidth, drawHeight)
        }
      },
      fail: (err) => {
        console.warn('[CanvasEngine] 图片加载失败:', err)
        // 图片加载失败，绘制占位文字
        ctx.setFillStyle('#999999')
        ctx.setFontSize(24)
        ctx.fillText('图片加载失败', x + width / 2 - 80, y + height / 2)
      }
    })
  } else {
    // 无图片，绘制占位文字
    ctx.setFillStyle('#CCCCCC')
    ctx.setFontSize(24)
    ctx.fillText('配图区域', x + width / 2 - 48, y + height / 2)
  }
}

/**
 * 绘制水印
 * @param {Object} ctx - Canvas上下文
 * @param {Object} watermarkArea - 水印区域配置
 */
function drawWatermark(ctx, watermarkArea) {
  if (!watermarkArea) return

  const x = watermarkArea.x || 80
  const y = watermarkArea.y || 1760
  const width = watermarkArea.width || 920
  const fontSize = watermarkArea.font_size || 20
  const fontColor = watermarkArea.font_color || '#999999'
  const text = watermarkArea.text || '新闻工坊出品'
  const align = watermarkArea.align || 'center'

  ctx.setFillStyle(fontColor)
  ctx.setFontSize(fontSize)

  // 根据对齐方式计算文本位置
  let textX = x
  if (align === 'center') {
    textX = x + width / 2
    ctx.setTextAlign('center')
  } else if (align === 'right') {
    textX = x + width
    ctx.setTextAlign('right')
  } else {
    textX = x
    ctx.setTextAlign('left')
  }

  ctx.fillText(text, textX, y + fontSize)
  ctx.setTextAlign('left') // 重置对齐
}

// ========== 工具函数 ==========

/**
 * 文本自动换行处理
 * @param {Object} ctx - Canvas上下文
 * @param {string} text - 待换行文本
 * @param {number} maxWidth - 最大宽度
 * @param {number} maxLines - 最大行数
 * @returns {Array<string>} 分行后的文本数组
 */
function wrapText(ctx, text, maxWidth, maxLines) {
  const lines = []
  let currentLine = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const testLine = currentLine + char
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && currentLine.length > 0) {
      lines.push(currentLine)
      currentLine = char

      if (lines.length >= maxLines) {
        // 超过最大行数，截断最后一行
        lines[maxLines - 1] = lines[maxLines - 1].substring(0, lines[maxLines - 1].length - 1) + '...'
        break
      }
    } else {
      currentLine = testLine
    }
  }

  // 添加最后一行
  if (currentLine.length > 0 && lines.length < maxLines) {
    lines.push(currentLine)
  }

  return lines
}

/**
 * 绘制圆角矩形（填充）
 * @param {Object} ctx - Canvas上下文
 * @param {number} x - 左上角x
 * @param {number} y - 左上角y
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @param {number} radius - 圆角半径
 * @param {string} color - 填充颜色
 */
function drawRoundedRect(ctx, x, y, width, height, radius, color) {
  ctx.setFillStyle(color)
  drawRoundedRectPath(ctx, x, y, width, height, radius)
  ctx.fill()
}

/**
 * 绘制圆角矩形路径
 * @param {Object} ctx - Canvas上下文
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} radius
 */
function drawRoundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()
}

module.exports = {
  renderPreview,
  generateFullImage,
  saveToAlbum
}
