import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_CONVERT_API_BASE } from "../config/constants";

type JobStatus = "idle" | "uploading" | "converting" | "done" | "error";
type OutputTarget = "md" | "docx" | "pdf";

type CreateJobResponse = {
  success?: boolean;
  id?: string;
  target?: OutputTarget;
};

type JobStateResponse = {
  success?: boolean;
  status?: "queued" | "processing" | "done" | "failed";
  error?: string;
};

type JobResultResponse = {
  success?: boolean;
  fileName?: string;
  target?: OutputTarget;
  outputFileName?: string;
  outputMimeType?: string;
  downloadUrl?: string;
  markdown?: string;
};

type HealthResponse = {
  ok?: boolean;
  maxFileMB?: number;
};

const defaultApiBase = import.meta.env.PUBLIC_CONVERT_API_BASE || DEFAULT_CONVERT_API_BASE;

type UiLang = "zh-CN" | "en-US";

interface ConverterPanelProps {
  lang?: UiLang;
}

function t(lang: UiLang, zh: string, en: string): string {
  return lang === "zh-CN" ? zh : en;
}

function extFromName(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "unknown";
  return name.slice(idx + 1).toLowerCase();
}

export default function ConverterPanel({ lang = "zh-CN" }: ConverterPanelProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<JobStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string>("");
  const [target, setTarget] = useState<OutputTarget>("md");
  const [includeDocxImages, setIncludeDocxImages] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [resultFileName, setResultFileName] = useState<string>("");
  const [serverMaxFileMB, setServerMaxFileMB] = useState<number | null>(null);
  const [message, setMessage] = useState<string>(
    t(lang, "请选择文件、目标格式，然后点击开始转换。", "Choose a file and target format, then click Convert.")
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isPointerOver, setIsPointerOver] = useState(false);
  const dragDepthRef = useRef(0);
  const blobUrlRef = useRef<string>("");

  const fileExt = useMemo(() => (file ? extFromName(file.name) : "-"), [file]);

  const allowedTargets = useMemo<OutputTarget[]>(() => {
    if (fileExt === "md") return ["docx", "pdf", "md"];
    if (["docx", "pptx", "pdf", "xlsx", "xls", "csv", "txt"].includes(fileExt)) return ["md"];
    return ["md"];
  }, [fileExt]);

  useEffect(() => {
    if (!allowedTargets.includes(target)) {
      setTarget(allowedTargets[0] ?? "md");
    }
  }, [allowedTargets, target]);

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    void (async () => {
      try {
        const response = await fetch(`${defaultApiBase}/health`);
        if (!response.ok) {
          return;
        }

        const health = (await response.json()) as HealthResponse;
        if (!disposed && typeof health.maxFileMB === "number" && health.maxFileMB > 0) {
          setServerMaxFileMB(health.maxFileMB);
        }
      } catch {
        // Ignore health check errors in offline/mock mode.
      }
    })();

    return () => {
      disposed = true;
    };
  }, []);

  async function runMockConversion(targetFile: File) {
    setStatus("uploading");
    setProgress(18);
    setMessage(t(lang, "正在上传文件...", "Uploading file..."));
    await new Promise((resolve) => setTimeout(resolve, 340));

    setStatus("converting");
    setMessage(t(lang, "正在生成 Markdown...", "Generating Markdown..."));
    const ticks = [34, 52, 67, 81, 96];
    for (const tick of ticks) {
      setProgress(tick);
      await new Promise((resolve) => setTimeout(resolve, 240));
    }

    const fileName = targetFile.name;
    if (target === "md") {
      setResult(
        lang === "zh-CN"
          ? `# ${fileName}\n\n- 这是在线转换示例结果。\n- 已抽取标题、列表、段落结构。\n- 正式环境将调用后端转换 API。`
          : `# ${fileName}\n\n- This is a sample conversion result.\n- Headings, lists, and paragraph structures were extracted.\n- Production uses backend conversion APIs.`
      );
    } else {
      setResult("");
    }
    setResultFileName(target === "md" ? `${fileName.replace(/\.[^.]+$/, "")}.md` : `${fileName.replace(/\.[^.]+$/, "")}.${target}`);
    setProgress(100);
    setStatus("done");
    setMessage(
      target === "md"
        ? t(lang, "转换完成，可复制结果或下载 .md 文件。", "Done. You can copy the result or download the .md file.")
        : t(lang, "转换完成，可点击下载文件。", "Done. Click download to save the file.")
    );
  }

  async function runRealConversion(targetFile: File) {
    try {
      if (!defaultApiBase) {
        throw new Error(
          t(
            lang,
            "未配置转换后端地址，请设置 PUBLIC_CONVERT_API_BASE。",
            "Conversion backend is not configured. Please set PUBLIC_CONVERT_API_BASE."
          )
        );
      }

      setStatus("uploading");
      setProgress(25);
      setMessage(t(lang, "正在上传文件...", "Uploading file..."));

      const formData = new FormData();
      formData.append("file", targetFile);
      formData.append("target", target);
      formData.append("includeImagesAsBase64", String(includeDocxImages));
      formData.append("includePptxImages", "false");

      const createResp = await fetch(`${defaultApiBase}/api/jobs`, {
        method: "POST",
        body: formData,
      });

      if (!createResp.ok) {
        throw new Error(t(lang, `上传失败: HTTP ${createResp.status}`, `Upload failed: HTTP ${createResp.status}`));
      }

      setStatus("converting");
      setProgress(36);
      setMessage(t(lang, "任务已创建，正在排队...", "Job created, queued..."));

      const created = (await createResp.json()) as CreateJobResponse;
      if (!created.id) {
        throw new Error(t(lang, "任务创建成功但未返回任务 ID", "Job created but no job ID returned"));
      }

      const converted = await pollJobAndFetchResult(created.id);
      setResult(converted.markdown ?? "");
      setDownloadUrl(converted.downloadUrl ? `${defaultApiBase}${converted.downloadUrl}` : "");
      setResultFileName(converted.outputFileName ?? "");
      setProgress(100);
      setStatus("done");
      setMessage(
        target === "md"
          ? t(lang, "转换完成，可复制或下载。", "Conversion completed. You can copy or download.")
          : t(lang, "转换完成，可点击下载。", "Conversion completed. Click Download.")
      );
    } catch (error) {
      setStatus("error");
      setProgress(0);
      setMessage(error instanceof Error ? error.message : t(lang, "转换失败", "Conversion failed"));
    }
  }

  async function pollJobAndFetchResult(jobId: string): Promise<JobResultResponse> {
    for (let i = 0; i < 60; i += 1) {
      const stateResp = await fetch(`${defaultApiBase}/api/jobs/${encodeURIComponent(jobId)}`);
      if (!stateResp.ok) {
        throw new Error(t(lang, `任务状态查询失败: HTTP ${stateResp.status}`, `Job status check failed: HTTP ${stateResp.status}`));
      }

      const state = (await stateResp.json()) as JobStateResponse;
      if (state.status === "queued") {
        setProgress((p) => Math.max(p, 42));
        setMessage(t(lang, "任务排队中...", "Queued..."));
      } else if (state.status === "processing") {
        setProgress((p) => Math.min(92, Math.max(p + 5, 56)));
        setMessage(t(lang, "正在转换中...", "Converting..."));
      } else if (state.status === "done") {
        const resultResp = await fetch(`${defaultApiBase}/api/jobs/${encodeURIComponent(jobId)}/result`);
        if (!resultResp.ok) {
          throw new Error(t(lang, `结果获取失败: HTTP ${resultResp.status}`, `Result fetch failed: HTTP ${resultResp.status}`));
        }

        const result = (await resultResp.json()) as JobResultResponse;
        return result;
      } else if (state.status === "failed") {
        throw new Error(state.error || t(lang, "转换任务失败", "Conversion job failed"));
      }

      await new Promise((resolve) => setTimeout(resolve, 700));
    }

    throw new Error(t(lang, "转换超时，请稍后重试", "Conversion timed out. Please retry."));
  }

  function queueFile(selected: File | null): void {
    const maxFileBytes = serverMaxFileMB != null ? serverMaxFileMB * 1024 * 1024 : null;
    if (selected && maxFileBytes != null && selected.size > maxFileBytes) {
      const mb = (selected.size / (1024 * 1024)).toFixed(1);
      setFile(null);
      setStatus("error");
      setProgress(0);
      setResult("");
      setDownloadUrl("");
      setResultFileName("");
      setMessage(
        t(
          lang,
          `文件过大：${mb}MB，超过当前限制 ${serverMaxFileMB}MB。请选择更小文件，或使用桌面版 EXE。`,
          `File too large: ${mb}MB exceeds ${serverMaxFileMB}MB limit. Please choose a smaller file, or use desktop EXE.`
        )
      );
      return;
    }

    setFile(selected);
    setStatus("idle");
    setProgress(0);
    setResult("");
    setDownloadUrl("");
    setResultFileName("");
    if (selected && extFromName(selected.name) === "md") {
      setTarget("docx");
    } else {
      setTarget("md");
    }
    setMessage(
      selected
        ? t(lang, `已选择 ${selected.name}，请点击“开始转换”。`, `Selected ${selected.name}. Click Convert to start.`)
        : t(lang, "请选择文件、目标格式，然后点击开始转换。", "Choose a file and target format, then click Convert.")
    );
  }

  async function handleConvertClick() {
    if (!file) {
      setStatus("error");
      setMessage(t(lang, "请先选择文件。", "Please choose a file first."));
      return;
    }

    await runRealConversion(file);
  }

  function handleDownload() {
    if (downloadUrl) {
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      if (resultFileName) {
        anchor.download = resultFileName;
      }
      anchor.click();
      return;
    }

    if (!result) return;
    const rawName = file?.name ?? "converted";
    const dot = rawName.lastIndexOf(".");
    const stem = dot > 0 ? rawName.slice(0, dot) : rawName;
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${stem}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="surface section reveal" style={{ animationDelay: "120ms" }}>
      <h2>{t(lang, "在线免费转换", "Free Online Conversion")}</h2>
      <p style={{ marginTop: 0, color: "var(--ink-soft)" }}>
        {t(
          lang,
          "每台设备 20 次试用。支持拖拽或点击上传，选择目标格式后自动转换。完全免费不需激活码。",
          "20 free uses per device. Drag or click to upload, select target format, and download. No license required for trial."
        )}
      </p>

      <div className="grid-2">
        <div
          className="surface"
          style={{
            padding: "1rem",
            borderStyle: isDragging ? "dashed" : "solid",
            borderColor: isDragging || isPointerOver ? "var(--brand)" : "var(--border)",
            background: isDragging || isPointerOver ? "#f2fff9" : "#fffdf8",
            transform: isDragging || isPointerOver ? "translateY(-2px) scale(1.005)" : "translateY(0) scale(1)",
            boxShadow:
              isDragging || isPointerOver
                ? "0 0 0 3px rgba(14,138,114,0.18), 0 18px 30px rgba(14,138,114,0.18)"
                : "var(--shadow)",
            transition: "all 0.22s ease",
          }}
          onPointerEnter={() => setIsPointerOver(true)}
          onPointerLeave={() => setIsPointerOver(false)}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragDepthRef.current += 1;
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragDepthRef.current -= 1;
            if (dragDepthRef.current <= 0) {
              dragDepthRef.current = 0;
              setIsDragging(false);
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragDepthRef.current = 0;
            setIsDragging(false);
            const dropped = e.dataTransfer.files?.[0] ?? null;
            queueFile(dropped);
          }}
        >
          <label htmlFor="file-picker" className="btn btn-ghost" style={{ marginBottom: "0.8rem" }}>
            {t(lang, "选择文件", "Choose File")}
          </label>
          <input
            id="file-picker"
            type="file"
            style={{ display: "none" }}
            onChange={(e) => {
              queueFile(e.currentTarget.files?.[0] ?? null);
            }}
          />

          <div style={{ color: "var(--ink-soft)", marginBottom: "0.6rem" }}>
            {isDragging
              ? t(lang, "松开鼠标即可上传", "Release to upload")
              : isPointerOver
                ? t(lang, "已进入上传区域，可点击或拖拽文件", "Drop zone active. Click or drag a file here")
                : t(lang, "也可以把文件直接拖到此区域", "You can also drag files into this area")}
          </div>

          <div style={{ color: "var(--ink-soft)", marginBottom: "0.6rem", fontSize: "0.92rem" }}>
            {serverMaxFileMB != null
              ? t(lang, `当前单文件限制：${serverMaxFileMB}MB`, `Current single file limit: ${serverMaxFileMB}MB`)
              : t(lang, "文件大小限制以服务端配置为准", "File size limit is controlled by server settings")}
          </div>

          <div style={{ color: "var(--ink-soft)", marginBottom: "0.6rem" }}>
            {t(lang, "目标格式", "Target")}: {" "}
            <select
              value={target}
              onChange={(e) => setTarget(e.currentTarget.value as OutputTarget)}
              style={{
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                padding: "0.3rem 0.45rem",
                background: "#fff",
                color: "var(--ink)",
              }}
            >
              <option value="md">Markdown (.md)</option>
              <option value="docx" disabled={!allowedTargets.includes("docx")}>
                DOCX (.docx){!allowedTargets.includes("docx") ? t(lang, "（仅 md 输入可选）", " (md input only)") : ""}
              </option>
              <option value="pdf" disabled={!allowedTargets.includes("pdf")}>
                PDF (.pdf){!allowedTargets.includes("pdf") ? t(lang, "（仅 md 输入可选）", " (md input only)") : ""}
              </option>
            </select>
          </div>

          {fileExt === "docx" && target === "md" && (
            <label style={{ display: "block", color: "var(--ink-soft)", marginBottom: "0.6rem" }}>
              <input
                type="checkbox"
                checked={includeDocxImages}
                onChange={(e) => setIncludeDocxImages(e.currentTarget.checked)}
                style={{ marginRight: "0.45rem" }}
              />
              {t(lang, "docx 转 md 时保留图片（base64）", "Keep images (base64) when converting docx to md")}
            </label>
          )}

          {fileExt === "pptx" && target === "md" && (
            <div style={{ color: "var(--danger)", marginBottom: "0.6rem", fontSize: "0.92rem" }}>
              {t(
                lang,
                "PPTX 转 MD 的保留图片功能在线版暂不可用。请下载桌面版 EXE 使用完整功能。",
                "Keep-images option for PPTX to MD is unavailable online. Download desktop EXE for full capability."
              )}
            </div>
          )}

          <div style={{ color: "var(--ink-soft)", marginBottom: "0.6rem" }}>
            {t(lang, "文件", "File")}: {file?.name || t(lang, "未选择", "Not selected")}
          </div>
          <div style={{ color: "var(--ink-soft)", marginBottom: "0.6rem" }}>{t(lang, "类型", "Type")}: {fileExt}</div>
          <div style={{ color: "var(--ink-soft)", marginBottom: "0.9rem" }}>
            {t(lang, "状态", "Status")}: {message}
          </div>

          <div style={{ display: "flex", gap: "0.55rem", marginBottom: "0.9rem", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                void handleConvertClick();
              }}
              disabled={status === "uploading" || status === "converting"}
            >
              {status === "uploading" || status === "converting"
                ? t(lang, "转换中...", "Converting...")
                : t(lang, "开始转换", "Convert")}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleDownload}
              disabled={status !== "done" || (!result && !downloadUrl)}
            >
              {t(lang, "下载结果", "Download")}
            </button>
          </div>

          <div style={{ background: "#eceff4", borderRadius: "999px", height: "10px", overflow: "hidden" }}>
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #0e8a72 0%, #f4b253 100%)",
                transition: "width 0.24s ease",
              }}
            />
          </div>
        </div>

        <div className="surface" style={{ padding: "1rem", display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ fontWeight: 700, marginBottom: "0.65rem" }}>{t(lang, "转换结果", "Conversion Result")}</div>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder={t(
              lang,
              "目标是 Markdown 时，这里会显示文本结果；DOCX/PDF 请点击下载。",
              "Markdown text appears here when target is Markdown. For DOCX/PDF, click Download."
            )}
            style={{
              flex: 1,
              width: "100%",
              minHeight: "240px",
              border: "1px solid var(--border)",
              borderRadius: "0.7rem",
              padding: "0.8rem",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
              resize: "vertical",
            }}
          />
        </div>
      </div>
    </div>
  );
}
