import Link from "next/link";
import { listAccessRequests, requestStats } from "@/lib/repo";
import { formatDateTime } from "@/lib/format";
import StatusBadge from "@/components/status-badge";
import type { RequestStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const tabs: { key: RequestStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "declined", label: "Declined" },
];

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: rawStatus, q = "" } = await searchParams;
  const status: RequestStatus | "all" =
    rawStatus === "pending" || rawStatus === "approved" || rawStatus === "declined" ? rawStatus : "all";

  const requests = listAccessRequests({ status, q });
  const stats = requestStats();

  const countFor = (key: RequestStatus | "all") => (key === "all" ? stats.total : stats[key]);
  const query = (next: { status?: string; q?: string }) => {
    const params = new URLSearchParams();
    const s = next.status ?? status;
    const term = next.q ?? q;
    if (s && s !== "all") params.set("status", s);
    if (term) params.set("q", term);
    const qs = params.toString();
    return qs ? `/admin/requests?${qs}` : "/admin/requests";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-600">Queue</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-forest-950">Access requests</h1>
        </div>
        <form method="get" className="flex items-center gap-2">
          {status !== "all" ? <input type="hidden" name="status" value={status} /> : null}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search ref, name, email…"
            className="w-56 rounded-[9px] border border-sand-300 bg-white px-3 py-2 text-sm transition hover:border-forest-300 focus:border-forest-600 focus:outline-none focus:ring-4 focus:ring-forest-100"
          />
          <button type="submit" className="btn-secondary btn-sm">
            Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const active = tab.key === status;
          return (
            <Link
              key={tab.key}
              href={query({ status: tab.key })}
              className={`inline-flex items-center gap-2 rounded-[8px] px-3.5 py-1.5 text-[13px] font-medium transition ${
                active ? "bg-forest-900 text-sand-50" : "border border-sand-300 bg-white text-forest-800 hover:border-forest-300 hover:bg-forest-50"
              }`}
            >
              {tab.label}
              <span className={`text-[11px] ${active ? "text-forest-200" : "text-forest-500"}`}>{countFor(tab.key)}</span>
            </Link>
          );
        })}
        {q ? (
          <Link href={query({ q: "" })} className="ml-1 self-center text-xs font-semibold text-forest-600 hover:underline">
            Clear search
          </Link>
        ) : null}
      </div>

      <section className="card overflow-hidden">
        {requests.length ? (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Requester</th>
                  <th>Dataset</th>
                  <th>Purpose</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-forest-50/40">
                    <td className="whitespace-nowrap font-mono text-[11px] font-semibold text-forest-800">
                      {request.ref}
                    </td>
                    <td>
                      <p className="font-medium text-forest-900">{request.full_name}</p>
                      <p className="text-[11px] text-forest-600">{request.email}</p>
                      <p className="text-[11px] text-forest-500">{request.organization}</p>
                    </td>
                    <td className="max-w-[200px]">
                      <p className="truncate text-forest-800">{request.dataset_title}</p>
                      <p className="font-mono text-[10px] text-forest-500">{request.dataset_slug}</p>
                    </td>
                    <td className="max-w-[260px]">
                      <p className="line-clamp-2 text-xs leading-relaxed text-forest-700">{request.purpose}</p>
                    </td>
                    <td className="whitespace-nowrap text-[11px] text-forest-600">
                      {formatDateTime(request.created_at)}
                    </td>
                    <td>
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="whitespace-nowrap text-right">
                      <Link
                        href={`/admin/requests/${request.id}`}
                        className="text-xs font-semibold text-forest-700 hover:underline"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <p className="font-display text-base font-semibold text-forest-900">Nothing in this queue</p>
            <p className="mt-1 text-sm text-forest-600">
              {q ? "Try a different search term." : "Requests will appear here as they are submitted."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
