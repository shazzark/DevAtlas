import Link from "next/link";
import { FiArrowUpRight, FiGitBranch } from "react-icons/fi";
import type { Release } from "@devatlas/shared";

function displayDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value)) : "Date not verified";
}

export function ReleaseCard({ release }: { release: Release }) {
  return <article className="group flex h-full min-w-0 flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/60">
    <div className="mb-5 flex items-center justify-between gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent-wash text-accent"><FiGitBranch aria-hidden="true" /></span><time className="text-xs text-text-faint" dateTime={release.sourcePublishedAt ?? release.lastVerifiedAt}>{displayDate(release.sourcePublishedAt)}</time></div>
    <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-text-soft">{release.technologyName} · {release.version}</p>
    <h2 className="mb-2 text-xl font-semibold tracking-tight"><Link href={`/releases/${release.slug}`}>{release.title}<FiArrowUpRight aria-hidden="true" className="ml-1 inline text-sm text-text-faint opacity-0 transition-opacity group-hover:opacity-100" /></Link></h2>
    <p className="mb-6 text-sm leading-6 text-text-soft">{release.summary}</p>
    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-text-faint"><span>Source checked {displayDate(release.lastVerifiedAt)}</span><a className="inline-flex items-center gap-1 text-accent-strong underline underline-offset-4" href={release.sourceUrl} rel="noreferrer" target="_blank">{release.sourceTitle}<FiArrowUpRight aria-hidden="true" /></a></div>
  </article>;
}
