// utils/constants.js - 全局常量定义

/** 9大题材分类映射 */
const CATEGORY_LIST = {
  sports: { key: 'sports', label: '体育', icon: '🏆', color: '#FF6B35', sort: 1 },
  car: { key: 'car', label: '汽车', icon: '🚗', color: '#4ECDC4', sort: 2 },
  agriculture: { key: 'agriculture', label: '三农', icon: '🌾', color: '#7CB342', sort: 3 },
  finance: { key: 'finance', label: '财经', icon: '💰', color: '#FFD93D', sort: 4 },
  tech: { key: 'tech', label: '科技', icon: '💡', color: '#6C5CE7', sort: 5 },
  international: { key: 'international', label: '国际', icon: '🌍', color: '#00B894', sort: 6 },
  house: { key: 'house', label: '房产', icon: '🏠', color: '#E17055', sort: 7 },
  entertainment: { key: 'entertainment', label: '娱乐', icon: '🎭', color: '#FD79A8', sort: 8 },
  food: { key: 'food', label: '美食', icon: '🍜', color: '#FDCB6E', sort: 9 }
}

/** 题材分类键名列表（按排序顺序） */
const CATEGORY_KEYS = Object.values(CATEGORY_LIST)
  .sort((a, b) => a.sort - b.sort)
  .map((item) => item.key)

/** 全局颜色常量 */
const COLORS = {
  PRIMARY_RED: '#E8002D',
  PRIMARY_RED_LIGHT: '#FF4D6A',
  PRIMARY_RED_DARK: '#C40024',
  DARK_BLACK: '#1A1A1A',
  TEXT_PRIMARY: '#1A1A1A',
  TEXT_SECONDARY: '#666666',
  TEXT_PLACEHOLDER: '#999999',
  TEXT_WHITE: '#FFFFFF',
  BG_GRAY: '#F5F5F5',
  BG_WHITE: '#FFFFFF',
  CARD_WHITE: '#FFFFFF',
  CARD_SHADOW: '#00000010',
  VIP_GOLD: '#FAAD14',
  VIP_GOLD_LIGHT: '#FFE58F',
  SUCCESS_GREEN: '#07C160',
  WARNING_ORANGE: '#FAAD14',
  ERROR_RED: '#E8002D',
  DIVIDER: '#EEEEEE',
  BORDER: '#DDDDDD',
  TAG_BG: '#F0F0F0',
  TAG_TEXT: '#666666',
  OVERLAY: '#00000080'
}

/** 积分消耗规则 */
const POINTS_COST = {
  NORMAL_TEMPLATE: 2,    // 普通模板消耗积分
  AI_REWRITE: 5,         // AI改写消耗积分
  VIP_FREE: 0            // VIP用户免费
}

/** VIP套餐配置 */
const VIP_PACKAGES = [
  {
    id: 'vip_month',
    name: '月卡',
    durationDays: 30,
    price: 18,
    priceYuan: '¥18',
    originalPrice: 30,
    originalPriceYuan: '¥30',
    discount: '6折',
    description: '30天畅享所有模板',
    isRecommended: false
  },
  {
    id: 'vip_quarter',
    name: '季卡',
    durationDays: 90,
    price: 42,
    priceYuan: '¥42',
    originalPrice: 90,
    originalPriceYuan: '¥90',
    discount: '4.7折',
    description: '90天畅享所有模板',
    isRecommended: true
  },
  {
    id: 'vip_year',
    name: '年卡',
    durationDays: 365,
    price: 128,
    priceYuan: '¥128',
    originalPrice: 360,
    originalPriceYuan: '¥360',
    discount: '3.5折',
    description: '365天畅享所有模板',
    isRecommended: false
  }
]

