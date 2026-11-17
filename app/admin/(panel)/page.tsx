import Link from "next/link";
import { listAccessRequests, requestStats, requestsByDataset } from "@/lib/repo";
import { getDatasets } from "@/lib/datasets";
import { formatDateTime } from "@/lib/format";
import StatusBadge from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const stats = requestStats();
  const pending = listAccessRequests({ status: "pending" }).slice(0, 6);
  const recent = listAccessRequests().slice(0, 6);
  const topDatasets = requestsByDataset(4);
  const datasets = getDatasets();

  const cards = [
    { label: "Pending review", value: stats.pending, tone: "text-amber-700", href: "/admin/requests?status=pending" },
    { label: "Approved", value: stats.approved, tone: "text-forest-700", href: "/admin/requests?status=approved" },
    { label: "Declined", value: stats.declined, tone: "text-red-700", href: "/admin/requests?status=declined" },
    { label: "Total requests", value: stats.total, tone: "text-forest-950", href: "/admin/requests" },
  ];

  const rows = pending.length ? pending : recent;
  const showingPending = pending.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-600">Overview</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-forest-950">Request queue</h1>
        </div>
        <p className="text-xs text-forest-600">
          {datasets.length} datasets catalogued · Region VII
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="card p-5 transition hover:border-forest-200 hover:shadow-md">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-600">{card.label}</p>
            <p className={`mt-2 font-display text-3xl font-bold ${card.tone}`}>{card.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-forest-100 px-5 py-3.5">
            <h2 className="font-display text-base font-semibold text-forest-950">
              {showingPending ? "Awaiting review" : "Most recent requests"}
            </h2>
            <Link href="/admin/requests" className="text-xs font-semibold text-forest-700 hover:underline">
              All requests →
            </Link>
          </div>

          {rows.length ? (
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Requester</th>
                    <th>Dataset</th>
                    <th>Submitted</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((request) => (
                    <tr key={request.id} className="hover:bg-forest-50/40">
                      <td className="whitespace-nowrap font-mono text-[11px]">
                        <Link href={`/admin/requests/${request.id}`} className="font-semibold text-forest-800 hover:underline">
                          {request.ref}
                        </Link>
                      </td>
                      <td>
                        <p className="font-medium text-forest-900">{request.full_name}</p>
                        <p className="text-[11px] text-forest-600">{request.organization}</p>
                      </td>
                      <td className="max-w-[220px]">
                        <p className="truncate text-forest-800">{request.dataset_title}</p>
                        <p className="font-mono text-[10px] text-forest-500">{request.dataset_slug}</p>
                      </td>
                      <td className="whitespace-nowrap text-[11px] text-forest-600">
                        {formatDateTime(request.created_at)}
                      </td>
                      <td>
                        <StatusBadge status={request.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-14 text-center">
              <p className="font-display text-base font-semibold text-forest-900">No requests yet</p>
              <p className="mt-1 text-sm text-forest-600">
                Requests submitted through the public portal will appear here.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <section className="card p-5">
            <h2 className="font-display text-base font-semibold text-forest-950">Most requested</h2>
            {topDatasets.length ? (
              <ol className="mt-3 space-y-3">
                {topDatasets.map((row, index) => (
                  <li key={row.dataset_title} className="flex items-start gap-3">
                    <span className="mt-0.5 font-mono text-[11px] text-forest-400">{String(index + 1).padStart(2, "0")}</span>
                    <span className="flex-1 text-sm leading-snug text-forest-800">{row.dataset_title}</span>
                    <span className="badge-outline">{row.c}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-2 text-sm text-forest-600">No request data yet.</p>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-display text-base font-semibold text-forest-950">Review checklist</h2>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-forest-700">
              <li>· Purpose is specific and matches the dataset.</li>
              <li>· Requester belongs to a verifiable organization.</li>
              <li>· No redistribution intent stated.</li>
              <li>· Sensitive tenure fields are only released to eligible parties.</li>
              <li>· Approval is recorded in the audit log automatically.</li>
            </ul>
            <Link href="/terms" className="mt-4 inline-block text-xs font-semibold text-forest-700 hover:underline">
              Data sharing terms →
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
