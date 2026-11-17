import { getCurrentUser } from "@/lib/auth";
import { listUsers } from "@/lib/repo";
import { formatDateTime } from "@/lib/format";
import { changeRoleAction, deleteUserAction } from "@/app/actions/admin";
import CreateUserForm from "@/components/create-user-form";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const actor = await getCurrentUser();
  const users = listUsers();
  const isAdmin = actor?.role === "admin";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-forest-600">Accounts</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-forest-950">Staff accounts</h1>
        <p className="mt-1 text-sm text-forest-600">
          Reviewers decide requests. Administrators can also manage accounts. Every action is written to the audit log.
        </p>
      </div>

      {!isAdmin ? (
        <p className="rounded-[10px] border border-brass-200 bg-brass-50 px-4 py-3 text-sm text-brass-700">
          Your account is a reviewer. Account management is limited to administrators.
        </p>
      ) : null}

      <section className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
                <th>Last sign in</th>
                {isAdmin ? <th className="text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-forest-50/40">
                  <td className="font-medium text-forest-900">
                    {user.name}
                    {user.id === actor?.id ? <span className="ml-2 badge-sand">you</span> : null}
                  </td>
                  <td className="font-mono text-[12px] text-forest-700">{user.username ?? "—"}</td>
                  <td className="text-forest-700">{user.email}</td>
                  <td>
                    <span className={user.role === "admin" ? "badge-forest" : "badge-outline"}>{user.role}</span>
                  </td>
                  <td className="whitespace-nowrap text-[11px] text-forest-600">{formatDateTime(user.created_at)}</td>
                  <td className="whitespace-nowrap text-[11px] text-forest-600">
                    {user.last_login_at ? formatDateTime(user.last_login_at) : "Never"}
                  </td>
                  {isAdmin ? (
                    <td>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {user.id !== actor?.id ? (
                          <>
                            <form action={changeRoleAction}>
                              <input type="hidden" name="id" value={user.id} />
                              <input type="hidden" name="role" value={user.role === "admin" ? "reviewer" : "admin"} />
                              <button type="submit" className="btn-secondary btn-sm">
                                Make {user.role === "admin" ? "reviewer" : "admin"}
                              </button>
                            </form>
                            <form action={deleteUserAction}>
                              <input type="hidden" name="id" value={user.id} />
                              <button type="submit" className="btn-ghost btn-sm text-red-700 hover:bg-red-50">
                                Remove
                              </button>
                            </form>
                          </>
                        ) : (
                          <span className="text-[11px] text-forest-400">—</span>
                        )}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isAdmin ? <CreateUserForm /> : null}
    </div>
  );
}
