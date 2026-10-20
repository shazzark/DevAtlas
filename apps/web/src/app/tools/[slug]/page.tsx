import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowUpRight, FiCheck, FiClock, FiExternalLink, FiLayers } from "react-icons/fi";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { SyntaxCode } from "@/components/syntax-code";

function formatDate(value: string | null) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(value));
}

export default async function TechnologyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let technology;
  try { technology = (await apiClient.getTechnology(slug)).data.item; }
  catch (error) {
    if (error instanceof ApiClientError && error.status === 404) notFound();
    return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-16"><p className="font-mono text-xs uppercase tracking-widest text-text-soft">Technology profile</p><h1 className="my-4 text-4xl font-semibold">This profile is temporarily unavailable.</h1><p className="max-w-xl text-text-soft">The technology service could not load this profile. Please try again in a moment.</p><Link className="mt-6 inline-flex rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface" href={`/tools/${slug}`}>Retry</Link></main>;
  }
  let related: typeof technology[] = [];
  try {
    const response = await apiClient.listTechnologies({ page: 1, limit: 48 });
    related = technology.relatedSlugs.map((relatedSlug) => response.data.items.find((item) => item.slug === relatedSlug)).filter((item): item is typeof technology => Boolean(item));
  } catch { /* A profile remains useful when related-content lookup is unavailable. */ }
  const verifiedDate = formatDate(technology.version.lastVerifiedAt);
  const releaseDate = formatDate(technology.version.releasedAt);

  return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-10 md:py-16">
    <nav aria-label="Breadcrumb" className="mb-8 text-sm text-text-faint"><Link className="hover:text-text" href="/tools">Technology Explorer</Link><span aria-hidden="true" className="mx-2">/</span><span aria-current="page" className="text-text-soft">{technology.name}</span></nav>
    <header className="grid gap-8 border-b border-border pb-10 md:grid-cols-[minmax(0,1fr)_280px] md:items-end md:pb-12">
      <div><p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-text-soft"><FiLayers aria-hidden="true" />{technology.category}</p><h1 className="mb-4 text-4xl font-semibold tracking-tight md:text-6xl">{technology.name}</h1><p className="max-w-3xl text-lg leading-8 text-text-soft">{technology.shortDescription}</p></div>
      <aside aria-label="Version information" className="rounded-xl border border-border bg-surface p-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-text-faint">Current version</p><p className="mb-3 text-lg font-semibold">{technology.version.current ?? "Not verified"}</p>
        {releaseDate && <p className="mb-2 flex items-center gap-2 text-xs text-text-soft"><FiClock aria-hidden="true" />Released {releaseDate}</p>}
        <p className="flex items-start gap-2 text-xs leading-5 text-text-soft"><FiCheck aria-hidden="true" className="mt-0.5 shrink-0 text-accent" />{verifiedDate ? `Content last verified ${verifiedDate}` : "Version details have not been verified"}</p>
        {technology.version.sourceUrl && <a className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent-strong underline underline-offset-4" href={technology.version.sourceUrl} rel="noreferrer" target="_blank">Version source <FiExternalLink aria-hidden="true" /></a>}
      </aside>
    </header>
    <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
      <article className="min-w-0 space-y-12">
        <section aria-labelledby="overview-title"><h2 className="mb-4 text-2xl font-semibold tracking-tight" id="overview-title">Overview and purpose</h2><p className="max-w-3xl text-[15px] leading-7 text-text-soft">{technology.overview}</p></section>
        <section aria-labelledby="use-cases-title"><h2 className="mb-4 text-2xl font-semibold tracking-tight" id="use-cases-title">Primary use cases</h2><ul className="grid gap-3 sm:grid-cols-2">{technology.primaryUseCases.map((item) => <li className="rounded-lg border border-border bg-surface p-4 text-sm leading-6" key={item}>{item}</li>)}</ul></section>
        <section aria-labelledby="alternatives-title"><h2 className="mb-3 text-xl font-semibold tracking-tight" id="alternatives-title">Alternatives to consider</h2>{technology.alternatives.length ? <ul className="flex flex-wrap gap-2">{technology.alternatives.map((item) => <li className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-soft" key={item}>{item}</li>)}</ul> : <p className="text-sm leading-6 text-text-faint">No direct alternative is listed for this profile.</p>}</section>
        <section className="grid gap-8 sm:grid-cols-2"><div><h2 className="mb-4 text-xl font-semibold tracking-tight">When to use it</h2><ul className="space-y-3 text-sm leading-6 text-text-soft">{technology.whenToUse.map((item) => <li className="flex gap-2" key={item}><FiCheck aria-hidden="true" className="mt-1 shrink-0 text-accent" />{item}</li>)}</ul></div><div><h2 className="mb-4 text-xl font-semibold tracking-tight">When it may not fit</h2><ul className="space-y-3 text-sm leading-6 text-text-soft">{technology.whenNotToUse.map((item) => <li className="flex gap-2" key={item}><span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-text-faint" />{item}</li>)}</ul></div></section>
        <section aria-labelledby="getting-started-title"><h2 className="mb-4 text-2xl font-semibold tracking-tight" id="getting-started-title">Installation and getting started</h2><div className="space-y-4 rounded-xl border border-border bg-surface-muted p-5 text-sm leading-7 text-text-soft"><p>{technology.installation}</p><p>{technology.gettingStarted}</p></div></section>
        <section aria-labelledby="concepts-title"><h2 className="mb-4 text-2xl font-semibold tracking-tight" id="concepts-title">Key concepts</h2><dl className="divide-y divide-border border-y border-border">{technology.keyConcepts.map((concept) => <div className="grid gap-2 py-4 sm:grid-cols-[180px_minmax(0,1fr)]" key={concept.title}><dt className="font-medium">{concept.title}</dt><dd className="text-sm leading-6 text-text-soft">{concept.description}</dd></div>)}</dl></section>
        <section aria-labelledby="examples-title"><h2 className="mb-5 text-2xl font-semibold tracking-tight" id="examples-title">Practical examples</h2><div className="space-y-5">{technology.codeExamples.map((example) => <div className="space-y-3" key={example.title}><SyntaxCode code={example.code} language={example.language} title={example.title} /><p className="text-sm leading-6 text-text-soft">{example.explanation}</p></div>)}</div></section>
        <section aria-labelledby="sources-title"><h2 className="mb-4 text-xl font-semibold tracking-tight" id="sources-title">Official documentation</h2><ul className="grid gap-3 sm:grid-cols-2">{technology.officialLinks.map((link) => <li key={link.url}><a className="flex h-full items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 text-sm font-medium hover:border-accent/60" href={link.url} rel="noreferrer" target="_blank">{link.label}<FiArrowUpRight aria-hidden="true" className="shrink-0 text-text-faint" /></a></li>)}</ul></section>
      </article>
      <aside className="h-fit rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-24"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-soft">Related technologies</h2>{related.length ? <ul className="space-y-1">{related.map((item) => <li key={item.slug}><Link className="flex items-center justify-between rounded-lg px-2 py-2.5 text-sm hover:bg-surface-muted" href={`/tools/${item.slug}`}>{item.name}<FiArrowUpRight aria-hidden="true" className="text-text-faint" /></Link></li>)}</ul> : <p className="text-sm leading-6 text-text-faint">Related entries will appear here as the catalog grows.</p>}<Link className="mt-5 inline-flex items-center gap-2 border-t border-border pt-4 text-sm font-medium text-accent-strong" href="/tools">Browse all technologies <FiArrowUpRight aria-hidden="true" /></Link></aside>
    </div>
  </main>;
}
