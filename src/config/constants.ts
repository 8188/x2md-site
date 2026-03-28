/**
 * X2MD 前端页面的集中配置中心
 * 包含下载链接、套餐配置、转换 API 地址及本地存储键名
 */

/** 转换服务的基础 API 地址（留空则默认使用相对路径） */
export const DEFAULT_CONVERT_API_BASE = "";

/** 存储用户语言偏好的 LocalStorage 键名 */
export const LANG_STORAGE_KEY = "x2md_lang";

/** 联系邮箱 */
export const CONTACT_EMAIL = "jsy444@yeah.net";

/** EXE 下载链接 */
export const DOWNLOAD_URLS = {
  portable: {
    version: "latest",
    url: "https://pub-6956b8ec162a4b9ab00d059bd5a042be.r2.dev/releases/any2md-0.1.0-x64-portable.exe",
  },
  cli: {
    version: "latest",
    url: "https://pub-6956b8ec162a4b9ab00d059bd5a042be.r2.dev/releases/any2md-0.1.0-x64-portable-cli.exe",
  },
};

/** 授权套餐配置 */
export const PRICING_PLANS = [
  {
    name_zh: "基础版",
    name_en: "Basic",
    price: 4.9,
    price_old: 10,
    days: 30,
    devices: 1,
    highlight: false,
  },
  {
    name_zh: "专业版",
    name_en: "Pro",
    price: 19.9,
    price_old: 40,
    days: 365,
    devices: 2,
    highlight: true,
  },
  {
    name_zh: "永久版",
    name_en: "Lifetime",
    price: 39.9,
    price_old: 100,
    days: 0, // 0 means perpetual
    devices: 3,
    highlight: false,
  },
];
