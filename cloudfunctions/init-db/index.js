// cloudfunctions/init-db/index.js
// 云数据库初始化脚本 - 创建10个集合+插入初始数据
// 需手动在云开发控制台执行或通过云函数触发一次

const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

/** 10个集合名称 */
const COLLECTION_NAMES = [
  'users',
  'content',
  'templates',
  'works',
  'points_records',
  'orders',
  'banners',
  'vip_records',
  'share_records',
  'feedback'
]

/** 9大题材分类 */
const CATEGORIES = [
  { key: 'sports', label: '体育' },
  { key: 'car', label: '汽车' },
  { key: 'agriculture', label: '三农' },
  { key: 'finance', label: '财经' },
  { key: 'tech', label: '科技' },
  { key: 'international', label: '国际' },
  { key: 'house', label: '房产' },
  { key: 'entertainment', label: '娱乐' },
  { key: 'food', label: '美食' }
]

/** 每个题材5条示例内容 */
const INITIAL_CONTENT_DATA = {
  sports: [
    { title: '国足世预赛大胜，球迷狂欢庆祝', body_text: '在昨晚的世界杯预选赛中，中国国家男子足球队以3:0大胜对手，创造了近年来最佳战绩。全场球迷沸腾，社交媒体上一片欢腾。这场胜利不仅让球迷重燃希望，也让国足的世界杯之路更加光明。', source: '体育新闻网', sort_weight: 100, is_featured: true },
    { title: 'NBA季后赛火热开打，湖人队首战告捷', body_text: 'NBA季后赛正式拉开帷幕，洛杉矶湖人队在首场比赛中展现了强大的实力，以112:98击败对手。詹姆斯全场砍下35分8篮板7助攻的全面数据，带领球队取得开门红。', source: '体育频道', sort_weight: 90, is_featured: false },
    { title: '马拉松赛事报名火爆，全民健身热潮持续', body_text: '2025年全国马拉松赛事报名人数再创新高，多个城市马拉松赛事名额在开售后几分钟内就被抢光。全民健身热潮持续升温，越来越多的人加入跑步运动。', source: '健康运动报', sort_weight: 80, is_featured: false },
    { title: '奥运冠军退役后转型教练，培养新一代选手', body_text: '多位奥运冠军在退役后选择转型为教练，将自己多年的竞技经验传承给新一代运动员。他们的加入为中国体育事业注入了新的活力，培养出更多优秀的年轻选手。', source: '体育周刊', sort_weight: 70, is_featured: false },
    { title: '电竞产业发展迅猛，职业选手收入创新高', body_text: '中国电竞产业2025年产值突破500亿元，顶级职业选手年收入可达数百万。电竞已正式成为体育竞技项目，获得越来越多社会认可和政府支持。', source: '电竞资讯', sort_weight: 60, is_featured: false }
  ],
  car: [
    { title: '新能源车销量再破纪录，行业格局加速重塑', body_text: '2025年上半年新能源汽车销量突破300万辆，同比增长45%。多家传统车企加速电动化转型，新势力品牌持续推出创新产品。充电基础设施建设也在快速推进，覆盖范围不断扩大。', source: '汽车之家', sort_weight: 100, is_featured: true },
    { title: '智能驾驶技术突破，L4级自动驾驶落地试运营', body_text: '多家科技公司宣布L4级自动驾驶技术取得重大突破，开始在指定区域进行试运营。智能驾驶技术的成熟将彻底改变出行方式，未来前景广阔。', source: '科技汽车', sort_weight: 90, is_featured: false },
    { title: '油价波动影响购车决策，燃油车市场份额下滑', body_text: '国际油价持续波动，国内成品油价格多次调整。消费者购车偏好明显向新能源倾斜，传统燃油车市场份额持续下滑，车企纷纷调整产品策略。', source: '财经汽车', sort_weight: 80, is_featured: false },
    { title: '汽车召回事件频发，质量安全引关注', body_text: '近期多家知名车企发布大规模召回通知，涉及制动系统、电池安全等多个问题。消费者对汽车质量安全关注度显著提升，监管部门加大检查力度。', source: '质量日报', sort_weight: 70, is_featured: false },
    { title: '二手车市场规范化，交易平台诚信度提升', body_text: '二手车市场规范化进程加速，多个交易平台推出车辆检测认证服务。消费者购买二手车的信心增强，市场交易量稳步增长。', source: '二手车周刊', sort_weight: 60, is_featured: false }
  ],
  agriculture: [
    { title: '智慧农业落地推广，数字化助力乡村振兴', body_text: '智慧农业技术在多地成功落地推广，物联网传感器、无人机巡田、AI病虫害识别等技术帮助农民提高产量降低成本。数字化正成为乡村振兴的重要引擎。', source: '农民日报', sort_weight: 100, is_featured: true },
    { title: '农产品直播带货火爆，新农人收入翻倍', body_text: '越来越多的新农人通过直播带货销售农产品，线上销量暴增。一位果农表示直播让其收入翻了两番，这种新模式正在改变传统农产品销售格局。', source: '乡村频道', sort_weight: 90, is_featured: false },
    { title: '粮食丰收喜报频传，保障国家粮食安全', body_text: '2025年全国粮食生产喜报频传，多个主产区产量创历史新高。农业科技的应用和管理水平的提升，为国家粮食安全提供了坚实保障。', source: '农业新闻', sort_weight: 80, is_featured: false },
    { title: '农村电商蓬勃发展，物流打通最后一公里', body_text: '农村电商基础设施建设取得重大进展，快递物流网络覆盖更多偏远村镇。打通最后一公里让更多农产品走出大山，农民增收效果显著。', source: '电商农业报', sort_weight: 70, is_featured: false },
    { title: '有机食品市场增长，绿色种植成新趋势', body_text: '消费者对健康食品需求增长推动有机食品市场快速扩大。绿色种植、无农药栽培成为农业生产新趋势，认证标准体系不断完善。', source: '绿色农业', sort_weight: 60, is_featured: false }
  ],
  finance: [
    { title: 'A股市场强势反弹，投资者信心回暖', body_text: 'A股市场近期强势反弹，主要指数涨幅明显。多只蓝筹股领涨，成交量大幅增加。分析师认为经济基本面改善和政策利好是推动市场上涨的主要因素。投资者信心明显回暖。', source: '财经头条', sort_weight: 100, is_featured: true },
    { title: '数字人民币试点范围扩大，应用场景丰富', body_text: '数字人民币试点城市增至30个，应用场景从零售支付扩展到公共交通、政务服务等领域。试点数据显示用户活跃度和交易频次持续增长，数字人民币推广进入新阶段。', source: '金融时报', sort_weight: 90, is_featured: false },
    { title: '银行利率调整，理财产品收益率变化', body_text: '多家银行调整存款利率和理财产品收益率。市场分析人士提醒投资者关注利率变化趋势，合理调整资产配置策略，分散风险。', source: '银行周刊', sort_weight: 80, is_featured: false },
    { title: '创业投资热度不减，科技创新获资本青睐', body_text: '2025年创业投资市场保持高热度，人工智能、生物医药、新能源等领域获得大量资本青睐。多家科技初创企业完成大额融资，创新驱动发展战略成效显著。', source: '创投日报', sort_weight: 70, is_featured: false },
    { title: '保险业数字化转型提速，线上理赔效率大增', body_text: '保险行业数字化转型加速，多家保险公司推出智能理赔服务。线上理赔平均处理时间从7天缩短至2天，客户满意度大幅提升。', source: '保险观察', sort_weight: 60, is_featured: false }
  ],
  tech: [
    { title: '国产芯片取得重大突破，自研能力大幅提升', body_text: '中国自主研发芯片取得重大技术突破，多款高性能芯片成功量产。从设计到制造的全产业链能力大幅提升，为科技自立自强奠定坚实基础。国际市场竞争力显著增强。', source: '科技日报', sort_weight: 100, is_featured: true },
    { title: 'AI大模型竞赛白热化，国产模型表现亮眼', body_text: '国内AI大模型发展进入白热化阶段，多家科技公司推出新一代大语言模型。国产模型在多项评测中表现亮眼，部分指标已达到国际领先水平。', source: 'AI科技', sort_weight: 90, is_featured: false },
    { title: '5G应用场景全面开花，万物互联时代加速到来', body_text: '5G技术在工业制造、远程医疗、自动驾驶等领域全面开花。万物互联时代加速到来，5G正在从通信基础设施升级为数字经济核心引擎。', source: '通信世界', sort_weight: 80, is_featured: false },
    { title: '量子计算研究进展，中国团队再创纪录', body_text: '中国量子计算研究团队再次取得重大进展，量子比特数量和计算精度双双突破纪录。量子计算从实验室走向实际应用的前景更加明朗。', source: '量子科技报', sort_weight: 70, is_featured: false },
    { title: '手机创新不断，折叠屏和卫星通信成新标配', body_text: '智能手机创新持续推进，折叠屏技术和卫星通信功能成为高端手机新标配。多家厂商推出创新产品，消费者选择更加丰富多元。', source: '数码前线', sort_weight: 60, is_featured: false }
  ],
  international: [
    { title: '全球气候峰会达成新共识，减排目标加码', body_text: '全球气候峰会闭幕，各国达成新的减排共识。多个大国承诺加大减排力度，发展中国家获得更多气候资金支持。环保组织对峰会成果给予积极评价。', source: '国际新闻', sort_weight: 100, is_featured: true },
    { title: '国际贸易格局重塑，多边合作趋势加强', body_text: '全球贸易格局正在重塑，区域贸易协定增多，多边合作趋势加强。新兴市场国家在全球贸易中的比重持续上升，贸易多元化发展势头良好。', source: '环球经贸', sort_weight: 90, is_featured: false },
    { title: '海外华人成就瞩目，多领域影响力扩大', body_text: '海外华人在科技、商业、文化等多个领域取得瞩目成就，影响力不断扩大。他们不仅促进了中外交流，也为全球经济和文化发展贡献了重要力量。', source: '华人周刊', sort_weight: 80, is_featured: false },
    { title: '国际科技合作加深，跨国研发项目增多', body_text: '国际科技合作持续加深，跨国联合研发项目数量增多。在航天探索、新能源、医药研发等领域，多国合作成果丰硕，推动了全球科技进步。', source: '科技国际合作', sort_weight: 70, is_featured: false },
    { title: '全球旅游复苏加速，热门目的地游客爆满', body_text: '全球旅游业复苏加速，多个热门旅游目的地游客数量恢复甚至超过疫情前水平。旅游产业为各国经济注入活力，文化交流更加频繁。', source: '环球旅行', sort_weight: 60, is_featured: false }
  ],
  house: [
    { title: '楼市政策利好频出，刚需购房者信心回升', body_text: '多地出台楼市利好政策，包括降低首付比例、放宽限购条件、提高公积金贷款额度等。刚需购房者信心回升，市场交易量环比增长明显。分析师认为政策效应将持续释放。', source: '房产日报', sort_weight: 100, is_featured: true },
    { title: '保障性住房建设提速，惠及更多低收入家庭', body_text: '全国保障性住房建设进度加快，多地超额完成年度建设目标。更多低收入家庭受益，居住条件显著改善。保障房体系建设进入加速期。', source: '住房保障报', sort_weight: 90, is_featured: false },
    { title: '长租市场规范化，租房族权益得到保障', body_text: '长租公寓市场规范化改革深入推进，租金管制、租期保障、维修责任等政策明确落地。租房族权益得到更好保障，市场信心逐步恢复。', source: '租房周刊', sort_weight: 80, is_featured: false },
    { title: '老旧小区改造惠民生，居民幸福感大幅提升', body_text: '老旧小区改造工程持续推进，加装电梯、完善管网、美化环境等举措让居民幸福感大幅提升。改造后的老旧小区焕然一新，成为城市更新的典范。', source: '城市更新报', sort_weight: 70, is_featured: false },
    { title: '智能家居系统普及，科技改变居住体验', body_text: '智能家居系统在新房交付中普及率超过60%，智能门锁、语音控制、远程监控等功能改变了传统居住体验。科技让家变得更安全更便捷。', source: '智能家居', sort_weight: 60, is_featured: false }
  ],
  entertainment: [
    { title: '国产电影票房创新高，文化软实力提升', body_text: '2025年国产电影总票房突破300亿，多部优质影片获得口碑与票房双丰收。国产电影品质持续提升，文化软实力不断增强，国际影响力扩大。', source: '娱乐头条', sort_weight: 100, is_featured: true },
    { title: '短视频创作新趋势，优质内容创作者涌现', body_text: '短视频创作进入精品化时代，越来越多优质内容创作者涌现。知识科普、文化传承、生活技能等垂直领域内容质量显著提升，用户粘性增强。', source: '短视频周刊', sort_weight: 90, is_featured: false },
    { title: '综艺节目创新转型，观众审美升级', body_text: '综艺节目从娱乐至上转向内涵驱动，文化类、纪实类综艺受到观众追捧。观众审美升级倒逼节目创新，市场迎来质量型竞争新阶段。', source: '综艺观察', sort_weight: 80, is_featured: false },
    { title: '音乐市场复苏，演唱会票房火爆', body_text: '线下音乐市场全面复苏，全国演唱会票房创下历史纪录。粉丝经济拉动消费，音乐产业链各环节蓬勃发展，行业景气度持续走高。', source: '音乐行业报', sort_weight: 70, is_featured: false },
    { title: '游戏出海成绩亮眼，中国文化走向世界', body_text: '中国游戏出海成绩亮眼，多款国产游戏在海外市场获得巨大成功。蕴含中国文化元素的游戏产品受到全球玩家喜爱，成为文化出海新名片。', source: '游戏资讯', sort_weight: 60, is_featured: false }
  ],
  food: [
    { title: '新式茶饮品牌崛起，饮品市场竞争激烈', body_text: '新式茶饮品牌快速崛起，各品牌在产品创新、门店体验和数字化运营上竞争激烈。市场规模突破千亿，消费者口味偏好日趋多元化和高端化。', source: '美食头条', sort_weight: 100, is_featured: true },
    { title: '预制菜产业规范化，便捷美食走进千家万户', body_text: '预制菜产业标准化规范化进程加速，多家企业推出高品质预制菜产品。便捷美食走进千家万户，为快节奏生活提供了更多选择。', source: '食品周刊', sort_weight: 90, is_featured: false },
    { title: '地方特色美食走红，文旅融合带动餐饮经济', body_text: '多地地方特色美食走红网络，成为文旅融合的重要载体。美食带动旅游，旅游推广美食，形成良性循环，有力促进了地方餐饮经济发展。', source: '美食旅游报', sort_weight: 80, is_featured: false },
    { title: '健康饮食理念普及，低糖低脂产品受追捧', body_text: '健康饮食理念深入人心，低糖低脂高纤维食品受到消费者追捧。食品企业纷纷推出健康产品线，满足消费者对美味与健康的双重需求。', source: '健康美食', sort_weight: 70, is_featured: false },
    { title: '美食纪录片热度不减，舌尖上的故事持续打动人心', body_text: '美食纪录片持续引发关注，从田间到餐桌的故事打动无数观众。这些纪录片不仅展示了美食本身，更呈现了背后的文化传承和人文情怀。', source: '纪录片资讯', sort_weight: 60, is_featured: false }
  ]
}

