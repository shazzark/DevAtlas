import Link from "next/link";

export default function BuildGuideNotFound() {
  return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-20"><p className="font-mono text-xs uppercase tracking-widest text-text-soft">Build guide</p><h1 className="my-4 text-4xl font-semibold">Build guide not found</h1><p className="max-w-xl text-text-soft">This project guide may not exist or may not be published yet.</p><Link className="mt-6 inline-flex rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface" href="/builds">Browse build guides</Link></main>;
}
