// components/business/news-editor/news-editor.js - 新闻编辑器组件逻辑
const api = require('../../utils/api')
const { POINTS_COST } = require('../../utils/constants')

Component({
  properties: {
    /** 新闻标题 */
    title: {
      type: String,
      value: ''
    },
    /** 新闻正文 */
    bodyText: {
      type: String,
      value: ''
    },
    /** 封面图路径 */
    coverImage: {
      type: String,
      value: ''
    },
    /** 题材分类 */
    category: {
      type: String,
      value: 'sports'
    }
  },

  data: {
    titleLength: 0,
    bodyLength: 0,
    isRewriting: false
  },

  observers: {
    'title': function(title) {
      this.setData({
        titleLength: title ? title.length : 0
      })
    },
    'bodyText': function(bodyText) {
      this.setData({
        bodyLength: bodyText ? bodyText.length : 0
      })
    }
  },

  methods: {
    /**
     * 标题输入事件
     */
    onTitleInput(e) {
      const title = e.detail.value
      this.setData({
        titleLength: title.length
      })
      this.triggerEvent('titlechange', { title: title })
    },

    /**
     * 正文输入事件
     */
    onBodyInput(e) {
      const bodyText = e.detail.value
      this.setData({
        bodyLength: bodyText.length
      })
      this.triggerEvent('bodychange', { bodyText: bodyText })
    },

    /**
     * 选择封面图
     */
    onChooseImage() {
      wx.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePath = res.tempFilePaths[0]
          this.triggerEvent('imagechange', { 
            coverImage: tempFilePath 
          })
        },
        fail: (err) => {
          console.error('[NewsEditor] 选择图片失败:', err)
        }
      })
    },

    /**
     * AI改写
     */
    onAIRewrite() {
      const { title, bodyText, category } = this.properties
      
      if (!title && !bodyText) {
        wx.showToast({
          title: '请先输入标题或正文',
          icon: 'none'
        })
        return
      }

      wx.showModal({
        title: 'AI智能改写',
        content: `将消耗${POINTS_COST.AI_REWRITE}积分进行AI改写，是否继续？`,
        confirmText: '确认改写',
        confirmColor: '#E8002D',
        success: (res) => {
          if (res.confirm) {
            this._doAIRewrite(title, bodyText, category)
          }
        }
      })
    },

    /**
     * 执行AI改写
     * @param {string} title - 标题
     * @param {string} bodyText - 正文
     * @param {string} category - 题材分类
     */
    _doAIRewrite(title, bodyText, category) {
      this.setData({
        isRewriting: true
      })

      wx.showLoading({
        title: 'AI改写中...',
        mask: true
      })

      api.callCloudFunc('make-aiRewrite', {
        title: title,
        content: bodyText,
        category: category
      })
        .then((result) => {
          wx.hideLoading()
          this.setData({
            isRewriting: false
          })

          if (result.code === 0 && result.data) {
            // 触发改写完成事件
            this.triggerEvent('airewrite', {
              title: result.data.title || title,
              bodyText: result.data.bodyText || bodyText
            })

            wx.showToast({
              title: '改写成功',
              icon: 'success'
            })
          } else {
            throw new Error(result.message || '改写失败')
          }
        })
        .catch((err) => {
          wx.hideLoading()
          this.setData({
            isRewriting: false
          })

          wx.showToast({
            title: err.message || '改写失败，请重试',
            icon: 'none'
          })
        })
    }
  }
})
