"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Layers3,
  Loader2,
  Save,
  Search,
  Sparkles,
} from "lucide-react";

type Feature = {
  id: number;
  name: string;
  description: string | null;
};

const cardClass =
  "overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(40,29,57,0.025)]";

export default function AddFeaturePage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;

  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedFeatureId, setSelectedFeatureId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadFeatures() {
      try {
        setLoading(true);
        setLoadError(false);

        const response = await fetch("/api/admin/features");
        const data = await response.json();

        if (!response.ok || !data.success) {
          if (active) {
            setLoadError(true);
            toast.error(data.message || "Failed to load features.");
          }
          return;
        }

        if (active) {
          setFeatures(Array.isArray(data.features) ? data.features : []);
        }
      } catch (error) {
        console.error("Failed to load features:", error);

        if (active) {
          setLoadError(true);
          toast.error("Failed to load features.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFeatures();

    return () => {
      active = false;
    };
  }, []);

  const filteredFeatures = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return features;

    return features.filter(
      (feature) =>
        feature.name.toLowerCase().includes(query) ||
        (feature.description || "").toLowerCase().includes(query) ||
        String(feature.id).includes(query),
    );
  }, [features, search]);

  const selectedFeature = features.find(
    (feature) => String(feature.id) === selectedFeatureId,
  );

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving || loading || loadError) return;

    if (!selectedFeatureId) {
      toast.error("Please select a feature.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/admin/products/${productId}/features`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            featureId: Number(selectedFeatureId),
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || "Failed to assign feature.");
        return;
      }

      toast.success("Feature assigned successfully.");

      router.push(`/admin/products/${productId}/features`);
      router.refresh();
    } catch (error) {
      console.error("Assign feature error:", error);
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[1440px] space-y-6">
        <div className="h-4 w-52 animate-pulse rounded bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-200" />

          <div className="space-y-2">
            <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="h-96 animate-pulse rounded-[24px] bg-white" />
          <div className="h-64 animate-pulse rounded-[24px] bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-10">
      {/* Header */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="mb-4 flex flex-wrap items-center gap-2 text-xs font-medium text-[#92909D]"
          >
            <Link
              href={`/admin/products/${productId}/features`}
              className="cursor-pointer transition hover:text-gray-900"
            >
              Features
            </Link>

            <ChevronRight size={14} />

            <span className="font-semibold text-gray-900">Add Feature</span>
          </nav>

          <div className="flex items-start gap-3 sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[#EBDEFA] text-[#8065B0] shadow-sm">
              <Sparkles size={22} />
            </div>

            <div>
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
                Add Product Feature
              </h1>

              <p className="mt-1 text-sm leading-6 text-[#77808E]">
                Assign an existing feature from the library to this product.
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/admin/products/${productId}/features`}
          className="inline-flex h-11 w-fit cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-sm font-medium text-[#514B5A] transition hover:bg-gray-50"
        >
          <ArrowLeft size={17} />
          Back to Features
        </Link>
      </section>

      <form
        onSubmit={handleSave}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]"
      >
        {/* Main content */}
        <div className="min-w-0 space-y-6">
          <section className={cardClass}>
            <SectionHeading
              icon={<Layers3 size={19} />}
              title="Select Feature"
              description="Choose one reusable feature to assign to this product."
            />

            <div className="p-5 sm:p-6">
              {loadError ? (
                <div className="rounded-xl border border-[#F6D9DC] bg-[#FFF0F1] p-5">
                  <p className="text-sm font-semibold text-[#BC4251]">
                    Unable to load features
                  </p>

                  <p className="mt-2 text-sm text-[#DC5361]">
                    Return to the product features page and try again.
                  </p>
                </div>
              ) : features.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-200 bg-[#FBFAFD] px-6 py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#92909D]">
                    <Sparkles size={24} />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-gray-900">
                    No features available
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-[#77808E]">
                    Create a reusable feature in the feature library before
                    assigning it to this product.
                  </p>

                  <Link
                    href="/admin/features"
                    className="mt-5 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-5 text-[13px] font-medium text-white transition hover:bg-[#403948]"
                  >
                    <ArrowLeft size={17} />
                    Go to Feature Library
                  </Link>
                </div>
              ) : (
                <>
                  <label
                    htmlFor="feature-search"
                    className="text-sm font-medium text-[#514B5A]"
                  >
                    Search Features
                  </label>

                  <div className="relative mt-2">
                    <Search
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#92909D]"
                    />

                    <input
                      id="feature-search"
                      type="search"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search by name, description, or feature ID..."
                      disabled={saving}
                      className="h-11 w-full rounded-xl border border-[#E5E2EA] bg-[#FBFAFD] pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-[#92909D] focus:border-[#A48ACD] focus:bg-white focus:ring-4 focus:ring-[#F0EBFA]"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-[#77808E]">
                      {filteredFeatures.length}{" "}
                      {filteredFeatures.length === 1 ? "feature" : "features"}{" "}
                      available
                    </p>

                    {selectedFeature && (
                      <button
                        type="button"
                        onClick={() => setSelectedFeatureId("")}
                        disabled={saving}
                        className="cursor-pointer text-xs font-semibold text-[#8065B0] transition hover:text-[#1F2430] disabled:opacity-50"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  <div className="mt-4 max-h-[460px] space-y-3 overflow-y-auto pr-1">
                    {filteredFeatures.length > 0 ? (
                      filteredFeatures.map((feature) => {
                        const isSelected =
                          selectedFeatureId === String(feature.id);

                        return (
                          <button
                            key={feature.id}
                            type="button"
                            onClick={() =>
                              setSelectedFeatureId(String(feature.id))
                            }
                            disabled={saving}
                            aria-pressed={isSelected}
                            className={`flex w-full cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              isSelected
                                ? "border-[#A48ACD] bg-[#F8F5FD] ring-1 ring-[#C5B3E1]"
                                : "border-[#EAE7EF] bg-white hover:border-[#C6B5DF] hover:bg-[#FBF9FE]"
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                                isSelected
                                  ? "border-[#111111] bg-[#F0EBFA] text-[#8065B0]"
                                  : "border-gray-300 bg-white"
                              }`}
                            >
                              {isSelected && (
                                <Check size={13} strokeWidth={3} />
                              )}
                            </span>

                            <div className="min-w-0 flex-1">
                              <p className="break-words text-sm font-semibold text-[#1F2430]">
                                {feature.name}
                              </p>

                              <p className="mt-1 text-xs leading-5 text-[#77808E]">
                                {feature.description ||
                                  "No description provided."}
                              </p>

                              <p className="mt-2 text-[11px] text-[#92909D]">
                                Feature #{feature.id}
                              </p>
                            </div>

                            {isSelected && (
                              <span className="shrink-0 rounded-lg bg-[#EAE2F6] px-2 py-1 text-[10px] font-semibold text-[#70519E]">
                                Selected
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FBFAFD] px-6 py-10 text-center">
                        <Search size={24} className="mx-auto text-[#92909D]" />

                        <h3 className="mt-3 text-sm font-semibold text-gray-900">
                          No matching features
                        </h3>

                        <p className="mt-2 text-xs text-[#77808E]">
                          Try searching with a different keyword.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Form actions */}
          <div className="flex flex-col-reverse gap-3 rounded-[20px] border border-[#EAE7EF] bg-white p-4 sm:flex-row sm:justify-end">
            <Link
              href={`/admin/products/${productId}/features`}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-[#514B5A] transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={saving || loading || loadError || !selectedFeatureId}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] px-6 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Feature
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          {/* Completion */}
          <section className={`${cardClass} p-5`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-[#8065B0]" />

              <h2 className="text-sm font-semibold text-[#1F2430]">
                Assignment Status
              </h2>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs font-medium text-[#77808E]">
                Feature selected
              </span>

              <span className="text-sm font-bold text-[#1F2430]">
                {selectedFeature ? "1/1" : "0/1"}
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F0EBFA]">
              <div
                className="h-full rounded-full bg-[#9676C7] transition-all duration-300"
                style={{
                  width: selectedFeature ? "100%" : "0%",
                }}
              />
            </div>

            <p className="mt-3 text-xs leading-5 text-[#92909D]">
              Select a feature to enable assignment.
            </p>
          </section>

          {/* Preview */}
          <section className={cardClass}>
            <div className="border-b border-[#F0EDF4] px-5 py-4">
              <h2 className="text-sm font-semibold text-[#1F2430]">
                Feature Preview
              </h2>

              <p className="mt-1 text-xs text-[#92909D]">
                Review your selected feature
              </p>
            </div>

            <div className="p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <Sparkles size={20} />
              </div>

              <h3 className="mt-4 break-words text-base font-semibold text-[#1F2430]">
                {selectedFeature?.name || "No feature selected"}
              </h3>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#77808E]">
                {selectedFeature
                  ? selectedFeature.description || "No description provided."
                  : "Select a feature from the list to see its details here."}
              </p>

              {selectedFeature && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#D7EDE0] bg-[#EFF9F3] px-2.5 py-1.5 text-xs font-semibold text-[#278455]">
                    <CheckCircle2 size={14} />
                    Ready to Assign
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Tip */}
          <section className="rounded-[20px] border border-[#E7DDF5] bg-[#F8F5FD] p-5">
            <div className="flex items-center gap-2">
              <Info size={17} className="text-[#8065B0]" />

              <h2 className="text-sm font-bold text-[#4C4260]">Helpful Tip</h2>
            </div>

            <p className="mt-2 text-xs leading-6 text-[#77808E]">
              Features are reusable across multiple products. Assigning a
              feature links it to this product without changing its original
              definition.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-[#F0EDF4] px-5 py-5 sm:px-6">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
        {icon}
      </span>

      <div>
        <h2 className="text-base font-semibold text-[#1F2430]">{title}</h2>

        <p className="mt-1 text-xs leading-5 text-[#77808E]">{description}</p>
      </div>
    </div>
  );
}
