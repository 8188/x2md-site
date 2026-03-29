import type { APIRoute } from "astro";
import { DEFAULT_SITE_URL } from "../config/constants";

const pageModules = import.meta.glob("/src/pages/**/*.{astro,md,mdx}");

function toRoutePath(filePath: string): string | null {
  const normalized = filePath
    .replace(/^\/src\/pages/, "")
    .replace(/\.(astro|md|mdx)$/, "");

  if (!normalized) return null;
  if (normalized.includes("[") || normalized.includes("]")) return null;

  const routePath = normalized.replace(/\/index$/, "") || "/";
  if (routePath === "/404") return null;
  if (routePath.startsWith("/_")) return null;

  return routePath.endsWith("/") ? routePath : `${routePath}/`;
}

export const GET: APIRoute = () => {
  const siteUrl = (import.meta.env.PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");
  const urls = Object.keys(pageModules)
    .map(toRoutePath)
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => a.localeCompare(b))
    .map((path) => `${siteUrl}${path}`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
