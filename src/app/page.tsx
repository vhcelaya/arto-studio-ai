import Image from "next/image";
import Link from "next/link";
import WaitlistForm from "./waitlist-form";
import PricingCards from "./PricingCards";

const pillars = [
  {
    title: "Strategy",
    description:
      "Market analysis, competitive benchmarking, brand positioning, and consumer insights powered by real agency methodology.",
  },
  {
    title: "Creativity",
    description:
      "Visual identity, color palettes, mood boards, and creative direction that stands out in culture, not just in category.",
  },
  {
    title: "Narrative",
    description:
      "Brand storytelling, copywriting, editorial content, and scripts where your customer is the hero, not your brand.",
  },
  {
    title: "Production",
    description:
      "Social media content, email campaigns, landing pages, and presentations — ready to publish, not just draft ideas.",
  },
  {
    title: "Digital",
    description:
      "SEO audits, social media strategy, content calendars, and analytics reports that drive real growth.",
  },
];

const comparisons = [
  { them: "ChatGPT", us: "Generic prompts", arto: "15+ years of real methodology" },
  { them: "Freelancer", us: "$1,500–3,000/mo", arto: "From $99/mo, always available" },
  { them: "Agency", us: "$5,000–15,000/mo", arto: "Same quality, fraction of the cost" },
  { them: "Canva", us: "DIY templates", arto: "Strategic thinking + execution" },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/arto-logo-black.png"
              alt="ARTO"
              width={80}
              height={24}
              className="h-6 w-auto"
            />
            <span className="text-sm font-medium tracking-wide text-muted">
              STUDIO AI
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/work" className="text-sm text-muted hover:text-foreground transition-colors">
              Work
            </Link>
            <Link href="/roast" className="text-sm text-muted hover:text-foreground transition-colors">
              Brand Roast
            </Link>
            <a href="#pricing" className="text-sm text-muted hover:text-foreground transition-colors">
              Pricing
            </a>
            <a
              href="#waitlist"
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32 lg:py-40">
          <div className="flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted">
                By ARTO Group — 15+ years with Google, Nike, Uber
              </p>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
                The marketing agency
                <br />
                <span className="text-zinc-400">that never sleeps.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
                Access ARTO&apos;s real methodology — strategy, creativity, narrative, and
                production — through an AI agent trained on 15+ years of experience
                with Fortune 500 brands.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#waitlist"
                  className="inline-flex items-center justify-center rounded-full bg-foreground px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  Start 7-day free trial
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-full border border-border px-8 py-3.5 text-base font-medium transition-colors hover:bg-zinc-50"
                >
                  See how it works
                </a>
              </div>
              <p className="mt-4 text-xs text-zinc-400">
                No charge until day 8. Cancel anytime. 30-day money-back guarantee.
              </p>
            </div>
            <div className="hidden md:block">
              <Image
                src="/brand/arto-character-01.png"
                alt="ARTO"
                width={280}
                height={280}
                className="opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-border bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Great marketing shouldn&apos;t cost $15,000/month.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-muted">
              You know you need strategy, creative, and consistent content. But
              hiring an agency costs $5–15K/month. A freelancer is unpredictable.
              And ChatGPT doesn&apos;t understand brand or culture.
            </p>
            <p className="mt-4 text-lg font-medium">
              ARTO Studio AI gives you the methodology of a world-class agency at a
              fraction of the cost.
            </p>
          </div>
        </div>
      </section>

      {/* How it works / 5 Pillars */}
      <section id="how-it-works" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-16 max-w-2xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-muted">
              The ARTO Method
            </p>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Five pillars. One system. Always improving.
            </h2>
            <p className="mt-4 text-lg text-muted">
              The same framework we use with Fortune 500 clients — now powered by AI
              and continuously refined by our team.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar, i) => (
              <div
                key={pillar.title}
                className={`rounded-2xl border border-border p-8 transition-colors hover:bg-zinc-50 ${
                  i === 4 ? "md:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-xl font-bold">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiator / Learning Loop */}
      <section className="border-t border-border bg-foreground text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="mb-2 text-sm font-medium uppercase tracking-widest text-zinc-400">
                Not just another AI tool
              </p>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                A system that gets smarter every day.
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                Every project our agency delivers, every client insight, every
                cultural shift — feeds directly into ARTO Studio AI. The knowledge
                base grows daily. The output quality improves weekly.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-zinc-400">
                Anyone can wrap ChatGPT and call it a marketing tool. Nobody else has
                15 years of methodology, a human team refining the system daily, and
                a self-evaluating quality layer.
              </p>
            </div>
            <div className="space-y-6">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="font-bold">Knowledge Feed</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Our team feeds real frameworks, trends, and learnings from premium
                  clients into the system — daily.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="font-bold">Auto-Evaluation</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Every deliverable is scored on Strategy, Creativity, Narrative, and
                  Production. Below threshold? It gets regenerated automatically.
                </p>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <h3 className="font-bold">Nightly Consolidation</h3>
                <p className="mt-2 text-sm text-zinc-400">
                  Every night, the system reviews all sessions, extracts patterns,
                  and updates the knowledge base. Tomorrow is always better than today.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              How ARTO Studio AI compares
            </h2>
          </div>
          <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-3 border-b border-border bg-zinc-50 px-6 py-4 text-sm font-medium">
              <span>Alternative</span>
              <span>Limitation</span>
              <span>ARTO Studio AI</span>
            </div>
            {comparisons.map((row) => (
              <div
                key={row.them}
                className="grid grid-cols-3 border-b border-border px-6 py-4 text-sm last:border-b-0"
              >
                <span className="font-medium">{row.them}</span>
                <span className="text-muted">{row.us}</span>
                <span className="font-medium">{row.arto}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Brand Roast CTA */}
      <section className="border-t border-border bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="relative overflow-hidden rounded-2xl bg-foreground p-10 text-white md:p-16">
            <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:justify-between">
              <div className="max-w-lg">
                <p className="mb-2 text-sm font-medium uppercase tracking-widest text-zinc-400">
                  Free tool
                </p>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                  Think your brand is solid?
                  <br />
                  <span className="text-zinc-400">Prove it.</span>
                </h2>
                <p className="mt-4 text-base leading-relaxed text-zinc-400">
                  Get a brutally honest analysis of your brand across Strategy,
                  Creativity, Narrative, and Digital — scored with the same methodology
                  we use for Fortune 500 clients. No signup required.
                </p>
              </div>
              <Link
                href="/roast"
                className="flex-shrink-0 rounded-full bg-white px-8 py-4 text-base font-medium text-foreground transition-colors hover:bg-zinc-100"
              >
                Roast My Brand
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-zinc-50">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-muted">
              An agency charges $5,000–15,000/month. We charge a fraction.
            </p>
          </div>
            <PricingCards />
        </div>
      </section>

      {/* Waitlist CTA */}
      <section id="waitlist" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <Image
              src="/brand/arto-character.gif"
              alt="ARTO"
              width={120}
              height={120}
              className="mx-auto mb-8"
              unoptimized
            />
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              The future agency is here.
            </h2>
            <p className="mt-4 text-lg text-muted">
              Join the waitlist and be the first to access ARTO Studio AI when we
              launch. Early members get lifetime pricing.
            </p>
            <WaitlistForm source="landing" />
            <p className="mt-3 text-xs text-zinc-400">
              No spam. We&apos;ll only email you when we launch.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-foreground text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-3">
              <Image
                src="/brand/arto-logo-black.png"
                alt="ARTO"
                width={60}
                height={18}
                className="h-4 w-auto invert"
              />
              <span className="text-xs tracking-wide text-zinc-500">STUDIO AI</span>
            </div>
            <p className="text-xs text-zinc-500">
              A product by ARTO Group. Design, Culture & Technology since 2009.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
