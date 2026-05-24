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
    {
      href: "/admin/traces/roast",
      label: "Roast traces",
      desc: "Cada Brand Roast que se ha corrido en /roast, con su score por pilar (Strategy, Creativity, Narrative, Digital), los inputs de marca y el usuario que lo ejecutó. Útil para muestrear casos, validar la calidad de los análisis y debuggear quejas sobre un score específico.",
      badge: roastTraces,
    },
    {
      href: "/admin/traces/skills",
      label: "Skill traces",
      desc: "Llamadas al API de Skills Studio (Brand Positioning, Brand Architecture, etc.) por client_id. Muestra qué skill se invocó, cuándo, con qué inputs y tamaño de output. Sirve para tracking de uso por tier, facturación y para encontrar sesiones específicas a inspeccionar.",
      badge: skillTraces,
    },
    {
      href: "/admin/engine/runs",
      label: "Engine · Runs",
      desc: "Bitácora de cada corrida del engine de outbound — manual o programada. Status, duración, fuente, traza de error si falló. Úsalo para confirmar que el engine está vivo, ver qué corrida produjo qué señales, o diagnosticar un job que se rompió.",
      badge: runs,
    },
    {
      href: "/admin/engine/signals",
      label: "Engine · Signals",
      desc: "Señales de crecimiento detectadas por el engine durante el scraping: un competidor lanzó, un target cambió de rol, una empresa abrió ronda. Es la cola priorizada para outreach manual o contenido reactivo.",
      badge: signals,
    },
    {
      href: "/admin/engine/attribution",
      label: "Engine · Attribution",
      desc: "Cuándo una señal del engine derivó en una conversión real (deal cerrado, sign-up, demo). Liga signal_id → outcome. Sirve para mostrar ROI del engine y decidir qué fuentes de señal vale la pena seguir alimentando.",
    },
    {
      href: "/admin/engine/social",
      label: "Engine · Social",
      desc: "Posts que el engine publicó (o agendó) en redes a tu nombre, con engagement, alcance y gasto en ads si aplicó. Úsalo para auditar qué salió, ajustar la cadencia y revertir lo que no funcionó.",
    },
    {
      href: "/admin/engine/scraping",
      label: "Engine · Scraping",
      desc: "Targets que el engine está monitoreando — empresas, personas, sitios — con stats de cobertura: cuándo se scrapeó por última vez, cuántas señales generó, status actual. Aquí agregas un target nuevo, pausas uno ruidoso, o validas la cobertura.",
    },
  ];

  const administrativas: Card[] = [
    {
      href: "/admin/clients",
      label: "Clients",
      desc: "Empresas con API key activo para Skills Studio. Crea, edita, cambia tier, suspende, o regenera la key. Cada renglón muestra uso del mes en curso y el plan al que están suscritas.",
      badge: clients,
    },
    {
      href: "/admin/admins",
      label: "Administradores",
      desc: "Quién puede entrar a este panel. Lista admins permanentes (env var, no se quitan desde aquí) y dinámicos (DB, los agregas con un email y los quitas con un click). El nuevo admin entra firmando con magic link.",
      badge: admins,
    },
  ];

  const desarrollo: Card[] = [
    {
      href: "/admin/engine/gaps",
      label: "Engine · Gaps",
      desc: "Brechas de contenido que el engine detectó: preguntas que se están haciendo en el mercado y que ARTO no responde con prompts, skills o /learn. Sirve de brief priorizado para producción de contenido.",
    },
    {
      href: "/admin/engine/config",
      label: "Engine · Config",
      desc: "Vista de solo lectura de la configuración del engine: qué fuentes scrapea, con qué cadencia, qué umbrales aplican a cada señal. Para cambiar la config, edita la tabla engine_config en Supabase directamente.",
    },
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
            className="flex flex-col rounded-lg border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-zinc-400 hover:shadow-sm"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-zinc-900">{card.label}</p>
              {card.badge !== undefined && card.badge !== null && (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-mono text-zinc-600">
                  {typeof card.badge === "number" ? card.badge.toLocaleString() : card.badge}
                </span>
              )}
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">{card.desc}</p>
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
