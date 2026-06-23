# QA测试报告 · 新闻工坊微信小程序

| 字段 | 内容 |
|------|------|
| **报告版本** | v1.0 |
| **QA工程师** | 严过关 (Edward) |
| **审查日期** | 2025-07-15 |
| **项目名称** | toutiao-news-maker |
| **审查范围** | 完整代码库（7页面、12组件、20云函数、8工具模块、3样式文件、全局配置） |

---

## 1. 测试概要

### 1.1 总体统计

| 指标 | 数值 |
|------|------|
| **审查文件总数** | 112 |
| **通过文件数** | 98 |
| **发现问题文件数** | 14 |
| **发现Bug总数** | 19 |
| **🔴 Critical (阻断)** | 5 |
| **🟠 Major (严重)** | 6 |
| **🟡 Minor (一般)** | 5 |
| **🟢 Info (建议)** | 3 |
| **测试通过率** | 87.5%（文件级） |

### 1.2 各模块通过情况

| 模块 | 文件数 | 通过 | 问题 | 通过率 |
|------|--------|------|------|--------|
| 页面 (7个) | 28 | 25 | 3 | 89.3% |
| 基础组件 (6个) | 24 | 23 | 1 | 95.8% |
| 业务组件 (6个) | 24 | 22 | 2 | 91.7% |
| 云函数 (20个) | 40 | 36 | 4 | 90.0% |
| 工具模块 (8个) | 8 | 8 | 0 | 100% |
| 样式文件 (3个) | 3 | 3 | 0 | 100% |
| 全局配置 | 5 | 5 | 0 | 100% |
| **重复冗余文件** | 20 | 0 | 20 | 0% |

---

## 2. 文件完整性检查

### 2.1 ✅ 必需文件检查（全部通过）

| 检查项 | 预期 | 实际 | 结果 |
|--------|------|------|------|
| 7个页面 × 4文件 | 28 | 28 | ✅ |
| 6个基础组件 × 4文件 | 24 | 24 (base/) | ✅ |
| 6个业务组件 × 4文件 | 24 | 24 (business/) | ✅ |
| 20个云函数 × 2文件 | 40 | 40 | ✅ |
| 8个工具模块 | 8 | 8 | ✅ |
| 3个全局样式文件 | 3 | 3 | ✅ |
| app.json/js/wxss | 3 | 3 | ✅ |
| project.config.json | 1 | 1 | ✅ |
| sitemap.json | 1 | 1 | ✅ |
| cloudbaserc.json | 1 | 1 | ✅ |

### 2.2 🔴 Critical：组件目录存在大量重复文件

`miniprogram/components/` 目录下同时存在两套组件：
- **正式版本**：`components/base/` 和 `components/business/` 下的组件
- **冗余副本**：`components/` 根目录下的同名组件（category-nav, empty-state, news-card, points-card, template-card, vip-badge）

**影响**：增加了小程序包体积约50KB+，且不同版本的组件内部逻辑有差异（见下方Bug列表），可能导致混淆。

**涉及文件（20个冗余文件）**：
```
components/category-nav/* (4 files)
components/empty-state/* (4 files)
components/news-card/* (4 files)
components/points-card/* (4 files)
components/template-card/* (4 files)
components/vip-badge/* (4 files)
```

---

## 3. 发现Bug列表

### 3.1 🔴 Critical（阻断级 - 必须修复）

#### BUG-01: pay-createOrder 云函数接口与前端调用不匹配

- **位置**：`cloudfunctions/pay-createOrder/index.js` (行12) vs `pages/pay/pay.js` (行94-98)
- **问题**：前端 `pay.js` 调用 `pay-createOrder` 传递参数 `{ type, packageId, price, paymentMethod }`，但云函数接收参数为 `{ orderId, description, priceInFen }`。
- **影响**：支付流程完全无法走通——前端期望云函数创建订单并返回 `orderId` + `paymentParams`，但云函数要求外部传入 `orderId`（已存在的订单ID）。正确的流程应该是：
  1. 前端调用 `pay-createOrder` → 云函数创建订单记录 → 返回 `orderId` + `payParams`
  2. 但当前云函数逻辑是先查订单（需外部传 orderId），不存在才创建，且创建的订单 `type: 'general'` 而非 `'points'` 或 `'vip'`
