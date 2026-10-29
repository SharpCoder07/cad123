import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEFAULT_SETTINGS = {
  primaryColor: "#2563EB",
  secondaryColor: "#0F172A",
  accentColor: "#14B8A6",
  accent2Color: "#F97316",
  backgroundColor: "#FFFFFF",
  textColor: "#0F172A",
  mutedTextColor: "#64748B",
  borderColor: "#E2E8F0",
  surfaceColor: "#F8FAFC",
};

const COLOR_FIELDS = [
  "primaryColor",
  "secondaryColor",
  "accentColor",
  "accent2Color",
  "backgroundColor",
  "textColor",
  "mutedTextColor",
  "borderColor",
  "surfaceColor",
] as const;

type ColorField = (typeof COLOR_FIELDS)[number];

function isValidHexColor(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^#[0-9A-Fa-f]{6}$/.test(value)
  );
}

/* =========================================================
   GET
========================================================= */

export async function GET() {
  try {
    const settings =
      await prisma.websiteSettings.upsert({
        where: {
          id: 1,
        },

        update: {},

        create: {
          id: 1,
          ...DEFAULT_SETTINGS,
        },
      });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(
      "Failed to fetch website settings:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to fetch website settings.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PUT
========================================================= */

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const updateData: Partial<
      Record<ColorField, string>
    > = {};

    for (const field of COLOR_FIELDS) {
      const value = body[field];

      if (!isValidHexColor(value)) {
        return NextResponse.json(
          {
            message: `Invalid colour value for ${field}.`,
          },
          {
            status: 400,
          }
        );
      }

      updateData[field] =
        value.toUpperCase();
    }

    const settings =
      await prisma.websiteSettings.upsert({
        where: {
          id: 1,
        },

        update: updateData,

        create: {
          id: 1,
          ...DEFAULT_SETTINGS,
          ...updateData,
        },
      });

    return NextResponse.json(settings);
  } catch (error) {
    console.error(
      "Failed to update website settings:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Failed to update website settings.",
      },
      {
        status: 500,
      }
    );
  }
}