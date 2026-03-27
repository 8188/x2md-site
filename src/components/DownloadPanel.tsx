import { useEffect, useState } from "react";
import { DEFAULT_RELEASES_API } from "../config/constants";

type ReleaseInfo = {
  version: string;
  downloadUrl: string;
  notes?: string;
  publishedAt?: string;
};

type ReleasesPayload = {
  ok?: boolean;
  channels?: Record<string, Record<string, ReleaseInfo>>;
};

const defaultReleaseApi =
  import.meta.env.PUBLIC_RELEASES_API || DEFAULT_RELEASES_API;

type UiLang = "zh-CN" | "en-US";

interface DownloadPanelProps {
  lang?: UiLang;
}

function t(lang: UiLang, zh: string, en: string): string {
  return lang === "zh-CN" ? zh : en;
}

function formatDate(raw: string | undefined, lang: UiLang): string {
  if (!raw) return "-";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleDateString(lang, { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function DownloadPanel({ lang = "zh-CN" }: DownloadPanelProps) {
  const [portable, setPortable] = useState<ReleaseInfo | null>(null);
  const [cli, setCli] = useState<ReleaseInfo | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const resp = await fetch(`${defaultReleaseApi}?product=any2md`);
        if (!resp.ok) {
          throw new Error(t(lang, `拉取版本失败: HTTP ${resp.status}`, `Failed to fetch releases: HTTP ${resp.status}`));
        }

        const payload = (await resp.json()) as ReleasesPayload;
        const stable = payload.channels?.stable;
        if (!stable) {
          throw new Error(t(lang, "版本数据缺少 stable channel", "Release data missing stable channel"));
        }

        if (active) {
          setPortable(stable.portable ?? null);
          setCli(stable.cli ?? null);
        }
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : t(lang, "加载下载信息失败", "Failed to load download information"));
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="surface section reveal" style={{ animationDelay: "220ms" }}>
      <h2>{t(lang, "免费下载 EXE", "Free EXE Downloads")}</h2>
      <p style={{ marginTop: 0, color: "var(--ink-soft)" }}>
        {t(
          lang,
          "下载区自动读取最新发布版本。未激活可试用 20 次，超出后可在下方购买序列号。",
          "Latest release versions are loaded automatically. You can try 20 uses before activation, then purchase a license key below."
        )}
      </p>

      {error ? (
        <div style={{ color: "var(--danger)", marginBottom: "0.8rem" }}>{error}</div>
      ) : null}

      <div className="grid-2">
        <article className="surface" style={{ padding: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>{t(lang, "GUI 便携版", "GUI Portable")}</h3>
          <div>{t(lang, "版本", "Version")}: {portable?.version || t(lang, "加载中...", "Loading...")}</div>
          <div>{t(lang, "发布时间", "Published")}: {formatDate(portable?.publishedAt, lang)}</div>
          <p style={{ color: "var(--ink-soft)", minHeight: "3rem" }}>{portable?.notes || "-"}</p>
          <a className="btn btn-primary" href={portable?.downloadUrl || "#"} target="_blank" rel="noreferrer">
            {t(lang, "下载 Portable EXE", "Download Portable EXE")}
          </a>
        </article>

        <article className="surface" style={{ padding: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>{t(lang, "CLI 便携版", "CLI Portable")}</h3>
          <div>{t(lang, "版本", "Version")}: {cli?.version || t(lang, "加载中...", "Loading...")}</div>
          <div>{t(lang, "发布时间", "Published")}: {formatDate(cli?.publishedAt, lang)}</div>
          <p style={{ color: "var(--ink-soft)", minHeight: "3rem" }}>{cli?.notes || "-"}</p>
          <a className="btn btn-ghost" href={cli?.downloadUrl || "#"} target="_blank" rel="noreferrer">
            {t(lang, "下载 CLI EXE", "Download CLI EXE")}
          </a>
        </article>
      </div>
    </div>
  );
}
