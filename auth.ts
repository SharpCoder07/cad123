import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",

      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: {
            email,
          },

          include: {
            vendor: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!passwordMatch) {
          return null;
        }

        /*
         * Vendor users must:
         * 1. belong to a vendor
         * 2. belong to an ACTIVE vendor
         *
         * ADMIN and normal USER accounts are unaffected.
         */
        if (user.role === "VENDOR") {
          if (!user.vendorId || !user.vendor) {
            return null;
          }

          if (user.vendor.status !== "ACTIVE") {
            return null;
          }
        }

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          role: user.role,
          vendorId: user.vendorId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.vendorId = user.vendorId ?? null;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        session.user.role = token.role as
          | "USER"
          | "ADMIN"
          | "VENDOR";

        session.user.vendorId =
          typeof token.vendorId === "number"
            ? token.vendorId
            : null;
      }

      return session;
    },
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.AUTH_SECRET,
};