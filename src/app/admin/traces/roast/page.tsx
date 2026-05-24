import RoastTracesTab from "../../RoastTracesTab";

/* /admin/traces/roast — Seguimiento. Wraps the existing RoastTracesTab
 * client. apiKey is a vestige (see AdminSidebar / shared.ts notes), the
 * empty value is ignored by authHeaders() at runtime. */

export const dynamic = "force-dynamic";

export default function RoastTracesPage() {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Roast traces</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Resultados de Brand Roast por usuario y por sesión.
        </p>
      </header>
      <RoastTracesTab apiKey="" refreshKey={0} />
    </div>
  );
}
