import type { Metadata } from "next";
import { getHomePageData } from "@/lib/data/home";
import { getPublishedWebsitePage } from "@/lib/website-builder/public-pages";
import PageRenderer from "@/lib/website-builder/PageRenderer";
import Hero from "@/components/Hero";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import BrandSection from "@/components/BrandSection";
import BlogSection from "@/components/BlogSection";

// The reserved CMS slug "home" controls the root URL (/).
// Keep the existing homepage as a fallback until a CMS version is published.

export async function generateMetadata(): Promise<Metadata> {
  const cmsPage = await getPublishedWebsitePage("home");

  if (cmsPage) {
    return {
      title: cmsPage.seo.title || cmsPage.title,
      description:
        cmsPage.seo.description || cmsPage.description || undefined,
      ...(cmsPage.seo.image
        ? {
            openGraph: {
              images: [cmsPage.seo.image],
            },
          }
        : {}),
    };
  }

  return {
    title: "CADGram - Discover Software",
    description: "Explore software, products, brands and categories on CADGram.",
  };
}

export default async function Home() {
  const publishedHome = await getPublishedWebsitePage("home");

  if (publishedHome) {
    return <PageRenderer page={publishedHome} />;
  }

  const data = await getHomePageData();

  return (
    <>
      <Hero />
      <CategorySection categories={data.categories} />
      <FeaturedProducts products={data.featuredProducts} />
      <BrandSection brands={data.brands} />
      <BlogSection posts={data.blogPosts} />
    </>
  );
}
