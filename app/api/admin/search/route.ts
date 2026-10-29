import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type SearchResult = {
  id: number;
  type: string;
  title: string;
  subtitle: string;
  href: string;
};

function scoreResult(title: string, query: string) {
  const normalizedTitle = title.toLowerCase();
  const normalizedQuery = query.toLowerCase();

  if (normalizedTitle === normalizedQuery) {
    return 0;
  }

  if (normalizedTitle.startsWith(normalizedQuery)) {
    return 1;
  }

  if (normalizedTitle.includes(normalizedQuery)) {
    return 2;
  }

  return 3;
}

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q")?.trim() || "";

    if (query.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
      });
    }

    const search = query.toLowerCase();

    const [
      products,
      brands,
      categories,
      features,
      specifications,
      reviews,
      questions,
      enquiries,
      contactMessages,
      blogPosts,
      users,
    ] = await Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              shortDescription: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
        include: {
          brand: {
            select: {
              name: true,
            },
          },
        },
        take: 8,
      }),

      prisma.brand.findMany({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
        take: 6,
      }),

      prisma.category.findMany({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
        take: 6,
      }),

      prisma.feature.findMany({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
        take: 6,
      }),

      prisma.specification.findMany({
        where: {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        take: 6,
      }),

      prisma.review.findMany({
        where: {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              comment: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
        include: {
          product: {
            select: {
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        take: 6,
      }),

      prisma.productQuestion.findMany({
        where: {
          question: {
            contains: search,
            mode: "insensitive",
          },
        },
        include: {
          product: {
            select: {
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        take: 6,
      }),

      prisma.enquiry.findMany({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              message: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
        include: {
          product: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
        take: 6,
      }),

      prisma.contactMessage.findMany({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              message: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
        take: 6,
      }),

      prisma.blogPost.findMany({
        where: {
          OR: [
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              slug: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              excerpt: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              content: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
        take: 6,
      }),

      prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        },
        take: 6,
      }),
    ]);

    const results: SearchResult[] = [
      ...products.map((product) => ({
        id: product.id,
        type: "product",
        title: product.name,
        subtitle: product.brand?.name
          ? `Product · ${product.brand.name}`
          : "Product",
        href: `/admin/products/${product.id}/edit`,
      })),

      ...brands.map((brand) => ({
        id: brand.id,
        type: "brand",
        title: brand.name,
        subtitle: "Brand",
        href: `/admin/brands/${brand.id}/edit`,
      })),

      ...categories.map((category) => ({
        id: category.id,
        type: "category",
        title: category.name,
        subtitle: "Category",
        href: `/admin/categories/${category.id}/edit`,
      })),

      ...features.map((feature) => ({
        id: feature.id,
        type: "feature",
        title: feature.name,
        subtitle: "Feature",
        href: `/admin/features/${feature.id}/edit`,
      })),

      ...specifications.map((specification) => ({
        id: specification.id,
        type: "specification",
        title: specification.name,
        subtitle: "Specification",
        href: `/admin/specifications/${specification.id}/edit`,
      })),

      ...reviews.map((review) => ({
        id: review.id,
        type: "review",
        title:
          review.title?.trim() ||
          `${review.product?.name || "Product"} review`,
        subtitle: review.user?.name
          ? `Review · ${review.user.name}`
          : "Review",
        href: "/admin/reviews",
      })),

      ...questions.map((question) => ({
        id: question.id,
        type: "question",
        title: question.question,
        subtitle: question.product?.name
          ? `Question · ${question.product.name}`
          : "Question",
        href: `/admin/questions/${question.id}`,
      })),

      ...enquiries.map((enquiry) => ({
        id: enquiry.id,
        type: "enquiry",
        title: enquiry.name,
        subtitle: enquiry.product?.name
          ? `Enquiry · ${enquiry.product.name}`
          : "Enquiry",
        href: "/admin/enquiries",
      })),

      ...contactMessages.map((message) => ({
        id: message.id,
        type: "contact",
        title: message.name,
        subtitle: `Contact message · ${message.email}`,
        href: "/admin/contact-messages",
      })),

      ...blogPosts.map((post) => ({
        id: post.id,
        type: "blog",
        title: post.title,
        subtitle: "Blog Post",
        href: `/admin/blog-posts/${post.id}/edit`,
      })),

      ...users.map((user) => ({
        id: user.id,
        type: "user",
        title: user.name || user.email,
        subtitle: user.name ? `User · ${user.email}` : "User",
        href: "/admin/users",
      })),
    ];

    results.sort(
      (a, b) =>
        scoreResult(a.title, search) -
        scoreResult(b.title, search),
    );

    return NextResponse.json({
      success: true,
      results: results.slice(0, 25),
    });
  } catch (error) {
    console.error("Global admin search error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to perform global search.",
      },
      { status: 500 },
    );
  }
}