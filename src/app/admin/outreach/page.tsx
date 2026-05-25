import OutreachClient from "./OutreachClient";

/* /admin/outreach landing — Administrativas section.
 *
 * Server component is intentionally thin: the OutreachClient handles all
 * the table state, draft generation, and inline editing because the UX
 * needs optimistic updates as the operator toggles include/exclude and
 * edits drafts. The parent /admin layout already gates auth + renders
 * the sidebar. */

export const dynamic = "force-dynamic";

export default function OutreachPage() {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Outreach</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Warm targets que el engine puede contactar. Marca cuáles incluir,
          revisa los drafts personalizados, edita lo que necesites antes
          de aprobar para envío. Nada sale a producción sin tu visto bueno.
        </p>
      </header>
      <OutreachClient />
    </div>
  );
}
