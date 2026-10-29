
"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Layers3,
  Search,
  RotateCcw,
  SlidersHorizontal,
  LoaderCircle,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

type Feature = {
  id: number;
  name: string;
  description: string | null;
};

type ProductFeature = {
  id: number;
  feature: Feature;
};

type Product = {
  id: number;
  name: string;
  features: ProductFeature[];
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_5px_20px_rgba(40,30,60,0.025)]";

export default function FeaturesPage() {
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name-asc");

  useEffect(() => {
    if (!productId) return;

    async function loadProductFeatures() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/vendor/products/${productId}/features`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message ||
              "Failed to load product features."
          );
          return;
        }

        setProduct(data.product);
      } catch (error) {
        console.error(
          "Failed to load product features:",
          error
        );

        toast.error("Failed to load product features.");
      } finally {
        setLoading(false);
      }
    }

    void loadProductFeatures();
  }, [productId]);

  async function handleRemove(featureId: number) {
    try {
      setRemovingId(featureId);

      const response = await fetch(
        `/api/vendor/products/${productId}/features`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            featureId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message ||
            "Failed to remove feature."
        );
        return;
      }

      setProduct((currentProduct) => {
        if (!currentProduct) return currentProduct;

        return {
          ...currentProduct,
          features: currentProduct.features.filter(
            (productFeature) =>
              productFeature.feature.id !== featureId
          ),
        };
      });

      toast.success("Feature removed successfully.");
      setConfirmRemoveId(null);
    } catch (error) {
      console.error("Remove feature error:", error);
      toast.error("Something went wrong.");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-4 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-12 w-72 animate-pulse rounded-xl bg-gray-200" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-44 animate-pulse rounded-[22px] bg-white" />
          <div className="h-44 animate-pulse rounded-[22px] bg-white" />
        </div>

        <div className="h-80 animate-pulse rounded-[24px] bg-white" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className={`${cardClass} p-8`}>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361]">
          <Sparkles size={23} />
        </span>

        <h1 className="mt-5 text-xl font-bold text-gray-950">
          Product not found
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          The requested product could not be loaded.
        </p>

        <Link
          href="/vendor/products"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948]"
        >
          <ArrowLeft size={16} />
          Back to Products
        </Link>
      </div>
    );
  }

  const totalFeatures = product.features.length;

  const selectedFeature =
    confirmRemoveId !== null
      ? product.features.find(
          (productFeature) =>
            productFeature.feature.id === confirmRemoveId
        )
      : null;

  const filteredFeatures = product.features
    .filter((item) => {
      const query = search.trim().toLowerCase();
      return !query || item.feature.name.toLowerCase().includes(query) ||
        (item.feature.description || "").toLowerCase().includes(query) ||
        String(item.feature.id).includes(query);
    })
    .sort((a, b) => sortBy === "name-desc"
      ? b.feature.name.localeCompare(a.feature.name)
      : sortBy === "newest"
        ? b.feature.id - a.feature.id
        : sortBy === "oldest"
          ? a.feature.id - b.feature.id
          : a.feature.name.localeCompare(b.feature.name));
  const activeFilters = Number(sortBy !== "name-asc");
  const resetFilters = () => { setSearch(""); setSortBy("name-asc"); };

  const stats = [
    { label: "Assigned Features", value: totalFeatures, description: "Linked to this product", icon: Sparkles,
      card: "bg-gradient-to-br from-[#FFF4F7] to-[#F5F0FA]", iconColor: "bg-[#EDE1FA] text-[#8966B7]" },
    { label: "Reusable Library", value: "Ready", description: "Add features from the shared library", icon: Layers3,
      card: "bg-gradient-to-br from-[#F1FAF6] to-[#E6F7ED]", iconColor: "bg-[#D7F2E4] text-[#328F72]" },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
        <Link
          href="/vendor/products"
          className="cursor-pointer hover:text-gray-900"
        >
          My Products
        </Link>

        <ChevronRight size={13} />

        <Link
          href={`/vendor/products/${product.id}/edit`}
          className="cursor-pointer hover:text-gray-900"
        >
          Edit Product
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">
          Features
        </span>
      </div>

      {/* Page heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <Sparkles size={22} strokeWidth={1.8} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">Product Features</h1>
              <span className="rounded-full border border-[#E5E2EA] bg-white px-2.5 py-1 text-[11px] font-medium text-[#77717F]">#{productId}</span>
            </div>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">Manage features assigned to <span className="font-medium text-[#44414C]">{product.name}</span>.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/vendor/products/${product.id}/edit`} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]">
            <ArrowLeft size={16} /> Back to Product
          </Link>
          <Link href={`/vendor/products/${product.id}/features/new`} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948]">
            <Plus size={16} /> Add Feature
          </Link>
        </div>
      </section>

      {/* Summary cards — Super Admin proportions */}
      <section className="grid gap-3 sm:grid-cols-2">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`flex min-h-[146px] flex-col justify-between rounded-[21px] border border-white/80 px-5 py-4 shadow-[0_8px_24px_rgba(40,30,60,0.035)] ${stat.card}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.055em] text-[#77808E]">{stat.label}</p>
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.iconColor}`}><Icon size={18} strokeWidth={1.8} /></span>
              </div>
              <div>
                <p className="text-[30px] font-semibold leading-none tracking-[-0.04em] text-[#1F2430]">{stat.value}</p>
                <p className="mt-2 text-[12px] leading-4 text-[#77808E]">{stat.description}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Feature catalog */}
      <section className={`${cardClass} overflow-hidden`}>
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]"><Sparkles size={19} /></span>
              <div>
                <h2 className="text-[16px] font-semibold text-[#1F2430]">Assigned Features</h2>
                <p className="mt-0.5 text-[12px] text-[#77808E]">Review and remove features associated with this product.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[#EAE7EF] bg-[#F8F7FA] px-3 py-1.5 text-[11px] font-medium text-[#77717F]">{totalFeatures} Total</span>
              <button type="button" onClick={() => setFiltersOpen(!filtersOpen)} aria-expanded={filtersOpen}
                className={`inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-xl border px-3 text-[12px] font-medium transition ${activeFilters ? "border-[#D7C5F4] bg-[#F2ECFC] text-[#8065B0]" : "border-[#E5E2EA] bg-white text-[#44414C] hover:bg-[#F8F6FA]"}`}>
                <SlidersHorizontal size={15} /> Filters
                {activeFilters > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#8065B0] px-1 text-[10px] font-semibold text-white">{activeFilters}</span>}
              </button>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A95A3]" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search features by name, description or ID..." aria-label="Search assigned features"
                className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-white pl-10 pr-4 text-[13px] text-[#1F2430] outline-none transition placeholder:text-[#A19AA8] focus:border-[#B69DE2] focus:ring-4 focus:ring-[#F2ECFC]" />
            </div>
            {(search || activeFilters > 0) && <button type="button" onClick={resetFilters} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-3 text-[12px] font-medium text-[#5B5362] hover:bg-[#F8F6FA]"><RotateCcw size={15} /> Reset</button>}
          </div>
          {filtersOpen && <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select aria-label="Sort features" value={sortBy} onChange={(event) => setSortBy(event.target.value)}
              className={`h-11 w-full cursor-pointer rounded-xl border bg-white px-3 text-[13px] text-[#44414C] outline-none focus:ring-4 focus:ring-[#F2ECFC] ${activeFilters ? "border-[#B69DE2]" : "border-[#E5E2EA]"}`}>
              <option value="name-asc">Name: A to Z</option><option value="name-desc">Name: Z to A</option><option value="newest">Newest feature ID</option><option value="oldest">Oldest feature ID</option>
            </select>
          </div>}
        </div>
        {filteredFeatures.length > 0 ? <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[740px] text-left">
              <thead className="border-y border-[#EEEAF1] bg-[#FBFAFC]"><tr>
                {['Feature', 'Description', 'Status', 'Actions'].map((heading) => <th key={heading} className={`px-5 py-3.5 text-[11px] font-semibold uppercase tracking-[0.055em] text-[#8C8592] ${heading === 'Actions' ? 'text-right' : ''}`}>{heading}</th>)}
              </tr></thead>
              <tbody>{filteredFeatures.map((item) => <tr key={item.id} className="border-b border-[#F0EDF3] last:border-0 hover:bg-[#FCFBFE]">
                <td className="px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]"><Sparkles size={18} /></span><div><p className="text-[13px] font-semibold text-[#292631]">{item.feature.name}</p><p className="mt-0.5 text-[11px] text-[#918A98]">Feature #{item.feature.id}</p></div></div></td>
                <td className="px-5 py-4"><p className="line-clamp-2 max-w-[360px] text-[13px] leading-5 text-[#77717F]">{item.feature.description || 'No description provided.'}</p></td>
                <td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1.5 text-[11px] font-medium text-[#278455]"><CheckCircle2 size={13} /> Assigned</span></td>
                <td className="px-5 py-4 text-right"><button type="button" aria-label={`Remove ${item.feature.name}`} title="Remove feature" onClick={() => setConfirmRemoveId(item.feature.id)} disabled={removingId === item.feature.id} className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] transition hover:bg-[#FFE3E6] disabled:cursor-not-allowed disabled:opacity-50"><Trash2 size={16} /></button></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="divide-y divide-[#F0EDF3] md:hidden">{filteredFeatures.map((item) => <article key={item.id} className="p-5">
            <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]"><Sparkles size={18} /></span><div className="min-w-0 flex-1"><h3 className="truncate text-[13px] font-semibold text-[#292631]">{item.feature.name}</h3><p className="mt-1 text-[11px] text-[#918A98]">Feature #{item.feature.id}</p></div><span className="inline-flex items-center gap-1 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2 py-1 text-[11px] font-medium text-[#278455]"><CheckCircle2 size={12} /> Assigned</span></div>
            <p className="mt-3 text-[13px] leading-5 text-[#77717F]">{item.feature.description || 'No description provided.'}</p>
            <div className="mt-3 flex justify-end"><button type="button" aria-label={`Remove ${item.feature.name}`} onClick={() => setConfirmRemoveId(item.feature.id)} disabled={removingId === item.feature.id} className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361] hover:bg-[#FFE3E6] disabled:opacity-50"><Trash2 size={16} /></button></div>
          </article>)}</div>
        </> : <div className="flex min-h-[260px] flex-col items-center justify-center px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]"><Sparkles size={25} /></span>
          <h3 className="mt-4 text-[15px] font-semibold text-[#292631]">{totalFeatures === 0 ? 'No features assigned' : 'No matching features'}</h3>
          <p className="mt-2 max-w-sm text-[13px] text-[#77808E]">{totalFeatures === 0 ? 'Add features to describe the capabilities of this product.' : 'Try another search or reset your filters.'}</p>
          {totalFeatures === 0 ? <Link href={`/vendor/products/${product.id}/features/new`} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white hover:bg-[#403948]"><Plus size={16} /> Add Feature</Link> : <button type="button" onClick={resetFilters} className="mt-5 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] text-[#44414C]"><RotateCcw size={15} /> Reset Filters</button>}
        </div>}
      </section>

      {/* Remove Confirmation Modal */}
      {selectedFeature && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#18141F]/45 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-feature-title"
            className="w-full max-w-md rounded-[20px] border border-[#EAE7EF] bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] text-[#DC5361]">
                <Trash2 size={21} />
              </span>

              <button
                type="button"
                onClick={() => setConfirmRemoveId(null)}
                disabled={removingId !== null}
                aria-label="Close confirmation dialog"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
              >
                <X size={19} />
              </button>
            </div>

            <h3
              id="remove-feature-title"
              className="mt-5 text-lg font-bold text-gray-950"
            >
              Remove feature?
            </h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Remove{" "}
              <span className="font-semibold text-gray-900">
                {selectedFeature.feature.name}
              </span>{" "}
              from this product? The reusable feature itself will not be
              deleted.
            </p>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setConfirmRemoveId(null)}
                disabled={removingId !== null}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  handleRemove(selectedFeature.feature.id)
                }
                disabled={removingId !== null}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#DC5361] px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removingId === selectedFeature.feature.id ? (
                  <>
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Remove Feature
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage features. Grow your business.</p>
      </footer>
    </div>
  );
}
