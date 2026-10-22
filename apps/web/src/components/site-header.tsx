import Link from "next/link";
import { FiBookOpen, FiLayers, FiMenu, FiZap } from "react-icons/fi";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { href: "/tools", label: "Explore", icon: FiLayers },
  { href: "/whats-new", label: "What’s new", icon: FiZap },
  { href: "/stacks", label: "Stack guides", icon: FiBookOpen },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-header backdrop-blur-[16px]">
      <div className="mx-auto flex min-h-[72px] w-[min(1280px,calc(100%-64px))] items-center justify-between gap-8 max-[900px]:gap-[18px] max-[680px]:min-h-[62px] max-[680px]:w-[calc(100%-32px)]">
        <Link aria-label="DevAtlas home" className="wordmark" href="/">
          <span aria-hidden="true" className="brand-mark"><span /></span>
          <span>devatlas</span>
        </Link>

        <nav aria-label="Main navigation" className="ml-auto mr-6 flex gap-8 max-[900px]:gap-[19px] max-[680px]:hidden">
          {navigation.map(({ href, label }) => <Link className="text-[13px] font-medium text-text-soft transition-colors hover:text-text" href={href} key={href}>{label}</Link>)}
        </nav>

        <div className="flex items-center gap-4 max-[680px]:gap-1">
          <Link className="inline-flex items-center gap-[26px] text-xs text-text-faint hover:text-text max-[680px]:hidden" href="/tools"><span>Search</span><kbd>/</kbd></Link>
          <ThemeToggle />
          <details className="relative hidden max-[680px]:block">
            <summary aria-label="Open navigation menu" className="grid size-10 cursor-pointer list-none place-items-center text-[19px] [&::-webkit-details-marker]:hidden" role="button"><FiMenu aria-hidden="true" /></summary>
            <nav aria-label="Mobile navigation" className="absolute right-0 top-12 grid w-[210px] gap-1 rounded-xl border border-border bg-surface p-2 shadow-[var(--shadow)]">
              {navigation.map(({ href, label, icon: Icon }) => (
                <Link className="flex items-center gap-[11px] rounded-md p-2.5 text-sm text-text-soft hover:bg-surface-muted hover:text-text" href={href} key={href}><Icon aria-hidden="true" />{label}</Link>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