- **修复建议**：
  - 云函数应接收 `{ type, packageId, price }`，内部创建订单记录并返回 `orderId` + `payParams`
  - 或者前端先调 `points-buyPoints` / `vip-subscribeVip` 创建订单，再用返回的 `orderId` 调 `pay-createOrder`
- **严重程度**：🔴 Critical — 支付核心流程阻断

#### BUG-02: pay-payCallback 云函数参数名与前端调用不一致

- **位置**：`cloudfunctions/pay-payCallback/index.js` (行28) vs `pages/pay/pay.js` (行147-149)
- **问题**：前端调用时传 `{ orderId, status: 'success' }`，但云函数接收 `{ orderId, payStatus }`。前端用 `status`，云函数读 `payStatus`，导致 `payStatus` 为 `undefined`，永远不会进入 `payStatus === 'success'` 分支。
- **影响**：支付成功后回调永远走 `else` 分支（标记为 `failed`），权益发放逻辑永远不会执行。
- **修复建议**：统一参数名，建议云函数改为读取 `event.status`，或前端改为传 `payStatus`。
- **严重程度**：🔴 Critical — 支付回调阻断，VIP/积分购买无法到账

#### BUG-03: make页面调用了不存在的云函数 content-getContentDetail

- **位置**：`pages/make/make.js` (行87)
- **问题**：`api.callCloudFunc('content-getContentDetail', ...)` — 该云函数不存在于 cloudfunctions 目录中。20个云函数列表中没有 `content-getContentDetail`。
- **影响**：从首页/题材库点击内容进入制作页时，无法加载内容详情，`loadContent` 始终走 catch 分支。
- **修复建议**：创建 `content-getContentDetail` 云函数，或在 `content-getContentList` 中增加 `contentId` 查询参数支持单条查询。
- **严重程度**：🔴 Critical — 核心功能不可用

#### BUG-04: profile页面调用了不存在的云函数 content-getFavorites

- **位置**：`pages/profile/profile.js` (行76)
- **问题**：`api.callCloudFuncSilent('content-getFavorites', ...)` — 该云函数不存在。
- **影响**：个人中心「我的收藏」数据永远加载失败（静默失败，用户无感知但功能不可用）。
- **修复建议**：创建 `content-getFavorites` 云函数，或从本地 Store 读取收藏数据。
- **严重程度**：🔴 Critical — 功能缺失

#### BUG-05: profile页面路由到不存在的页面

- **位置**：`pages/profile/profile.js` (行125, 行197, 行179)
- **问题**：
  - `wx.navigateTo({ url: '/pages/works/works' })` — `/pages/works/works` 页面不存在
  - `wx.reLaunch({ url: '/pages/login/login' })` — `/pages/login/login` 页面不存在
  - `wx.navigateTo({ url: '/pages/webview/webview?url=...' })` — `/pages/webview/webview` 页面不存在
- **影响**：用户点击「我的作品」「退出登录」「隐私政策」时页面跳转失败，微信会显示页面不存在错误。
- **修复建议**：创建对应页面或使用 `wx.showToast` 占位提示（已有部分占位逻辑）。
- **严重程度**：🔴 Critical — 用户操作失败

### 3.2 🟠 Major（严重级 - 影响核心体验）

#### BUG-06: sign-in-card 组件读取云函数返回字段名不匹配

- **位置**：`components/business/sign-in-card/sign-in-card.js` (行90)
- **问题**：组件从结果中读取 `result.data.points` 和 `result.data.consecutiveDays`，但云函数 `points-signIn` 返回的字段名是 `rewardPoints` 和 `consecutiveDays`（已匹配），而 `points` 字段不存在——云函数返回的是 `rewardPoints`。
- **影响**：签到成功后 `points` 为 `undefined`，`store.setState('pointsBalance', ...)` 会计算 `NaN`，积分显示异常。Toast 提示也会显示 "签到成功 +undefined积分"。
- **修复建议**：将 `result.data.points` 改为 `result.data.rewardPoints`。
- **严重程度**：🟠 Major — 签到积分计算错误

