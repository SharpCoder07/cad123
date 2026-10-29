// lib/cms/revalidate.ts
import { revalidatePath } from "next/cache";

export function revalidateCmsContent(options: {
  pageSlug?: string;
  isGlobal?: boolean;
  isBlog?: boolean;
  blogSlug?: string;
}) {
  if (options.isGlobal) {
    revalidatePath("/", "layout");
  }
  if (options.pageSlug) {
    const normalized = options.pageSlug === "home" ? "/" : `/${options.pageSlug.replace(/^\/+/, "")}`;
    revalidatePath(normalized);
    revalidatePath("/sitemap.xml");
  }
  if (options.isBlog) {
    revalidatePath("/blog");
    revalidatePath("/");
    if (options.blogSlug) {
      revalidatePath(`/blog/${options.blogSlug}`);
    }
    revalidatePath("/sitemap.xml");
  }
}