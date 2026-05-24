import AdminsClient from "./AdminsClient";

export const dynamic = "force-dynamic";

export default function AdminsPage() {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Administradores</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Qué emails tienen acceso a este panel. Los admins bootstrap vienen
          de la variable de entorno <code className="rounded bg-zinc-100 px-1 py-0.5 text-[11px]">ADMIN_EMAILS</code> y
          no se pueden quitar desde aquí.
        </p>
      </header>
      <AdminsClient />
    </div>
  );
}
