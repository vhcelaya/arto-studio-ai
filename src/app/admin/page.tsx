import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

/* /admin landing — "Resumen". Cheap counts pulled server-side so the
 * dashboard is useful at first glance. Each card links into the deeper
 * page under its sidebar section. */

export const dynamic = "force-dynamic";

interface Card {
  href: string;
  label: string;
  desc: string;
  badge?: string | number | null;
}

async function safeCount(table: string): Promise<number | null> {
  try {
    const sb = createAdminClient();
    const { count } = await sb.from(table).select("*", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return null;
  }
}

export default async function AdminHome() {
  const [clients, roastTraces, skillTraces, runs, signals, admins] = await Promise.all([
    safeCount("clients"),
    safeCount("traces"),
    safeCount("skill_traces"),
    safeCount("scraping_runs"),
    safeCount("growth_signals"),
    safeCount("admin_users"),
  ]);

  const seguimiento: Card[] = [
    { href: "/admin/traces/roast", label: "Roast traces", desc: "Resultados de Brand Roast", badge: roastTraces },
    { href: "/admin/traces/skills", label: "Skill traces", desc: "Llamadas a Skills Studio API", badge: skillTraces },
    { href: "/admin/engine/runs", label: "Engine · Runs", desc: "Jobs y corridas del engine", badge: runs },
    { href: "/admin/engine/signals", label: "Engine · Signals", desc: "Señales detectadas", badge: signals },
    { href: "/admin/engine/attribution", label: "Engine · Attribution", desc: "Eventos de atribución" },
    { href: "/admin/engine/social", label: "Engine · Social", desc: "Log de actividad social" },
    { href: "/admin/engine/scraping", label: "Engine · Scraping", desc: "Targets y stats de scraping" },
  ];

  const administrativas: Card[] = [
    { href: "/admin/clients", label: "Clients", desc: "Alta, edición y status de clientes", badge: clients },
    { href: "/admin/admins", label: "Administradores", desc: "Quién tiene acceso a este panel", badge: admins },
  ];

  const desarrollo: Card[] = [
    { href: "/admin/engine/gaps", label: "Engine · Gaps", desc: "Brechas de contenido detectadas" },
    { href: "/admin/engine/config", label: "Engine · Config", desc: "Configuración del engine (read-only)" },
  ];

  const Section = ({ title, cards }: { title: string; cards: Card[] }) => (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-zinc-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-sm"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-zinc-900">{card.label}</p>
              {card.badge !== undefined && card.badge !== null && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-mono text-zinc-600">
                  {typeof card.badge === "number" ? card.badge.toLocaleString() : card.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-500">{card.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Resumen del panel. Usa el menú de la izquierda para entrar a cada sección.
        </p>
      </header>

      <Section title="Seguimiento" cards={seguimiento} />
      <Section title="Administrativas" cards={administrativas} />
      <Section title="Desarrollo" cards={desarrollo} />
    </div>
  );
}
