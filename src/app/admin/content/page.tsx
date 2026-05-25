import ContentClient from "./ContentClient";

export const dynamic = "force-dynamic";

export default function ContentPage() {
  return (
    <div>
      <header className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Content Factory</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Genera prompts nuevos para la biblioteca y posts editoriales para /learn.
          Cada item nace como borrador, lo revisas, editas si hace falta,
          apruebas, y un publisher lo lleva a su canal final (prompts a la
          tabla pública, posts a /learn — wiring de /learn en Phase 3c).
        </p>
      </header>
      <ContentClient />
    </div>
  );
}
