"use client";

import { useEffect, useState } from "react";
import {
  Check,
  LoaderCircle,
  Palette,
  Eye,
  SlidersHorizontal,
  RefreshCcw,
  RotateCcw,
  Save,
} from "lucide-react";
import { toast } from "react-toastify";

type WebsiteColors = {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  accent2Color: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  borderColor: string;
};

const DEFAULT_COLORS: WebsiteColors = {
  primaryColor: "#2563EB",
  secondaryColor: "#0F172A",
  accentColor: "#14B8A6",
  accent2Color: "#F97316",
  backgroundColor: "#FFFFFF",
  surfaceColor: "#F8FAFC",
  textColor: "#0F172A",
  mutedTextColor: "#64748B",
  borderColor: "#E2E8F0",
};

const COLOR_FIELDS: {
  key: keyof WebsiteColors;
  label: string;
  description: string;
}[] = [
  {
    key: "primaryColor",
    label: "Primary",
    description:
      "Main buttons, active navigation and important links.",
  },
  {
    key: "secondaryColor",
    label: "Secondary",
    description:
      "Dark sections, strong headings and secondary actions.",
  },
  {
    key: "accentColor",
    label: "Accent",
    description:
      "Supporting highlights, badges and visual emphasis.",
  },
  {
    key: "accent2Color",
    label: "Accent 2",
    description:
      "Optional additional highlight colour.",
  },
  {
    key: "backgroundColor",
    label: "Background",
    description:
      "Primary background colour across the website.",
  },
  {
    key: "surfaceColor",
    label: "Surface",
    description:
      "Light sections, cards and alternate backgrounds.",
  },
  {
    key: "textColor",
    label: "Text",
    description:
      "Primary headings and body text.",
  },
  {
    key: "mutedTextColor",
    label: "Muted Text",
    description:
      "Descriptions, metadata and secondary text.",
  },
  {
    key: "borderColor",
    label: "Border",
    description:
      "Cards, inputs, dividers and subtle boundaries.",
  },
];

