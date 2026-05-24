import ClientsTab from "../ClientsTab";

export const dynamic = "force-dynamic";

export default function ClientsPage() {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Clients</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Alta, edición y status de cuentas cliente que consumen el API.
        </p>
      </header>
      <ClientsTab apiKey="" refreshKey={0} />
    </div>
  );
}