/** 5个模板配置 */
const INITIAL_TEMPLATE_DATA = [
  {
    category: 'sports',
    name: '体育赛事快讯模板',
    description: '适用于体育赛事新闻报道，标题醒目+正文精炼+配图区域',
    cover_image: '',
    layout_config: {
      canvas_width: 1080,
      canvas_height: 1920,
      background_color: '#FFFFFF',
      title_area: {
        x: 80, y: 120, width: 920, height: 160,
        font_size: 48, font_color: '#1A1A1A', font_weight: 'bold',
        background_color: '#FFFFFF',
        max_lines: 2, line_height: 60
      },
      body_area: {
        x: 80, y: 340, width: 920, height: 800,
        font_size: 30, font_color: '#333333', font_weight: 'normal',
        background_color: '#FFFFFF',
        max_lines: 12, line_height: 44
      },
      image_area: {
        x: 80, y: 1200, width: 920, height: 500,
        background_color: '#F5F5F5',
        border_radius: 12
      },
      watermark_area: {
        x: 80, y: 1760, width: 920, height: 80,
        font_size: 20, font_color: '#999999',
        text: '新闻工坊出品',
        align: 'center'
      }
    },
    is_vip: false,
    sort_weight: 100,
    use_count: 0,
    status: 'published'
  },
  {
    category: 'finance',
    name: '财经资讯模板',
    description: '适用于财经新闻，深色标题区+数据区+正文+配图',
    cover_image: '',
    layout_config: {
      canvas_width: 1080,
      canvas_height: 1920,
      background_color: '#FFFFFF',
      title_area: {
        x: 80, y: 100, width: 920, height: 180,
        font_size: 44, font_color: '#E8002D', font_weight: 'bold',
        background_color: '#FFFFFF',
        max_lines: 2, line_height: 56
      },
      body_area: {
        x: 80, y: 320, width: 920, height: 880,
        font_size: 28, font_color: '#333333', font_weight: 'normal',
        background_color: '#FFFFFF',
        max_lines: 14, line_height: 42
      },
      image_area: {
        x: 80, y: 1240, width: 920, height: 440,
        background_color: '#F0F0F0',
        border_radius: 8
      },
      watermark_area: {
        x: 80, y: 1760, width: 920, height: 80,
        font_size: 20, font_color: '#999999',
        text: '新闻工坊出品',
        align: 'center'
      }
    },
    is_vip: false,
    sort_weight: 90,
    use_count: 0,
    status: 'published'
  },
  {
    category: 'tech',
    name: '科技前沿模板',
    description: '适用于科技新闻，大图+标题+正文经典排版',
    cover_image: '',
    layout_config: {
      canvas_width: 1080,
      canvas_height: 1920,
      background_color: '#1A1A1A',
      title_area: {
        x: 80, y: 100, width: 920, height: 200,
        font_size: 50, font_color: '#FFFFFF', font_weight: 'bold',
        background_color: 'transparent',
        max_lines: 2, line_height: 64
      },
      body_area: {
        x: 80, y: 340, width: 920, height: 760,
        font_size: 28, font_color: '#DDDDDD', font_weight: 'normal',
        background_color: 'transparent',
        max_lines: 12, line_height: 42
      },
      image_area: {
        x: 0, y: 1140, width: 1080, height: 600,
        background_color: '#333333',
        border_radius: 0
      },
      watermark_area: {
        x: 80, y: 1800, width: 920, height: 60,
        font_size: 18, font_color: '#666666',
        text: '新闻工坊出品',
        align: 'center'
      }
    },
    is_vip: true,
    sort_weight: 80,
    use_count: 0,
    status: 'published'
  },
  {
    category: 'entertainment',
    name: '娱乐热点模板',
    description: '适用于娱乐新闻，彩色标题+活泼排版+配图',
    cover_image: '',
    layout_config: {
      canvas_width: 1080,
      canvas_height: 1920,
      background_color: '#FFFFFF',
      title_area: {
        x: 60, y: 120, width: 960, height: 200,
        font_size: 52, font_color: '#E8002D', font_weight: 'bold',
        background_color: '#FFE5E5',
        max_lines: 2, line_height: 66,
        padding: { top: 20, bottom: 20, left: 20, right: 20 }
      },
      body_area: {
        x: 60, y: 360, width: 960, height: 760,
        font_size: 30, font_color: '#333333', font_weight: 'normal',
        background_color: '#FFFFFF',
        max_lines: 12, line_height: 44
      },
      image_area: {
        x: 60, y: 1160, width: 960, height: 500,
        background_color: '#F5F5F5',
        border_radius: 16
      },
      watermark_area: {
        x: 60, y: 1760, width: 960, height: 80,
        font_size: 20, font_color: '#999999',
        text: '新闻工坊出品',
        align: 'center'
      }
    },
    is_vip: false,
    sort_weight: 70,
    use_count: 0,
    status: 'published'
  },
  {
    category: 'all',
    name: '通用新闻模板',
    description: '适用于所有题材的通用新闻排版，简洁大方',
    cover_image: '',
    layout_config: {
      canvas_width: 1080,
      canvas_height: 1920,
      background_color: '#FFFFFF',
      title_area: {
        x: 80, y: 100, width: 920, height: 200,
        font_size: 46, font_color: '#1A1A1A', font_weight: 'bold',
        background_color: '#FFFFFF',
        max_lines: 2, line_height: 58
      },
      body_area: {
        x: 80, y: 340, width: 920, height: 820,
        font_size: 28, font_color: '#333333', font_weight: 'normal',
        background_color: '#FFFFFF',
        max_lines: 14, line_height: 40
      },
      image_area: {
        x: 80, y: 1200, width: 920, height: 480,
        background_color: '#F5F5F5',
        border_radius: 12
      },
      watermark_area: {
        x: 80, y: 1760, width: 920, height: 80,
        font_size: 20, font_color: '#999999',
        text: '新闻工坊出品',
        align: 'center'
      }
    },
    is_vip: false,
    sort_weight: 50,
    use_count: 0,
    status: 'published'
  }
]

