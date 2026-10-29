import { z } from "zod";

export function sanitizeRichHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return "";
  return dirtyHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<(object|embed|applet|meta|link|style|form|base)\b[^>]*>/gi, "")
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src|action)\s*=\s*["']?\s*(javascript:|data:|vbscript:)[^"'\s>]*/gi, '$1="#"');
}

export function sanitizeUrl(url: string | null | undefined, allowExternal = true): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }
  if (allowExternal) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === "http:" || parsed.protocol === "https:" || parsed.protocol === "mailto:" || parsed.protocol === "tel:") {
        return trimmed;
      }
    } catch {
      return "#";
    }
  }
  return "#";
}

export async function validateRedirectChain(
  sourcePath: string,
  destinationPath: string,
  existingRedirects: Array<{ sourcePath: string; destinationPath: string; isEnabled: boolean }>
): Promise<{ valid: boolean; error?: string }> {
  const normSource = sourcePath.trim();
  const normDest = destinationPath.trim();

  if (!normSource.startsWith("/") || normSource.startsWith("//")) {
    return { valid: false, error: "Source path must be a relative internal path starting with '/'." };
  }
  if (normSource.startsWith("/admin") || normSource.startsWith("/api")) {
    return { valid: false, error: "Cannot redirect administrative or API routes." };
  }
  if (!normDest.startsWith("/") || normDest.startsWith("//")) {
    return { valid: false, error: "Destination path must be a safe internal path starting with '/'." };
  }
  if (normSource === normDest) {
    return { valid: false, error: "Source and destination paths cannot be identical (self-loop)." };
  }

  const map = new Map<string, string>();
  for (const r of existingRedirects) {
    if (r.isEnabled) map.set(r.sourcePath, r.destinationPath);
  }
  map.set(normSource, normDest);

  const visited = new Set<string>([normSource]);
  let current: string | undefined = normDest;
  let hops = 0;

  while (current && hops < 15) {
    if (visited.has(current)) {
      return { valid: false, error: `Redirect loop detected involving path "${current}".` };
    }
    visited.add(current);
    current = map.get(current);
    hops++;
  }

  if (hops >= 15) {
    return { valid: false, error: "Redirect chain exceeds maximum allowed hops (15)." };
  }

  return { valid: true };
}

export const PageSectionSchema = z.object({
  type: z.enum([
    "HERO",
    "RICH_TEXT",
    "IMAGE_GALLERY",
    "IMAGE_TEXT",
    "VIDEO",
    "FEATURE_GRID",
    "PRODUCTS_SHOWCASE",
    "CATEGORIES_GRID",
    "BRANDS_STRIP",
    "TESTIMONIALS",
    "STATS_COUNTER",
    "TEAM_GRID",
    "CLIENT_LOGOS",
    "FAQ_ACCORDION",
    "PRICING_TABLE",
    "CTA_BANNER",
    "CONTACT_FORM",
    "BLOG_LISTING",
    "SAFE_EMBED",
  ]),
  title: z.string().max(200).optional().nullable(),
  subtitle: z.string().max(500).optional().nullable(),
  isEnabled: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  settings: z
    .object({
      alignment: z.enum(["left", "center", "right"]).default("left"),
      backgroundColor: z.string().max(32).optional(),
      textColor: z.string().max(32).optional(),
      paddingY: z.enum(["none", "sm", "md", "lg", "xl"]).default("lg"),
      containerWidth: z.enum(["narrow", "standard", "wide", "full"]).default("standard"),
      hideOnMobile: z.boolean().default(false),
      hideOnDesktop: z.boolean().default(false),
    })
    .default({}),
  content: z.record(z.string(), z.unknown()).default({}),
});