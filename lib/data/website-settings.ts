import { prisma } from "@/lib/prisma";

export const DEFAULT_WEBSITE_COLORS = {
  primaryColor: "#2563EB",
  secondaryColor: "#0F172A",
  accentColor: "#14B8A6",
  accent2Color: "#F97316",
  backgroundColor: "#FFFFFF",
  surfaceColor: "#F8FAFC",
  textColor: "#0F172A",
  mutedTextColor: "#64748B",
  borderColor: "#E2E8F0",
};

export async function getWebsiteSettings() {
  try {
    return await prisma.websiteSettings.upsert({
      where: {
        id: 1,
      },

      update: {},

      create: {
        id: 1,
        ...DEFAULT_WEBSITE_COLORS,
      },
    });
  } catch (error) {
    console.error(
      "Failed to load website settings:",
      error
    );

    return {
      id: 1,
      ...DEFAULT_WEBSITE_COLORS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}