import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/admin";
import AdminNav from "@/components/admin-nav";
import { Logo } from "@/components/logo";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-sand-50">
      <header className="sticky top-0 z-30 border-b border-sand-200 bg-sand-50/90 backdrop-blur-md">
        <div className="container-gov flex h-16 items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Logo size={34} variant="static" />
            <span className="hidden leading-none sm:block">
              <span className="block font-display text-[15px] font-semibold tracking-tight text-forest-950">
                ENVIS Console
              </span>
              <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-forest-600">
                DENR Region VII
              </span>
            </span>
          </Link>

          <span aria-hidden className="hidden h-6 w-px bg-sand-300 sm:block" />

          <div className="flex-1 overflow-x-auto">
            <AdminNav />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[12px] font-semibold text-forest-900">{user.name}</p>
              <p className="text-[10px] font-medium text-forest-500">{user.username ? `@${user.username}` : user.email}</p>
            </div>
            <form action={logoutAction}>
              <button type="submit" className="btn-secondary btn-sm">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main id="main" className="container-gov py-10">
        {children}
      </main>

      <footer className="container-gov flex flex-wrap items-center justify-between gap-2 border-t border-sand-200 py-5 text-[11px] text-forest-500">
        <p className="uppercase tracking-[0.1em]">ENVIS review console · internal use only</p>
        <Link href="/" className="font-semibold transition hover:text-forest-900">
          View public portal →
        </Link>
      </footer>
    </div>
  );
}
