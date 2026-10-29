"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

type EnquiryStatus = "pending" | "contacted" | "closed";

type Props = {
  enquiryId: number;
  status: string;
};

const statusConfig = {
  pending: {
    label: "Pending",
    icon: Clock3,
    className: "border-[#F5E4BF] bg-[#FFFAED] text-[#A77521]",
  },
  contacted: {
    label: "Contacted",
    icon: CheckCircle2,
    className: "border-[#D8E7FA] bg-[#F0F6FF] text-[#4275B6]",
  },
  closed: {
    label: "Closed",
    icon: XCircle,
    className: "border-[#E5E2EA] bg-[#F8F7FA] text-[#77717F]",
  },
} as const;

function normalizeStatus(status: string): EnquiryStatus {
  const value = status.toLowerCase();
  if (value === "pending" || value === "contacted" || value === "closed") {
    return value;
  }
  return "pending";
}

export default function EnquiryStatusSelect({ enquiryId, status }: Props) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState<EnquiryStatus>(
    () => normalizeStatus(status),
  );
  const [updating, setUpdating] = useState(false);

  // Keep the selector in sync if the server sends updated enquiry data.
  useEffect(() => {
    if (!updating) setCurrentStatus(normalizeStatus(status));
  }, [status, updating]);

  async function handleStatusChange(newStatus: EnquiryStatus) {
    if (newStatus === currentStatus || updating) return;

    const previousStatus = currentStatus;
    setCurrentStatus(newStatus);
    setUpdating(true);

    try {
      const response = await fetch(`/api/admin/enquiries/${enquiryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Failed to update enquiry status.");
      }

      toast.success(
        data.message || `Enquiry marked as ${statusConfig[newStatus].label}.`,
      );
      router.refresh();
    } catch (error) {
      setCurrentStatus(previousStatus);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update enquiry status.",
      );
    } finally {
      setUpdating(false);
    }
  }

  const config = statusConfig[currentStatus];
  const StatusIcon = config.icon;

  return (
    <div className="relative inline-flex shrink-0 items-center">
      <StatusIcon
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 z-10"
      />
      <select
        value={currentStatus}
        disabled={updating}
        onChange={(event) =>
          void handleStatusChange(event.target.value as EnquiryStatus)
        }
        aria-label="Change enquiry status"
        aria-busy={updating}
        className={`h-9 min-w-[132px] cursor-pointer appearance-none rounded-xl border py-1.5 pl-8 pr-8 text-[12px] font-medium outline-none transition focus:ring-4 focus:ring-[#F0EBFA] disabled:cursor-not-allowed disabled:opacity-60 ${config.className}`}
      >
        <option value="pending">Pending</option>
        <option value="contacted">Contacted</option>
        <option value="closed">Closed</option>
      </select>
      {updating ? (
        <Loader2
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 animate-spin"
        />
      ) : (
        <ChevronDown
          size={14}
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5"
        />
      )}
    </div>
  );
}
