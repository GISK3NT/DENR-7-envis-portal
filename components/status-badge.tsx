import type { RequestStatus } from "@/lib/types";

const styles: Record<RequestStatus, string> = {
  pending: "bg-amber-100 text-amber-900",
  approved: "bg-forest-100 text-forest-800",
  declined: "bg-red-100 text-red-800",
};

const labels: Record<RequestStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  declined: "Declined",
};

export default function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`badge ${styles[status]}`}>
      <span aria-hidden className="text-[9px]">
        ●
      </span>
      {labels[status]}
    </span>
  );
}
