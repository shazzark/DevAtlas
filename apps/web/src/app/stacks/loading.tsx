export default function StacksLoading() {
  return <main id="main-content" aria-busy="true" aria-live="polite" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-12 md:py-20">
    <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Stack guides</p>
    <h1 className="mb-8 text-4xl font-semibold tracking-tight">Loading guides</h1>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div aria-hidden="true" className="h-56 animate-pulse rounded-xl border border-border bg-surface" key={index} />)}</div>
  </main>;
}
