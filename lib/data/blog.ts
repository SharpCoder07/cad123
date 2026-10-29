import { prisma } from "@/lib/prisma";

export async function getBlogPosts() {
  const posts = await prisma.blogPost.findMany({
    where: {
      published: true,
    },
    orderBy: {
      publishedAt: "desc",
    },
    include: {
      author: true,
    },
  });

  return posts;
}