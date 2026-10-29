// prisma/seed-cms.ts
import { prisma } from "../lib/prisma";

const CMS_PERMISSION_RECORDS = [
  { module: "website_builder", action: "pages.manage", key: "website_builder.pages.manage" },
  { module: "website_builder", action: "pages.publish", key: "website_builder.pages.publish" },
  {
    module: "website_builder",
    action: "global_sections.manage",
    key: "website_builder.global_sections.manage",
  },
  { module: "cms", action: "media.manage", key: "cms.media.manage" },
  { module: "cms", action: "navigation.manage", key: "cms.navigation.manage" },
  { module: "cms", action: "redirects.manage", key: "cms.redirects.manage" },
  { module: "cms", action: "seo.manage", key: "cms.seo.manage" },
  { module: "website_settings", action: "manage", key: "website_settings.manage" },
  { module: "website_design", action: "manage", key: "website_design.manage" },
  { module: "blog_posts", action: "manage", key: "blog_posts.manage" },
  { module: "blog_posts", action: "publish", key: "blog_posts.publish" },
];

async function main() {
  console.log("Seeding CMS permissions, global settings, theme tokens, navigation, and homepage...");

  // 1. Upsert CMS Permissions using { module, action, key }
  for (const perm of CMS_PERMISSION_RECORDS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { module: perm.module, action: perm.action },
      create: perm,
    });
  }

  // 2. Upsert WebsiteSettings (id: 1)
  await prisma.websiteSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      siteName: "CAD Directory",
      tagline: "Compare the Best CAD, CAM & Engineering Software",
      headerSticky: true,
      announcementEnabled: true,
      announcementText: "Compare 2026 CAD Software Benchmarks & Pricing Plans →",
      announcementLink: "/compare",
      headerCtaLabel: "Browse CAD Software",
      headerCtaUrl: "/products",
      newsletterEnabled: true,
      newsletterTitle: "Engineering Software Insights",
      newsletterDescription: "Get monthly CAD software comparisons and release notes.",
      copyrightText: `© ${new Date().getFullYear()} CAD Directory. All rights reserved.`,
    },
  });

  // 3. Upsert WebsiteTheme (id: 1)
  await prisma.websiteTheme.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Default Enterprise Theme",
      isActive: true,
      tokens: {
        primaryColor: "#2563eb",
        secondaryColor: "#0f172a",
        accentColor: "#3b82f6",
        backgroundColor: "#ffffff",
        textColor: "#0f172a",
        fontHeading: "Inter",
        fontBody: "Inter",
      },
    },
  });

  // 4. Upsert Primary Header Navigation Menu
  const headerMenu = await prisma.navigationMenu.upsert({
    where: { location: "header_primary" },
    update: {},
    create: {
      name: "Primary Header Navigation",
      slug: "header-primary",
      location: "header_primary",
      isEnabled: true,
    },
  });

  const existingHeaderItems = await prisma.navigationItem.count({
    where: { menuId: headerMenu.id },
  });

  if (existingHeaderItems === 0) {
    const defaultLinks = [
      { label: "Products", url: "/products", sortOrder: 0 },
      { label: "Categories", url: "/category", sortOrder: 1 },
      { label: "Brands", url: "/brand", sortOrder: 2 },
      { label: "Compare", url: "/compare", sortOrder: 3 },
      { label: "Blog", url: "/blog", sortOrder: 4 },
      { label: "Contact", url: "/contact", sortOrder: 5 },
    ];
    for (const link of defaultLinks) {
      await prisma.navigationItem.create({
        data: {
          menuId: headerMenu.id,
          label: link.label,
          url: link.url,
          sortOrder: link.sortOrder,
          isEnabled: true,
        },
      });
    }
  }

  // 5. Upsert Homepage ("home") and Default Editable Sections
  const homePage = await prisma.websitePage.upsert({
    where: { slug: "home" },
    update: {},
    create: {
      title: "Homepage",
      slug: "home",
      status: "ACTIVE",
      publishStatus: "PUBLISHED",
      isSystem: true,
      isPublished: true,
      publishedAt: new Date(),
      seoTitle: "CAD Directory — Compare Leading CAD & 3D Modeling Software",
      seoDescription:
        "Evaluate CAD, CAM, BIM, and 3D engineering software with verified reviews, specifications, pricing plans, and side-by-side comparisons.",
    },
  });

  let homeVersion = await prisma.websitePageVersion.findFirst({
    where: { pageId: homePage.id },
  });

  if (!homeVersion) {
    homeVersion = await prisma.websitePageVersion.create({
      data: {
        pageId: homePage.id,
        version: 1,
        title: "Initial Homepage Version",
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }

  const existingHomeSections = await prisma.websiteSection.count({
    where: { pageId: homePage.id },
  });

  if (existingHomeSections === 0) {
    const defaultSections = [
      {
        key: "home-hero",
        type: "HERO",
        name: "Homepage Hero Banner",
        sortOrder: 0,
        content: {
          badge: "Trusted Engineering Software Directory",
          title: "Find & Compare the Right CAD Software for Your Team",
          subtitle:
            "Explore verified specifications, pricing tiers, alternatives, and real engineer reviews across 2D/3D CAD, BIM, and CAE platforms.",
          primaryCtaLabel: "Explore CAD Software",
          primaryCtaUrl: "/products",
          secondaryCtaLabel: "Compare Side-by-Side",
          secondaryCtaUrl: "/compare",
        },
        settings: { alignment: "center", paddingY: "xl", containerWidth: "standard" },
      },
      {
        key: "home-categories",
        type: "CATEGORIES_GRID",
        name: "Browse by CAD Category",
        sortOrder: 1,
        content: { title: "Browse by Category" },
        settings: { alignment: "left", paddingY: "lg", containerWidth: "standard" },
      },
      {
        key: "home-products",
        type: "PRODUCTS_SHOWCASE",
        name: "Featured CAD Software",
        sortOrder: 2,
        content: { title: "Featured CAD Products" },
        settings: { alignment: "left", paddingY: "lg", containerWidth: "standard" },
      },
      {
        key: "home-brands",
        type: "BRANDS_STRIP",
        name: "Top Software Vendors & Brands",
        sortOrder: 3,
        content: { title: "Leading CAD Vendors" },
        settings: { alignment: "left", paddingY: "lg", containerWidth: "standard" },
      },
      {
        key: "home-blog",
        type: "BLOG_LISTING",
        name: "Latest Editorial & Guides",
        sortOrder: 4,
        content: { title: "Latest Articles & Buying Guides" },
        settings: { alignment: "left", paddingY: "lg", containerWidth: "standard" },
      },
      {
        key: "home-cta",
        type: "CTA_BANNER",
        name: "Vendor Portal Call to Action",
        sortOrder: 5,
        content: {
          title: "Are You a CAD Software Vendor?",
          subtitle:
            "List your software, manage product specifications, and receive qualified buyer enquiries.",
          buttonLabel: "Join Vendor Portal",
          buttonUrl: "/register",
        },
        settings: { alignment: "center", paddingY: "lg", containerWidth: "standard" },
      },
    ];

    for (const sec of defaultSections) {
      await prisma.websiteSection.create({
        data: {
          pageId: homePage.id,
          versionId: homeVersion.id,
          key: sec.key,
          type: sec.type,
          name: sec.name,
          sortOrder: sec.sortOrder,
          visible: true,
          isVisible: true,
          content: sec.content as any,
          settings: sec.settings as any,
        },
      });
    }
  }

  console.log("CMS seed completed successfully.");
}

main()
  .catch((err) => {
    console.error("Error seeding CMS:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });