import { prisma } from "@/lib/prisma";

export async function getProducts(
  categorySlug?: string,
  search?: string,
  sort?: string,
) {
  const products = await prisma.product.findMany({
    where: {
      // Public website must only expose approved products.
      status: "PUBLISHED",
      deletedAt: null,

      ...(categorySlug
        ? {
            category: {
              slug: categorySlug,
            },
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                brand: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
              {
                category: {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              },
            ],
          }
        : {}),
    },

    orderBy:
      sort === "reviews"
        ? {
            reviewCount: "desc",
          }
        : sort === "name-asc"
          ? {
              name: "asc",
            }
          : sort === "name-desc"
            ? {
                name: "desc",
              }
            : [
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
  });

  return products;
}

export async function getProductCategories() {
  const categories = await prisma.category.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return categories;
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      deletedAt: null,
    },

    include: {
      brand: true,

      category: true,

      pricingPlans: {
        orderBy: {
          price: "asc",
        },
      },

      features: {
        include: {
          feature: true,
        },
      },

      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },

      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      },

      faqs: {
        orderBy: {
          sortOrder: "asc",
        },
      },

      questions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },

          answers: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },

            orderBy: {
              createdAt: "asc",
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      },

      specifications: {
        include: {
          specification: true,
        },

        orderBy: {
          specification: {
            name: "asc",
          },
        },
      },

      alternatives: {
  where: {
    alternative: {
      status: "PUBLISHED",
      deletedAt: null,
    },
  },

        include: {
          alternative: true,
        },
      },
    },
  });

  return product;
}

export async function getCompareProducts() {
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED",
       deletedAt: null,
    },

    orderBy: {
      name: "asc",
    },

    select: {
      id: true,
      name: true,
      slug: true,
      rating: true,
      logo: true,
      reviewCount: true,
      pricing: true,
      freeTrial: true,
      deployment: true,
      supportedPlatforms: true,
      targetAudience: true,

      brand: {
        select: {
          name: true,
        },
      },

      category: {
        select: {
          name: true,
        },
      },

      features: {
        include: {
          feature: {
            select: {
              name: true,
            },
          },
        },
      },

      pricingPlans: {
        select: {
          name: true,
          price: true,
          billing: true,
          currency: true,
        },
      },

      specifications: {
        select: {
          value: true,

          specification: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return products;
}