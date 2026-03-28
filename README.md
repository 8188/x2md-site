# any2md-site

基于 Astro + React Islands 的 any2md 官网。

目标：

- 在线免费转换（前端体验层）
- 免费下载 exe（版本数据由 VersionControl 提供）
- Creem 支付入口（支付成功后由 AppLicense webhook 自动发码）

## 技术栈

- Astro 6
- React 19（仅用于高交互组件）
- TypeScript

## 本地开发

```powershell
cd d:\Documents\TypeScript\Website\any2md-site
pnpm install
pnpm dev
```

访问：`http://localhost:4321`

## 环境变量

复制 `.env.example` 为 `.env`，按需填写：

```env
PUBLIC_CONVERT_API_BASE=https://api.yourdomain.com
PUBLIC_CREEM_BASIC_URL=https://creem.io/checkout/your-basic-plan
PUBLIC_CREEM_PRO_URL=https://creem.io/checkout/your-pro-plan
PUBLIC_CREEM_LIFETIME_URL=https://creem.io/checkout/your-lifetime-plan
PUBLIC_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
```

说明：

- `PUBLIC_CONVERT_API_BASE`
	- 在线转换 API 的基础地址。
	- 本地联调 `any2md-site-api` 时建议填：`http://127.0.0.1:8789`。
	- 部署到 VPS 时，填写你的 API 公网地址（例如 `https://api.x2md.xyz` 或 `http://<VPS_IP>:8789`）。
	- 建议优先使用 HTTPS 域名；如果前端是 HTTPS 页面，调用 HTTP API 会被浏览器拦截（mixed content）。
	- 不配置时，在线转换面板会回退为前端 mock 流程。
- 文件大小限制
	- 前端不再维护独立大小阈值。
	- 统一读取后端 `/health` 返回的 `maxFileMB`，该值由 `any2md-site-api` 的 `DEFAULT_MAX_FILE_MB`（或 `MAX_FILE_MB` 环境变量）控制。
- `PUBLIC_CREEM_BASIC_URL`
	- 基础版套餐购买链接。
	- 你提供的 Creem test 链接可填在这里用于测试。
- `PUBLIC_CREEM_PRO_URL`
	- 专业版套餐购买链接。
- `PUBLIC_CREEM_LIFETIME_URL`
	- 永久版套餐购买链接。
- `PUBLIC_ADSENSE_CLIENT`
	- AdSense client id（例如 `ca-pub-7157539957248921`）。
	- 默认值在 `src/config/constants.ts` 中维护，可在 `.env` 覆盖。
- `PUBLIC_ADSENSE_SCRIPT_SRC`
	- 可选，完整脚本地址覆盖项。
	- 若设置该值，会优先于 `PUBLIC_ADSENSE_CLIENT`。

Creem 购买流程说明：

- 点击价格区“立即购买 / Buy Now”会跳转到 Creem Checkout 页面。
- 邮箱输入在 Creem Checkout 页面中完成。
- 支付成功后，`AppLicense` webhook 会按支付邮箱自动发放序列号。

## 构建

```powershell
pnpm build
pnpm preview
```

## 当前里程碑

- 首页完成：Hero、在线转换面板、下载区、价格区、FAQ。
- 下载区已动态读取 releases API。
- 转换区支持点击选择 + 拖拽上传，支持手动选择目标格式（md/docx/pdf）。
- 转换区支持 docx 转 md 图片保留开关；pptx 保留图片在线版不可用（引导使用桌面版 EXE）。
- md -> pdf 已切换为浏览器端生成，降低后端负载并适配 Worker 部署。
- 转换区优先走异步任务接口（`/api/jobs`），支持任务状态查询与文件下载。
- 免费试用文案已更新为每台设备总计 20 次。
