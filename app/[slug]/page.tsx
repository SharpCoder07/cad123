import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageRenderer from "@/lib/website-builder/PageRenderer";
import { getPublishedWebsitePage } from "@/lib/website-builder/public-pages";

type PageProps = {
  params: Promise<{ slug: string }>;
};

// Keep CMS pages away from application-owned routes. Next.js static routes
// already take precedence over [slug], but this prevents accidental shadowing.
const RESERVED_SLUGS = new Set([
  "admin", "api", "auth", "blog", "brands", "categories", "category",
  "compare", "contact", "login", "products", "register", "vendor",
  "vendors", "_next", "favicon.ico",
]);

function isReserved(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (isReserved(slug)) return { title: "Page Not Found | CADGram" };

  const page = await getPublishedWebsitePage(slug);
  if (!page) return { title: "Page Not Found | CADGram" };

  return {
    title: page.seo.title || page.title,
    description: page.seo.description || page.description || undefined,
    openGraph: {
      title: page.seo.title || page.title,
      description: page.seo.description || page.description || undefined,
      ...(page.seo.image ? { images: [{ url: page.seo.image }] } : {}),
    },
  };
}

export default async function WebsiteBuilderPublicPage({ params }: PageProps) {
  const { slug } = await params;
  if (isReserved(slug)) notFound();

  const page = await getPublishedWebsitePage(slug);
  if (!page) notFound();

  return <PageRenderer page={page} />;
}
