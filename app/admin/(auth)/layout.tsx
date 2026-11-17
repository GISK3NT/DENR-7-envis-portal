export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-forest-950 px-5 py-12">
      <div aria-hidden className="topo-field absolute inset-0 opacity-20" />
      <div aria-hidden className="grain-overlay opacity-20" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 12%, rgba(74,115,95,.35), transparent 46%), radial-gradient(circle at 84% 78%, rgba(185,133,46,.18), transparent 42%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
