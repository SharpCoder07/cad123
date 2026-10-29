import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Inter } from "next/font/google";

import "./globals.css";

import ToastProvider from "@/components/ToastProvider";
import { getWebsiteSettings } from "@/lib/data/website-settings";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-admin-inter",
});

export const metadata: Metadata = {
  title: {
    default: "CADGram",
    template: "%s | CADGram",
  },

  description:
    "Discover and compare CAD, engineering, design and business software to find the right solution for your requirements.",

  applicationName: "CADGram",

  keywords: [
    "CAD software",
    "engineering software",
    "design software",
    "business software",
    "software comparison",
    "CADGram",
  ],

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

type ThemeStyle = CSSProperties & {
  "--site-primary": string;
  "--site-secondary": string;
  "--site-accent": string;
  "--site-accent-2": string;
  "--site-background": string;
  "--site-surface": string;
  "--site-text": string;
  "--site-muted": string;
  "--site-border": string;
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const settings = await getWebsiteSettings();

  const themeStyle: ThemeStyle = {
    "--site-primary": settings.primaryColor,
    "--site-secondary": settings.secondaryColor,
    "--site-accent": settings.accentColor,
    "--site-accent-2": settings.accent2Color,
    "--site-background": settings.backgroundColor,
    "--site-surface": settings.surfaceColor,
    "--site-text": settings.textColor,
    "--site-muted": settings.mutedTextColor,
    "--site-border": settings.borderColor,
  };

  return (
    <html
      lang="en"
      className={`${poppins.variable} ${inter.variable} h-full scroll-smooth antialiased`}
      style={themeStyle}
    >
      <body className="min-h-full font-sans">
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