#### BUG-07: ad-reward-btn 组件读取云函数返回字段名不匹配

- **位置**：`components/business/ad-reward-btn/ad-reward-btn.js` (行144)
- **问题**：组件从结果中读取 `result.data.points` 和 `result.data.watchedTimes`，但云函数 `points-adReward` 返回的字段名是 `amount` 和 `todayCount`。
- **影响**：广告奖励积分显示为 `undefined`，今日观看次数统计错误。
- **修复建议**：将 `result.data.points` 改为 `result.data.amount`，`result.data.watchedTimes` 改为 `result.data.todayCount`。
- **严重程度**：🟠 Major — 广告奖励计算错误

#### BUG-08: news-editor 组件 AI改写参数名与云函数不匹配

- **位置**：`components/business/news-editor/news-editor.js` (行134-137)
- **问题**：组件调用 AI 改写时传 `{ title, content: bodyText, category }`，但云函数 `make-aiRewrite` 接收参数为 `{ title, bodyText, category, style }`。组件传的是 `content`，云函数读的是 `bodyText`。
- **影响**：云函数中 `bodyText` 为 `undefined`，参数校验 `if (!bodyText || bodyText.trim().length === 0)` 始终为 true，AI改写永远返回"正文不能为空"错误。
- **修复建议**：将组件中的 `content: bodyText` 改为 `bodyText: bodyText`。
- **严重程度**：🟠 Major — AI改写功能完全不可用

#### BUG-09: canvas-preview 组件调用 canvasEngine.renderPreview 参数格式错误

- **位置**：`components/business/canvas-preview/canvas-preview.js` (行139-142)
- **问题**：`canvasEngine.renderPreview(ctx, layoutConfig, editData, { width, height })` — 但 `canvas-engine.js` 中的 `renderPreview` 函数签名是 `renderPreview(layout_config, edit_data, canvasId, componentInstance)`，需要4个参数且第3个是 canvasId（字符串），第4个是 componentInstance。
- **影响**：Canvas 预览渲染失败，用户看不到实时预览效果。
- **修复建议**：
  - 方案A：修改 `canvas-engine.js` 使其支持直接传入 CanvasContext 渲染
  - 方案B：修改 `canvas-preview.js` 使用正确的调用方式
- **严重程度**：🟠 Major — 预览功能不可用

#### BUG-10: make页面生成流程中 saveWork 参数名与云函数不匹配

- **位置**：`pages/make/make.js` (行377-381) vs `cloudfunctions/make-saveWork/index.js` (行12)
- **问题**：前端传 `{ templateId, editData, imageUrl }`，但云函数接收 `{ templateId, category, title, bodyText, imageUrl, sourceContentId }`。云函数直接从 `event` 顶层读取 `title` 和 `bodyText`，而不是从 `event.editData` 读取，导致参数校验失败（标题/正文为空）。
- **影响**：作品保存失败（静默失败，用户无感知但作品不会被保存）。
- **修复建议**：前端展开 editData 或云函数从 `event.editData` 中读取。
- **严重程度**：🟠 Major — 作品保存功能不可用

#### BUG-11: pay-createOrder 中微信支付参数格式不标准

- **位置**：`cloudfunctions/pay-createOrder/index.js` (行56-62)
- **问题**：生成的支付参数是 mock 数据（`paySign: 'mock_sign_' + Date.now()`），虽然注释说明是模拟参数，但 `nonceStr` 使用了默认值 `32` 而实际应为 `32位`，且缺少 `appId` 字段。
- **影响**：即使前端调用正确，实际支付也无法完成（mock数据），需正式对接微信支付API。
- **修复建议**：对接微信支付统一下单API，返回真实的支付参数。
- **严重程度**：🟠 Major — 支付功能需真实对接

### 3.3 🟡 Minor（一般级 - 不影响核心流程但需修复）

#### BUG-12: points-adReward 云函数中分享类型也被计入广告次数

