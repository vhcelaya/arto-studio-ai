import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";
import AdminClient from "./AdminClient";

/* /admin entry — server-gated by Supabase session + ADMIN_EMAILS allowlist.
 * Non-admins get a redirect (signed-in non-admin → home, anonymous → /login).
 * No API-key form. The page hands off to AdminClient for the tab UI, which
 * fetches /api/admin/* with cookie-based session auth (no Bearer header). */

export const dynamic = "force-dynamic";

export default async function AdminEntry() {
  const auth = await requireAdminSession();
  if (!auth.ok) {
    if (auth.reason === "unauthenticated") {
      redirect("/login?next=/admin");
    }
    // not_admin or no_allowlist — send the user back home; the link won't
    // even be rendered for them in the Nav, so reaching here is rare.
    redirect("/");
  }
  return <AdminClient email={auth.email} />;
}
