"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

/* ── Types ─────────────────────────────────────────────── */

interface RoastResult {
  overall: number;
  strategy: { score: number; roast: string };
  creativity: { score: number; roast: string };
  narrative: { score: number; roast: string };
  digital: { score: number; roast: string };
  verdict: string;
  improvements: string[];
}

/* ── Roast generation (deterministic, client-side) ───── */

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

const strategyRoasts = [
  "Your positioning says 'we do everything for everyone.' Translation: you stand for nothing.",
  "You're competing on features when the market already moved to competing on culture. Classic.",
  "Your brand strategy reads like a corporate Mad Libs. Insert [buzzword], add [synergy], serve lukewarm.",
  "No tension, no point of view, no cultural relevance. Your strategy is a room-temperature glass of water.",
  "You have a mission statement, not a strategy. There's a difference — and your customers can tell.",
  "Your positioning could belong to any of your 12 competitors. That's not a strategy, that's camouflage.",
  "You're playing it safe in a market that rewards boldness. Beige is not a brand strategy.",
  "Your target audience is 'everyone 18-65.' That's not targeting, that's hoping.",
];

const creativityRoasts = [
  "Your visual identity looks like it was designed by committee — because it probably was.",
  "Stock photos, blue gradients, and a sans-serif logo. Welcome to 2015, population: too many brands.",
  "Your brand looks like every other brand in your category. If I blur my eyes, you literally disappear.",
  "There's 'clean design' and then there's 'we had no creative direction.' Guess which one this is.",
  "Your color palette says 'trustworthy and reliable.' So does every bank, insurance company, and toothpaste brand.",
  "The anti-polish movement is here and you're still trying to look like a Fortune 500 annual report.",
  "Your creative direction is 'professional.' That's not a direction, that's the absence of one.",
  "Minimalism works when there's substance underneath. Right now it's just... minimum.",
];

const narrativeRoasts = [
  "Your brand talks about itself in every sentence. Your customer is the hero, not you. Read that again.",
  "Your copy reads like a press release from 2008. 'We're proud to announce' — nobody is proud reading this.",
  "'Innovative solutions for modern challenges.' I've seen this exact line on 47 websites today.",
  "Your brand story starts with your founding year. Nobody cares. Start with the customer's problem.",
  "You tell people you're great instead of showing them. That's not narrative, that's a LinkedIn humble-brag.",
  "Your brand voice is 'corporate warm.' That's like 'military jazz' — two things that cancel each other out.",
  "There's no tension in your story. No conflict, no stakes, no reason to care. It's a bedtime story — literally.",
  "Your tagline could be an AI-generated placeholder. Actually, it might be worse than one.",
];

const digitalRoasts = [
  "Your social media strategy is 'post three times a week and pray.' That's not a strategy, that's a ritual.",
  "You have 10K followers and 3 likes per post. That's not a community, that's a ghost town with bots.",
  "Your SEO strategy is non-existent. Page 5 of Google is basically witness protection.",
  "You're still thinking 'audience' when the market moved to 'community.' Broadcasting to nobody who cares.",
  "Your content calendar is just holidays and product launches. Where's the cultural conversation?",
  "Your website loads like it's powered by a hamster wheel. Speed is a ranking factor — and a respect factor.",
  "You treat social media like a megaphone when it should be a conversation. No wonder nobody's responding.",
  "Your digital presence is scattered across 7 platforms doing nothing well. Pick 2 and actually show up.",
];

const verdicts = [
  "Your brand isn't broken — it's just invisible. The raw material is there, but nobody can see it through the generic positioning.",
  "Honest truth: your brand has potential, but right now it's playing dress-up in someone else's clothes. Time to find your own voice.",
  "You're not terrible — you're forgettable. And in marketing, forgettable is worse than terrible. At least terrible gets talked about.",
  "Your brand is doing the marketing equivalent of mumbling. Speak up, take a stand, or get drowned out.",
  "There's a real brand buried under layers of corporate caution. The question is: are you brave enough to let it out?",
  "You're one bold decision away from being interesting. Right now you're three safe decisions deep into boring.",
  "Your brand has the personality of a default settings page. Factory reset and start with intention this time.",
  "Not hopeless — just directionless. With the right strategy, this could actually become something people remember.",
];

