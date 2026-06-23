// pages/make/make.js - 新闻制作页面逻辑
const api = require('../../utils/api')
const store = require('../../utils/store')
const { CATEGORY_KEYS, CATEGORY_LIST, POINTS_COST } = require('../../utils/constants')

Page({
  data: {
    // 步骤控制
    currentStep: 0, // 0:选模板 1:编辑 2:预览 3:生成

    // 题材分类
    categories: [],
    selectedCategory: '',

    // 模板列表
    templates: [],
    selectedTemplateId: '',
    layoutConfig: null,
    isLoadingTemplates: false,

    // 编辑数据
    editData: {
      title: '',
      bodyText: '',
      coverImage: '',
      category: ''
    },

    // 内容来源ID（从内容详情进入时记录，保存作品时回传）
    sourceContentId: '',

    // 积分相关
    pointsCost: POINTS_COST.NORMAL_TEMPLATE,
    pointsBalance: 0,
    showPayDialog: false,

    // 生成状态
    isGenerating: false,
    generatedImageUrl: ''
  },

  onLoad(options) {
    console.log('[Make] 页面加载, 参数:', options)
    
    // 初始化分类列表
    const categories = CATEGORY_KEYS.map((key) => CATEGORY_LIST[key])
    this.setData({
      categories: categories,
      selectedCategory: categories[0]?.key || 'sports',
      'editData.category': categories[0]?.key || 'sports'
    })

    // 加载积分余额
    this.loadPointsBalance()

    // 如果传入了contentId，加载内容
    if (options.contentId) {
      this.loadContent(options.contentId)
    }

    // 加载模板列表
    this.loadTemplates()
  },

  onShow() {
    // 刷新积分余额
    this.loadPointsBalance()
  },

  /**
   * 加载积分余额
   */
  loadPointsBalance() {
    const balance = store.getState('pointsBalance') || 0
    this.setData({
      pointsBalance: balance
    })
  },

  /**
   * 加载内容详情
   * @param {string} contentId - 内容ID
   */
  loadContent(contentId) {
    wx.showLoading({
      title: '加载中...',
      mask: true
    })

    // 记录内容来源ID，供保存作品时回传
    this.setData({
      sourceContentId: contentId
    })

    api.callCloudFunc('content-getContentDetail', {
      contentId: contentId
    })
      .then((result) => {
        wx.hideLoading()
        if (result.code === 0 && result.data) {
          const content = result.data
          this.setData({
            'editData.title': content.title || '',
            'editData.bodyText': content.body || content.body_text || '',
            'editData.coverImage': content.cover_image || content.cover || '',
            'editData.category': content.category || this.data.selectedCategory
          })
        }
      })
      .catch((err) => {
        wx.hideLoading()
        console.error('[Make] 加载内容失败:', err)
      })
  },

  /**
   * 加载模板列表
   */
  loadTemplates() {
    this.setData({
      isLoadingTemplates: true
    })

    api.callCloudFunc('template-getTemplateList', {
      category: this.data.selectedCategory
    })
      .then((result) => {
        if (result.code === 0 && result.data) {
          this.setData({
            templates: result.data.list || [],
            isLoadingTemplates: false
          })
        } else {
          throw new Error(result.message || '加载模板失败')
        }
      })
      .catch((err) => {
        console.error('[Make] 加载模板失败:', err)
        this.setData({
          isLoadingTemplates: false
        })
      })
  },

  /**
   * 步骤变更
   */
  onStepChange(e) {
    const step = e.detail.step
    this.setData({
      currentStep: step
    })
  },

  /**
   * 上一步
   */
  onPrevStep() {
    if (this.data.currentStep > 0) {
      this.setData({
        currentStep: this.data.currentStep - 1
      })
    }
  },

  /**
   * 下一步
   */
  onNextStep() {
    const { currentStep, editData, selectedTemplateId } = this.data

    // 步骤验证
    if (currentStep === 0 && !selectedTemplateId) {
      wx.showToast({
        title: '请先选择模板',
        icon: 'none'
      })
      return
    }

    if (currentStep === 1 && !editData.title) {
      wx.showToast({
        title: '请输入标题',
        icon: 'none'
      })
      return
    }

    if (currentStep < 3) {
      this.setData({
        currentStep: currentStep + 1
      })

      // 如果进入预览步骤，加载模板配置
      if (currentStep + 1 === 2) {
        this.loadTemplateConfig()
      }
    }
  },

  /**
   * 选择分类
   */
  onCategorySelect(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category,
      'editData.category': category
    })
    this.loadTemplates()
  },

  /**
   * 选择模板
   */
  onTemplateSelect(e) {
    const template = e.detail.template
    this.setData({
      selectedTemplateId: template.id,
      layoutConfig: template.layoutConfig || null
    })

    wx.showToast({
      title: '已选择模板',
      icon: 'success',
      duration: 1000
    })
  },

  /**
   * 加载模板配置
   */
  loadTemplateConfig() {
    if (!this.data.selectedTemplateId) return

    api.callCloudFunc('template-getTemplateDetail', {
      templateId: this.data.selectedTemplateId
    })
      .then((result) => {
        if (result.code === 0 && result.data) {
          this.setData({
            layoutConfig: result.data.layoutConfig || null
          })
        }
      })
      .catch((err) => {
        console.error('[Make] 加载模板配置失败:', err)
      })
  },

  /**
   * 标题变化
   */
  onTitleChange(e) {
    this.setData({
      'editData.title': e.detail.title
    })
  },

  /**
   * 正文变化
   */
  onBodyChange(e) {
    this.setData({
      'editData.bodyText': e.detail.bodyText
    })
  },

  /**
   * 图片变化
   */
  onImageChange(e) {
    this.setData({
      'editData.coverImage': e.detail.coverImage
    })
  },

  /**
   * AI改写完成
   */
  onAIRewrite(e) {
    this.setData({
      'editData.title': e.detail.title,
      'editData.bodyText': e.detail.bodyText
    })
  },

  /**
   * 生成按钮点击
   */
  onGenerateTap() {
    const { pointsBalance, pointsCost } = this.data

    if (pointsBalance < pointsCost) {
      wx.showToast({
        title: '积分余额不足',
        icon: 'none'
      })
      return
    }

    // 显示支付确认弹窗
    this.setData({
      showPayDialog: true
    })
  },

  /**
   * 支付确认
   */
  onPayConfirm() {
    this.setData({
      showPayDialog: false
    })
    this.generateImage()
  },

  /**
   * 支付取消
   */
  onPayCancel() {
    this.setData({
      showPayDialog: false
    })
  },

  /**
   * 生成图片
   */
  generateImage() {
    this.setData({
      isGenerating: true
    })

    // 调用云函数消耗积分并生成
    api.callCloudFunc('make-consumePoints', {
      points: this.data.pointsCost,
      templateId: this.data.selectedTemplateId,
      editData: this.data.editData
    })
      .then((result) => {
        if (result.code === 0 && result.data) {
          // 更新积分余额
          store.setState('pointsBalance', this.data.pointsBalance - this.data.pointsCost)
          this.setData({
            pointsBalance: this.data.pointsBalance - this.data.pointsCost
          })

          // 获取生成的图片URL
          const imageUrl = result.data.imageUrl || ''
          
          this.setData({
            isGenerating: false,
            generatedImageUrl: imageUrl
          })

          // 保存作品记录
          this.saveWork(imageUrl)

          wx.showToast({
            title: '生成成功',
            icon: 'success'
          })
        } else {
          throw new Error(result.message || '生成失败')
        }
      })
      .catch((err) => {
        console.error('[Make] 生成失败:', err)
        this.setData({
          isGenerating: false
        })

        wx.showToast({
          title: err.message || '生成失败，请重试',
          icon: 'none'
        })
      })
  },

  /**
   * 保存作品
   * 入参与 make-saveWork 云函数期望的字段名保持一致：
   * { templateId, category, title, bodyText, imageUrl, sourceContentId }
   */
  saveWork(imageUrl) {
    const { editData, selectedTemplateId } = this.data
    api.callCloudFunc('make-saveWork', {
      templateId: selectedTemplateId,
      category: editData.category || '',
      title: editData.title || '',
      bodyText: editData.bodyText || '',
      imageUrl: imageUrl || '',
      sourceContentId: this.data.sourceContentId || ''
    })
      .then((result) => {
        console.log('[Make] 作品保存成功:', result)
      })
      .catch((err) => {
        console.error('[Make] 作品保存失败:', err)
      })
  },

  /**
   * 全图生成（Canvas预览组件触发）
   */
  onGenerateFull(e) {
    this.onGenerateTap()
  },

  /**
   * 预览图片
   */
  onPreviewImage() {
    if (this.data.generatedImageUrl) {
      wx.previewImage({
        urls: [this.data.generatedImageUrl]
      })
    }
  },

  /**
   * 保存图片到相册
   */
  onSaveImage() {
    if (!this.data.generatedImageUrl) return

    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.writePhotosAlbum'] === false) {
          // 之前拒绝了授权，引导重新授权
          wx.showModal({
            title: '提示',
            content: '需要您授权保存图片到相册',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          // 保存图片
          wx.saveImageToPhotosAlbum({
            filePath: this.data.generatedImageUrl,
            success: () => {
              wx.showToast({
                title: '已保存到相册',
                icon: 'success'
              })
            },
            fail: (err) => {
              console.error('[Make] 保存失败:', err)
              // 如果是临时文件，先下载
              if (this.data.generatedImageUrl.startsWith('http')) {
                this._downloadAndSave(this.data.generatedImageUrl)
              }
            }
          })
        }
      }
    })
  },

  /**
   * 下载并保存图片
   */
  _downloadAndSave(url) {
    wx.downloadFile({
      url: url,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.showToast({
                title: '已保存到相册',
                icon: 'success'
              })
            }
          })
        }
      }
    })
  },

  /**
   * 分享图片
   */
  onShareImage() {
    if (!this.data.generatedImageUrl) return

    wx.shareFileMessage({
      filePath: this.data.generatedImageUrl,
      success: () => {
        console.log('[Make] 分享成功')
      },
      fail: (err) => {
        console.error('[Make] 分享失败:', err)
        // 降级：使用转发
        wx.showToast({
          title: '请使用右上角分享',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 分享设置
   */
  onShareAppMessage() {
    return {
      title: this.data.editData.title || '新闻工坊',
      path: '/pages/home/home',
      imageUrl: this.data.generatedImageUrl || ''
    }
  }
})