/** 积分购买套餐 */
const POINTS_PACKAGES = [
  {
    id: 'points_30',
    name: '体验包',
    points: 30,
    price: 3,
    priceYuan: '¥3',
    unitPrice: '0.1分/¥',
    description: '30积分',
    isRecommended: false
  },
  {
    id: 'points_100',
    name: '标准包',
    points: 100,
    price: 8,
    priceYuan: '¥8',
    unitPrice: '0.08分/¥',
    description: '100积分',
    isRecommended: true
  },
  {
    id: 'points_300',
    name: '超值包',
    points: 300,
    price: 18,
    priceYuan: '¥18',
    unitPrice: '0.06分/¥',
    description: '300积分',
    isRecommended: false
  },
  {
    id: 'points_1000',
    name: '专业包',
    points: 1000,
    price: 48,
    priceYuan: '¥48',
    unitPrice: '0.048分/¥',
    description: '1000积分',
    isRecommended: false
  }
]

/** 签到奖励规则 */
const SIGN_REWARD = {
  BASE_POINTS: 3,           // 每日签到基础奖励3积分
  CONSECUTIVE_BONUS: [
    { days: 3, bonus: 2 },  // 连续3天额外2分
    { days: 7, bonus: 5 },  // 连续7天额外5分
    { days: 15, bonus: 10 }, // 连续15天额外10分
    { days: 30, bonus: 20 }  // 连续30天额外20分
  ],
  AD_REWARD_POINTS: 2,      // 广告激励每次奖励2积分
  AD_REWARD_MAX_PER_DAY: 5  // 每天广告激励上限5次
}

/** 分享奖励 */
const SHARE_REWARD = {
  POINTS: 5,             // 分享成功奖励积分
  MAX_PER_DAY: 3         // 每天分享奖励上限3次
}

/** VIP权益列表 */
const VIP_BENEFITS = [
  { icon: '🎯', title: '模板免费', description: '所有模板无限免费使用' },
  { icon: '✨', title: 'AI改写免费', description: 'AI智能改写功能免费使用' },
  { icon: '🏷', title: '去除水印', description: '生成图片去除VIP水印' },
  { icon: '📦', title: '更多素材', description: '独家VIP素材库权限' },
  { icon: '⚡', title: '优先体验', description: '新功能优先体验资格' }
]

/** 页面路由常量 */
const ROUTES = {
  HOME: '/pages/home/home',
  CATEGORY: '/pages/category/category',
  MAKE: '/pages/make/make',
  POINTS: '/pages/points/points',
  VIP: '/pages/vip/vip',
  PROFILE: '/pages/profile/profile',
  PAY: '/pages/pay/pay'
}

/** 云函数名称常量 */
const CLOUD_FUNC_NAMES = {
  USER_LOGIN: 'user-login',
  CONTENT_GET_LIST: 'content-getContentList',
  CONTENT_SEARCH: 'content-searchContent',
  CONTENT_GET_BANNER: 'content-getBannerList',
  TEMPLATE_GET_LIST: 'template-getTemplateList',
  TEMPLATE_GET_DETAIL: 'template-getTemplateDetail',
  MAKE_CHECK_POINTS: 'make-checkPoints',
  MAKE_CONSUME_POINTS: 'make-consumePoints',
  MAKE_SAVE_WORK: 'make-saveWork',
  MAKE_GET_MY_WORKS: 'make-getMyWorks',
  MAKE_AI_REWRITE: 'make-aiRewrite',
  POINTS_SIGN_IN: 'points-signIn',
  POINTS_AD_REWARD: 'points-adReward',
  POINTS_GET_DETAIL: 'points-getPointsDetail',
  POINTS_BUY: 'points-buyPoints',
  VIP_GET_INFO: 'vip-getVipInfo',
  VIP_SUBSCRIBE: 'vip-subscribeVip',
  VIP_CHECK_STATUS: 'vip-checkVipStatus',
  PAY_CREATE_ORDER: 'pay-createOrder',
  PAY_CALLBACK: 'pay-payCallback'
}

module.exports = {
  CATEGORY_LIST,
  CATEGORY_KEYS,
  COLORS,
  POINTS_COST,
  VIP_PACKAGES,
  POINTS_PACKAGES,
  SIGN_REWARD,
  SHARE_REWARD,
  VIP_BENEFITS,
  ROUTES,
  CLOUD_FUNC_NAMES
}
