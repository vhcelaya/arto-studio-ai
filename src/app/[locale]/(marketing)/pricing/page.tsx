import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — ARTO Studio AI",
  description: "Start free. Unlock the full prompt library for $9/mo. Skills and AI Agents launching soon.",
};

/* Pro $9 checkout is now internal. The route is auth-gated: if the user isn't
   signed in, /api/stripe/checkout/pro bounces them to /login with a `next`
   param and returns here after sign-in. After payment, Stripe redirects to
   /account?upgraded=pro and the existing webhook updates profiles.tier. */
const PRO_CHECKOUT_HREF = "/api/stripe/checkout/pro";

const TIERS = [
  {
    name: "Free",
    tagline: "Explore the library.",
    price: "$0",
    period: "/ forever",
    cta: "Try Brand Roast",
    ctaHref: "/roast",
    external: false,
    ctaStyle: "border border-neutral-300 text-neutral-700 hover:border-neutral-400",
    badge: null,
    features: [
      "Access to all Free-tier prompts (~730)",
      "Bilingual EN / ES",
      "Copy to clipboard",
      "Smart Search with recommendations",
      "Save favorites and collections",
      "Brand Roast (1 free analysis)",
    ],
  },
  {
    name: "Prompts Pro",
    tagline: "Full creative library.",
    price: "$9",
    period: "/ per month",
    cta: "Subscribe",
    ctaHref: PRO_CHECKOUT_HREF,
    external: false,
    ctaStyle: "bg-neutral-900 text-white hover:bg-neutral-700",
    badge: null,
    highlight: true,
    features: [
      "Everything in Free",
      "All 3,000 prompts (EN / ES)",
      "Unlimited daily views",
      "Priority access to new prompts",
      "Brand Roast unlimited",
      "Email support",
      "Cancel anytime",
    ],
  },
  {
    name: "Skills Studio",
    tagline: "AI-powered creative tools.",
    price: "$29",
    period: "/ per month",
    cta: "Join waitlist",
    ctaHref: "/skills",
    external: false,
    ctaStyle: "border border-neutral-300 text-neutral-700 hover:border-neutral-400",
    badge: "Coming soon",
    features: [
      "Everything in Prompts Pro",
      "Brand Positioning skill",
      "Brand Architecture analysis",
      "Illustration licensing calculator",
      "Healthcare UI templates",
      "Credit-based retainer calculator",
      "Priority support",
    ],
  },
  {
    name: "Agents",
    tagline: "Autonomous creative workflows.",
    price: "$79",
    period: "/ per month",
    cta: "Join waitlist",
    ctaHref: "/agents",
    external: false,
    ctaStyle: "border border-neutral-300 text-neutral-700 hover:border-neutral-400",
    badge: "Coming soon",
    features: [
      "Everything in Skills Studio",
      "Brand Writer agent",
      "Social Content agent",
      "Client Hub automation",
      "Provider coordination agent",
      "Custom agent configuration",
      "Dedicated support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Pricing</h1>
        <p className="mx-auto mt-3 max-w-lg text-neutral-600">
          Start free. Unlock the full catalog for $9/mo. Skills and Agents launching soon.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((tier) => {
          const ctaClasses = `mt-6 block rounded-md px-4 py-2.5 text-center text-sm font-medium transition ${tier.ctaStyle}`;
          return (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-xl border bg-white p-6 ${
                tier.highlight ? "border-2 border-neutral-900" : "border-neutral-200"
              }`}
            >
              {tier.badge && (
                <span className="absolute -top-3 left-4 rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  {tier.badge}
                </span>
              )}
              {tier.highlight && (
                <span className="absolute -top-3 left-4 rounded bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
                  Most popular
                </span>
              )}
              <h2 className="text-lg font-bold">{tier.name}</h2>
              <p className="mt-0.5 text-sm text-neutral-500">{tier.tagline}</p>
              <div className="mt-4">
                <span className="text-3xl font-extrabold">{tier.price}</span>
                <span className="ml-1 text-sm text-neutral-400">{tier.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 text-green-500">&#10003;</span>
                    <span className="text-neutral-600">{f}</span>
                  </li>
                ))}
              </ul>
              {tier.external ? (
                <a
                  href={tier.ctaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={ctaClasses}
                >
                  {tier.cta}
                </a>
              ) : (
                <Link href={tier.ctaHref} className={ctaClasses}>
                  {tier.cta}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <div className="mx-auto mt-12 max-w-2xl text-center">
        <p className="text-xs text-neutral-400">
          Payments processed by Stripe. Cancel from your account page anytime.
        </p>
      </div>

      <div className="mt-16 border-t border-neutral-200 pt-16">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
          What&apos;s included at each tier
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left">
                <th className="py-3 pr-4 text-xs uppercase text-neutral-400">Feature</th>
                <th className="py-3 pr-4 text-xs uppercase text-neutral-400">Free</th>
                <th className="py-3 pr-4 text-xs uppercase text-neutral-400">Pro $9</th>
                <th className="py-3 pr-4 text-xs uppercase text-neutral-400">Skills $29</th>
                <th className="py-3 text-xs uppercase text-neutral-400">Agents $79</th>
              </tr>
            </thead>
            <tbody className="text-neutral-600">
              {[
                ["Free prompts (~730)", "yes", "yes", "yes", "yes"],
                ["Pro prompts (~2,265)", "no", "yes", "yes", "yes"],
                ["Daily view limit", "5/day", "Unlimited", "Unlimited", "Unlimited"],
                ["Collections + Favorites", "yes", "yes", "yes", "yes"],
                ["Smart Search", "yes", "yes", "yes", "yes"],
                ["Brand Roast", "1 free", "Unlimited", "Unlimited", "Unlimited"],
                ["AI Skills", "no", "no", "yes", "yes"],
                ["AI Agents", "no", "no", "no", "yes"],
                ["Custom configuration", "no", "no", "no", "yes"],
                ["Support", "Community", "Email", "Priority", "Dedicated"],
              ].map(([feature, ...tiers]) => (
                <tr key={feature} className="border-b border-neutral-100">
                  <td className="py-2.5 pr-4 font-medium text-neutral-900">{feature}</td>
                  {tiers.map((val, i) => (
                    <td key={i} className="py-2.5 pr-4">
                      {val === "yes" ? (
                        <span className="text-green-500">&#10003;</span>
                      ) : val === "no" ? (
                        <span className="text-neutral-300">&mdash;</span>
                      ) : (
                        val
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
