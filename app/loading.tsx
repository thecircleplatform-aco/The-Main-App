export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col bg-black/95">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/80 px-3 py-2 sm:px-4 sm:py-3" />
      <main className="min-h-0 flex-1 overflow-hidden" />
      <footer className="shrink-0 border-t border-white/10 bg-black/80 px-3 py-2 sm:px-4 sm:py-3">
        <div className="h-12 rounded-2xl border border-white/10 bg-white/5" />
      </footer>
    </div>
  );
}
