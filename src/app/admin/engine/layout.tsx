/* /admin/engine pages live under /admin/layout.tsx, which already owns
 * the auth gate AND the sidebar. This layout used to render its own
 * chrome + auth form; now it's a passthrough so the engine pages slot
 * straight into the parent layout. */
export default function EngineLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