const improvementPool = [
  "Define a real positioning that your competitors can't copy — something only YOU can own.",
  "Kill the corporate speak. Write like a human talking to another human.",
  "Find your cultural tension — what conversation can your brand lead that nobody else is leading?",
  "Stop trying to appeal to everyone. Pick your tribe and speak directly to them.",
  "Invest in a visual identity that actually reflects your brand's personality, not your industry's defaults.",
  "Build community, not audience. Create spaces where your customers talk to each other, not just listen to you.",
  "Create a content strategy based on cultural relevance, not just product features.",
  "Make your customer the hero of every story you tell. Your brand is the guide, not the protagonist.",
  "Audit your digital presence — consolidate platforms and go deep instead of wide.",
  "Develop a brand voice guide that your team actually uses, not one that sits in a Google Drive folder.",
  "Stop chasing trends and start setting them. Your brand should lead conversations, not follow them.",
  "Align your visual identity with the anti-polish movement — authentic beats perfect in 2026.",
];

function generateRoast(brandName: string, industry: string, description: string): RoastResult {
  const seed = hash(brandName.toLowerCase() + industry.toLowerCase() + description.toLowerCase());

  const strategyScore = 3 + (seed % 5);          // 3-7
  const creativityScore = 2 + ((seed >> 3) % 6);  // 2-7
  const narrativeScore = 3 + ((seed >> 6) % 5);   // 3-7
  const digitalScore = 2 + ((seed >> 9) % 6);     // 2-7

  const overall =
    strategyScore * 0.3 +
    creativityScore * 0.25 +
    narrativeScore * 0.25 +
    digitalScore * 0.2;

  const s2 = hash(brandName + industry);
  const improvements = [
    pick(improvementPool, seed),
    pick(improvementPool, seed + 3),
    pick(improvementPool, seed + 7),
  ];
  // deduplicate
  const uniqueImprovements = [...new Set(improvements)];
  while (uniqueImprovements.length < 3) {
    uniqueImprovements.push(pick(improvementPool, seed + uniqueImprovements.length + 10));
  }

  return {
    overall: Math.round(overall * 10) / 10,
    strategy: { score: strategyScore, roast: pick(strategyRoasts, seed) },
    creativity: { score: creativityScore, roast: pick(creativityRoasts, seed >> 2) },
    narrative: { score: narrativeScore, roast: pick(narrativeRoasts, seed >> 4) },
    digital: { score: digitalScore, roast: pick(digitalRoasts, s2) },
    verdict: pick(verdicts, seed >> 1),
    improvements: uniqueImprovements.slice(0, 3),
  };
}

/* ── Score bar component ──────────────────────────────── */

