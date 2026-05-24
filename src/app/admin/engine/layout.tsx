import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { requireAdminSession } from "@/lib/auth";
import EngineTabs from "./EngineTabs";

/* /admin/engine/* gate. Server-checks Supabase session + ADMIN_EMAILS
 * allowlist; renders the engine chrome + delegates the active-tab
 * highlight to the EngineTabs client component. */

export const dynamic = "force-dynamic";

export default async function EngineLayout({ children }: { children: React.ReactNode }) {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      redirect("/login?next=/admin/engine");
    }
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <nav className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/arto-logo-black.png"
              alt="ARTO"
              width={80}
              height={24}
              className="h-6 w-auto"
            />
            <span className="text-sm font-medium tracking-wide text-zinc-500">
              ADMIN · ENGINE
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-xs text-zinc-400 sm:inline" title={auth.email}>
              {auth.email}
            </span>
            <Link
              href="/admin"
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              ← Back to Admin
            </Link>
            <Link
              href="/auth/signout"
              className="text-sm text-zinc-500 hover:text-red-600 transition-colors"
            >
              Sign out
            </Link>
          </div>
        </div>
        <EngineTabs />
      </nav>

      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
