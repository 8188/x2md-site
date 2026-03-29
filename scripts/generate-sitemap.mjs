import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const pagesDir = path.join(projectRoot, "src", "pages");
const outputPath = path.join(projectRoot, "public", "sitemap.xml");
const siteUrl = (process.env.PUBLIC_SITE_URL || "https://www.x2md.xyz").replace(/\/+$/, "");

async function collectPageFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectPageFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith(".astro") || entry.name.endsWith(".md") || entry.name.endsWith(".mdx"))) {
      files.push(fullPath);
    }
  }

  return files;
}

function toRoutePath(filePath) {
  const relativePath = path.relative(pagesDir, filePath).replace(/\\/g, "/");
  const withoutExt = relativePath.replace(/\.(astro|md|mdx)$/, "");

  if (!withoutExt) return null;
  if (withoutExt.includes("[") || withoutExt.includes("]")) return null;
  if (withoutExt === "404") return null;
  if (withoutExt.startsWith("_")) return null;

  if (withoutExt === "index") return "/";

  const normalized = withoutExt.replace(/\/index$/, "");
  return normalized.endsWith("/") ? `/${normalized}` : `/${normalized}/`;
}

async function main() {
  const pageFiles = await collectPageFiles(pagesDir);
  const urls = pageFiles
    .map(toRoutePath)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))
    .map((routePath) => `${siteUrl}${routePath}`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`)
    .join("\n")}\n</urlset>\n`;

  await fs.writeFile(outputPath, xml, "utf8");
}

await main();
