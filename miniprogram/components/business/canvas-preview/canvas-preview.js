// components/business/canvas-preview/canvas-preview.js - Canvas预览组件逻辑
const canvasEngine = require('../../utils/canvas-engine')

Component({
  properties: {
    /** 布局配置 */
    layoutConfig: {
      type: Object,
      value: null
    },
    /** 编辑数据 */
    editData: {
      type: Object,
      value: null
    }
  },

  data: {
    canvasWidth: 375,
    canvasHeight: 500,
    isRendering: false,
    ctx: null
  },

  lifetimes: {
    attached() {
      // 获取系统信息设置Canvas尺寸
      this._initCanvasSize()
    },

    detached() {
      // 清理Canvas资源
      if (this.data.ctx) {
        this.data.ctx = null
      }
    }
  },

  observers: {
    'editData': function(editData) {
      // editData变化时自动重绘
      if (editData && this.data.ctx) {
        this._renderPreview()
      }
    },
    
    'layoutConfig': function(layoutConfig) {
      if (layoutConfig && this.data.ctx) {
        this._renderPreview()
      }
    }
  },

  methods: {
    /**
     * 初始化Canvas尺寸
     */
    _initCanvasSize() {
      const systemInfo = wx.getSystemInfoSync()
      const canvasWidth = systemInfo.windowWidth
      const canvasHeight = canvasWidth * 1.33 // 4:3比例

      this.setData({
        canvasWidth: canvasWidth,
        canvasHeight: canvasHeight
      })

      // 延迟获取Canvas上下文
      setTimeout(() => {
        this._getCanvasContext()
      }, 300)
    },

    /**
     * 获取Canvas上下文
     */
    _getCanvasContext() {
      return new Promise((resolve, reject) => {
        const query = this.createSelectorQuery()
        query.select('#previewCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (res && res[0] && res[0].node) {
              const canvas = res[0].node
              const ctx = canvas.getContext('2d')

              // 设置Canvas实际渲染尺寸（考虑像素比）
              const dpr = wx.getSystemInfoSync().pixelRatio
              canvas.width = this.data.canvasWidth * dpr
              canvas.height = this.data.canvasHeight * dpr
              ctx.scale(dpr, dpr)

              this.setData({
                ctx: ctx
              })

              // 初始渲染
              this._renderPreview()
              resolve(ctx)
            } else {
              // 降级方案：使用旧版Canvas API
              this._getCanvasContextLegacy()
              resolve(null)
            }
          })
      })
    },

    /**
     * 降级方案：使用旧版Canvas API
     */
    _getCanvasContextLegacy() {
      const ctx = wx.createCanvasContext('previewCanvas', this)
      this.setData({
        ctx: ctx,
        useLegacy: true
      })
      this._renderPreview()
    },

    /**
     * 渲染预览
     */
    _renderPreview() {
      const { layoutConfig, editData } = this.data

      if (!layoutConfig || !editData) {
        // 无配置或数据时绘制占位提示
        const ctx = this.data.ctx
        if (ctx) {
          this._drawPlaceholder(ctx)
          if (this.data.useLegacy) {
            ctx.draw()
          }
        }
        return
      }

      this.setData({
        isRendering: true
      })

      try {
        // 调用Canvas引擎渲染
        // renderPreview 期望签名：renderPreview(layout_config, edit_data, canvasId, componentInstance)
        // 第一个参数是 layout_config 对象，第二个是 edit_data 对象，
        // 第三个是 canvasId 字符串，第四个是组件实例 this。
        const canvasId = 'previewCanvas'

        // 将页面 editData（title/bodyText/coverImage）转换为 canvas-engine 期望的字段名
        // （canvas-engine 内部读取 edit_data.title / edit_data.body_text / edit_data.image_url）
        const engineEditData = {
          title: editData.title || '',
          body_text: editData.bodyText || editData.body || '',
          image_url: editData.coverImage || editData.image_url || editData.imageUrl || ''
        }

        canvasEngine.renderPreview(layoutConfig, engineEditData, canvasId, this)
          .then(() => {
            this.setData({
              isRendering: false
            })
          })
          .catch((err) => {
            console.error('[CanvasPreview] renderPreview 失败:', err)
            // 降级：绘制占位
            const ctx = this.data.ctx
            if (ctx) {
              this._drawPlaceholder(ctx)
              if (this.data.useLegacy) {
                ctx.draw()
              }
            }
            this.setData({
              isRendering: false
            })
          })
      } catch (err) {
        console.error('[CanvasPreview] 渲染失败:', err)
        this.setData({
          isRendering: false
        })
      }
    },

    /**
     * 绘制占位提示
     */
    _drawPlaceholder(ctx) {
      const { canvasWidth, canvasHeight } = this.data

      // 绘制背景
      ctx.setFillStyle('#F5F5F5')
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      // 绘制提示文字
      ctx.setFillStyle('#999999')
      ctx.setFontSize(16)
      ctx.setTextAlign('center')
      ctx.fillText('请选择模板并开始编辑', canvasWidth / 2, canvasHeight / 2)
    },

    /**
     * 刷新预览
     */
    onRefresh() {
      this._renderPreview()
      wx.showToast({
        title: '已刷新',
        icon: 'success',
        duration: 1000
      })
    },

    /**
     * 生成完整图
     */
    onGenerateFull() {
      this.triggerEvent('generate', {
        canvasId: 'previewCanvas',
        width: this.data.canvasWidth,
        height: this.data.canvasHeight
      })
    },

    /**
     * 导出图片
     * @returns {Promise<string>} 临时文件路径
     */
    exportImage() {
      return new Promise((resolve, reject) => {
        if (this.data.useLegacy) {
          // 旧版API导出
          wx.canvasToTempFilePath({
            canvasId: 'previewCanvas',
            success: (res) => {
              resolve(res.tempFilePath)
            },
            fail: (err) => {
              reject(err)
            }
          }, this)
        } else {
          // 新版API导出
          const query = this.createSelectorQuery()
          query.select('#previewCanvas')
            .fields({ node: true })
            .exec((res) => {
              if (res && res[0] && res[0].node) {
                wx.canvasToTempFilePath({
                  canvas: res[0].node,
                  success: (res) => {
                    resolve(res.tempFilePath)
                  },
                  fail: (err) => {
                    reject(err)
                  }
                })
              } else {
                reject(new Error('Canvas节点未找到'))
              }
            })
        }
      })
    }
  }
})
