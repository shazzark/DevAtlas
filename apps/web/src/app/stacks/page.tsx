import type { Metadata } from "next";
import Link from "next/link";
import { FiArrowRight, FiLayers, FiSearch } from "react-icons/fi";
import { apiClient } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Stack Guides",
  description: "Explore verified guides for integrating developer technologies.",
};

type SearchParams = Promise<{ q?: string | string[]; technologySlug?: string | string[]; page?: string | string[] }>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function StacksPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = first(params.q)?.slice(0, 100) ?? "";
  const technologySlug = first(params.technologySlug)?.slice(0, 100) ?? "";
  const rawPage = Number(first(params.page) ?? "1");
  const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10_000) : 1;
  let result: Awaited<ReturnType<typeof apiClient.listStackGuides>>;
  try {
    result = await apiClient.listStackGuides({ q, technologySlug, page, limit: 12 });
  } catch {
    return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-16 md:py-24"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Stack guides</p><h1 className="mb-4 text-4xl font-semibold tracking-tight">Guides are temporarily unavailable.</h1><p className="max-w-xl text-text-soft">We couldn’t load stack guides. Check your connection and try again.</p><Link className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-canvas" href="/stacks">Try again <FiArrowRight aria-hidden="true" /></Link></main>;
  }

  const listing = result.data;
  const query = new URLSearchParams();
  if (q) query.set("q", q);
  if (technologySlug) query.set("technologySlug", technologySlug);
  const pageUrl = (target: number) => {
    const next = new URLSearchParams(query);
    if (target > 1) next.set("page", String(target));
    return `/stacks${next.size ? `?${next}` : ""}`;
  };

  return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-12 md:py-20">
    <header className="mb-10 border-b border-border pb-9 md:mb-12"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Connect the tools / 04</p><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h1 className="mb-3 text-4xl font-semibold tracking-tight md:text-5xl">Stack Guides</h1><p className="max-w-2xl text-base leading-7 text-text-soft">Learn how technologies fit together through source-linked, reviewed integration guides.</p></div><span className="text-sm text-text-faint">{listing.pagination.totalItems} guides</span></div></header>
    <form action="/stacks" className="mb-8 grid gap-3 rounded-xl border border-border bg-surface-muted p-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,220px)_auto] sm:p-4">
      <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface px-3 text-text-faint"><FiSearch aria-hidden="true" /><span className="sr-only">Search stack guides</span><input aria-label="Search stack guides" className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint" name="q" placeholder="Search guides…" defaultValue={q} /></label>
      <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text-soft"><span className="sr-only">Filter by technology slug</span><input aria-label="Filter by technology slug" className="w-full bg-transparent text-text outline-none placeholder:text-text-faint" name="technologySlug" placeholder="Technology slug" defaultValue={technologySlug} /></label>
      <button className="min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-canvas transition-colors hover:bg-accent-strong" type="submit">Search</button>
    </form>
    {listing.items.length ? <>
      <div aria-live="polite" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listing.items.map((guide) => <article className="group flex h-full min-w-0 flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/60" key={guide.slug}>
        <div className="mb-5 flex items-center justify-between gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-wash text-accent"><FiLayers aria-hidden="true" /></span><span className="text-xs text-text-faint">{guide.steps.length} steps</span></div>
        <h2 className="mb-2 text-xl font-semibold tracking-tight"><Link className="focus-visible:outline-accent" href={`/stacks/${guide.slug}`}>{guide.title}<FiArrowRight aria-hidden="true" className="ml-1 inline text-sm text-text-faint" /></Link></h2>
        <p className="mb-5 text-sm leading-6 text-text-soft">{guide.summary}</p>
        <ul aria-label="Technologies" className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">{guide.technologies.map((technology) => <li key={technology.slug}><Link className="rounded-full border border-border px-2.5 py-1 text-xs text-text-soft hover:border-accent/60 hover:text-text" href={`/tools/${technology.slug}`}>{technology.name}</Link></li>)}</ul>
      </article>)}</div>
      <nav aria-label="Stack guide pages" className="mt-9 flex items-center justify-between border-t border-border pt-5 text-sm"><span className="text-text-soft">Page {listing.pagination.page} of {Math.max(1, listing.pagination.totalPages)}</span><div className="flex gap-2">{listing.pagination.page > 1 && <Link className="rounded-md border border-border px-3 py-2 hover:bg-surface" href={pageUrl(listing.pagination.page - 1)}>Previous</Link>}{listing.pagination.page < listing.pagination.totalPages && <Link className="rounded-md border border-border px-3 py-2 hover:bg-surface" href={pageUrl(listing.pagination.page + 1)}>Next</Link>}</div></nav>
    </> : <section aria-live="polite" className="rounded-xl border border-dashed border-border px-6 py-16 text-center"><h2 className="mb-2 text-lg font-semibold">No stack guides found</h2><p className="mb-5 text-sm text-text-soft">Try another search or remove the technology filter.</p><Link className="text-sm font-semibold text-accent-strong underline underline-offset-4" href="/stacks">Clear filters</Link></section>}
  </main>;
}
