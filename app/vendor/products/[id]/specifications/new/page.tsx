
"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  FileText,
  Info,
  LoaderCircle,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "react-toastify";

type Specification = {
  id: number;
  name: string;
};

const cardClass =
  "rounded-[20px] border border-[#EAE7EF] bg-white shadow-[0_4px_18px_rgba(42,31,68,0.025)]";

const inputClass =
  "w-full min-h-11 rounded-xl border border-[#E5E2EA] bg-white px-4 py-3 text-[13px] text-[#292631] outline-none transition placeholder:text-[#A6A0AF] focus:border-[#A58ACD] focus:ring-4 focus:ring-[#F1ECF9] disabled:cursor-not-allowed disabled:bg-[#F8F7FA]";

export default function NewVendorProductSpecificationPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id as string;

  const [specifications, setSpecifications] = useState<
    Specification[]
  >([]);

  const [specificationId, setSpecificationId] = useState("");
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSpecifications() {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/vendor/specifications",
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          toast.error(
            data.message || "Failed to load specifications."
          );
          return;
        }

        setSpecifications(data.specifications || []);
      } catch (error) {
        console.error(
          "Load vendor specifications error:",
          error
        );

        toast.error("Failed to load specifications.");
      } finally {
        setLoading(false);
      }
    }

    void loadSpecifications();
  }, []);

  const filteredSpecifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return specifications;

    return specifications.filter((specification) =>
      specification.name.toLowerCase().includes(query)
    );
  }, [search, specifications]);

  const selectedSpecification = specifications.find(
    (specification) =>
      String(specification.id) === specificationId
  );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!specificationId) {
      toast.error("Please select a specification.");
      return;
    }

    if (!value.trim()) {
      toast.error("Specification value is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `/api/vendor/products/${productId}/specifications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            specificationId: Number(specificationId),
            value: value.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(
          data.message ||
            "Failed to add product specification."
        );
        return;
      }

      toast.success(
        "Product specification added successfully."
      );

      router.push(
        `/vendor/products/${productId}/specifications`
      );
      router.refresh();
    } catch (error) {
      console.error(
        "Add vendor product specification error:",
        error
      );

      toast.error(
        "Something went wrong while adding the specification."
      );
    } finally {
      setSaving(false);
    }
  }

  const canSubmit =
    !loading &&
    !saving &&
    Boolean(specificationId) &&
    Boolean(value.trim());

  return (
    <div className="space-y-6 pb-8">
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-400">
        
        <Link
          href={`/vendor/products/${productId}/specifications`}
          className="cursor-pointer hover:text-gray-900"
        >
          Specifications
        </Link>

        <ChevronRight size={13} />

        <span className="text-gray-700">
          Add Specification
        </span>
      </div>

      {/* Page Heading */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <Link
            href={`/vendor/products/${productId}/specifications`}
            aria-label="Back to specifications"
            className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EBDEFA] text-[#8065B0] shadow-sm"
          >
            <SlidersHorizontal size={20} strokeWidth={1.8} />
          </Link>

          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">
              Add Product Specification
            </h1>

            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">
              Select a reusable specification and configure its
              value for your product.
            </p>
          </div>
        </div>

        <Link
          href={`/vendor/products/${productId}/specifications`}
          className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA]"
        >
          <ArrowLeft size={16} />
          Back to Specifications
        </Link>
      </section>

      {/* Workspace */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
        {/* Main Form */}
        <form
          id="add-specification-form"
          onSubmit={handleSubmit}
          className={`${cardClass} overflow-hidden`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#EEEAF2] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <SlidersHorizontal size={21} />
              </span>

              <div>
                <h2 className="text-[15px] font-semibold text-[#252330]">
                  Specification Details
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Choose a specification and enter its value.
                </p>
              </div>
            </div>

            <span className="shrink-0 rounded-full border border-[#EAE7EF] bg-[#F8F7FA] px-3 py-1.5 text-xs font-medium text-[#77717F]">
              {loading ? "Loading" : `${specifications.length} Total`}
            </span>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {/* Search */}
            <div>
              <label
                htmlFor="specification-search"
                className="mb-2 block text-[13px] font-semibold text-gray-700"
              >
                Search Specifications
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="specification-search"
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search by specification name..."
                  disabled={loading || saving}
                  className={`${inputClass} pl-11`}
                />
              </div>

              {search.trim() && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  disabled={saving}
                  className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-[#8065B0] hover:bg-[#F0EBFA] disabled:opacity-50"
                >
                  <RotateCcw size={13} /> Reset search
                </button>
              )}

              {!loading && (
                <p className="mt-2 text-xs text-gray-400">
                  {filteredSpecifications.length}{" "}
                  {filteredSpecifications.length === 1
                    ? "specification"
                    : "specifications"}{" "}
                  available
                </p>
              )}
            </div>

            {/* Specification Selector */}
            <div>
              <p className="mb-3 text-[13px] font-semibold text-gray-700">
                Select Specification
                <span className="ml-1 text-[#8065B0]">
                  *
                </span>
              </p>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-20 animate-pulse rounded-2xl bg-gray-100"
                    />
                  ))}
                </div>
              ) : filteredSpecifications.length > 0 ? (
                <div
                  role="radiogroup"
                  aria-label="Select specification"
                  className="max-h-[350px] space-y-3 overflow-y-auto pr-1"
                >
                  {filteredSpecifications.map((specification) => {
                    const selected =
                      specificationId === String(specification.id);

                    return (
                      <label
                        key={specification.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                          selected
                            ? "border-[#A58ACD] bg-[#F7F3FC] ring-2 ring-[#EEE6FA]"
                            : "border-[#EAE7EF] bg-white hover:border-gray-300 hover:bg-gray-50"
                        } ${saving ? "pointer-events-none opacity-60" : ""}`}
                      >
                        <input
                          type="radio"
                          name="specificationId"
                          value={specification.id}
                          checked={selected}
                          onChange={() =>
                            setSpecificationId(String(specification.id))
                          }
                          disabled={saving}
                          className="sr-only"
                        />

                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            selected
                              ? "bg-[#EAE1F6] text-[#8065B0]"
                              : "bg-[#F0EBFA] text-[#8065B0]"
                          }`}
                        >
                          <SlidersHorizontal size={18} />
                        </span>

                        <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">
                          {specification.name}
                        </span>

                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-[#8065B0] bg-[#8065B0] text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {selected && <CheckCircle2 size={13} />}
                        </span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-[#FBFAFD] p-6 text-center">
                  <Search size={24} className="text-gray-400" />

                  <p className="mt-3 text-sm font-semibold text-gray-800">
                    {specifications.length === 0
                      ? "No specifications available"
                      : "No matching specifications"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {specifications.length === 0
                      ? "The specification library is currently empty."
                      : "Try searching with a different keyword."}
                  </p>
                </div>
              )}
            </div>

            {/* Value */}
            <div>
              <label
                htmlFor="specification-value"
                className="mb-2 block text-[13px] font-semibold text-gray-700"
              >
                Specification Value
                <span className="ml-1 text-[#8065B0]">
                  *
                </span>
              </label>

              <input
                id="specification-value"
                type="text"
                value={value}
                onChange={(event) =>
                  setValue(event.target.value)
                }
                placeholder="e.g. Windows 11"
                disabled={saving}
                className={inputClass}
              />

              <p className="mt-2 text-xs leading-5 text-gray-400">
                Enter the value that applies specifically to this product.
              </p>
            </div>

            {/* Live Preview */}
            {selectedSpecification && (
              <div className="rounded-2xl border border-[#E4D9F2] bg-[#F8F5FC] p-5">
                <div className="flex items-center gap-2">
                  <FileText size={17} className="text-[#8065B0]" />

                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#8065B0]">
                    Live Preview
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    {selectedSpecification.name}
                  </span>

                  <span className="break-words text-sm font-bold text-gray-950">
                    {value.trim() || "Value not entered yet"}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse gap-3 border-t border-[#EEEAF2] bg-[#FBFAFD] px-5 py-5 sm:flex-row sm:justify-end sm:px-6">
            <Link
              href={`/vendor/products/${productId}/specifications`}
              className="inline-flex items-center justify-center rounded-xl border border-[#E5E2EA] bg-white px-5 py-3 text-[13px] font-medium text-[#44414C] transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#25232C] min-h-10 px-4 py-2.5 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={17} />
                  Add Specification
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-[112px]">
          <section className={`${cardClass} p-5`}>
            <div className="flex items-start justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]">
                <SlidersHorizontal size={21} />
              </span>

              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-semibold text-gray-600">
                New
              </span>
            </div>

            <h2 className="mt-5 text-[15px] font-semibold text-[#252330]">
              Specification Summary
            </h2>

            <p className="mt-2 text-xs leading-6 text-gray-500">
              Select a specification from the library and
              configure the value for this product.
            </p>

            <div className="mt-5 space-y-4 rounded-2xl bg-[#F8F7FA] p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Specification
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {selectedSpecification?.name || "Not selected"}
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Value
                </p>

                <p className="mt-2 break-words text-sm font-semibold text-gray-900">
                  {value.trim() || "Not configured"}
                </p>
              </div>
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
              Specifications describe structured product
              attributes, such as operating systems,
              compatibility, or technical requirements.
            </p>

            <div className="mt-4 flex items-start gap-2 border-t border-[#EEEAF2] pt-4">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-gray-400"
              />

              <p className="text-xs leading-5 text-gray-500">
                You are assigning an existing specification,
                not creating a new specification definition.
              </p>
            </div>
          </section>
        </aside>
      </div>

      {/* Footer */}
      <footer className="flex flex-col gap-2 border-t border-gray-200 pt-5 text-xs text-gray-400 sm:flex-row sm:items-center sm:justify-between">
        <p>CADGram Vendor Portal</p>
        <p>Manage specifications. Grow your business.</p>
      </footer>
    </div>
  );
}
