import Link from "next/link";
import type { Metadata } from "next";
import NewsletterForm from "@/components/NewsletterForm";

export const metadata: Metadata = {
  title: "AI Agents — ARTO Studio AI",
  description:
    "Autonomous creative workflows: Brand Writer, Social Content, Client Hub, and Provider Coordination agents. Coming soon.",
};

const AGENTS = [
  {
    name: "Brand Writer Agent",
    desc: "Writes brand content using your positioning, voice guidelines, and the 'asi si / asi no' table. Bilingual EN/ES from day one.",
    status: "In development",
  },
  {
    name: "Social Content Agent",
    desc: "Creates weekly content calendars, writes posts, suggests visuals, and schedules across platforms. Follows your brand voice.",
    status: "Planned",
  },
  {
    name: "Client Hub Agent",
    desc: "Automates Client Hub creation for new deals. Sets up Notion portals, Drive folders, and welcome sequences.",
    status: "Planned",
  },
  {
    name: "Provider Coordination Agent",
    desc: "Auto-links deals to Provider Hubs, generates RFQs, tracks deliverables, and manages the provider workflow.",
    status: "Planned",
  },
];

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
      <div className="mb-12">
        <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
          Coming soon
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">AI Agents</h1>
        <p className="mt-3 max-w-xl text-lg text-neutral-600">
          Autonomous creative workflows that run on your behalf. Each agent
          encodes a complete operational process, trained on ARTO&apos;s 15+ years of
          real client work.
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          Starting at $79/mo. Includes all Skills Studio features.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {AGENTS.map((agent) => (
          <div key={agent.name} className="rounded-lg border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">{agent.name}</h3>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  agent.status === "In development"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-neutral-100 text-neutral-500"
                }`}
              >
                {agent.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-500">{agent.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 border-t border-neutral-200 pt-12">
        <h2 className="mb-6 text-xl font-bold">How ARTO agents work</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              n: "01",
              title: "Knowledge base",
              desc: "Each agent reads from ARTO's canonical knowledge: client patterns, methodology, positioning frameworks, and anti-patterns.",
            },
            {
              n: "02",
              title: "Autonomous execution",
              desc: "Agents run workflows end-to-end. A Brand Writer agent drafts, self-evaluates against the calibration scale (3-5-8-9), and iterates.",
            },
            {
              n: "03",
              title: "Human review",
              desc: "Every agent output goes through a review step. You approve, adjust, or redirect before anything ships.",
            },
          ].map((step) => (
            <div key={step.n} className="rounded-lg border border-neutral-200 bg-white p-5">
              <span className="text-xs font-bold text-neutral-400">{step.n}</span>
              <h3 className="mt-1 font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-neutral-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <h2 className="text-xl font-bold">Get early access</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Drop your email — we&apos;ll let you know the moment AI Agents launch.
          Early subscribers get a launch discount.
        </p>
        <div className="mx-auto mt-6 max-w-sm">
          <NewsletterForm source="agents" cta="Notify me" />
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
