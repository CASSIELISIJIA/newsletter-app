import type { NewsCategory, NewsSource, RssFeedConfig, TrackedEntity } from "./types";

// ============================================================
//  新闻偏好与选文方向配置 (Editorial Preferences)
//  ----------------------------------------------------------
//  本文件定义了 Newsletter 的全部选文规则，包括：
//    1. 关注的海外重点媒体源
//    2. 五大编辑方向（分类）
//    3. 重点追踪机构（AIIB 专题 + Peer Highlights）
//  后续调整只需修改以下数组，无需改动其他文件。
// ============================================================

// ==================== 1. 海外重点媒体源 ====================
export const NEWS_SOURCES: NewsSource[] = [
  { id: "reuters", name: "Reuters", country: "UK", homepage: "https://www.reuters.com" },
  { id: "ap", name: "Associated Press", country: "US", homepage: "https://apnews.com" },
  { id: "bbc", name: "BBC News", country: "UK", homepage: "https://www.bbc.com/news" },
  { id: "nyt", name: "The New York Times", country: "US", homepage: "https://www.nytimes.com" },
  { id: "wsj", name: "The Wall Street Journal", country: "US", homepage: "https://www.wsj.com" },
  { id: "ft", name: "Financial Times", country: "UK", homepage: "https://www.ft.com" },
  { id: "bloomberg", name: "Bloomberg", country: "US", homepage: "https://www.bloomberg.com" },
  { id: "guardian", name: "The Guardian", country: "UK", homepage: "https://www.theguardian.com" },
  { id: "economist", name: "The Economist", country: "UK", homepage: "https://www.economist.com" },
  { id: "cnn", name: "CNN", country: "US", homepage: "https://www.cnn.com" },
  { id: "aljazeera", name: "Al Jazeera", country: "QA", homepage: "https://www.aljazeera.com" },
  { id: "dw", name: "Deutsche Welle", country: "DE", homepage: "https://www.dw.com" },
  { id: "nikkei", name: "Nikkei Asia", country: "JP", homepage: "https://asia.nikkei.com" },
  { id: "japantimes", name: "The Japan Times", country: "JP", homepage: "https://www.japantimes.co.jp" },
  { id: "koreatimes", name: "The Korea Times", country: "KR", homepage: "https://www.koreatimes.co.kr" },
  { id: "scmp", name: "South China Morning Post", country: "HK", homepage: "https://www.scmp.com" },
  { id: "hindu", name: "The Hindu", country: "IN", homepage: "https://www.thehindu.com" },
  { id: "abc-au", name: "ABC News Australia", country: "AU", homepage: "https://www.abc.net.au/news" },
  { id: "smh", name: "The Sydney Morning Herald", country: "AU", homepage: "https://www.smh.com.au" },
  { id: "politico-eu", name: "Politico Europe", country: "EU", homepage: "https://www.politico.eu" },
  { id: "ftchinese", name: "FT Chinese", country: "UK", homepage: "https://www.ftchinese.com" },
  { id: "caixin", name: "Caixin Global", country: "CN", homepage: "https://www.caixinglobal.com" },
];

// ==================== 2. 五大编辑方向 ====================
export const NEWS_CATEGORIES: NewsCategory[] = [
  {
    id: "global-affairs",
    label: "全球政经要事",
    labelEn: "Global Affairs",
    description: "对全球经济、市场或国际关系产生影响的重大事件：地缘政治风险（美伊、俄乌、中美、中东局势）、国际贸易摩擦等",
  },
  {
    id: "trade-policy",
    label: "国际贸易与政策",
    labelEn: "Trade & Policy",
    description: "贸易协定、关税调整、产业政策、供应链调整、投资规则变化（如欧盟钢铁关税、英国-GCC贸易协议、供应链多元化）",
  },
  {
    id: "asia-pacific",
    label: "亚太政经动态",
    labelEn: "Asia-Pacific",
    description: "GDP变化与产业升级、制造业投资与科技发展、基础设施与能源转型、企业及产业重大事件（罢工、重大投资、产业政策）",
  },
  {
    id: "markets",
    label: "金融市场",
    labelEn: "Markets",
    description: "影响全球市场走势：股市、债券收益率、美元、黄金、原油，及核心驱动因素（美联储政策、地缘风险、通胀、能源价格）。不收录个股涨跌或小规模交易",
  },
  {
    id: "multilateral",
    label: "多边开发机构",
    labelEn: "Multilateral",
    description: "Peer Highlights：AfDB、ADB、AIIB、CEB、EBRD、EIB、IDB、IsDB、NDB、WBG、IMF、SCO 的贷款批准、融资计划、政策调整、气候融资、债务管理等",
  },
];