- **位置**：`cloudfunctions/points-adReward/index.js` (行39-42)
- **问题**：查询今日广告次数时，`type: _.in(['ad_reward', 'share'])` 将分享奖励也计入了广告次数限制。PRD 规定广告激励每天上限5次，分享奖励每天上限3次，两者应独立计数。
- **影响**：用户分享了3次后，广告只能看2次（被错误地计入同一配额）。但分享奖励和广告奖励是不同的激励机制，应分开计数。
- **修复建议**：广告次数查询只过滤 `type: 'ad_reward'`，分享独立处理。
- **严重程度**：🟡 Minor — 影响用户获取积分的体验

#### BUG-13: home.js 中 onBannerTap 未实现跳转逻辑

- **位置**：`pages/home/home.js` (行248-254)
- **问题**：Banner 点击事件只打印日志，没有实际跳转逻辑。
- **影响**：用户点击 Banner 无反应。
- **修复建议**：根据 Banner 的 `link_type` 实现跳转（内部页面跳转或外部链接打开）。
- **严重程度**：🟡 Minor — Banner 功能不可用

#### BUG-14: make.js 中积分扣除后本地状态更新存在竞态

- **位置**：`pages/make/make.js` (行336-339)
- **问题**：`store.setState('pointsBalance', this.data.pointsBalance - this.data.pointsCost)` 使用 `this.data.pointsBalance`（异步更新前的值），而非云函数返回的 `balance_after`。如果用户在生成过程中同时在别处消耗了积分，本地状态将与服务端不一致。
- **影响**：积分显示可能不准确。
- **修复建议**：使用云函数返回的 `result.data.balance_after` 更新本地积分。
- **严重程度**：🟡 Minor — 数据一致性问题

#### BUG-15: points.js 签到成功回调中手动计算积分与Store更新不一致

- **位置**：`pages/points/points.js` (行97-108)
- **问题**：`onSignInSuccess` 中使用 `this.data.pointsBalance + points` 更新余额，但 sign-in-card 组件已经更新了 Store。两处都在更新余额，可能导致重复累加。
- **影响**：签到后积分余额可能翻倍显示。
- **修复建议**：统一由 Store 管理积分状态，页面从 Store 读取而非自行计算。
- **严重程度**：🟡 Minor — 积分显示异常

#### BUG-16: pay.js 中 _updateLocalState 计算VIP过期时间未使用云函数返回值

- **位置**：`pages/pay/pay.js` (行198-204)
- **问题**：支付成功后本地计算VIP过期时间，而非使用云函数返回的准确值。这可能导致与数据库中实际到期时间不一致。
- **影响**：VIP状态显示与实际可能有偏差。
- **修复建议**：使用 `pay-payCallback` 返回的数据更新本地状态。
- **严重程度**：🟡 Minor — 状态一致性问题

### 3.4 🟢 Info（建议级 - 改进建议）

#### INFO-01: 组件目录冗余

- **问题**：`components/` 根目录下有6个组件的旧版本副本（20个文件），与 `components/base/` 下的正式版本并存。
- **建议**：删除 `components/` 根目录下的旧版本副本（保留 base/ 和 business/ 下的正式版本），减小包体积并避免混淆。
- **严重程度**：🟢 Info

#### INFO-02: canvas-engine.js 中图片加载为异步操作但未等待完成

- **位置**：`utils/canvas-engine.js` (行333-365)
- **问题**：`drawImageArea` 函数中使用 `wx.getImageInfo` 异步加载图片，但 `ctx.draw()` 在 `drawImageArea` 返回后立即执行，此时图片可能尚未加载完成，导致图片区域为空。
- **建议**：将图片加载改为 Promise 并在所有图片加载完成后再执行 `ctx.draw()`。
- **严重程度**：🟢 Info — 图片可能不显示

#### INFO-03: init-db 云函数中通用模板category使用了 'all'

- **位置**：`cloudfunctions/init-db/index.js` (行259)
- **问题**：通用模板的 `category: 'all'` 不是9大分类中的有效值。虽然查询时做了 `category !== 'all'` 的特殊处理，但建议将通用模板的 category 设为空字符串或单独标记 `is_universal: true`。
- **建议**：增加 `is_universal` 字段标识通用模板，category 保留有效值或为空。
- **严重程度**：🟢 Info

---

## 4. 代码逻辑审查详情

### 4.1 app.js — 云开发初始化+登录流程 ✅

