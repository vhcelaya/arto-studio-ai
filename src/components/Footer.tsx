import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

interface Props {
  locale: Locale;
  footer: Dictionary["footer"];
}

export default function Footer({ locale, footer }: Props) {
  const lp = (p: string) => `/${locale}${p.startsWith("/") ? p : "/" + p}`;
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <img src="/brand/arto-logo-black.png" alt="ARTO" className="h-5 w-auto" />
            <p className="mt-2 text-xs text-neutral-400">{footer.copyright}</p>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {footer.product}
            </p>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link href={lp("/prompts")} className="text-neutral-600 hover:text-neutral-900">
                {footer.prompts}
              </Link>
              <span className="flex items-center gap-1.5 text-neutral-400">
                {footer.skills}
                <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-semibold text-amber-700">
                  Soon
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-neutral-400">
                {footer.agents}
                <span className="rounded bg-amber-50 px-1 py-0.5 text-[9px] font-semibold text-amber-700">
                  Soon
                </span>
              </span>
              <Link href="/roast" className="text-neutral-600 hover:text-neutral-900">
                {footer.roast}
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {footer.company}
            </p>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link href={lp("/pricing")} className="text-neutral-600 hover:text-neutral-900">
                {footer.pricing}
              </Link>
              <Link href={lp("/learn")} className="text-neutral-600 hover:text-neutral-900">
                {footer.learn}
              </Link>
              <Link href={lp("/work")} className="text-neutral-600 hover:text-neutral-900">
                {footer.work}
              </Link>
              <Link href="/studio" className="text-neutral-600 hover:text-neutral-900">
                {footer.studio}
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {footer.legal}
            </p>
            <div className="flex flex-col gap-1.5 text-sm">
              <Link href={lp("/privacy")} className="text-neutral-600 hover:text-neutral-900">
                {footer.privacy}
              </Link>
              <Link href={lp("/terms")} className="text-neutral-600 hover:text-neutral-900">
                {footer.terms}
              </Link>
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
      </div>
    </footer>
  );
}