exports.main = async (event, context) => {
  const results = {
    collections: [],
    content: [],
    templates: [],
    banners: []
  }

  try {
    // 1. 创建集合
    for (const name of COLLECTION_NAMES) {
      try {
        await db.createCollection(name)
        results.collections.push({ name: name, status: 'created' })
      } catch (err) {
        // 集合可能已存在
        results.collections.push({ name: name, status: 'exists' })
      }
    }

    // 2. 插入初始内容数据
    const contentCollection = db.collection('content')
    for (const category of CATEGORIES) {
      const contentList = INITIAL_CONTENT_DATA[category.key]
      for (const item of contentList) {
        const contentItem = {
          category: category.key,
          title: item.title,
          body_text: item.body_text,
          cover_image: '',
          source: item.source,
          sort_weight: item.sort_weight,
          is_featured: item.is_featured,
          view_count: Math.floor(Math.random() * 500) + 100,
          make_count: Math.floor(Math.random() * 50) + 5,
          status: 'published',
          created_at: db.serverDate(),
          updated_at: db.serverDate()
        }
        const addResult = await contentCollection.add({ data: contentItem })
        results.content.push({ id: addResult.id, category: category.key, title: item.title })
      }
    }

    // 3. 插入模板数据
    const templatesCollection = db.collection('templates')
    for (const template of INITIAL_TEMPLATE_DATA) {
      const templateItem = {
        ...template,
        created_at: db.serverDate(),
        updated_at: db.serverDate()
      }
      const addResult = await templatesCollection.add({ data: templateItem })
      results.templates.push({ id: addResult.id, name: template.name })
    }

    // 4. 插入Banner数据
    const bannersCollection = db.collection('banners')
    const bannerData = [
      { title: '新闻工坊全新上线', image_url: '', link_type: 'page', link_url: '/pages/home/home', sort_weight: 100, status: 'active' },
      { title: 'VIP会员限时特惠', image_url: '', link_type: 'page', link_url: '/pages/vip/vip', sort_weight: 90, status: 'active' },
      { title: 'AI智能改写功能发布', image_url: '', link_type: 'page', link_url: '/pages/make/make', sort_weight: 80, status: 'active' }
    ]
    for (const banner of bannerData) {
      const bannerItem = {
        ...banner,
        created_at: db.serverDate(),
        updated_at: db.serverDate()
      }
      const addResult = await bannersCollection.add({ data: bannerItem })
      results.banners.push({ id: addResult.id, title: banner.title })
    }

    return {
      code: 0,
      data: results,
      message: '数据库初始化完成'
    }
  } catch (err) {
    console.error('[init-db] 错误:', err)
    return { code: -1, data: null, message: '数据库初始化失败: ' + err.message }
  }
}
