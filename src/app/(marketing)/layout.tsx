import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { createClient } from "@/lib/supabase/server";

/* Layout for marketing routes only — homepage, pricing, skills, agents.
   /admin, /studio, /roast, /upgrade, /welcome, /work keep their own
   layouts because they ship a different nav/footer pattern.

   Server component so we can fetch the auth user from Supabase and pass
   it down to the (client) Nav component, which renders Sign in or
   Account button accordingly. */

export default async function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let userEmail: string | null = null;
  try {
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    userEmail = user?.email ?? null;
  } catch {
    // If Supabase env vars are missing during build, render as anonymous.
    userEmail = null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
        <Nav user={userEmail ? { email: userEmail } : null} />
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
