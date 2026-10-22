export default function StackGuideLoading() {
  return <main id="main-content" aria-busy="true" aria-live="polite" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-10 md:py-16">
    <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Stack guide</p>
    <h1 className="mb-10 text-4xl font-semibold tracking-tight">Loading guide</h1>
    <div aria-hidden="true" className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_260px]"><div className="h-[680px] animate-pulse rounded-xl border border-border bg-surface" /><div className="h-80 animate-pulse rounded-xl border border-border bg-surface" /></div>
  </main>;
}
