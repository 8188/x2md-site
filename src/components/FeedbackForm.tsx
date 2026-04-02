import { useState } from "react";
import { DEFAULT_CONVERT_API_BASE } from "../config/constants";

type UiLang = "zh-CN" | "en-US";

type Props = {
  lang?: UiLang;
};

function t(lang: UiLang, zh: string, en: string): string {
  return lang === "zh-CN" ? zh : en;
}

const rawApiBase = import.meta.env.PUBLIC_CONVERT_API_BASE || DEFAULT_CONVERT_API_BASE;
const defaultApiBase = rawApiBase.replace(/\/+$/, "");

export default function FeedbackForm({ lang = "zh-CN" }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("");

  async function submit(): Promise<void> {
    if (!message.trim()) {
      setStatus(t(lang, "请先填写反馈内容。", "Please enter your feedback first."));
      return;
    }

    if (!defaultApiBase) {
      setStatus(t(lang, "未配置反馈 API 地址，请先设置 PUBLIC_CONVERT_API_BASE。", "Feedback API base is missing. Please configure PUBLIC_CONVERT_API_BASE."));
      return;
    }

    setSending(true);
    setStatus(t(lang, "正在发送反馈...", "Sending feedback..."));

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("message", message.trim());
      formData.append("pageUrl", pageUrl.trim() || window.location.href);
      formData.append("lang", lang);
      if (screenshot) {
        formData.append("screenshot", screenshot);
      }

      const resp = await fetch(`${defaultApiBase}/api/feedback`, {
        method: "POST",
        body: formData,
      });

      const json = (await resp.json()) as { success?: boolean; message?: string };
      if (!resp.ok || !json.success) {
        throw new Error(json.message || `HTTP ${resp.status}`);
      }

      setStatus(t(lang, "发送成功，感谢你的反馈。", "Sent successfully. Thanks for your feedback."));
      setMessage("");
      setScreenshot(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : t(lang, "发送失败，请稍后重试。", "Failed to send. Please try again."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="surface section">
      <h2>{t(lang, "反馈意见", "Feedback")}</h2>
      <p style={{ color: "var(--ink-soft)", marginTop: 0 }}>
        {t(
          lang,
          "可提交文字与截图，我们会通过邮件接收并处理。",
          "You can submit text and screenshots. We will receive them by email."
        )}
      </p>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        <input
          type="text"
          value={name}
          placeholder={t(lang, "姓名（可选）", "Name (optional)")}
          onChange={(e) => setName(e.currentTarget.value)}
          style={{ padding: "0.65rem 0.75rem", borderRadius: "0.55rem", border: "1px solid var(--border)" }}
        />
        <input
          type="email"
          value={email}
          placeholder={t(lang, "联系邮箱（可选）", "Email (optional)")}
          onChange={(e) => setEmail(e.currentTarget.value)}
          style={{ padding: "0.65rem 0.75rem", borderRadius: "0.55rem", border: "1px solid var(--border)" }}
        />
        <input
          type="url"
          value={pageUrl}
          placeholder={t(lang, "问题页面链接（可选）", "Problem page URL (optional)")}
          onChange={(e) => setPageUrl(e.currentTarget.value)}
          style={{ padding: "0.65rem 0.75rem", borderRadius: "0.55rem", border: "1px solid var(--border)" }}
        />
        <textarea
          value={message}
          placeholder={t(lang, "请描述你的建议、问题或复现步骤（必填）", "Describe your suggestion, issue, or repro steps (required)")}
          onChange={(e) => setMessage(e.currentTarget.value)}
          rows={8}
          style={{ padding: "0.75rem", borderRadius: "0.55rem", border: "1px solid var(--border)", resize: "vertical" }}
        />
        <label style={{ color: "var(--ink-soft)" }}>
          {t(lang, "截图（可选，支持常见图片格式）", "Screenshot (optional, common image formats)")}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setScreenshot(e.currentTarget.files?.[0] ?? null)}
            style={{ display: "block", marginTop: "0.4rem" }}
          />
        </label>

        <div style={{ display: "flex", gap: "0.65rem", alignItems: "center", flexWrap: "wrap" }}>
          <button className="btn btn-primary" type="button" onClick={() => void submit()} disabled={sending}>
            {sending ? t(lang, "发送中...", "Sending...") : t(lang, "提交反馈", "Submit")}
          </button>
          <span style={{ color: "var(--ink-soft)", fontSize: "0.92rem" }}>{status}</span>
        </div>
      </div>
    </div>
  );
}