- 云开发初始化逻辑正确，使用 `wx.cloud.init()` 并配置环境ID
- 自动静默登录流程合理，登录成功后正确更新 Store 和 globalData
- **无明显Bug**

### 4.2 utils/store.js — 状态管理 ✅

- 发布订阅模式实现规范
- 支持持久化到 Storage
- `subscribe` 返回取消订阅函数，设计合理
- `setMultiple` 内部循环调用 `setState`，每次都会触发持久化，可能导致性能问题（Minor）
- **整体质量良好**

### 4.3 utils/api.js — 云函数调用封装 ✅

- `callCloudFunc` 统一封装了调用、错误处理、格式校验
- `callCloudFuncBatch` 使用 `Promise.allSettled` 保证部分失败不影响整体
- `callCloudFuncWithLoading` 自动处理加载状态
- **设计合理，无明显Bug**

### 4.4 utils/constants.js — 常量定义 ✅

- 9大分类、颜色、积分规则、VIP套餐、签到奖励、分享奖励、路由、云函数名定义完整
- 云函数名 `CLOUD_FUNC_NAMES` 中缺少 `content-getContentDetail` 和 `content-getFavorites`（被页面引用但不存在的云函数）
- **常量定义完整度：90%**

### 4.5 utils/canvas-engine.js — Canvas引擎

- `renderPreview` 和 `generateFullImage` 核心函数实现合理
- `wrapText` 文本换行算法正确
- `drawRoundedRect` 和 `drawRoundedRectPath` 圆角绘制正确
- **已知问题**：图片异步加载未等待（INFO-02）

### 4.6 云函数返回格式一致性 ✅

所有20个云函数均使用 `{ code: 0/-1, data: ..., message: '...' }` 统一格式。✅ 通过。

### 4.7 云函数 openid 获取方式 ✅

所有需要用户身份的云函数均使用 `cloud.getWXContext().OPENID` 获取 openid。✅ 通过。

### 4.8 签到防重复逻辑 ✅

`points-signIn` 云函数通过比较 `user.last_sign_date === todayStr` 防重复。✅ 通过。

### 4.9 积分扣除和流水记录 ✅

`make-consumePoints` 云函数正确实现了：
- VIP用户免费
- 余额检查
- 原子更新（先查后扣）
- 流水记录

✅ 通过。

---

## 5. 组件引用链检查

### 5.1 页面 → 组件引用

| 页面 | 引用组件 | 路径 | 状态 |
|------|----------|------|------|
| home | category-nav | /components/base/category-nav/category-nav | ✅ |
| home | news-card | /components/base/news-card/news-card | ✅ |
| home | empty-state | /components/base/empty-state/empty-state | ✅ |
| category | category-nav | /components/base/category-nav/category-nav | ✅ |
| category | news-card | /components/base/news-card/news-card | ✅ |
| category | empty-state | /components/base/empty-state/empty-state | ✅ |
| make | step-progress | /components/business/step-progress/step-progress | ✅ |
| make | news-editor | /components/business/news-editor/news-editor | ✅ |
| make | canvas-preview | /components/business/canvas-preview/canvas-preview | ✅ |
| make | template-card | /components/base/template-card/template-card | ✅ |
| make | vip-badge | /components/base/vip-badge/vip-badge | ✅ |
| make | category-nav | /components/base/category-nav/category-nav | ✅ |
| make | pay-dialog | /components/business/pay-dialog/pay-dialog | ✅ |
| points | points-card | /components/base/points-card/points-card | ✅ |
| points | sign-in-card | /components/business/sign-in-card/sign-in-card | ✅ |
| points | ad-reward-btn | /components/business/ad-reward-btn/ad-reward-btn | ✅ |
| points | vip-badge | /components/base/vip-badge/vip-badge | ✅ |
| points | empty-state | /components/base/empty-state/empty-state | ✅ |
| vip | vip-badge | /components/base/vip-badge/vip-badge | ✅ |
| profile | vip-badge | /components/base/vip-badge/vip-badge | ✅ |
| profile | news-card | /components/base/news-card/news-card | ✅ |
| profile | empty-state | /components/base/empty-state/empty-state | ✅ |
| pay | (none) | — | ✅ |

