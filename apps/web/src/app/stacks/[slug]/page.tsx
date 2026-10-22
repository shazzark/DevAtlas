import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowUpRight, FiCheck, FiExternalLink } from "react-icons/fi";
import { SyntaxCode } from "@/components/syntax-code";
import { ApiClientError, apiClient } from "@/lib/api-client";

type PageProps = { params: Promise<{ slug: string }> };

async function loadGuide(slug: string) {
  try { return (await apiClient.getStackGuide(slug)).data.item; }
  catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const guide = await loadGuide(slug);
    return guide ? { title: guide.title, description: guide.summary } : { title: "Stack guide not found" };
  } catch { return { title: "Stack guide" }; }
}

export default async function StackGuidePage({ params }: PageProps) {
  const { slug } = await params;
  let guide;
  try { guide = await loadGuide(slug); }
  catch {
    return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-16"><p className="font-mono text-xs uppercase tracking-widest text-text-soft">Stack guide</p><h1 className="my-4 text-4xl font-semibold">This guide is temporarily unavailable.</h1><p className="max-w-xl text-text-soft">The guide service could not load this page. Please try again in a moment.</p><Link className="mt-6 inline-flex rounded-lg border border-border px-4 py-2 text-sm hover:bg-surface" href={`/stacks/${slug}`}>Retry</Link></main>;
  }
  if (!guide) notFound();
  const verifiedDate = new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(guide.lastVerifiedAt));

  return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-10 md:py-16">
    <nav aria-label="Breadcrumb" className="mb-8 text-sm text-text-faint"><Link className="hover:text-text" href="/stacks">Stack Guides</Link><span aria-hidden="true" className="mx-2">/</span><span aria-current="page" className="text-text-soft">{guide.title}</span></nav>
    <header className="border-b border-border pb-10 md:pb-12"><p className="mb-3 font-mono text-xs uppercase tracking-widest text-text-soft">Reviewed integration guide</p><h1 className="mb-4 text-4xl font-semibold tracking-tight md:text-6xl">{guide.title}</h1><p className="max-w-3xl text-lg leading-8 text-text-soft">{guide.summary}</p><p className="mt-5 flex items-center gap-2 text-sm text-text-soft"><FiCheck aria-hidden="true" className="text-accent" />Guide verified {verifiedDate}</p><ul aria-label="Technologies in this stack" className="mt-5 flex flex-wrap gap-2">{guide.technologies.map((technology) => <li key={technology.slug}><Link className="rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-text-soft hover:border-accent/60 hover:text-text" href={`/tools/${technology.slug}`}>{technology.name}</Link></li>)}</ul></header>
    <div className="grid gap-12 py-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
      <article className="min-w-0 space-y-12">
        <section aria-labelledby="architecture-title"><h2 className="mb-4 text-2xl font-semibold tracking-tight" id="architecture-title">Architecture</h2><p className="max-w-3xl text-[15px] leading-7 text-text-soft">{guide.architecture}</p></section>
        <section aria-labelledby="steps-title"><h2 className="mb-6 text-2xl font-semibold tracking-tight" id="steps-title">Implementation</h2><ol className="space-y-10">{guide.steps.map((step, index) => <li className="space-y-4" key={`${index}-${step.title}`}><h3 className="text-xl font-semibold tracking-tight"><span className="mr-2 font-mono text-sm text-accent">{String(index + 1).padStart(2, "0")}</span>{step.title}</h3><p className="text-sm leading-7 text-text-soft">{step.explanation}</p><SyntaxCode code={step.code.code} language={step.code.language} title={step.code.title} /><p className="text-sm leading-6 text-text-soft">{step.code.explanation}</p></li>)}</ol></section>
        <section aria-labelledby="troubleshooting-title"><h2 className="mb-4 text-2xl font-semibold tracking-tight" id="troubleshooting-title">Troubleshooting</h2><dl className="divide-y divide-border border-y border-border">{guide.troubleshooting.map((item) => <div className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" key={item.problem}><dt className="font-medium">{item.problem}</dt><dd className="text-sm leading-6 text-text-soft">{item.solution}</dd></div>)}</dl></section>
        <section aria-labelledby="references-title"><h2 className="mb-4 text-xl font-semibold tracking-tight" id="references-title">Official documentation</h2><ul className="grid gap-3 sm:grid-cols-2">{guide.references.map((reference) => <li key={reference.url}><a className="flex h-full items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4 text-sm font-medium hover:border-accent/60" href={reference.url} rel="noreferrer" target="_blank">{reference.label}<FiExternalLink aria-hidden="true" className="shrink-0 text-text-faint" /></a></li>)}</ul></section>
      </article>
      <aside className="h-fit rounded-xl border border-border bg-surface p-5 lg:sticky lg:top-24"><h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-soft">Before you begin</h2><h3 className="mb-2 text-sm font-medium">Prerequisites</h3><ul className="mb-5 list-inside list-disc space-y-2 text-sm leading-6 text-text-soft">{guide.prerequisites.map((item) => <li key={item}>{item}</li>)}</ul><h3 className="mb-2 text-sm font-medium">Version compatibility</h3><ul className="mb-5 space-y-2 text-sm leading-6 text-text-soft">{guide.compatibility.map((item) => <li className="flex gap-2" key={item}><FiCheck aria-hidden="true" className="mt-1 shrink-0 text-accent" />{item}</li>)}</ul><Link className="inline-flex items-center gap-2 border-t border-border pt-4 text-sm font-medium text-accent-strong" href="/stacks">Browse all guides <FiArrowUpRight aria-hidden="true" /></Link></aside>
    </div>
  </main>;
}