export default function WebsiteDesignPage() {
  const [colors, setColors] =
    useState<WebsiteColors>(DEFAULT_COLORS);

  const [savedColors, setSavedColors] =
    useState<WebsiteColors>(DEFAULT_COLORS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hasChanges =
    JSON.stringify(colors) !==
    JSON.stringify(savedColors);

  /* =======================================================
     Load
  ======================================================= */

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);

        const response = await fetch(
          "/api/admin/website-settings",
          {
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load website settings."
          );
        }

        const data = await response.json();

        const loadedColors: WebsiteColors = {
          primaryColor: data.primaryColor,
          secondaryColor: data.secondaryColor,
          accentColor: data.accentColor,
          accent2Color: data.accent2Color,
          backgroundColor: data.backgroundColor,
          surfaceColor: data.surfaceColor,
          textColor: data.textColor,
          mutedTextColor: data.mutedTextColor,
          borderColor: data.borderColor,
        };

        setColors(loadedColors);
        setSavedColors(loadedColors);
      } catch (error) {
        console.error(error);

        toast.error(
          "Unable to load website colours."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  /* =======================================================
     Update field
  ======================================================= */

  function updateColor(
    field: keyof WebsiteColors,
    value: string
  ) {
    setColors((current) => ({
      ...current,
      [field]: value.toUpperCase(),
    }));
  }

  /* =======================================================
     Save
  ======================================================= */

  async function handleSave() {
    if (saving || !hasChanges) return;
    if (COLOR_FIELDS.some(({ key }) => !/^#[0-9A-Fa-f]{6}$/.test(colors[key]))) {
      toast.error("Enter a valid 6-digit HEX colour for every field.");
      return;
    }
    try {
      setSaving(true);

      const response = await fetch(
        "/api/admin/website-settings",
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(colors),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save website colours."
        );
      }

      const updatedColors: WebsiteColors = {
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        accentColor: data.accentColor,
        accent2Color: data.accent2Color,
        backgroundColor: data.backgroundColor,
        surfaceColor: data.surfaceColor,
        textColor: data.textColor,
        mutedTextColor: data.mutedTextColor,
        borderColor: data.borderColor,
      };

      setColors(updatedColors);
      setSavedColors(updatedColors);

      toast.success(
        "Website colours updated successfully."
      );
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save website colours."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     Reset
  ======================================================= */

  function handleResetDefaults() {
    setColors(DEFAULT_COLORS);

    toast.info(
      "Default colours loaded. Save to apply them."
    );
  }

  function handleDiscardChanges() {
    setColors(savedColors);
  }

  /* =======================================================
     Loading
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <LoaderCircle
            size={26}
            className="mx-auto animate-spin text-[#8065B0]"
          />

          <p className="mt-3 text-sm font-medium text-slate-500">
            Loading website design...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl pb-8">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F0EBFA] text-[#8065B0]">
            <Palette size={23} />
          </span>
          <div>
            <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-[#1F2430]">Global Colours</h1>
            <p className="mt-0.5 text-[14px] leading-5 text-[#77808E]">Manage the colour palette of your CADGram public website.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {hasChanges && (
            <button type="button" onClick={handleDiscardChanges} disabled={saving} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCcw size={15} /> Discard
            </button>
          )}
          <button type="button" onClick={handleResetDefaults} disabled={saving} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#E5E2EA] bg-white px-4 text-[13px] font-medium text-[#44414C] transition hover:bg-[#F8F6FA] disabled:cursor-not-allowed disabled:opacity-50">
            <RotateCcw size={15} /> Reset Defaults
          </button>
          <button type="button" onClick={handleSave} disabled={saving || !hasChanges} className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl bg-[#25232C] px-4 text-[13px] font-medium text-white transition hover:bg-[#403948] disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* ===================================================
          Main
      ==================================================== */}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        {/* =================================================
            Colour settings
        ================================================== */}

        <div className="overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white">
          <div className="border-b border-[#F0EDF4] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0EBFA] text-[#8065B0]"><SlidersHorizontal size={19} /></span>
              <div><h2 className="text-[16px] font-semibold text-[#252632]">Colour Palette</h2><p className="mt-0.5 text-[13px] text-[#848797]">Select a colour or enter a HEX value.</p></div>
            </div>


          </div>

          <div className="divide-y divide-slate-100">
            {COLOR_FIELDS.map((field) => (
              <ColorSetting
                key={field.key}
                label={field.label}
                description={field.description}
                value={colors[field.key]}
                onChange={(value) =>
                  updateColor(field.key, value)
                }
              />
            ))}
          </div>
        </div>

        {/* =================================================
            Preview
        ================================================== */}

        <div>
          <div className="sticky top-24 overflow-hidden rounded-[20px] border border-[#EAE7EF] bg-white">
            <div className="border-b border-[#F0EDF4] px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2"><Eye size={17} className="text-[#8065B0]" /><h2 className="text-[16px] font-semibold text-[#252632]">Live Preview</h2></div>

                  <p className="mt-1 text-xs text-slate-500">
                    Preview your current palette.
                  </p>
                </div>

                {hasChanges && (
                  <span className="rounded-full border border-[#E9DCC5] bg-[#FFF9ED] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#A67A2B]">
                    Unsaved
                  </span>
                )}
              </div>
            </div>

            {/* Website mockup */}
            <div
              className="p-5"
              style={{
                backgroundColor:
                  colors.surfaceColor,
              }}
            >
              <div
                className="overflow-hidden rounded-xl border shadow-sm"
                style={{
                  borderColor:
                    colors.borderColor,
                  backgroundColor:
                    colors.backgroundColor,
                }}
              >
                {/* Mock header */}
                <div
                  className="flex items-center justify-between border-b px-4 py-3"
                  style={{
                    borderColor:
                      colors.borderColor,
                  }}
                >
                  <span
                    className="text-sm font-black"
                    style={{
                      color:
                        colors.secondaryColor,
                    }}
                  >
                    CADGram
                  </span>

                  <div className="flex gap-2">
                    <span
                      className="h-2 w-8 rounded-full"
                      style={{
                        backgroundColor:
                          colors.borderColor,
                      }}
                    />

                    <span
                      className="h-2 w-8 rounded-full"
                      style={{
                        backgroundColor:
                          colors.primaryColor,
                      }}
                    />
                  </div>
                </div>

                {/* Mock content */}
                <div className="p-5">
                  <span
                    className="inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide"
                    style={{
                      color:
                        colors.primaryColor,
                      backgroundColor: `${colors.primaryColor}14`,
                    }}
                  >
                    Software
                  </span>

                  <h3
                    className="mt-4 text-xl font-bold"
                    style={{
                      color:
                        colors.textColor,
                    }}
                  >
                    Find the right software.
                  </h3>

                  <p
                    className="mt-2 text-xs leading-5"
                    style={{
                      color:
                        colors.mutedTextColor,
                    }}
                  >
                    Compare software products,
                    features and pricing for your
                    workflow.
                  </p>

                  <div className="mt-5 flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg px-3 py-2 text-[10px] font-semibold text-white"
                      style={{
                        backgroundColor:
                          colors.primaryColor,
                      }}
                    >
                      Browse Software
                    </button>

                    <button
                      type="button"
                      className="rounded-lg border px-3 py-2 text-[10px] font-semibold"
                      style={{
                        borderColor:
                          colors.borderColor,
                        color:
                          colors.textColor,
                      }}
                    >
                      Compare
                    </button>
                  </div>

                  {/* Card */}
                  <div
                    className="mt-5 rounded-xl border p-4"
                    style={{
                      borderColor:
                        colors.borderColor,
                      backgroundColor:
                        colors.surfaceColor,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{
                          backgroundColor:
                            colors.accentColor,
                        }}
                      >
                        C
                      </div>

                      <div>
                        <p
                          className="text-xs font-bold"
                          style={{
                            color:
                              colors.textColor,
                          }}
                        >
                          Software Product
                        </p>

                        <p
                          className="mt-1 text-[10px]"
                          style={{
                            color:
                              colors.mutedTextColor,
                          }}
                        >
                          Product description
                          appears here.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mock dark section */}
                <div
                  className="p-5"
                  style={{
                    backgroundColor:
                      colors.secondaryColor,
                  }}
                >
                  <p className="text-xs font-bold text-white">
                    Compare your options.
                  </p>

                  <div className="mt-3 flex gap-2">
                    <span
                      className="h-2 flex-1 rounded-full"
                      style={{
                        backgroundColor:
                          colors.accentColor,
                      }}
                    />

                    <span
                      className="h-2 flex-1 rounded-full"
                      style={{
                        backgroundColor:
                          colors.accent2Color,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Palette */}
              <div className="mt-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                  Palette
                </p>

                <div className="grid grid-cols-5 gap-2">
                  {[
                    colors.primaryColor,
                    colors.secondaryColor,
                    colors.accentColor,
                    colors.accent2Color,
                    colors.surfaceColor,
                  ].map((color, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg border border-black/5 shadow-sm"
                      style={{
                        backgroundColor: color,
                      }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="border-t border-[#F0EDF4] px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Check size={11} />
                </div>

                Changes appear here before saving.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   Colour setting
========================================================= */

function ColorSetting({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const validColor =
    /^#[0-9A-Fa-f]{6}$/.test(value);

  return (
    <div className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_230px] sm:items-center sm:px-6">
      <div>
        <label className="text-[13px] font-semibold text-[#353342]">
          {label}
        </label>

        <p className="mt-1 max-w-md text-[12px] leading-5 text-[#848797]">
          {description}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Native colour picker */}
        <label
          className="relative h-11 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-[#E5E2EA] shadow-sm"
          title={`Choose ${label} colour`}
        >
          <input
            type="color"
            value={
              validColor
                ? value
                : "#000000"
            }
            onChange={(event) =>
              onChange(event.target.value)
            }
            className="absolute -inset-2 h-16 w-20 cursor-pointer border-0 p-0"
          />
        </label>

        {/* HEX */}
        <div className="relative flex-1">
          <input
            type="text"
            value={value}
            maxLength={7}
            spellCheck={false}
            onChange={(event) =>
              onChange(event.target.value)
            }
            className={`h-11 w-full rounded-xl border bg-white px-3 font-mono text-sm font-semibold uppercase outline-none transition ${
              validColor
                ? "border-slate-200 text-slate-700 focus:border-[#B7A3D8] focus:ring-4 focus:ring-[#F0EBFA]"
                : "border-red-300 text-red-600 focus:border-red-400 focus:ring-4 focus:ring-red-50"
            }`}
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
}