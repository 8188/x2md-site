/**
 * any2md-site 前端页面的集中配置中心
 * 包含转换 API 地址、版本检查接口及本地存储键名
 */

/** 转换服务的基础 API 地址（留空则默认使用相对路径） */
export const DEFAULT_CONVERT_API_BASE = "";

/** 获取版本发布信息的远程接口地址 */
export const DEFAULT_RELEASES_API = "https://versioncontrol-worker.posuiredstar.workers.dev/api/releases";

/** 存储用户语言偏好的 LocalStorage 键名 */
export const LANG_STORAGE_KEY = "any2md_lang";
