import Link from "next/link";
import type { Metadata } from "next";
import NewsletterForm from "@/components/NewsletterForm";

export const metadata: Metadata = {
  title: "Skills Studio — ARTO Studio AI",
  description:
    "AI-powered creative tools: brand positioning, architecture analysis, illustration licensing, and more. Coming soon.",
};

const SKILLS = [
  {
    name: "Brand Positioning",
    desc: "Run ARTO's 5-phase positioning process with AI. Brief, Brand Essence, calibration scoring, anti-pattern detection.",
    status: "In development",
  },
  {
    name: "Brand Architecture",
    desc: "Evaluate sub-brand structures. Company-first vs product-forward analysis with competitor mapping.",
    status: "Planned",
  },
  {
    name: "Illustration Licensing",
    desc: "Creation and licensing as separate line items. Rate card calculator with market-by-market pricing.",
    status: "Planned",
  },
  {
    name: "Healthcare UI Dashboard",
    desc: "Clinical modular UI patterns built on Preline/Tailwind. Data-dense layouts for health tech products.",
    status: "Planned",
  },
  {
    name: "Credit Retainer Calculator",
    desc: "Token-based pricing model for retainers. Calculate credit allocation, burn rates, and client billing.",
    status: "Planned",
  },
  {
    name: "Mural Broker RFP",
    desc: "Multi-provider RFQ for outdoor and mural projects. Compare quotes, manage production timelines.",
    status: "Planned",
  },
];

export default function SkillsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
      <div className="mb-12">
        <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
          Coming soon
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Skills Studio</h1>
        <p className="mt-3 max-w-xl text-lg text-neutral-600">
          AI-powered creative tools built on ARTO&apos;s real methodology. Each skill
          encodes a specific workflow that took years to develop, now available
          on demand.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Starting at $29/mo. Includes all Prompts Pro features.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SKILLS.map((skill) => (
          <div key={skill.name} className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{skill.name}</h3>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  skill.status === "In development"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {skill.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-500">{skill.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <h2 className="text-xl font-bold">Get early access</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Drop your email — we&apos;ll let you know the moment Skills Studio is
          ready. Early subscribers get a launch discount.
        </p>
        <div className="mx-auto mt-6 max-w-sm">
          <NewsletterForm source="skills" cta="Notify me" />
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link href="/pricing" className="text-sm text-neutral-500 hover:text-neutral-700">
          &larr; See all pricing plans
        </Link>
      </div>
    </div>
  );
}