// ==================== 3. 重点追踪机构 ====================
// AIIB 为专题追踪（标题提及或正文 2 次以上），highlight=true
// 其余为 Peer Highlights 机构
export const TRACKED_ENTITIES: TrackedEntity[] = [
  {
    id: "aiib",
    name: "AIIB",
    fullName: "Asian Infrastructure Investment Bank 亚洲基础设施投资银行",
    homepage: "https://www.aiib.org",
    keywords: ["AIIB", "Asian Infrastructure Investment Bank", "亚投行", "亚洲基础设施投资银行"],
    highlight: true,
  },
  {
    id: "afdb",
    name: "AfDB",
    fullName: "African Development Bank Group 非洲开发银行集团",
    homepage: "https://www.afdb.org",
    keywords: ["AfDB", "African Development Bank", "非洲开发银行"],
  },
  {
    id: "adb",
    name: "ADB",
    fullName: "Asian Development Bank 亚洲开发银行",
    homepage: "https://www.adb.org",
    keywords: ["ADB", "Asian Development Bank", "亚洲开发银行"],
  },
  {
    id: "ceb",
    name: "CEB",
    fullName: "Council of Europe Development Bank 欧洲委员会开发银行",
    homepage: "https://coebank.org",
    keywords: ["CEB", "Council of Europe Development Bank"],
  },
  {
    id: "ebrd",
    name: "EBRD",
    fullName: "European Bank for Reconstruction and Development 欧洲复兴开发银行",
    homepage: "https://www.ebrd.com",
    keywords: ["EBRD", "European Bank for Reconstruction and Development"],
  },
  {
    id: "eib",
    name: "EIB",
    fullName: "European Investment Bank 欧洲投资银行",
    homepage: "https://www.eib.org",
    keywords: ["EIB", "European Investment Bank", "欧洲投资银行"],
  },
  {
    id: "idb",
    name: "IDB",
    fullName: "Inter-American Development Bank 美洲开发银行",
    homepage: "https://www.iadb.org",
    keywords: ["IDB", "Inter-American Development Bank", "美洲开发银行"],
  },
  {
    id: "isdb",
    name: "IsDB",
    fullName: "Islamic Development Bank 伊斯兰开发银行",
    homepage: "https://www.isdb.org",
    keywords: ["IsDB", "Islamic Development Bank", "伊斯兰开发银行"],
  },
  {
    id: "ndb",
    name: "NDB",
    fullName: "New Development Bank 新开发银行",
    homepage: "https://www.ndb.int",
    keywords: ["NDB", "New Development Bank", "新开发银行", "金砖银行"],
  },
  {
    id: "wbg",
    name: "World Bank",
    fullName: "World Bank Group 世界银行集团",
    homepage: "https://www.worldbank.org",
    keywords: ["World Bank", "World Bank Group", "世界银行"],
  },
  {
    id: "imf",
    name: "IMF",
    fullName: "International Monetary Fund 国际货币基金组织",
    homepage: "https://www.imf.org",
    keywords: ["IMF", "International Monetary Fund", "国际货币基金组织"],
  },
  {
    id: "sco",
    name: "SCO",
    fullName: "Shanghai Cooperation Organization 上海合作组织",
    homepage: "https://www.sectsco.org",
    keywords: ["SCO", "Shanghai Cooperation Organization", "上海合作组织"],
  },
];