function ScoreBar({ label, score, roast }: { label: string; score: number; roast: string }) {
  const pct = (score / 10) * 100;
  const color =
    score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="rounded-xl border border-border bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest">{label}</h3>
        <span className="text-2xl font-bold tracking-tight">{score}/10</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full ${color} transition-all duration-1000`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-muted">{roast}</p>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */

export default function BrandRoast() {
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<RoastResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);

  const stages = [
    "Scanning brand positioning...",
    "Evaluating creative direction...",
    "Analyzing narrative & voice...",
    "Auditing digital presence...",
    "Calculating ARTO Score...",
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim() || !industry.trim()) return;

    setResult(null);
    setAnalyzing(true);
    setStage(0);

    // Simulate analysis stages
    let currentStage = 0;
    const interval = setInterval(() => {
      currentStage++;
      if (currentStage < stages.length) {
        setStage(currentStage);
      } else {
        clearInterval(interval);
        setAnalyzing(false);
        setResult(generateRoast(brandName, industry, description));
      }
    }, 800);
  }

  function handleReset() {
    setResult(null);
    setBrandName("");
    setIndustry("");
    setDescription("");
    setStage(0);
  }

  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
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
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="/work" className="text-sm text-muted hover:text-foreground transition-colors">
              Work
            </Link>
            <Link
              href="/roast"
              className="text-sm font-medium text-foreground transition-colors"
            >
              Brand Roast
            </Link>
            <Link
              href="/#pricing"
              className="text-sm text-muted hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <a
              href="/#waitlist"
              className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="border-b border-border bg-foreground text-white">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-24">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-zinc-400">
            Free tool by ARTO Studio AI
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Brand Roast
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-zinc-400">
            Get a brutally honest analysis of your brand — scored across Strategy,
            Creativity, Narrative, and Digital — using the same methodology we use
            with Fortune 500 clients.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            No sugarcoating. No generic advice. Just the truth your brand needs to hear.
          </p>
        </div>
      </section>

      {/* Form / Results */}
      <section className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          {!result && !analyzing && (
            <div className="mx-auto max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Enter your brand details
              </h2>
              <p className="mt-2 text-muted">
                Be honest — the more context you give, the sharper the roast.
              </p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label htmlFor="brandName" className="block text-sm font-medium">
                    Brand name *
                  </label>
                  <input
                    id="brandName"
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Acme Corp"
                    required
                    className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="industry" className="block text-sm font-medium">
                    Industry *
                  </label>
                  <select
                    id="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    required
                    className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-foreground bg-white"
                  >
                    <option value="">Select your industry</option>
                    <option value="Technology">Technology</option>
                    <option value="E-commerce">E-commerce / Retail</option>
                    <option value="Food & Beverage">Food & Beverage</option>
                    <option value="Finance">Finance / Fintech</option>
                    <option value="Health & Wellness">Health & Wellness</option>
                    <option value="Education">Education</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Fashion">Fashion & Beauty</option>
                    <option value="Entertainment">Entertainment & Media</option>
                    <option value="SaaS">SaaS / B2B</option>
                    <option value="Agency">Agency / Services</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium">
                    Brief description of your brand
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does your brand do? Who is your audience? What makes you different (or not)?"
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-border px-4 py-3 text-sm outline-none transition-colors focus:border-foreground resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-full bg-foreground px-8 py-4 text-base font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  Roast My Brand
                </button>
                <p className="text-center text-xs text-zinc-400">
                  Free forever. No signup required. Results are for entertainment
                  and strategic inspiration.
                </p>
              </form>
            </div>
          )}

          {/* Analyzing animation */}
          {analyzing && (
            <div className="mx-auto max-w-2xl text-center py-20">
              <div className="mx-auto mb-8 h-16 w-16 animate-spin rounded-full border-4 border-zinc-200 border-t-foreground" />
              <h2 className="text-2xl font-bold tracking-tight">
                Analyzing {brandName}...
              </h2>
              <p className="mt-4 text-lg text-muted">{stages[stage]}</p>
              <div className="mt-8 mx-auto max-w-sm">
                <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-700"
                    style={{ width: `${((stage + 1) / stages.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div>
              {/* Overall Score */}
              <div className="mb-12 text-center">
                <p className="text-sm font-medium uppercase tracking-widest text-muted">
                  ARTO Score for
                </p>
                <h2 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
                  {brandName}
                </h2>
                <p className="mt-1 text-sm text-muted">{industry}</p>
                <div className="mt-6 inline-flex items-baseline gap-1">
                  <span
                    className={`text-7xl font-bold tracking-tight ${
                      result.overall >= 7
                        ? "text-emerald-500"
                        : result.overall >= 5
                        ? "text-amber-500"
                        : "text-red-500"
                    }`}
                  >
                    {result.overall}
                  </span>
                  <span className="text-2xl font-bold text-zinc-300">/10</span>
                </div>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                  Weighted: Strategy (30%) + Creativity (25%) + Narrative (25%) + Digital (20%)
                </p>
              </div>

              {/* Score cards */}
              <div className="grid gap-6 md:grid-cols-2">
                <ScoreBar label="Strategy" score={result.strategy.score} roast={result.strategy.roast} />
                <ScoreBar label="Creativity" score={result.creativity.score} roast={result.creativity.roast} />
                <ScoreBar label="Narrative" score={result.narrative.score} roast={result.narrative.roast} />
                <ScoreBar label="Digital" score={result.digital.score} roast={result.digital.roast} />
              </div>

              {/* Verdict */}
              <div className="mt-12 rounded-2xl border border-border bg-zinc-50 p-8 md:p-10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted">
                  The Verdict
                </h3>
                <p className="mt-4 text-lg font-medium leading-relaxed">
                  {result.verdict}
                </p>
              </div>

              {/* Improvements */}
              <div className="mt-8 rounded-2xl border border-border p-8 md:p-10">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted">
                  Where to Start
                </h3>
                <ul className="mt-4 space-y-4">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-muted">{imp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="mt-12 rounded-2xl bg-foreground p-8 text-center text-white md:p-12">
                <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
                  Ready to fix what&apos;s broken?
                </h3>
                <p className="mx-auto mt-4 max-w-lg text-zinc-400">
                  This roast is just the surface. ARTO Studio AI gives you a complete
                  brand strategy, creative direction, and content system — powered by
                  15+ years of real methodology.
                </p>
                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <a
                    href="/#waitlist"
                    className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-zinc-100"
                  >
                    Start 7-day free trial
                  </a>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center justify-center rounded-full border border-zinc-700 px-8 py-3.5 text-base font-medium transition-colors hover:bg-zinc-800"
                  >
                    Roast another brand
                  </button>
                </div>
              </div>
            </div>
          )}
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
