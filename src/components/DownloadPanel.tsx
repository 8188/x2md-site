import { DOWNLOAD_URLS } from "../config/constants";

type DownloadRelease = {
  version: string;
  downloadUrl: string;
};

const FIXED_RELEASES: { portable: DownloadRelease; cli: DownloadRelease } = {
  portable: {
    version: "lastest",
    downloadUrl: "https://pub-6956b8ec162a4b9ab00d059bd5a042be.r2.dev/releases/any2md-0.1.0-x64-portable.exe",
  },
  cli: {
    version: "lastest",
    downloadUrl: "https://pub-6956b8ec162a4b9ab00d059bd5a042be.r2.dev/releases/any2md-0.1.0-x64-portable-cli.exe",
  },
};

type UiLang = "zh-CN" | "en-US";

interface DownloadPanelProps {
  lang?: UiLang;
}

function t(lang: UiLang, zh: string, en: string): string {
  return lang === "zh-CN" ? zh : en;
}

export default function DownloadPanel({ lang = "zh-CN" }: DownloadPanelProps) {
  return (
    <div className="surface section reveal" style={{ animationDelay: "220ms" }}>
      <h2>{t(lang, "免费下载 EXE", "Free EXE Downloads")}</h2>
      <p style={{ marginTop: 0, color: "var(--ink-soft)" }}>
        {t(
          lang,
          "GUI 版支持右键菜单快捷转换，CLI 版可被大模型驱动。EXE 可免费试用 20 次。",
          "GUI supports context menu shortcuts, and CLI can be driven by AI models. EXE includes 20 free trial uses."
        )}
      </p>

      <div className="grid-2">
        <article className="surface" style={{ padding: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>{t(lang, "GUI 版", "GUI")}</h3>
          <div style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginBottom: "0.8rem" }}>
            {t(lang, "版本", "Version")}: {DOWNLOAD_URLS.portable.version}
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", margin: "0 0 1rem" }}>
            {t(lang, "离线转换 + 批量处理 + 右键菜单集成", "Offline conversion, batch processing, context menu integration")}
          </p>
          <a className="btn btn-primary" href={DOWNLOAD_URLS.portable.url} target="_blank" rel="noreferrer">
            {t(lang, "下载 GUI", "Download GUI")}
          </a>
        </article>

        <article className="surface" style={{ padding: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>{t(lang, "CLI 版", "CLI")}</h3>
          <div style={{ color: "var(--ink-soft)", fontSize: "0.9rem", marginBottom: "0.8rem" }}>
            {t(lang, "版本", "Version")}: {DOWNLOAD_URLS.cli.version}
          </div>
          <p style={{ color: "var(--ink-soft)", fontSize: "0.85rem", margin: "0 0 1rem" }}>
            {t(lang, "命令行工具 · 支持自动化驱动", "Command-line tool for automation")}
          </p>
          <a className="btn btn-ghost" href={DOWNLOAD_URLS.cli.url} target="_blank" rel="noreferrer">
            {t(lang, "下载 CLI", "Download CLI")}
          </a>
        </article>
      </div>
    </div>
  );
}
