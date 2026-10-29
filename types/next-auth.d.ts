import type { DefaultSession } from "next-auth";

type AppRole = "USER" | "ADMIN" | "VENDOR";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      vendorId: number | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: AppRole;
    vendorId: number | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    vendorId: number | null;
  }
}