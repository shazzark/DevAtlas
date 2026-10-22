import Link from "next/link";
import { FiArrowRight, FiSearch } from "react-icons/fi";
import { searchCategorySchema } from "@devatlas/shared";
import { apiClient } from "@/lib/api-client";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Search DevAtlas", description: "Search developer technologies, release notes, stack guides and practical projects.", robots: { index: false, follow: true } };

type SearchParams = Promise<{ q?: string | string[]; category?: string | string[]; technologySlug?: string | string[]; page?: string | string[] }>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
const categories = searchCategorySchema.options;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = first(params.q)?.slice(0, 100) ?? "";
  const category = first(params.category);
  const technologySlug = first(params.technologySlug);
  const rawPage = Number(first(params.page) ?? 1);
  let result: Awaited<ReturnType<typeof apiClient.search>>;
  let technologies: { slug: string; name: string }[] = [];
  try {
    const [searchResult, technologyResult] = await Promise.all([
      apiClient.search({ q, category: categories.find((item) => item === category), technologySlug, page: Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1, limit: 12 }),
      apiClient.listTechnologies({ limit: 48 }),
    ]);
    result = searchResult;
    technologies = technologyResult.data.items.map(({ slug, name }) => ({ slug, name }));
  } catch {
    return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(960px,calc(100%-40px))] py-16 md:py-24"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Search DevAtlas</p><h1 className="mb-4 text-4xl font-semibold tracking-tight">Search is temporarily unavailable.</h1><p className="text-text-soft">We couldn’t load results. Check your connection and try again.</p><Link href="/search" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-accent-strong">Try again <FiArrowRight aria-hidden="true" /></Link></main>;
  }
  const data = result.data;
  const pageUrl = (page: number) => {
    const next = new URLSearchParams();
    if (q) next.set("q", q);
    if (category) next.set("category", category);
    if (technologySlug) next.set("technologySlug", technologySlug);
    if (page > 1) next.set("page", String(page));
    return `/search?${next}`;
  };
  return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(960px,calc(100%-40px))] py-12 md:py-20">
    <header className="mb-8 border-b border-border pb-8"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Explore the atlas</p><h1 className="mb-3 text-4xl font-semibold tracking-tight md:text-5xl">Search DevAtlas</h1><p className="text-text-soft">Find technologies, releases, stack guides and practical projects.</p></header>
    <form action="/search" className="mb-8 grid gap-3 rounded-xl border border-border bg-surface-muted p-3 sm:grid-cols-[minmax(0,1fr)_190px_auto] sm:p-4">
      <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface px-3 text-text-faint"><FiSearch aria-hidden="true"/><span className="sr-only">Search all content</span><input aria-label="Search all content" className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint" name="q" placeholder="Search technologies, guides, releases…" defaultValue={q}/></label>
      <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text-soft"><span className="sr-only">Filter by content type</span><select aria-label="Filter by content type" className="w-full bg-transparent text-text outline-none" name="category" defaultValue={category ?? ""}><option value="">All content</option>{categories.map((item) => <option key={item} value={item}>{({ technology: "Technologies", release: "Releases", stack: "Stack guides", build: "Build guides" })[item]}</option>)}</select></label>
      <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text-soft sm:col-span-2"><span className="sr-only">Filter by technology</span><select aria-label="Filter by technology" className="w-full bg-transparent text-text outline-none" name="technologySlug" defaultValue={technologySlug ?? ""}><option value="">All technologies</option>{technologies.map((technology) => <option key={technology.slug} value={technology.slug}>{technology.name}</option>)}</select></label>
      <button className="min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-canvas hover:bg-accent-strong" type="submit">Search</button>
    </form>
    {q && <p aria-live="polite" className="mb-5 text-sm text-text-soft">{data.pagination.totalItems} results for “{q}”</p>}
    {data.items.length ? <section aria-label="Search results" className="grid gap-3">{data.items.map((item) => <article key={`${item.category}:${item.slug}`} className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/50"><p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-faint">{item.category === "build" ? "Build guide" : item.category === "stack" ? "Stack guide" : item.category}</p><h2 className="mb-2 text-lg font-semibold"><Link className="hover:text-accent-strong" href={item.href}>{item.title}</Link></h2><p className="text-sm leading-6 text-text-soft">{item.summary}</p>{item.technologySlugs.length > 0 && <p className="mt-3 text-xs text-text-faint">Related technologies: {item.technologySlugs.join(", ")}</p>}</article>)}</section> : <section aria-live="polite" className="rounded-xl border border-dashed border-border px-6 py-16 text-center"><h2 className="mb-2 text-lg font-semibold">No matching content</h2><p className="mb-5 text-sm text-text-soft">Try another term or remove the content filter.</p><Link className="text-sm font-semibold text-accent-strong underline underline-offset-4" href="/search">Clear filters</Link></section>}
    {data.related.length > 0 && <aside className="mt-10 border-t border-border pt-7"><h2 className="mb-4 text-xl font-semibold">Related content</h2><ul className="grid gap-3 sm:grid-cols-2">{data.related.map((item) => <li key={`${item.category}:${item.slug}`}><Link className="flex items-center justify-between rounded-lg border border-border p-4 text-sm hover:bg-surface-muted" href={item.href}>{item.title}<FiArrowRight aria-hidden="true" className="shrink-0 text-accent-strong"/></Link></li>)}</ul></aside>}
    {data.pagination.totalPages > 1 && <nav aria-label="Search result pages" className="mt-9 flex items-center justify-between border-t border-border pt-5 text-sm"><span className="text-text-soft">Page {data.pagination.page} of {data.pagination.totalPages}</span><div className="flex gap-2">{data.pagination.page > 1 && <Link className="rounded-md border border-border px-3 py-2 hover:bg-surface" href={pageUrl(data.pagination.page - 1)}>Previous</Link>}{data.pagination.page < data.pagination.totalPages && <Link className="rounded-md border border-border px-3 py-2 hover:bg-surface" href={pageUrl(data.pagination.page + 1)}>Next</Link>}</div></nav>}
  </main>;
}
