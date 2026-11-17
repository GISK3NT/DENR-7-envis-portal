import { listAudit } from "@/lib/repo";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const tone: Record<string, string> = {
  "auth.login": "bg-forest-50 text-forest-800",
  "auth.login_failed": "bg-red-50 text-red-800",
  "request.submitted": "bg-sky-50 text-sky-800",
  "request.approved": "bg-forest-100 text-forest-900",
  "request.declined": "bg-red-100 text-red-900",
  "user.created": "bg-amber-50 text-amber-900",
  "user.role_changed": "bg-amber-50 text-amber-900",
  "user.deleted": "bg-red-50 text-red-800",
};

export default async function AdminAuditPage() {
  const entries = listAudit(150);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-600">Audit</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-forest-950">Activity log</h1>
        <p className="mt-1 text-sm text-forest-600">
          Sign-ins, submissions and decisions. Newest first, capped at 150 entries per view.
        </p>
      </div>

      <section className="card overflow-hidden">
        {entries.length ? (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-forest-50/40">
                    <td className="whitespace-nowrap text-[11px] text-forest-600">{formatDateTime(entry.created_at)}</td>
                    <td className="text-forest-800">{entry.actor_email ?? "system"}</td>
                    <td>
                      <span className={`badge normal-case tracking-normal ${tone[entry.action] ?? "badge-outline"}`}>
                        {entry.action}
                      </span>
                    </td>
                    <td className="font-mono text-[11px] text-forest-700">{entry.target ?? "—"}</td>
                    <td className="max-w-[320px] text-[11px] text-forest-600">{entry.detail ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-16 text-center text-sm text-forest-600">No activity recorded yet.</div>
        )}
      </section>
    </div>
  );
}
