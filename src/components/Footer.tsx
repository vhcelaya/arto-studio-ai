import Link from "next/link";

const LIBRARY_HREF = "https://library.artostudio.ai/prompts";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <img src="/brand/arto-logo-black.png" alt="ARTO" className="h-5 w-auto" />
            <p className="mt-2 text-xs text-neutral-400">
              Design, Culture &amp; Technology since 2009.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Products
            </p>
            <div className="flex flex-col gap-1.5 text-sm">
              <a
                href={LIBRARY_HREF}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 hover:text-neutral-900"
              >
                Prompt Library
              </a>
              <span className="flex items-center gap-1.5 text-neutral-400">
                Skills Studio
                <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-semibold text-amber-700">
                  Soon
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-neutral-400">
                AI Agents
                <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-semibold text-amber-700">
                  Soon
                </span>
              </span>
              <Link href="/roast" className="text-neutral-600 hover:text-neutral-900">
                Brand Roast
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Resources
            </p>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link href="/pricing" className="text-neutral-600 hover:text-neutral-900">
                Pricing
              </Link>
              <Link href="/studio" className="text-neutral-600 hover:text-neutral-900">
                Studio
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              About
            </p>
            <div className="flex flex-col gap-1.5 text-sm">
              <a
                href="https://artogroup.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 hover:text-neutral-900"
              >
                ARTO Group
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-neutral-100 pt-6 text-xs text-neutral-400">
          &copy; {new Date().getFullYear()} ARTO Studio AI. A product by ARTO Group.
        </div>
      </div>
    </footer>
  );
}
