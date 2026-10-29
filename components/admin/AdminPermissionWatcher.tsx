"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  permissions: readonly string[];
  adminRoleName: string;
};

type PermissionResponse = {
  success: boolean;
  redirectUrl: string | null;
  permissions: string[];
  adminRoleName: string;
};

const moduleRoutes = [
  { path: "/admin/contact-messages", key: "contact_messages" },
  { path: "/admin/website-design", key: "website_design" },
  { path: "/admin/specifications", key: "specifications" },
  { path: "/admin/blog-posts", key: "blog_posts" },
  { path: "/admin/categories", key: "categories" },
  { path: "/admin/products", key: "products" },
  { path: "/admin/features", key: "features" },
  { path: "/admin/enquiries", key: "enquiries" },
  { path: "/admin/questions", key: "questions" },
  { path: "/admin/reviews", key: "reviews" },
  { path: "/admin/vendors", key: "vendors" },
  { path: "/admin/brands", key: "brands" },
  { path: "/admin/users", key: "users" },
  { path: "/admin/roles", key: "roles" },
] as const;

function getRequiredPermission(pathname: string): string | null {
  if (pathname === "/admin/no-access") {
    return null;
  }

  if (pathname === "/admin") {
    return "dashboard.view";
  }

  const module = moduleRoutes.find(
    (item) => pathname === item.path || pathname.startsWith(`${item.path}/`),
  );

  if (!module) {
    return null;
  }

  const suffix = pathname.slice(module.path.length);

  if (!suffix || suffix === "/") {
    return `${module.key}.view`;
  }

  if (suffix === "/new") {
    return `${module.key}.create`;
  }

  if (suffix === "/edit" || /^\/[^/]+\/edit$/.test(suffix)) {
    return `${module.key}.edit`;
  }

  return `${module.key}.view`;
}

export default function AdminPermissionWatcher({
  permissions,
  adminRoleName,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const initialSignature = JSON.stringify({
    permissions: [...permissions].sort(),
    adminRoleName,
  });

  const currentSignature = useRef(initialSignature);
  const pathnameRef = useRef(pathname);
  const redirectingRef = useRef(false);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    currentSignature.current = initialSignature;
  }, [initialSignature]);

  useEffect(() => {
    let checking = false;
    let disposed = false;

    async function checkPermissions() {
      if (
        checking ||
        redirectingRef.current ||
        document.visibilityState === "hidden"
      ) {
        return;
      }

      checking = true;

      try {
        const response = await fetch("/api/admin/landing-page", {
          cache: "no-store",
          credentials: "same-origin",
        });

        if (disposed) return;

        if (response.status === 401 || response.status === 403) {
          redirectingRef.current = true;
          window.location.replace("/login");
          return;
        }

        if (!response.ok) return;

        const data: PermissionResponse = await response.json();

        if (disposed || !data.success) return;

        const nextSignature = JSON.stringify({
          permissions: [...data.permissions].sort(),
          adminRoleName: data.adminRoleName,
        });

        const permissionsChanged = nextSignature !== currentSignature.current;

        if (permissionsChanged) {
          currentSignature.current = nextSignature;
        }

        if (pathnameRef.current === "/admin/no-access" && data.redirectUrl) {
          redirectingRef.current = true;
          window.location.replace(data.redirectUrl);
          return;
        }

        const requiredPermission = getRequiredPermission(pathnameRef.current);

        const canAccessCurrentPage =
          requiredPermission === null ||
          data.permissions.includes(requiredPermission);

        if (!canAccessCurrentPage) {
          redirectingRef.current = true;

          if (data.redirectUrl) {
            window.location.replace(data.redirectUrl);
          } else {
            window.location.replace("/admin/no-access");
          }

          return;
        }

        if (permissionsChanged) {
          router.refresh();
        }
      } catch (error) {
        console.error("Admin permission refresh failed:", error);
      } finally {
        checking = false;
      }
    }

    // Check immediately after mounting.
    void checkPermissions();

    // Check every 30 seconds.
    const interval = window.setInterval(checkPermissions, 30000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkPermissions();
      }
    }

    function handleFocus() {
      void checkPermissions();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    window.addEventListener("focus", handleFocus);

    return () => {
      disposed = true;
      window.clearInterval(interval);

      document.removeEventListener("visibilitychange", handleVisibilityChange);

      window.removeEventListener("focus", handleFocus);
    };
  }, [router]);

  return null;
}
