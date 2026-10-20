import Link from "next/link";

export default function ReleaseNotFound() {
  return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-16"><p className="font-mono text-xs uppercase tracking-widest text-text-soft">Release intelligence</p><h1 className="my-4 text-4xl font-semibold">Release not found</h1><p className="max-w-xl text-text-soft">This release may not be published or its address may have changed.</p><Link className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-strong underline underline-offset-4" href="/whats-new">Browse reviewed releases</Link></main>;
}
