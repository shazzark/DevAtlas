import Link from "next/link";
import { FiArrowUpRight, FiLayers } from "react-icons/fi";
import type { Technology } from "@devatlas/shared";

export function TechnologyCard({ technology }: { technology: Technology }) {
  return (
    <article className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/60">
      <div className="mb-5 flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-lg bg-accent-wash text-accent"><FiLayers aria-hidden="true" /></span>
        <span className="rounded-full bg-surface-muted px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-text-soft">{technology.category}</span>
      </div>
      <h2 className="mb-2 text-xl font-semibold tracking-tight"><Link className="focus-visible:outline-accent" href={`/tools/${technology.slug}`}>{technology.name}<FiArrowUpRight aria-hidden="true" className="ml-1 inline text-sm text-text-faint opacity-0 transition-opacity group-hover:opacity-100" /></Link></h2>
      <p className="mb-6 text-sm leading-6 text-text-soft">{technology.shortDescription}</p>
      <div className="mt-auto flex items-center justify-between border-t border-border pt-4 text-xs text-text-faint">
        <span>{technology.version.current ? `Current ${technology.version.current}` : "Version not verified"}</span>
        <span>{technology.primaryUseCases.length} use cases</span>
      </div>
    </article>
  );
}
