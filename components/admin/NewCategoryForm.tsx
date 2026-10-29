"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FolderTree,
  GitBranch,
  Loader2,
  Save,
} from "lucide-react";

type Category = { id: number; name: string };
type Props = { canViewCategories: boolean };

const fieldClass =
  "mt-2 w-full rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-[13px] text-[#292631] outline-none transition placeholder:text-[#A4A0AB] focus:border-[#B9A5D9] focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]";
const cardClass =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_6px_24px_rgba(36,30,48,0.035)]";

function Status({
  complete,
  yes,
  no,
}: {
  complete: boolean;
  yes: string;
  no: string;
}) {
  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1 text-[11px] font-medium ${complete ? "border-[#D7EDE0] bg-[#EFF9F3] text-[#278455]" : "border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]"}`}
    >
      {complete ? yes : no}
    </span>
  );
}

export default function NewCategoryForm({ canViewCategories }: Props) {
  const router = useRouter();
  const backHref = canViewCategories ? "/admin/categories" : "/";
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      try {
        const response = await fetch("/api/admin/category-options");
        const data = await response.json();
        if (!response.ok) {
          if (active) toast.error(data.message || "Failed to load categories.");
          return;
        }
        if (active) setCategories(data.categories ?? []);
      } catch (error) {
        console.error("Load categories error:", error);
        if (active)
          toast.error("Something went wrong while loading categories.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadCategories();
    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating || loading) return;
    if (!name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    if (!slug.trim()) {
      toast.error("Slug is required.");
      return;
    }
    try {
      setCreating(true);
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          parentId: parentId ? Number(parentId) : null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || "Failed to create category.");
        return;
      }
      toast.success("Category created successfully.");
      setTimeout(() => {
        router.push(backHref);
        router.refresh();
      }, 700);
    } catch (error) {
      console.error("Create category error:", error);
      toast.error("Something went wrong while creating the category.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2 text-[12px] text-[#8C8795]">
            <Link
              href={backHref}
              className="cursor-pointer transition hover:text-gray-900"
            >
              Categories
            </Link>
            <ChevronRight size={13} />
            <span className="text-[#4A4553]">Add Category</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <FolderTree size={22} strokeWidth={1.8} />
            </span>
            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Category
              </h1>
              <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
                Create a category to organize CADGram products.
              </p>
            </div>
          </div>
        </div>
        <Link
          href={backHref}
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} /> Back to Categories
        </Link>
      </header>

      <form
        onSubmit={handleCreate}
        className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]"
      >
        <div className="min-w-0 space-y-5">
          <section className={cardClass}>
            <div className="border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-semibold text-[#292631]">
                Category Information
              </h2>
              <p className="mt-1 text-[12px] text-[#898391]">
                Define the name, URL, and position in your category hierarchy.
              </p>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div>
                <label
                  htmlFor="category-name"
                  className="text-[13px] font-medium text-[#45404D]"
                >
                  Category Name <span className="text-[#CB5A65]">*</span>
                </label>
                <input
                  id="category-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={creating}
                  placeholder="e.g. 3D Design Software"
                  className={fieldClass}
                />
                <p className="mt-1.5 text-[11px] text-[#97919E]">
                  Use a clear name that describes the product category.
                </p>
              </div>
              <div>
                <label
                  htmlFor="category-slug"
                  className="text-[13px] font-medium text-[#45404D]"
                >
                  Slug <span className="text-[#CB5A65]">*</span>
                </label>
                <div className="mt-2 flex overflow-hidden rounded-xl border border-[#E5E2EA] bg-white focus-within:border-[#B9A5D9] focus-within:ring-4 focus-within:ring-[#F0EBFA]">
                  <span className="flex items-center border-r border-[#EAE7EF] bg-[#F8F7FA] px-3 text-[12px] text-[#8D8794]">
                    /categories/
                  </span>
                  <input
                    id="category-slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    disabled={creating}
                    placeholder="3d-design-software"
                    className="min-w-0 flex-1 bg-transparent px-4 py-3 text-[13px] text-[#292631] outline-none placeholder:text-[#A4A0AB] disabled:cursor-not-allowed"
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[#97919E]">
                  Use a lowercase, URL-friendly value.
                </p>
              </div>
              <div>
                <label
                  htmlFor="category-parent"
                  className="text-[13px] font-medium text-[#45404D]"
                >
                  Parent Category
                </label>
                <select
                  id="category-parent"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  disabled={loading || creating}
                  className={`${fieldClass} cursor-pointer`}
                >
                  <option value="">
                    {loading ? "Loading categories..." : "No Parent Category"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-[11px] text-[#97919E]">
                  Leave unselected to create a top-level category.
                </p>
              </div>
            </div>
          </section>

          <section className={cardClass}>
            <div className="border-b border-[#F0EDF3] px-5 py-4 sm:px-6">
              <h2 className="text-[15px] font-semibold text-[#292631]">
                Category Description
              </h2>
              <p className="mt-1 text-[12px] text-[#898391]">
                Add optional context about what belongs in this category.
              </p>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="category-description"
                  className="text-[13px] font-medium text-[#45404D]"
                >
                  Description
                </label>
                <span className="text-[11px] text-[#97919E]">
                  {description.length} characters
                </span>
              </div>
              <textarea
                id="category-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={creating}
                rows={6}
                placeholder="Enter category description..."
                className={`${fieldClass} resize-y leading-6`}
              />
            </div>
          </section>

          <div className="flex flex-col-reverse justify-end gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 sm:flex-row sm:items-center">
            <Link
              href={backHref}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={creating || loading}
              className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Category
                </>
              )}
            </button>
          </div>
        </div>

        <aside className="space-y-5">
          <section className={cardClass}>
            <div className="border-b border-[#F0EDF3] px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <FolderTree size={18} />
                </span>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#292631]">
                    Category Setup
                  </h3>
                  <p className="text-[11px] text-[#898391]">
                    Required information
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3.5 p-5">
              {[
                {
                  label: "Category name",
                  complete: !!name.trim(),
                  yes: "Complete",
                  no: "Required",
                },
                {
                  label: "Slug",
                  complete: !!slug.trim(),
                  yes: "Complete",
                  no: "Required",
                },
                {
                  label: "Parent",
                  complete: !!parentId,
                  yes: "Selected",
                  no: "Top-level",
                },
                {
                  label: "Description",
                  complete: !!description.trim(),
                  yes: "Added",
                  no: "Optional",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="text-[12px] text-[#716B79]">
                    {item.label}
                  </span>
                  <Status
                    complete={item.complete}
                    yes={item.yes}
                    no={item.no}
                  />
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-[20px] border border-[#E8E0F4] bg-[#F8F5FD] p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#8065B0]">
                <GitBranch size={18} />
              </span>
              <div>
                <h3 className="text-[13px] font-semibold text-[#41364E]">
                  Category Hierarchy
                </h3>
                <p className="mt-1.5 text-[12px] leading-5 text-[#80748D]">
                  Choose a parent category to nest this category beneath an
                  existing one. Otherwise it will be a top-level category.
                </p>
              </div>
            </div>
          </section>
          <section className={cardClass}>
            <div className="border-b border-[#F0EDF3] px-5 py-4">
              <h3 className="text-[14px] font-semibold text-[#292631]">
                Category Preview
              </h3>
              <p className="mt-1 text-[11px] text-[#898391]">
                Live summary of your new category
              </p>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                  <FolderTree size={17} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-[#292631]">
                    {name.trim() || "Category name"}
                  </p>
                  <p className="truncate text-[11px] text-[#928B99]">
                    {slug.trim() || "category-slug"}
                  </p>
                </div>
              </div>
              <div className="border-t border-[#F0EDF3] pt-3">
                <span className="text-[11px] text-[#928B99]">Parent</span>
                <p className="mt-1 text-[12px] font-medium text-[#514B58]">
                  {categories.find(
                    (category) => String(category.id) === parentId,
                  )?.name || "Top-level category"}
                </p>
              </div>
              {name.trim() && slug.trim() && (
                <div className="flex items-center gap-1.5 text-[11px] text-[#278455]">
                  <CheckCircle2 size={13} /> Required fields complete
                </div>
              )}
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
}
