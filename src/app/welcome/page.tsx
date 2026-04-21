import Link from "next/link";
import Image from "next/image";

export default function WelcomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <nav className="border-b border-border px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/brand/arto-logo-black.png" alt="ARTO" width={80} height={24} className="h-6 w-auto" />
          <span className="text-sm font-medium tracking-wide text-muted">STUDIO AI</span>
        </Link>
      </nav>

      <main className="mx-auto mt-16 max-w-xl px-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-8 w-8 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">You're in</h1>
        <p className="mt-3 text-lg text-muted">
          Welcome to ARTO Studio AI Starter. Your API key now has unlimited
          access to Brand Positioning.
        </p>
        <p className="mt-3 text-sm text-muted">
          Your existing key still works — no need to regenerate. We also sent
          a confirmation email with your receipt.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-zinc-50 p-6 text-left">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Next step
          </p>
          <p className="mt-2 text-sm text-foreground">
            Use your API key with the Brand Positioning endpoint. See the
            welcome email for a copy-paste curl example, or head to{" "}
            <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
              /api/skills/brand-positioning
            </code>
            .
          </p>
        </div>

        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-border px-6 py-3 text-sm font-medium hover:bg-zinc-50"
        >
          Back to home
        </Link>
      </main>
    </div>
  );
}
