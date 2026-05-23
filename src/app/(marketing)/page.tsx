import Image from "next/image";
import Link from "next/link";

const VERTICALS = [
  { code: "BR", name: "Branding", count: 250 },
  { code: "DG", name: "Graphic Design", count: 250 },
  { code: "CW", name: "Copywriting", count: 250 },
  { code: "FT", name: "Photography", count: 250 },
  { code: "VD", name: "Video", count: 250 },
  { code: "UX", name: "UX / UI", count: 250 },
  { code: "IL", name: "Illustration", count: 250 },
  { code: "MK", name: "Marketing", count: 250 },
  { code: "MU", name: "Music", count: 250 },
  { code: "AR", name: "Architecture", count: 250 },
  { code: "FA", name: "Fashion", count: 250 },
  { code: "CP", name: "Creative Productivity", count: 250 },
];

const LIBRARY_HREF = "https://library.artostudio.ai/prompts";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-6">
      {/* HERO */}
      <section className="py-16 sm:py-24">
        <div className="flex flex-col items-start gap-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-neutral-400">
              By ARTO Group — 15+ years with Google, Nike, Uber
            </p>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              The creative studio
              <br />
              <span className="text-neutral-400">that never sleeps.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-neutral-600">
              Access ARTO&apos;s real methodology — strategy, creativity,
              narrative, and production — through prompts, AI tools, and
              autonomous agents. 3,000 prompts, brand positioning skills, and
              creative agents, built on 15+ years with Fortune 500 brands.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/roast"
                className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
              >
                Try Brand Roast — Free
              </Link>
              <Link
                href="/pricing"
                className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
              >
                See pricing
              </Link>
              <Link
                href="/work"
                className="rounded-md px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:text-neutral-900"
              >
                See our work →
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <Image
              src="/brand/arto-character-01.png"
              alt="ARTO"
              width={280}
              height={280}
              priority
              className="h-auto w-[260px] lg:w-[300px]"
            />
          </div>
        </div>
      </section>

      {/* THREE TIERS */}
      <section className="border-t border-neutral-200 py-16">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Three products. One platform.
        </p>
        <h2 className="mb-10 text-2xl font-bold tracking-tight sm:text-3xl">
          Everything a creative team needs.
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border-2 border-neutral-900 bg-white p-6">
            <div className="mb-3">
              <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                Live
              </span>
            </div>
            <h3 className="text-lg font-bold">Prompt Library</h3>
            <p className="mt-1 text-sm text-neutral-500">
              3,000 bilingual prompts across 12 creative verticals. Browse free
              or unlock the full catalog for $9/mo.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-neutral-600">
              <li>12 verticals: branding to architecture</li>
              <li>English and Spanish, side by side</li>
              <li>Collections, favorites, smart search</li>
              <li>Free tier with ~730 prompts</li>
            </ul>
            <a
              href={LIBRARY_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 block rounded-md bg-neutral-900 px-4 py-2 text-center text-sm font-medium text-white transition hover:bg-neutral-700"
            >
              Browse catalog
            </a>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-3">
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                Coming soon
              </span>
            </div>
            <h3 className="text-lg font-bold">Skills Studio</h3>
            <p className="mt-1 text-sm text-neutral-500">
              AI-powered creative tools. Brand positioning, architecture
              analysis, illustration licensing, and more.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-neutral-600">
              <li>Brand Positioning skill</li>
              <li>Brand Architecture analysis</li>
              <li>Illustration licensing calculator</li>
              <li>Healthcare UI templates</li>
            </ul>
            <Link
              href="/skills"
              className="mt-5 block rounded-md border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
            >
              Join waitlist
            </Link>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            <div className="mb-3">
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                Coming soon
              </span>
            </div>
            <h3 className="text-lg font-bold">AI Agents</h3>
            <p className="mt-1 text-sm text-neutral-500">
              Autonomous creative workflows. A Brand Writer agent, Social
              Content agent, and Client Hub agent that run on your behalf.
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-neutral-600">
              <li>Brand Writer agent</li>
              <li>Social Content agent</li>
              <li>Client Hub automation</li>
              <li>Provider coordination</li>
            </ul>
            <Link
              href="/agents"
              className="mt-5 block rounded-md border border-neutral-300 px-4 py-2 text-center text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
            >
              Join waitlist
            </Link>
          </div>
        </div>
      </section>

      {/* THE ARTO METHOD */}
      <section className="border-t border-neutral-200 py-16">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
          The ARTO Method
        </p>
        <h2 className="mb-10 text-2xl font-bold tracking-tight sm:text-3xl">
          Five pillars. One system. Always improving.
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { n: "01", title: "Strategy", desc: "Market analysis, competitive benchmarking, brand positioning, and consumer insights." },
            { n: "02", title: "Creativity", desc: "Visual identity, color palettes, mood boards, and creative direction." },
            { n: "03", title: "Narrative", desc: "Brand storytelling, copywriting, editorial content, and scripts." },
            { n: "04", title: "Production", desc: "Social media content, email campaigns, landing pages, and presentations." },
            { n: "05", title: "Digital", desc: "SEO audits, social media strategy, content calendars, and analytics." },
          ].map((p) => (
            <div key={p.n} className="rounded-lg border border-neutral-200 bg-white p-5">
              <span className="text-xs font-bold text-neutral-400">{p.n}</span>
              <h3 className="mt-1 font-bold">{p.title}</h3>
              <p className="mt-1 text-sm text-neutral-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIFFERENTIATORS */}
      <section className="border-t border-neutral-200 py-16">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
          Not just another AI tool
        </p>
        <h2 className="mb-10 text-2xl font-bold tracking-tight sm:text-3xl">
          A system that gets smarter every day.
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { title: "Knowledge Feed", desc: "Our team feeds real frameworks, trends, and learnings from premium clients into the system daily." },
            { title: "Auto-Evaluation", desc: "Every deliverable is scored on Strategy, Creativity, Narrative, and Production. Below threshold? Regenerated automatically." },
            { title: "Nightly Consolidation", desc: "Every night, the system reviews all sessions, extracts patterns, and updates the knowledge base." },
          ].map((d) => (
            <div key={d.title} className="rounded-lg border border-neutral-200 bg-white p-5">
              <h3 className="font-bold">{d.title}</h3>
              <p className="mt-2 text-sm text-neutral-500">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BRAND ROAST CTA */}
      <section className="border-t border-neutral-200 py-16">
        <div className="rounded-xl border border-neutral-200 bg-white p-8 sm:p-10">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            Free tool
          </p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Think your brand is solid? Prove it.
          </h2>
          <p className="mt-3 max-w-xl text-neutral-600">
            Get an honest analysis of your brand across Strategy, Creativity,
            Narrative, and Digital, scored with the same methodology we use for
            Fortune 500 clients. No signup required.
          </p>
          <Link
            href="/roast"
            className="mt-6 inline-block rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Roast My Brand
          </Link>
        </div>
      </section>

      {/* VERTICALS GRID */}
      <section className="border-t border-neutral-200 py-16">
        <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">12 creative verticals</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {VERTICALS.map((v) => (
            <a
              key={v.code}
              href={`${LIBRARY_HREF}?vertical=${v.code}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 transition hover:border-neutral-400 hover:shadow-sm"
            >
              <div>
                <p className="text-xs font-bold text-neutral-400">{v.code}</p>
                <p className="text-sm font-medium text-neutral-900">{v.name}</p>
              </div>
              <p className="text-xs text-neutral-400">{v.count}</p>
            </a>
          ))}
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="border-t border-neutral-200 py-16">
        <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
          How ARTO Studio AI compares
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-xs uppercase text-neutral-400">
                <th className="py-3 pr-4">Alternative</th>
                <th className="py-3 pr-4">Limitation</th>
                <th className="py-3">ARTO Studio AI</th>
              </tr>
            </thead>
            <tbody className="text-neutral-600">
              {[
                ["ChatGPT", "Generic prompts", "15+ years of real methodology"],
                ["Freelancer", "$1,500-3,000/mo", "From $0/mo, always available"],
                ["Agency", "$5,000-15,000/mo", "Same quality, fraction of the cost"],
                ["Canva", "DIY templates", "Strategic thinking + execution"],
              ].map(([alt, limit, asai]) => (
                <tr key={alt} className="border-b border-neutral-100">
                  <td className="py-3 pr-4 font-medium text-neutral-900">{alt}</td>
                  <td className="py-3 pr-4">{limit}</td>
                  <td className="py-3 font-medium text-neutral-900">{asai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="border-t border-neutral-200 py-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Ready to see ARTO Studio AI in action?
        </h2>
        <p className="mt-3 max-w-xl text-neutral-600">
          Start with the free Brand Roast. Browse the Library. Reserve your seat
          for Skills Studio and AI Agents when they ship.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/roast"
            className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Try Brand Roast
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-400"
          >
            See pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
