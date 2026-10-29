import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Read-only public data loader for the Website Builder.
 * Only ACTIVE pages with an explicitly published version are exposed.
 * Draft versions are never selected as a fallback.
 */

const publicPageSelect = {
  id: true,
  slug: true,
  title: true,
  description: true,
  seoTitle: true,
  seoDescription: true,
  seoImage: true,
  publishedVersion: true,
} as const;

/**
 * A conservative slug policy prevents route traversal and unexpected URLs.
 * The homepage is represented by an empty slug and stored as "home".
 */
export function normalizePublicPageSlug(input: string): string | null {
  if (typeof input !== "string") return null;
  const slug = input.trim().replace(/^\/+|\/+$/g, "");
  if (!slug) return "home";
  if (slug.length > 180 || !/^[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$/.test(slug)) {
    return null;
  }
  return slug;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function resolveGlobalSection<
  T extends {
    globalSection: { data: unknown } | null;
    elements: Array<{
      key: string;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  },
>(section: T) {
  const data = section.globalSection?.data;

  if (!isRecord(data) || !isRecord(data.section)) {
    return section;
  }

  const sharedSection = data.section;
  const sharedElements = Array.isArray(data.elements)
    ? data.elements.filter(isRecord)
    : [];

  const elementsByKey = new Map(
    sharedElements
      .filter((element) => typeof element.key === "string")
      .map((element) => [element.key as string, element]),
  );

  return {
    ...section,
    type:
      typeof sharedSection.type === "string"
        ? sharedSection.type
        : section.type,
    name:
      typeof sharedSection.name === "string" ||
      sharedSection.name === null
        ? sharedSection.name
        : section.name,
    settings:
      sharedSection.settings ?? section.settings,
    styles: sharedSection.styles ?? section.styles,
    elements: section.elements.map((element) => {
      const shared = elementsByKey.get(element.key);

      if (!shared) return element;

      return {
        ...element,
        type:
          typeof shared.type === "string"
            ? shared.type
            : element.type,
        sortOrder:
          typeof shared.sortOrder === "number"
            ? shared.sortOrder
            : element.sortOrder,
        visible:
          typeof shared.visible === "boolean"
            ? shared.visible
            : element.visible,
        content: shared.content ?? element.content,
        styles: shared.styles ?? element.styles,
        responsive: shared.responsive ?? element.responsive,
        action: shared.action ?? element.action,
      };
    }),
  };
}

export async function getPublishedWebsitePage(rawSlug: string) {
  const slug = normalizePublicPageSlug(rawSlug);
  if (!slug) return null;

  const page = await prisma.websitePage.findFirst({
    where: {
      slug,
      status: "ACTIVE",
      publishedVersion: { not: null },
    },
    select: publicPageSelect,
  });

  if (!page || page.publishedVersion === null) return null;

  // Look up the exact published version number; never substitute the latest draft.
  // An older version can be ARCHIVED after a rollback, so publishedAt is the
  // historical evidence of publication rather than requiring status=PUBLISHED.
  const version = await prisma.websitePageVersion.findUnique({
    where: {
      pageId_version: {
        pageId: page.id,
        version: page.publishedVersion,
      },
    },
    select: {
      id: true,
      version: true,
      status: true,
      publishedAt: true,
      settings: true,
      sections: {
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        select: {
          id: true,
          key: true,
          type: true,
          name: true,
          sortOrder: true,
          visible: true,
          settings: true,
          styles: true,
          globalSection: {
  select: {
    id: true,
    data: true,
  },
},
          elements: {
            orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
            select: {
              id: true,
              parentId: true,
              key: true,
              type: true,
              sortOrder: true,
              visible: true,
              content: true,
              styles: true,
              responsive: true,
              action: true,
            },
          },
        },
      },
    },
  });

  if (!version || (version.status !== "PUBLISHED" && !version.publishedAt)) {
    return null;
  }

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    description: page.description,
    seo: {
      title: page.seoTitle,
      description: page.seoDescription,
      image: page.seoImage,
    },
    version: version.version,
    settings: version.settings,
    sections: version.sections
  .filter((section) => section.visible)
  .map((section) => {
    const resolved = resolveGlobalSection(section);

    return {
      ...resolved,
      elements: resolved.elements.filter(
        (element) => element.visible,
      ),
    };
  }),
  };
}

export type PublishedWebsitePage = NonNullable<
  Awaited<ReturnType<typeof getPublishedWebsitePage>>
>;
