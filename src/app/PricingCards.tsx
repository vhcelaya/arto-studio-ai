"use client";

import { useState } from "react";
import SignupModal from "./SignupModal";

const pricing = [
  {
    name: "Starter",
    price: "$99",
    period: "/mo",
    description: "Strategy + Narrative for one brand",
    cta: "start-trial" as const,
    ctaLabel: "Start free trial",
    ctaHint: "5 free calls — no card required",
    features: [
      "Brand positioning",
      "Monthly content calendar",
      "Social media copy",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$299",
    period: "/mo",
    description: "All 5 pillars, weekly reports, autonomous sessions",
    cta: "waitlist" as const,
    ctaLabel: "Join waitlist",
    ctaHint: "Coming soon",
    popular: true,
    features: [
      "Everything in Starter",
      "Creative direction",
      "SEO & digital audits",
      "Weekly strategy reports",
      "Autonomous content sessions",
      "Priority support",
    ],
  },
  {
    name: "Agency",
    price: "$799",
    period: "/mo",
    description: "Multi-brand, white-label, API access",
    cta: "waitlist" as const,
    ctaLabel: "Join waitlist",
    ctaHint: "Coming soon",
    features: [
      "Everything in Pro",
      "Up to 5 brands",
      "White-label deliverables",
      "API access",
      "Dedicated account manager",
    ],
  },
];

export default function PricingCards() {
  const [signupOpen, setSignupOpen] = useState(false);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {pricing.map((plan) => (
          <div
            key={plan.name}
            className={`flex flex-col rounded-2xl border p-8 ${
              plan.popular ? "border-foreground bg-white shadow-lg" : "border-border bg-white"
            }`}
          >
            {plan.popular && (
              <span className="mb-4 inline-block self-start rounded-full bg-foreground px-3 py-1 text-xs font-medium text-white">
                Most popular
              </span>
            )}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-bold tracking-tight">{plan.price}</span>
              <span className="text-muted">{plan.period}</span>
            </div>
            <p className="mt-2 text-sm text-muted">{plan.description}</p>

            {plan.cta === "start-trial" ? (
              <button
                onClick={() => setSignupOpen(true)}
                className="mt-6 block w-full rounded-full bg-foreground py-3 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                {plan.ctaLabel}
              </button>
            ) : (
              <a
                href="#waitlist"
                className={`mt-6 block w-full rounded-full py-3 text-center text-sm font-medium transition-colors ${
                  plan.popular
                    ? "bg-foreground text-white hover:bg-zinc-800"
                    : "border border-border hover:bg-zinc-50"
                }`}
              >
                {plan.ctaLabel}
              </a>
            )}
            <p className="mt-2 text-center text-xs text-muted">{plan.ctaHint}</p>

            <ul className="mt-6 flex-1 space-y-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <SignupModal open={signupOpen} onClose={() => setSignupOpen(false)} />
    </>
  );
}