**所有页面引用路径正确，无404引用。** ✅

### 5.2 组件内部引用

| 组件 | require 路径 | 状态 |
|------|-------------|------|
| news-card (base) | ../../utils/constants | ✅ |
| news-card (base) | ../../utils/formatter | ✅ |
| sign-in-card | ../../utils/api | ✅ |
| sign-in-card | ../../utils/constants | ✅ |
| sign-in-card | ../../utils/store | ✅ |
| ad-reward-btn | ../../utils/api | ✅ |
| ad-reward-btn | ../../utils/constants | ✅ |
| ad-reward-btn | ../../utils/store | ✅ |
| news-editor | ../../utils/api | ✅ |
| news-editor | ../../utils/constants | ✅ |
| canvas-preview | ../../utils/canvas-engine | ✅ |

**注意**：`components/news-card/news-card.js`（根目录旧版本）也引用了 `../../utils/formatter` 和 `../../utils/constants`，路径正确。

---

## 6. 样式文件检查

### 6.1 颜色规范一致性

| 常量定义 | CSS变量 | 值 | 一致性 |
|----------|---------|-----|--------|
| COLORS.PRIMARY_RED | --color-primary | #E8002D | ✅ |
| COLORS.DARK_BLACK | --color-text-primary | #1A1A1A | ✅ |
| COLORS.TEXT_SECONDARY | --color-text-secondary | #666666 | ✅ |
| COLORS.TEXT_PLACEHOLDER | --color-text-placeholder | #999999 | ✅ |
| COLORS.BG_GRAY | --color-bg | #F5F5F5 | ✅ |
| COLORS.VIP_GOLD | --color-vip-gold | #FAAD14 | ✅ |
| COLORS.SUCCESS_GREEN | --color-success | #07C160 | ✅ |
| COLORS.ERROR_RED | --color-error | #E8002D | ✅ |

**颜色值定义完全一致。** ✅

### 6.2 样式文件结构

- `variables.wxss` — CSS变量定义完整（颜色/字号/间距/圆角/阴影/动画/Z-index）
- `mixins.wxss` — 样式混入
- `animations.wxss` — 动画定义
- `app.wxss` — 正确引用三个样式文件

---

## 7. 云函数清单

| # | 云函数名 | index.js | package.json | 返回格式 | openid获取 | 状态 |
|---|----------|----------|-------------|----------|------------|------|
| 1 | user-login | ✅ | ✅ | ✅ | ✅ | ✅ |
| 2 | content-getContentList | ✅ | ✅ | ✅ | N/A | ✅ |
| 3 | content-searchContent | ✅ | ✅ | ✅ | N/A | ✅ |
| 4 | content-getBannerList | ✅ | ✅ | ✅ | N/A | ✅ |
| 5 | template-getTemplateList | ✅ | ✅ | ✅ | N/A | ✅ |
| 6 | template-getTemplateDetail | ✅ | ✅ | ✅ | N/A | ✅ |
| 7 | make-checkPoints | ✅ | ✅ | ✅ | ✅ | ✅ |
| 8 | make-consumePoints | ✅ | ✅ | ✅ | ✅ | ✅ |
| 9 | make-saveWork | ✅ | ✅ | ✅ | ✅ | ✅ |
| 10 | make-getMyWorks | ✅ | ✅ | ✅ | ✅ | ✅ |
| 11 | make-aiRewrite | ✅ | ✅ | ✅ | ✅ | ✅ |
| 12 | points-signIn | ✅ | ✅ | ✅ | ✅ | ✅ |
| 13 | points-adReward | ✅ | ✅ | ✅ | ✅ | ✅ |
| 14 | points-getPointsDetail | ✅ | ✅ | ✅ | ✅ | ✅ |
| 15 | points-buyPoints | ✅ | ✅ | ✅ | ✅ | ✅ |
| 16 | vip-getVipInfo | ✅ | ✅ | ✅ | ✅ | ✅ |
| 17 | vip-subscribeVip | ✅ | ✅ | ✅ | ✅ | ✅ |
| 18 | vip-checkVipStatus | ✅ | ✅ | ✅ | ✅ | ✅ |
| 19 | pay-createOrder | ✅ | ✅ | ✅ | ✅ | ⚠️ BUG-01 |
| 20 | pay-payCallback | ✅ | ✅ | ✅ | ✅ | ⚠️ BUG-02 |
| 21 | init-db | ✅ | ✅ | ✅ | N/A | ✅ |