// ==================== 4. RSS Feed 配置 ====================
// Google News RSS 按关键词聚合全网新闻（覆盖 Reuters/Bloomberg/Nikkei/CNA 等）
// direct 类型为媒体自有 RSS（如 Doha News）
// 新增/修改 feed 只需在此数组中操作
export const RSS_FEEDS: RssFeedConfig[] = [
  // ---- AIIB 专题 ----
  {
    id: "feed-aiib",
    name: "AIIB 专题",
    url: "https://news.google.com/rss/search?q=AIIB%20OR%20%22Asian%20Infrastructure%20Investment%20Bank%22&hl=en-US&gl=US&ceid=US:en",
    type: "google-news",
    defaultCategory: "multilateral",
    description: "追踪 AIIB 相关报道（标题提及或正文多次提及）",
  },
  // ---- 全球政经要事 ----
  {
    id: "feed-global",
    name: "全球政经要事",
    url: "https://news.google.com/rss/search?q=%22US%20Iran%22%20OR%20%22Russia%20Ukraine%22%20OR%20%22China%20US%22%20OR%20%22Middle%20East%22%20OR%20%22trade%20war%22%20OR%20geopolitics&hl=en-US&gl=US&ceid=US:en",
    type: "google-news",
    defaultCategory: "global-affairs",
    description: "地缘政治风险、大国关系、区域冲突",
  },
  // ---- 国际贸易与政策 ----
  {
    id: "feed-trade",
    name: "国际贸易与政策",
    url: "https://news.google.com/rss/search?q=%22trade%20agreement%22%20OR%20tariff%20OR%20%22trade%20policy%22%20OR%22trade%20deal%22%20OR%22trade%20war%22%20OR%22WTO%22%20OR%22customs%22%20OR%22quotas%22%20OR%22export%20control%22%20OR%22sanction%22%20OR%22industrial%20policy%22%20OR%22investment%20rules%22%20OR%22trade%20barrier%22%20OR%22trade%20tension%22%20OR%22trade%20negotiation%22%20OR%22trade%20pact%22%20OR%22trade%20cooperation%22%20OR%22trade%20partnership%22%20OR%22trade%20alliance%22%20OR%22trade%20framework%22%20OR%22trade%20accord%22%20OR%22trade%20dialogue%22%20OR%22trade%20council%22%20OR%22trade%20commission%22%20OR%22trade%20ministry%22%20OR%22trade%20department%22%20OR%22trade%20agency%22%20OR%22trade%20bureau%22%20OR%22trade%20office%22%20OR%22trade%20representative%22%20OR%22trade%20attach%C3%A9%22%20OR%22trade%20delegation%22%20OR%22trade%20mission%22%20OR%22trade%20forum%22%20OR%22trade%20summit%22%20OR%22trade%20conference%22%20OR%22trade%20symposium%22%20OR%22trade%20seminar%22%20OR%22trade%20workshop%22%20OR%22trade%20event%22%20OR%22trade%20gathering%22%20OR%22trade%20meeting%22%20OR%22trade%20talk%22%20OR%22trade%20consultation%22%20OR%22trade%20discussion%22%20OR%22trade%20exchange%22%20OR%22trade%20cooperation%22%20OR%22trade%20partnership%22%20OR%22trade%20alliance%22%20OR%22trade%20union%22%20OR%22trade%20association%22%20OR%22trade%20federation%22%20OR%22trade%20chamber%22%20OR%22trade%22%20hl=en-US&gl=US&ceid=US:en",
    type: "google-news",
    defaultCategory: "trade-policy",
    description: "贸易协定、关税调整、产业政策、投资规则（排除企业新闻）",
  },
  // ---- 亚太政经动态 ----
  {
    id: "feed-asia",
    name: "亚太政经动态",
    url: "https://news.google.com/rss/search?q=%22Asia%20Pacific%22%20OR%20%22GDP%22%20OR%20%22energy%20transition%22%20OR%20%22manufacturing%22%20OR%20infrastructure%20OR%20%22industrial%20output%22&hl=en-US&gl=US&ceid=US:en",
    type: "google-news",
    defaultCategory: "asia-pacific",
    description: "GDP、产业升级、基础设施、能源转型、企业事件",
  },
  // ---- 金融市场 ----
  {
    id: "feed-markets",
    name: "金融市场",
    url: "https://news.google.com/rss/search?q=%22Federal%20Reserve%22%20OR%20%22stock%20market%22%20OR%20%22bond%20yields%22%20OR%20%22oil%20prices%22%20OR%20%22gold%20price%22%20OR%20%22dollar%22%20OR%20inflation&hl=en-US&gl=US&ceid=US:en",
    type: "google-news",
    defaultCategory: "markets",
    description: "股市、债市、美元、黄金、原油、央行政策",
  },
  // ---- 多边开发机构 (Peer Highlights) ----
  {
    id: "feed-multilateral",
    name: "多边开发机构",
    url: "https://news.google.com/rss/search?q=%22World%20Bank%22%20OR%20IMF%20OR%20%22Asian%20Development%20Bank%22%20OR%20EBRD%20OR%20EIB%20OR%20%22African%20Development%20Bank%22%20OR%20%22New%20Development%20Bank%22%20OR%20%22Shanghai%20Cooperation%22&hl=en-US&gl=US&ceid=US:en",
    type: "google-news",
    defaultCategory: "multilateral",
    description: "Peer 机构贷款、融资、政策调整、气候融资",
  },
  // ---- Doha News 直连 ----
  {
    id: "feed-dohanews",
    name: "Doha News",
    url: "https://dohanews.co/category/news/feed/",
    type: "direct",
    defaultCategory: "global-affairs",
    description: "卡塔尔及海湾地区新闻直连",
  },
  // ---- 地区专题：日本 ----
  {
    id: "feed-japan",
    name: "日本政经",
    url: "https://news.google.com/rss/search?q=Japan%20economy%20OR%20Japan%20policy%20OR%20Japan%20defense%20OR%20BOJ&hl=en-US&gl=JP&ceid=JP:en",
    type: "google-news",
    defaultCategory: "asia-pacific",
    description: "日本经济、政策、防务、央行",
  },
  // ---- 地区专题：韩国 ----
  {
    id: "feed-korea",
    name: "韩国政经",
    url: "https://news.google.com/rss/search?q=South%20Korea%20economy%20OR%20South%20Korea%20policy%20OR%20Korea%20semiconductor%20OR%20Bank%20of%20Korea&hl=en-US&gl=KR&ceid=KR:en",
    type: "google-news",
    defaultCategory: "asia-pacific",
    description: "韩国经济、产业、半导体、央行",
  },
  // ---- 地区专题：印度 ----
  {
    id: "feed-india",
    name: "印度政经",
    url: "https://news.google.com/rss/search?q=India%20economy%20OR%20India%20GDP%20OR%20India%20manufacturing%20OR%20RBI&hl=en-US&gl=IN&ceid=IN:en",
    type: "google-news",
    defaultCategory: "asia-pacific",
    description: "印度经济、GDP、制造业、央行",
  },
  // ---- 地区专题：中东 ----
  {
    id: "feed-middleeast",
    name: "中东局势",
    url: "https://news.google.com/rss/search?q=Middle%20East%20OR%20Gulf%20OR%20Iran%20OR%20Saudi%20OR%20Israel%20OR%20OPEC&hl=en-US&gl=US&ceid=US:en",
    type: "google-news",
    defaultCategory: "global-affairs",
    description: "中东地缘政治、能源、OPEC",
  },
  // ---- 地区专题：欧洲 ----
  {
    id: "feed-europe",
    name: "欧洲政经",
    url: "https://news.google.com/rss/search?q=EU%20economy%20OR%20ECB%20OR%20Europe%20policy%20OR%20Eurozone%20OR%20Germany%20economy&hl=en-US&gl=DE&ceid=DE:en",
    type: "google-news",
    defaultCategory: "global-affairs",
    description: "欧盟经济、ECB、欧元区、德国",
  },
  // ---- 地区专题：澳大利亚 ----
  {
    id: "feed-australia",
    name: "澳大利亚政经",
    url: "https://news.google.com/rss/search?q=Australia%20economy%20OR%20RBA%20OR%20Australia%20trade%20OR%20Australia%20mining&hl=en-US&gl=AU&ceid=AU:en",
    type: "google-news",
    defaultCategory: "asia-pacific",
    description: "澳大利亚经济、RBA、贸易、矿业",
  },
];

// ==================== 工具函数 ====================
export function getSourceName(sourceId: string): string {
  return NEWS_SOURCES.find((s) => s.id === sourceId)?.name ?? sourceId;
}

export function getSourceHomepage(sourceId: string): string {
  return NEWS_SOURCES.find((s) => s.id === sourceId)?.homepage ?? "#";
}

export function getCategoryLabel(categoryId: string): string {
  return NEWS_CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export function getEntityName(entityId: string): string {
  return TRACKED_ENTITIES.find((e) => e.id === entityId)?.name ?? entityId;
}

export function getEntityFullName(entityId: string): string {
  return TRACKED_ENTITIES.find((e) => e.id === entityId)?.fullName ?? entityId;
}

export function getEntityHomepage(entityId: string): string {
  return TRACKED_ENTITIES.find((e) => e.id === entityId)?.homepage ?? "#";
}

export function getHighlightEntities(): TrackedEntity[] {
  return TRACKED_ENTITIES.filter((e) => e.highlight);
}
