// components/business/sign-in-card/sign-in-card.js - 签到打卡组件逻辑
const api = require('../../utils/api')
const { SIGN_REWARD } = require('../../utils/constants')
const store = require('../../utils/store')

Component({
  properties: {
    /** 连续签到天数 */
    consecutiveDays: {
      type: Number,
      value: 0
    },
    /** 今日是否已签到 */
    signedToday: {
      type: Boolean,
      value: false
    }
  },

  data: {
    weekDays: [],
    rewardPoints: SIGN_REWARD.BASE_POINTS
  },

  lifetimes: {
    attached() {
      this._buildWeekDays()
    }
  },

  observers: {
    'consecutiveDays, signedToday': function() {
      this._buildWeekDays()
    }
  },

  methods: {
    /**
     * 构建7天签到进度
     */
    _buildWeekDays() {
      const today = new Date()
      const weekDays = []
      const dayLabels = ['日', '一', '二', '三', '四', '五', '六']

      for (let i = 0; i < 7; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - (6 - i)) // 过去7天
        
        const day = date.getDate()
        const isToday = i === 6 // 最后一天是今天
        const signed = this.properties.signedToday && i === 6

        weekDays.push({
          day: day,
          label: i === 6 ? '今天' : dayLabels[date.getDay()],
          signed: signed,
          isToday: isToday
        })
      }

      this.setData({
        weekDays: weekDays,
        rewardPoints: SIGN_REWARD.BASE_POINTS
      })
    },

    /**
     * 签到按钮点击
     */
    onSignIn() {
      if (this.properties.signedToday) {
        wx.showToast({
          title: '今日已签到',
          icon: 'none'
        })
        return
      }

      wx.showLoading({
        title: '签到中...',
        mask: true
      })

      api.callCloudFunc('points-signIn', {})
        .then((result) => {
          wx.hideLoading()

          if (result.code === 0 && result.data) {
            const { points, consecutiveDays } = result.data

            // 更新Store
            store.setState('pointsBalance', store.getState('pointsBalance') + points)
            store.setState('lastSignInDate', new Date().toISOString().split('T')[0])
            store.setState('consecutiveDays', consecutiveDays)

            // 触发事件
            this.triggerEvent('signin', {
              points: points,
              consecutiveDays: consecutiveDays
            })

            wx.showToast({
              title: `签到成功 +${points}积分`,
              icon: 'success'
            })
          } else {
            throw new Error(result.message || '签到失败')
          }
        })
        .catch((err) => {
          wx.hideLoading()
          wx.showToast({
            title: err.message || '签到失败，请重试',
            icon: 'none'
          })
        })
    }
  }
})
