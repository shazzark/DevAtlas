export default function BuildGuideLoading() {
  return <main id="main-content" aria-busy="true" aria-live="polite" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-12 md:py-20">
    <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Build guide</p>
    <h1 className="mb-8 text-4xl font-semibold tracking-tight">Loading project guide</h1>
    <div aria-hidden="true" className="max-w-3xl space-y-4"><div className="h-5 w-3/4 animate-pulse rounded bg-surface-muted" /><div className="h-5 w-full animate-pulse rounded bg-surface-muted" /><div className="h-64 animate-pulse rounded-xl border border-border bg-surface" /></div>
  </main>;
}
