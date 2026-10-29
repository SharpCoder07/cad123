"use client";

import { Fragment, useEffect, useRef, useState, type FormEvent } from "react";
import {
  Camera,
  Clock3,
  Loader2,
  UserRound,
  Eye,
  EyeOff,
  LockKeyhole,
  Trash2,
  Mail,
  CalendarDays,
  ShieldCheck,
  Globe2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "react-toastify";

type Profile = {
  id: number;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  jobTitle: string | null;
  department: string | null;
  timezone: string;
  createdAt: string;
  adminRole: {
    id: number;
    name: string;
  } | null;
};

type ProfileForm = {
  name: string;
  phone: string;
  jobTitle: string;
  department: string;
  timezone: string;
};

type Activity = {
  id: number;
  action: string;
  description: string;
  status: string;
  createdAt: string;
  metadata: {
    changes?: Record<
      string,
      {
        from: string | null;
        to: string | null;
      }
    >;
    updatedFields?: string[];
  } | null;
  user: {
    name: string | null;
    email: string;
  };
};

type ActivityPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

const tabs = [
  { id: "profile", label: "Profile" },
  { id: "security", label: "Password & Security" },
  { id: "personal", label: "Personal Details" },
  { id: "activity", label: "Activity" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const timezones = [
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
  { value: "Europe/London", label: "London" },
  { value: "America/New_York", label: "New York" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Singapore", label: "Singapore" },
];

const activityFieldLabels: Record<string, string> = {
  name: "Full Name",
  phone: "Phone Number",
  jobTitle: "Job Title",
  department: "Department",
  timezone: "Timezone",
};

function getActivityCategory(action: string) {
  if (action.includes("PASSWORD") || action.includes("LOGIN")) {
    return "Security";
  }

  if (action.includes("PRODUCT")) return "Product";
  if (action.includes("ROLE") || action.includes("PERMISSION")) {
    return "Access";
  }

  if (action.includes("USER")) return "User";

  return "Profile";
}

function getActivityChanges(activity: Activity) {
  const changes = activity.metadata?.changes;

  if (!changes || typeof changes !== "object") {
    return [];
  }

  return Object.entries(changes).filter(
    (entry): entry is [string, { from: string | null; to: string | null }] =>
      entry[1] !== null &&
      typeof entry[1] === "object" &&
      "from" in entry[1] &&
      "to" in entry[1],
  );
}

function formatActivityValue(value: string | null) {
  return value === null || value === "" ? "—" : value;
}

export default function AdminProfilePage() {
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityPage, setActivityPage] = useState(1);
  const [activityPagination, setActivityPagination] =
    useState<ActivityPagination | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [expandedActivityId, setExpandedActivityId] = useState<number | null>(
    null,
  );

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    phone: "",
    jobTitle: "",
    department: "",
    timezone: "Asia/Kolkata",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      try {
        const response = await fetch("/api/admin/profile", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load profile.");
        }

        if (cancelled) return;

        const user = data.profile as Profile;

        setProfile(user);
        setForm({
          name: user.name || "",
          phone: user.phone || "",
          jobTitle: user.jobTitle || "",
          department: user.department || "",
          timezone: user.timezone || "Asia/Kolkata",
        });
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Unable to load profile.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      toast.error("Full name is required.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update profile.");
      }

      setProfile(data.profile);
      window.dispatchEvent(new Event("admin-profile-updated"));
      toast.success("Profile updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed.");
      event.target.value = "";
      return;
    }

    if (file.size === 0 || file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5 MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingPhoto(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/profile/photo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to upload photo.");
      }

      setProfile((previous) =>
        previous ? { ...previous, image: data.image } : previous,
      );
      window.dispatchEvent(new Event("admin-profile-updated"));

      toast.success("Profile photo updated successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload photo.",
      );
    } finally {
      setUploadingPhoto(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handlePhotoRemove() {
    if (!profile?.image) return;

    try {
      setRemovingPhoto(true);

      const response = await fetch("/api/admin/profile/photo", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to remove photo.");
      }

      setProfile((previous) =>
        previous ? { ...previous, image: null } : previous,
      );
      window.dispatchEvent(new Event("admin-profile-updated"));

      toast.success("Profile photo removed successfully.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to remove photo.",
      );
    } finally {
      setRemovingPhoto(false);
    }
  }

  useEffect(() => {
    if (activeTab !== "activity") return;

    const controller = new AbortController();

    async function loadActivities() {
      try {
        setActivityLoading(true);
        setActivityError(null);

        const response = await fetch(
          `/api/admin/profile/activity?page=${activityPage}&limit=10`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load activity.");
        }

        if (controller.signal.aborted) return;

        setActivities(data.activities);
        setActivityPagination(data.pagination);
      } catch (error) {
        if (controller.signal.aborted) return;

        setActivityError(
          error instanceof Error ? error.message : "Unable to load activity.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setActivityLoading(false);
        }
      }
    }

    void loadActivities();

    return () => controller.abort();
  }, [activeTab, activityPage]);

  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#DC0000]" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <p className="font-medium text-gray-700">
          Unable to load your profile.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 cursor-pointer rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  const initials = (profile.name || "A").charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-950">
          My Profile
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Your details, password, two-step verification and signed-in devices.
        </p>
      </div>

      <div className="flex gap-6 overflow-x-auto border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 cursor-pointer border-b-2 pb-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-[#DC0000] text-[#DC0000]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900">Profile Photo</h2>
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG or WebP, up to 5 MB.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-5 p-6">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-red-50 text-2xl font-bold text-[#DC0000]">
                {profile.image ? (
                  <img
                    src={profile.image}
                    alt="Profile photo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto || removingPhoto}
                    className="hidden"
                    aria-label="Choose profile photo"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto || removingPhoto}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingPhoto ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Camera size={16} />
                    )}
                    {uploadingPhoto ? "Uploading..." : "Change Photo"}
                  </button>

                  {profile.image && (
                    <button
                      type="button"
                      onClick={handlePhotoRemove}
                      disabled={uploadingPhoto || removingPhoto}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removingPhoto ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                      {removingPhoto ? "Removing..." : "Remove"}
                    </button>
                  )}
                </div>

                <p className="text-xs text-gray-400">
                  Recommended: Square image, at least 200 × 200 pixels.
                </p>
              </div>
            </div>
          </section>

          <form
            onSubmit={handleSave}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
          >
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900">Your Details</h2>
              <p className="mt-1 text-xs text-gray-500">
                How you appear to the rest of the team.
              </p>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <Field label="Full Name" required>
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  maxLength={100}
                  required
                  className="profile-input"
                  placeholder="Enter your name"
                />
              </Field>

              <Field label="Phone">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  maxLength={30}
                  className="profile-input"
                  placeholder="Enter phone number"
                />
              </Field>

              <Field label="Job Title">
                <input
                  value={form.jobTitle}
                  onChange={(event) =>
                    updateField("jobTitle", event.target.value)
                  }
                  maxLength={100}
                  className="profile-input"
                  placeholder="Enter job title"
                />
              </Field>

              <Field label="Department">
                <input
                  value={form.department}
                  onChange={(event) =>
                    updateField("department", event.target.value)
                  }
                  maxLength={100}
                  className="profile-input"
                  placeholder="Enter department"
                />
              </Field>

              <Field label="Timezone">
                <select
                  value={form.timezone}
                  onChange={(event) =>
                    updateField("timezone", event.target.value)
                  }
                  className="profile-input cursor-pointer"
                >
                  {!timezones.some(
                    (timezone) => timezone.value === form.timezone,
                  ) && <option value={form.timezone}>{form.timezone}</option>}
                  {timezones.map((timezone) => (
                    <option key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-gray-400">
                  Used when showing dates and times to you.
                </p>
              </Field>

              <Field label="Role">
                <input
                  value={profile.adminRole?.name || "Administrator"}
                  readOnly
                  className="profile-input cursor-not-allowed bg-gray-50 text-gray-500"
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Only an authorized administrator can change this.
                </p>
              </Field>
            </div>

            <div className="flex justify-end border-t border-gray-100 px-6 py-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-sm font-bold text-gray-900">Sign-in Email</h2>
              <p className="mt-1 text-xs text-gray-500">
                This is the email address you use to sign in.
              </p>
            </div>

            <div className="p-6">
              <Field label="Email Address">
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="profile-input cursor-not-allowed bg-gray-50 text-gray-500"
                />
              </Field>
              <p className="mt-2 text-xs text-gray-400">
                Email changes will require password verification.
              </p>
            </div>
          </section>
        </div>
      )}

      {activeTab === "security" && (
        <div className="space-y-5">
          <ChangePasswordForm />
        </div>
      )}

      {activeTab === "personal" && (
        <div className="space-y-5">
          {/* Personal and professional information */}
          <form
            onSubmit={handleSave}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
          >
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-50 p-2.5 text-[#DC0000]">
                  <UserRound size={20} />
                </div>

                <div>
                  <h2 className="text-base font-bold text-gray-950">
                    Personal Information
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Manage your contact and professional details.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <Field label="Full Name" required>
                <input
                  value={form.name}
                  onChange={(event) => updateField("name", event.target.value)}
                  maxLength={100}
                  required
                  autoComplete="name"
                  className="profile-input"
                  placeholder="Enter your full name"
                />
              </Field>

              <Field label="Phone Number">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                  maxLength={30}
                  autoComplete="tel"
                  className="profile-input"
                  placeholder="Enter your phone number"
                />
              </Field>

              <Field label="Job Title">
                <input
                  value={form.jobTitle}
                  onChange={(event) =>
                    updateField("jobTitle", event.target.value)
                  }
                  maxLength={100}
                  autoComplete="organization-title"
                  className="profile-input"
                  placeholder="e.g. Product Manager"
                />
              </Field>

              <Field label="Department">
                <input
                  value={form.department}
                  onChange={(event) =>
                    updateField("department", event.target.value)
                  }
                  maxLength={100}
                  className="profile-input"
                  placeholder="e.g. Product Development"
                />
              </Field>

              <Field label="Timezone">
                <select
                  value={form.timezone}
                  onChange={(event) =>
                    updateField("timezone", event.target.value)
                  }
                  className="profile-input cursor-pointer"
                >
                  {!timezones.some(
                    (timezone) => timezone.value === form.timezone,
                  ) && <option value={form.timezone}>{form.timezone}</option>}

                  {timezones.map((timezone) => (
                    <option key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Email Address">
                <input
                  type="email"
                  value={profile.email}
                  readOnly
                  className="profile-input cursor-not-allowed bg-gray-50 text-gray-500"
                />
              </Field>
            </div>

            <div className="flex justify-end border-t border-gray-100 px-6 py-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>

          {/* Account information */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-gray-100 p-2.5 text-gray-700">
                  <ShieldCheck size={20} />
                </div>

                <div>
                  <h2 className="text-base font-bold text-gray-950">
                    Account Information
                  </h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Information associated with your administrator account.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <AccountInfo
                icon={<Mail size={18} />}
                label="Login Email"
                value={profile.email}
              />

              <AccountInfo
                icon={<ShieldCheck size={18} />}
                label="Assigned Role"
                value={profile.adminRole?.name || "Not assigned"}
              />

              <AccountInfo
                icon={<CalendarDays size={18} />}
                label="Account Created"
                value={new Date(profile.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  timeZone: form.timezone,
                })}
              />

              <AccountInfo
                icon={<Globe2 size={18} />}
                label="Preferred Timezone"
                value={
                  timezones.find(
                    (timezone) => timezone.value === profile.timezone,
                  )?.label || profile.timezone
                }
              />
            </div>
          </section>
        </div>
      )}

      {activeTab === "activity" && (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-2.5 text-[#DC0000]">
                <Clock3 size={20} />
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-950">
                  Account Activity
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Your recent account changes and security activity.
                </p>
              </div>
            </div>

            {activityPagination && (
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                {activityPagination.total} activities
              </span>
            )}
          </div>

          {activityLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Loader2 size={26} className="animate-spin text-[#DC0000]" />
            </div>
          ) : activityError ? (
            <div className="m-5 rounded-xl bg-red-50 p-5 text-center text-sm text-red-600">
              {activityError}
            </div>
          ) : activities.length === 0 ? (
            <div className="py-14 text-center">
              <Clock3 size={32} className="mx-auto mb-3 text-gray-400" />
              <p className="font-semibold text-gray-800">No activity yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Your account activity will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-5 py-4">When</th>
                    <th className="px-5 py-4">Who</th>
                    <th className="px-5 py-4">Action</th>
                    <th className="px-5 py-4">What Changed</th>
                    <th className="px-5 py-4 text-right">Detail</th>
                  </tr>
                </thead>

                <tbody>
                  {activities.map((activity) => {
                    const changes = getActivityChanges(activity);
                    const isExpanded = expandedActivityId === activity.id;
                    const hasDetails =
                      changes.length > 0 ||
                      (activity.metadata?.updatedFields?.length ?? 0) > 0;

                    return (
                      <Fragment key={activity.id}>
                        <tr className="border-b border-gray-100 transition hover:bg-gray-50/60">
                          <td className="whitespace-nowrap px-5 py-4 align-top text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                                timeZone: profile.timezone || "Asia/Kolkata",
                              },
                            )}
                          </td>

                          <td className="px-5 py-4 align-top">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.user?.name || "Unknown User"}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500">
                              {activity.user?.email || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md border border-gray-200 bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                                {activity.action}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getActivityCategory(activity.action)}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 align-top">
                            <p className="text-sm text-gray-800">
                              {activity.description}
                            </p>

                            <span
                              className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                activity.status === "SUCCESS"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-red-50 text-red-700"
                              }`}
                            >
                              {activity.status === "SUCCESS"
                                ? "Success"
                                : "Failed"}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right align-top">
                            {hasDetails ? (
                              <button
                                type="button"
                                aria-expanded={isExpanded}
                                aria-label={
                                  isExpanded
                                    ? "Hide activity details"
                                    : "Show activity details"
                                }
                                onClick={() =>
                                  setExpandedActivityId(
                                    isExpanded ? null : activity.id,
                                  )
                                }
                                className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-gray-600 hover:text-[#DC0000]"
                              >
                                {isExpanded ? "Hide" : "Show"}
                                {isExpanded ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                        </tr>

                        {isExpanded && hasDetails && (
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <td colSpan={5} className="px-5 py-5">
                              {changes.length > 0 ? (
                                <div className="space-y-3">
                                  <p className="text-xs font-bold uppercase tracking-wide text-gray-600">
                                    Changes Made
                                  </p>

                                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <table className="w-full text-left text-xs">
                                      <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50 text-gray-500">
                                          <th className="px-4 py-3 font-semibold">
                                            Field
                                          </th>
                                          <th className="px-4 py-3 font-semibold">
                                            Before
                                          </th>
                                          <th className="px-4 py-3 font-semibold">
                                            After
                                          </th>
                                        </tr>
                                      </thead>

                                      <tbody>
                                        {changes.map(([field, values]) => (
                                          <tr
                                            key={field}
                                            className="border-b border-gray-100 last:border-0"
                                          >
                                            <td className="px-4 py-3 font-medium text-gray-700">
                                              {activityFieldLabels[field] ||
                                                field}
                                            </td>

                                            <td className="max-w-[250px] break-words px-4 py-3 text-gray-500">
                                              {formatActivityValue(values.from)}
                                            </td>

                                            <td className="max-w-[250px] break-words px-4 py-3 font-medium text-gray-900">
                                              {formatActivityValue(values.to)}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <p className="mb-2 text-xs font-semibold text-gray-700">
                                    Previously recorded fields
                                  </p>

                                  <div className="flex flex-wrap gap-2">
                                    {activity.metadata?.updatedFields?.map(
                                      (field) => (
                                        <span
                                          key={field}
                                          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600"
                                        >
                                          {activityFieldLabels[field] || field}
                                        </span>
                                      ),
                                    )}
                                  </div>

                                  <p className="mt-3 text-xs text-gray-500">
                                    Exact previous and new values were not
                                    recorded for this older activity.
                                  </p>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activityPagination && activityPagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
              <p className="text-xs text-gray-500">
                Page {activityPagination.page} of{" "}
                {activityPagination.totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedActivityId(null);
                    setActivityPage((previous) => Math.max(1, previous - 1));
                  }}
                  disabled={
                    activityLoading || !activityPagination.hasPreviousPage
                  }
                  className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setExpandedActivityId(null);
                    setActivityPage((previous) => previous + 1);
                  }}
                  disabled={activityLoading || !activityPagination.hasNextPage}
                  className="cursor-pointer rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function AccountInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-gray-500 shadow-sm">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </span>
      {children}
    </label>
  );
}

function Placeholder({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-8 text-center">
      <div className="mb-4 rounded-2xl bg-gray-100 p-4 text-gray-600">
        {icon}
      </div>
      <h2 className="text-lg font-bold text-gray-950">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-gray-500">{description}</p>
    </div>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [saving, setSaving] = useState(false);

  const passwordRules = [
    {
      label: "At least 12 characters",
      valid: newPassword.length >= 12,
    },
    {
      label: "At most 128 characters",
      valid: newPassword.length <= 128,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(newPassword),
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(newPassword),
    },
    {
      label: "One number",
      valid: /[0-9]/.test(newPassword),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9]/.test(newPassword),
    },
  ];

  const validPassword = passwordRules.every((rule) => rule.valid);

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please complete all password fields.");
      return;
    }

    if (!validPassword) {
      toast.error("New password does not meet the security requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/admin/profile/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to change password.");
      }

      toast.success(data.message || "Password changed successfully.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrent(false);
      setShowNew(false);
      setShowConfirm(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to change password.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-red-50 p-2.5 text-[#DC0000]">
            <LockKeyhole size={20} />
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-950">
              Change Password
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Update your password to keep your account secure.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-5 p-6">
        <PasswordInput
          label="Current Password"
          value={currentPassword}
          onChange={setCurrentPassword}
          visible={showCurrent}
          onToggle={() => setShowCurrent((previous) => !previous)}
          autoComplete="current-password"
        />

        <div className="grid gap-5 md:grid-cols-2">
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            visible={showNew}
            onToggle={() => setShowNew((previous) => !previous)}
            autoComplete="new-password"
          />

          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirm}
            onToggle={() => setShowConfirm((previous) => !previous)}
            autoComplete="new-password"
          />
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="mb-3 text-xs font-semibold text-gray-700">
            Password requirements
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {passwordRules.map((rule) => (
              <div key={rule.label} className="flex items-center gap-2 text-xs">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full ${
                    rule.valid
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {rule.valid ? "✓" : "·"}
                </span>

                <span
                  className={rule.valid ? "text-green-700" : "text-gray-500"}
                >
                  {rule.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {confirmPassword && (
          <p
            className={`text-xs font-medium ${
              newPassword === confirmPassword
                ? "text-green-700"
                : "text-red-600"
            }`}
          >
            {newPassword === confirmPassword
              ? "Passwords match"
              : "Passwords do not match"}
          </p>
        )}

        <div className="flex justify-end border-t border-gray-100 pt-5">
          <button
            type="submit"
            disabled={
              saving ||
              !currentPassword ||
              !validPassword ||
              newPassword !== confirmPassword
            }
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}

            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
}

function PasswordInput({
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-gray-700">
        {label}
        <span className="ml-1 text-red-600">*</span>
      </span>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          className="profile-input pr-11"
          placeholder={`Enter ${label.toLowerCase()}`}
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          className="absolute inset-y-0 right-3 flex cursor-pointer items-center text-gray-400 hover:text-gray-700"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </label>
  );
}
