
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Info,
  Layers3,
  LoaderCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";

type Feature = {
  id: number;
  name: string;
  description: string | null;
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_8px_28px_rgba(40,30,60,0.035)]";

export default function VendorAddFeaturePage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;

  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] =
    useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadFeatures() {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/vendor/features",
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message || "Failed to load features."
          );
          return;
        }

        setFeatures(data.features || []);
      } catch (error) {
        console.error(
          "Failed to load vendor features:",
          error
        );

        toast.error("Failed to load features.");
      } finally {
        setLoading(false);
      }
    }

    void loadFeatures();
  }, []);

  const filteredFeatures = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return features;

    return features.filter((feature) => {
      return (
        feature.name.toLowerCase().includes(query) ||
        feature.description
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [features, search]);

  const selectedFeature = features.find(
    (feature) =>
      String(feature.id) === selectedFeatureId
  );

  async function handleSave() {
    if (!selectedFeatureId) {
      toast.error("Please select a feature.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/vendor/products/${productId}/features`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            featureId: Number(selectedFeatureId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message || "Failed to assign feature."
        );
        return;
      }

      toast.success("Feature assigned successfully.");

      router.push(
        `/vendor/products/${productId}/features`
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Assign vendor feature error:",
        error
      );

      toast.error(
        "Something went wrong while assigning the feature."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 pb-8">
        <div className="h-4 w-48 animate-pulse rounded-lg bg-gray-200" />

        <div className="h-12 w-72 animate-pulse rounded-xl bg-gray-200" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="h-[480px] animate-pulse rounded-[20px] bg-white" />
          <div className="h-72 animate-pulse rounded-[20px] bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
        
        <Link
          href={`/vendor/products/${productId}/features`}
          className="cursor-pointer hover:text-gray-900"
        >
          Features
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">
          Add Feature
        </span>
      </div>

      {/* Page Heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm">
            <Sparkles size={22} strokeWidth={1.8} />
          </span>
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">Add Product Feature</h1>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">Assign an existing feature from the library to your product.</p>
          </div>
        </div>
        <Link
          href={`/vendor/products/${productId}/features`}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} /> Back to Features
        </Link>
      </section>

      {/* Workspace */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        {/* Feature Selector */}
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Sparkles size={21} />
              </span>

              <div>
                <h2 className="text-[15px] font-semibold text-[#1F2430]">
                  Feature Library
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Select a reusable feature for this product.
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
              {features.length} Total
            </span>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {/* Search */}
            <div>

              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="feature-search"
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search by feature name or description..."
                  disabled={saving}
                  className={`w-full rounded-xl border border-[#E5E2EA] bg-white py-3 pl-11 ${search ? "pr-24" : "pr-4"} text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#A88ACF] focus:ring-4 focus:ring-[#F0EBFA]`}
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center gap-1 rounded-lg border border-[#E5E2EA] bg-white px-2.5 py-1.5 text-xs font-medium text-[#66606E] hover:bg-[#F8F6FA]">
                    <RotateCcw size={13} /> Reset
                  </button>
                )}
              </div>

              <p className="mt-2 text-xs text-gray-400">
                {filteredFeatures.length}{" "}
                {filteredFeatures.length === 1
                  ? "feature"
                  : "features"}{" "}
                available
              </p>
            </div>

            {/* Feature Cards */}
            <div>
              <p className="mb-3 text-[13px] font-semibold text-gray-700">
                Select Feature
                <span className="ml-1 text-[#8065B0]">
                  *
                </span>
              </p>

              {filteredFeatures.length > 0 ? (
                <div className="max-h-[460px] space-y-3 overflow-y-auto pr-1">
                  {filteredFeatures.map((feature) => {
                    const selected =
                      selectedFeatureId ===
                      String(feature.id);

                    return (
                      <button
                        key={feature.id}
                        type="button"
                        onClick={() =>
                          setSelectedFeatureId(
                            String(feature.id)
                          )
                        }
                        disabled={saving}
                        aria-pressed={selected}
                        className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          selected
                            ? "border-[#A88ACF] bg-[#F7F3FD] ring-2 ring-[#EDE5F8]"
                            : "border-[#EAE7EF] bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            selected
                              ? "bg-[#EDE1FA] text-[#8065B0]"
                              : "bg-[#F0EBFA] text-[#8065B0]"
                          }`}
                        >
                          <Sparkles size={18} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-bold text-gray-900">
                            {feature.name}
                          </span>

                          <span className="mt-1 block text-xs leading-5 text-gray-500">
                            {feature.description ||
                              "No description provided for this feature."}
                          </span>
                        </span>

                        <span
                          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-[#8065B0] bg-[#8065B0] text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {selected && (
                            <CheckCircle2 size={13} />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-[#FBFAFC] p-6 text-center">
                  <Search
                    size={25}
                    className="text-gray-400"
                  />

                  <p className="mt-3 text-sm font-semibold text-gray-800">
                    {features.length === 0
                      ? "No features available"
                      : "No matching features"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {features.length === 0
                      ? "There are currently no features in the library."
                      : "Try searching with a different keyword."}
                  </p>
                </div>
              )}
            </div>

            {/* Selected Preview */}
            {selectedFeature && (
              <div className="rounded-2xl border border-[#E7DDF4] bg-[#F8F5FD] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#8065B0]">
                    <Sparkles size={19} />
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">
                        {selectedFeature.name}
                      </h3>

                      <span className="rounded-full bg-[#EDE1FA] px-2 py-1 text-[10px] font-semibold text-[#8065B0]">
                        Selected
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-6 text-gray-600">
                      {selectedFeature.description ||
                        "No description provided for this feature."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-[#FBFAFC] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href={`/vendor/products/${productId}/features`}
              className="inline-flex items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !selectedFeatureId}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                  Assigning...
                </>
              ) : (
                <>
                  <Sparkles size={17} />
                  Assign Feature
                </>
              )}
            </button>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-[112px]">
          <section className={`${cardClass} p-5`}>
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Layers3 size={21} />
              </span>

              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-semibold text-gray-600">
                Assignment
              </span>
            </div>

            <h2 className="mt-5 text-[15px] font-semibold text-[#1F2430]">
              Feature Assignment
            </h2>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              Select one feature from the available library
              and assign it to this product.
            </p>

            <div className="mt-5 rounded-2xl bg-[#F8F9FA] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Selected Feature
              </p>

              {selectedFeature ? (
                <div className="mt-3 flex items-center gap-2">
                  <CheckCircle2
                    size={17}
                    className="shrink-0 text-[#8065B0]"
                  />

                  <p className="text-sm font-semibold text-gray-900">
                    {selectedFeature.name}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs text-gray-500">
                  No feature selected yet.
                </p>
              )}
            </div>

          </section>

          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Info size={19} />
              </span>

              <h3 className="text-sm font-bold text-gray-900">
                Helpful Information
              </h3>
            </div>

            <p className="mt-4 text-xs leading-6 text-gray-500">
              Features describe the capabilities of your product.
              Selecting an existing feature helps maintain
              consistency across the catalog.
            </p>

            <div className="mt-4 flex items-start gap-2 border-t border-gray-100 pt-4">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-gray-400"
              />

              <p className="text-xs leading-5 text-gray-500">
                You are assigning an existing feature,
                not creating a new feature definition.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage features. Grow your business.</p>
      </footer>
    </div>
  );
}
