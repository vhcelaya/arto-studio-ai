import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

/* Layout for marketing routes only — homepage, pricing, skills, agents.
   /admin, /studio, /roast, /upgrade, /welcome, /work keep their own
   layouts because they ship a different nav/footer pattern. */

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
        <Nav />
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
