import { prisma } from "@/lib/prisma";

export async function getHomePageData() {
  const [
    categories,
    featuredProducts,
    brands,
    blogPosts,
  ] = await Promise.all([
    prisma.category.findMany({
      where: {
        parentId: null,
      },
      orderBy: {
        name: "asc",
      },
      take: 8,
    }),

   prisma.product.findMany({
  where: {
    status: "PUBLISHED",
    deletedAt: null,
    isFeatured: true,
  },

  orderBy: [
    {
      rating: "desc",
    },
    {
      reviewCount: "desc",
    },
  ],

  include: {
    brand: true,
    category: true,
    images: {
      orderBy: {
        sortOrder: "asc",
      },
      take: 1,
    },
  },

  take: 6,
}),

    prisma.brand.findMany({
      orderBy: {
        name: "asc",
      },
      take: 6,
    }),

    prisma.blogPost.findMany({
      where: {
        published: true,
      },
      orderBy: {
        publishedAt: "desc",
      },
      take: 3,
    }),
  ]);

  return {
    categories,
    featuredProducts,
    brands,
    blogPosts,
  };
}