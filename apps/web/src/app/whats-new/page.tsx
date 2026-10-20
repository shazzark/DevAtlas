import Link from "next/link";
import { FiArrowRight, FiGitBranch } from "react-icons/fi";
import { apiClient } from "@/lib/api-client";
import { ReleaseCard } from "@/components/release-card";

type SearchParams = Promise<{ technologySlug?: string | string[]; page?: string | string[] }>;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function WhatsNewPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const rawPage = Number(first(params.page) ?? "1");
  const page = Number.isInteger(rawPage) && rawPage > 0 ? Math.min(rawPage, 10_000) : 1;
  const technologySlug = first(params.technologySlug)?.slice(0, 100);
  let result: Awaited<ReturnType<typeof apiClient.listReleases>>;
  try {
    result = await apiClient.listReleases({ page, limit: 12, ...(technologySlug ? { technologySlug } : {}) });
  } catch {
    return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-16 md:py-24"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Release intelligence</p><h1 className="mb-4 text-4xl font-semibold tracking-tight">Release updates are temporarily unavailable.</h1><p className="max-w-xl text-text-soft">We couldn’t load reviewed releases. Please check your connection and try again.</p><Link className="mt-7 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-canvas" href="/whats-new">Try again <FiArrowRight aria-hidden="true" /></Link></main>;
  }
  const listing = result.data;
  const previous = new URLSearchParams();
  if (technologySlug) previous.set("technologySlug", technologySlug);
  if (listing.pagination.page > 2) previous.set("page", String(listing.pagination.page - 1));
  const next = new URLSearchParams(previous);
  next.set("page", String(listing.pagination.page + 1));

  return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-12 md:py-20">
    <header className="mb-10 border-b border-border pb-9 md:mb-12"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Source-aware release notes / 03</p><div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><h1 className="mb-3 text-4xl font-semibold tracking-tight md:text-5xl">What’s new</h1><p className="max-w-2xl text-base leading-7 text-text-soft">Important changes, explained with their official source and practical upgrade context.</p></div><span className="text-sm text-text-faint">{listing.pagination.totalItems} reviewed releases</span></div></header>
    {listing.items.length ? <><div aria-live="polite" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{listing.items.map((release) => <ReleaseCard key={release.slug} release={release} />)}</div><nav aria-label="Release pages" className="mt-9 flex items-center justify-between border-t border-border pt-5 text-sm"><span className="text-text-soft">Page {listing.pagination.page} of {Math.max(1, listing.pagination.totalPages)}</span><div className="flex gap-2">{listing.pagination.page > 1 && <Link className="rounded-md border border-border px-3 py-2 hover:bg-surface" href={`/whats-new?${previous}`}>Previous</Link>}{listing.pagination.page < listing.pagination.totalPages && <Link className="rounded-md border border-border px-3 py-2 hover:bg-surface" href={`/whats-new?${next}`}>Next</Link>}</div></nav></> : <section aria-live="polite" className="rounded-xl border border-dashed border-border px-6 py-16 text-center"><span className="mx-auto mb-4 grid size-11 place-items-center rounded-xl bg-accent-wash text-accent"><FiGitBranch aria-hidden="true" /></span><h2 className="mb-2 text-lg font-semibold">No reviewed releases yet</h2><p className="mx-auto max-w-lg text-sm leading-6 text-text-soft">When a release summary has been checked against its official source, it will appear here. Unverified updates stay out of the public feed.</p><Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-strong underline underline-offset-4" href="/tools">Explore technologies <FiArrowRight aria-hidden="true" /></Link></section>}
  </main>;
}