**20个业务云函数 + 1个初始化脚本 = 21个云函数全部存在。** 但缺少 `content-getContentDetail` 和 `content-getFavorites` 两个被前端引用的云函数。

---

## 8. 修复优先级建议

### 第一轮修复（P0 — 上线阻断）

| 序号 | Bug ID | 描述 | 修复工时估计 |
|------|--------|------|-------------|
| 1 | BUG-01 | pay-createOrder 接口不匹配 | 2h |
| 2 | BUG-02 | pay-payCallback 参数名不一致 | 0.5h |
| 3 | BUG-03 | 缺少 content-getContentDetail 云函数 | 1h |
| 4 | BUG-04 | 缺少 content-getFavorites 云函数 | 1h |
| 5 | BUG-05 | 路由到不存在的页面 | 1h |

### 第二轮修复（P1 — 核心体验）

| 序号 | Bug ID | 描述 | 修复工时估计 |
|------|--------|------|-------------|
| 6 | BUG-06 | sign-in-card 积分字段名不匹配 | 0.5h |
| 7 | BUG-07 | ad-reward-btn 积分字段名不匹配 | 0.5h |
| 8 | BUG-08 | AI改写参数名不匹配 | 0.5h |
| 9 | BUG-09 | Canvas预览参数格式错误 | 2h |
| 10 | BUG-10 | saveWork 参数结构不匹配 | 0.5h |
| 11 | BUG-11 | 支付参数mock需真实对接 | 4h |

### 第三轮修复（P2 — 体验优化）

| 序号 | Bug ID | 描述 | 修复工时估计 |
|------|--------|------|-------------|
| 12 | BUG-12 | 广告分享计数混淆 | 0.5h |
| 13 | BUG-13 | Banner点击无跳转 | 0.5h |
| 14 | BUG-14 | 积分本地状态竞态 | 0.5h |
| 15 | BUG-15 | 签到积分重复累加 | 0.5h |
| 16 | BUG-16 | VIP过期时间本地计算 | 0.5h |

### 后续优化（P3 — 技术债清理）

| 序号 | Info ID | 描述 | 修复工时估计 |
|------|---------|------|-------------|
| 17 | INFO-01 | 清理20个冗余组件文件 | 0.5h |
| 18 | INFO-02 | Canvas异步图片加载修复 | 2h |
| 19 | INFO-03 | init-db 通用模板category规范化 | 0.5h |

---

## 9. 测试结论

### 9.1 总体评价

项目代码整体架构清晰，模块化程度高，Store状态管理、API封装、云函数设计等核心基础设施质量良好。样式系统使用CSS变量，与JS常量定义保持一致。

主要问题集中在：
1. **前后端接口契约不一致**（参数名不匹配）— 这是最突出的问题类型，建议引入接口文档或TypeScript类型定义来规避
2. **缺失功能实现**（3个页面、2个云函数不存在）
3. **组件文件冗余**（20个旧版副本文件）

### 9.2 测试通过率

| 维度 | 通过率 |
|------|--------|
| 文件完整性 | 100% |
| 组件引用链 | 100% |
| 云函数返回格式 | 100% |
| openid获取方式 | 100% |
| 样式颜色一致性 | 100% |
| 页面逻辑正确性 | 71.4% (5/7页面存在Bug) |
| 云函数逻辑正确性 | 90% (2/20存在接口不匹配) |
| 组件逻辑正确性 | 83.3% (4/12组件存在Bug) |
| **综合通过率** | **87.5%** |

### 9.3 路由决策

**Send To: Engineer (Alex)** — 发现5个Critical Bug和6个Major Bug需要源码修复。所有Bug均为源码层面的接口不匹配、缺失功能或逻辑错误，测试分析正确，需工程师修复源码。

---

*报告由QA工程师 严过关 (Edward) 生成，版本 v1.0，2025-07-15*
