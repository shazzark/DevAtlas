import Link from "next/link";
import { FiArrowRight, FiSearch } from "react-icons/fi";
import { technologyCategorySchema } from "@devatlas/shared";
import { apiClient } from "@/lib/api-client";
import { TechnologyCard } from "@/components/technology-card";

type SearchParams = Promise<{ q?: string | string[]; category?: string | string[]; page?: string | string[] }>;
const categories = technologyCategorySchema.options;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function ToolsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = first(params.q)?.slice(0, 100) ?? "";
  const category = first(params.category);
  const page = Number(first(params.page) ?? "1");
  let result: Awaited<ReturnType<typeof apiClient.listTechnologies>> | undefined;
  try {
    result = await apiClient.listTechnologies({ q, category: categories.find((value) => value === category), page: Number.isInteger(page) && page > 0 ? page : 1, limit: 12 });
  } catch {
    return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-16 md:py-24"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Technology explorer</p><h1 className="mb-4 text-4xl font-semibold tracking-tight">The catalog is temporarily unavailable.</h1><p className="max-w-xl text-text-soft">We couldn’t load the technology catalog. Check your connection and try again.</p><Link className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-canvas" href="/tools">Try again <FiArrowRight aria-hidden="true" /></Link></main>;
  }
  const listing = result.data;
  const nextParams = new URLSearchParams();
  if (q) nextParams.set("q", q);
  if (category && categories.includes(category as typeof categories[number])) nextParams.set("category", category);
  const previousUrl = `/tools?${new URLSearchParams([...nextParams, ...(listing.pagination.page > 2 ? [["page", String(listing.pagination.page - 1)]] : [])])}`;
  const nextUrl = `/tools?${new URLSearchParams([...nextParams, ["page", String(listing.pagination.page + 1)]])}`;

  return (
    <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-12 md:py-20">
      <header className="mb-10 border-b border-border pb-9 md:mb-12">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Explore the atlas / 01</p>
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><h1 className="mb-3 text-4xl font-semibold tracking-tight md:text-5xl">Technology Explorer</h1><p className="max-w-2xl text-base leading-7 text-text-soft">Understand what each tool does, where it fits, and how to start using it.</p></div>
          <span className="text-sm text-text-faint">{listing.pagination.totalItems} technologies</span>
        </div>
      </header>
      <form action="/tools" className="mb-8 grid gap-3 rounded-xl border border-border bg-surface-muted p-3 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:p-4">
        <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-surface px-3 text-text-faint"><FiSearch aria-hidden="true" /><span className="sr-only">Search technologies</span><input aria-label="Search technologies" className="min-w-0 flex-1 bg-transparent text-sm text-text outline-none placeholder:text-text-faint" name="q" placeholder="Search technologies…" defaultValue={q} /></label>
        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-text-soft"><span className="sr-only">Filter by category</span><select aria-label="Filter by category" className="w-full bg-transparent text-text outline-none" name="category" defaultValue={category ?? ""}><option value="">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <button className="min-h-11 rounded-lg bg-accent px-5 text-sm font-semibold text-canvas transition-colors hover:bg-accent-strong" type="submit">Search</button>
      </form>
      {listing.items.length ? <>
        <div aria-live="polite" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listing.items.map((technology) => <TechnologyCard key={technology.slug} technology={technology} />)}</div>
        <nav aria-label="Technology pages" className="mt-9 flex items-center justify-between border-t border-border pt-5 text-sm">
          <span className="text-text-soft">Page {listing.pagination.page} of {Math.max(1, listing.pagination.totalPages)}</span>
          <div className="flex gap-2">{listing.pagination.page > 1 && <Link className="rounded-md border border-border px-3 py-2 hover:bg-surface" href={previousUrl}>Previous</Link>}{listing.pagination.page < listing.pagination.totalPages && <Link className="rounded-md border border-border px-3 py-2 hover:bg-surface" href={nextUrl}>Next</Link>}</div>
        </nav>
      </> : <section aria-live="polite" className="rounded-xl border border-dashed border-border px-6 py-16 text-center"><h2 className="mb-2 text-lg font-semibold">No technologies found</h2><p className="mb-5 text-sm text-text-soft">Try a different search term or category.</p><Link className="text-sm font-semibold text-accent-strong underline underline-offset-4" href="/tools">Clear filters</Link></section>}
    </main>
  );
}
