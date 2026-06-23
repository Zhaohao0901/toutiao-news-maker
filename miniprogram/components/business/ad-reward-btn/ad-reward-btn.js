// components/business/ad-reward-btn/ad-reward-btn.js - 广告激励按钮组件逻辑
const api = require('../../utils/api')
const { SIGN_REWARD } = require('../../utils/constants')
const store = require('../../utils/store')

Component({
  properties: {
    /** 今日已观看次数 */
    watchedTimes: {
      type: Number,
      value: 0
    }
  },

  data: {
    maxTimes: SIGN_REWARD.AD_REWARD_MAX_PER_DAY,
    rewardPoints: SIGN_REWARD.AD_REWARD_POINTS,
    remainingTimes: SIGN_REWARD.AD_REWARD_MAX_PER_DAY,
    videoAd: null
  },

  lifetimes: {
    attached() {
      this._updateRemainingTimes()
      this._createVideoAd()
    },

    detached() {
      // 清理广告实例
      if (this.data.videoAd) {
        this.data.videoAd.destroy()
      }
    }
  },

  observers: {
    'watchedTimes': function(watchedTimes) {
      this._updateRemainingTimes()
    }
  },

  methods: {
    /**
     * 更新剩余次数
     */
    _updateRemainingTimes() {
      const remaining = Math.max(0, this.data.maxTimes - this.properties.watchedTimes)
      this.setData({
        remainingTimes: remaining
      })
    },

    /**
     * 创建激励视频广告
     */
    _createVideoAd() {
      if (wx.createRewardedVideoAd) {
        try {
          const videoAd = wx.createRewardedVideoAd({
            adUnitId: 'adunit-xxxxxxxxx' // 需要替换为真实的广告单元ID
          })

          videoAd.onClose((res) => {
            if (res && res.isEnded) {
              // 广告观看完成，发放奖励
              this._onAdReward()
            } else {
              wx.showToast({
                title: '观看完整广告才能获得奖励',
                icon: 'none'
              })
            }
          })

          videoAd.onError((err) => {
            console.error('[AdReward] 广告加载失败:', err)
            // 降级方案：直接调用云函数（开发环境）
            if (err.errCode === 1004) {
              console.warn('[AdReward] 无广告填充，使用模拟模式')
            }
          })

          this.setData({
            videoAd: videoAd
          })
        } catch (err) {
          console.error('[AdReward] 创建广告失败:', err)
        }
      }
    },

    /**
     * 广告按钮点击
     */
    onAdTap() {
      if (this.data.remainingTimes <= 0) {
        wx.showToast({
          title: '今日次数已用完',
          icon: 'none'
        })
        return
      }

      const videoAd = this.data.videoAd
      if (videoAd) {
        videoAd.show().catch(() => {
          // 广告显示失败，重试
          videoAd.load()
            .then(() => videoAd.show())
            .catch((err) => {
              console.error('[AdReward] 广告显示失败:', err)
              // 降级：直接调用云函数（开发调试用）
              this._onAdReward()
            })
        })
      } else {
        // 降级：直接调用云函数（开发调试用）
        wx.showModal({
          title: '开发模式',
          content: '广告组件不可用，是否模拟观看广告？',
          success: (res) => {
            if (res.confirm) {
              this._onAdReward()
            }
          }
        })
      }
    },

    /**
     * 广告奖励发放
     */
    _onAdReward() {
      wx.showLoading({
        title: '发放奖励中...',
        mask: true
      })

      api.callCloudFunc('points-adReward', {})
        .then((result) => {
          wx.hideLoading()

          if (result.code === 0 && result.data) {
            const { points, watchedTimes } = result.data

            // 更新Store
            store.setState('pointsBalance', store.getState('pointsBalance') + points)

            // 触发事件
            this.triggerEvent('adreward', {
              points: points,
              watchedTimes: watchedTimes
            })

            this.setData({
              remainingTimes: Math.max(0, this.data.maxTimes - watchedTimes)
            })

            wx.showToast({
              title: `获得${points}积分`,
              icon: 'success'
            })
          } else {
            throw new Error(result.message || '奖励发放失败')
          }
        })
        .catch((err) => {
          wx.hideLoading()
          console.error('[AdReward] 奖励发放失败:', err)
          wx.showToast({
            title: err.message || '奖励发放失败',
            icon: 'none'
          })
        })
    }
  }
})
