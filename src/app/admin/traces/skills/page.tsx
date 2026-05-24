import SkillTracesTab from "../../SkillTracesTab";

export const dynamic = "force-dynamic";

export default function SkillTracesPage() {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Skill traces</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Llamadas al API de Skills Studio agrupadas por skill y por cliente.
        </p>
      </header>
      <SkillTracesTab apiKey="" refreshKey={0} />
    </div>
  );
}
