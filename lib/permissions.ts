export const ADMIN_MODULES = {
  dashboard: ["view"],
  products: ["view", "create", "edit", "delete", "approve"],
  features: ["view", "create", "edit", "delete"],
  specifications: ["view", "create", "edit", "delete"],
  brands: ["view", "create", "edit", "delete"],
  categories: ["view", "create", "edit", "delete"],
  reviews: ["view", "edit", "delete"],
  questions: ["view", "answer", "delete"],
  enquiries: ["view", "edit", "delete"],
  contact_messages: ["view", "delete"],
  blog_posts: ["view", "create", "edit", "delete", "publish"],
  users: ["view", "create", "edit", "delete"],
  vendors: ["view", "create", "edit", "delete"],
  website_design: ["view", "edit"],
  website_builder: ["view", "create", "edit", "delete", "publish", "assets_manage"],
  roles: ["view", "create", "edit", "delete", "assign"],
} as const;

export type AdminModule = keyof typeof ADMIN_MODULES;

export type AdminPermissionKey = {
  [M in AdminModule]:
    `${M}.${(typeof ADMIN_MODULES)[M][number]}`
}[AdminModule];

export const ADMIN_PERMISSIONS = Object.entries(
  ADMIN_MODULES,
).flatMap(([module, actions]) =>
  actions.map((action) => ({
    module,
    action,
    key: `${module}.${action}`,
  })),
);

export function isAdminPermissionKey(
  key: string,
): key is AdminPermissionKey {
  return ADMIN_PERMISSIONS.some(
    (permission) => permission.key === key,
  );
}
