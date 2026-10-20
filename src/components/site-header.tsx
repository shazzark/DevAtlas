import Link from "next/link";
import { FiBookOpen, FiLayers, FiMenu, FiZap } from "react-icons/fi";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { href: "#explore", label: "Explore", icon: FiLayers },
  { href: "#whats-new", label: "What’s new", icon: FiZap },
  { href: "#guides", label: "Guides", icon: FiBookOpen },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link aria-label="DevAtlas home" className="wordmark" href="/">
          <span aria-hidden="true" className="brand-mark"><span /></span>
          <span>devatlas</span>
        </Link>

        <nav aria-label="Main navigation" className="desktop-nav">
          {navigation.map(({ href, label }) => <a href={href} key={href}>{label}</a>)}
        </nav>

        <div className="header-actions">
          <a className="search-shortcut" href="#search"><span>Search</span><kbd>/</kbd></a>
          <ThemeToggle />
          <details className="mobile-menu">
            <summary aria-label="Open navigation menu" role="button"><FiMenu aria-hidden="true" /></summary>
            <nav aria-label="Mobile navigation">
              {navigation.map(({ href, label, icon: Icon }) => (
                <a href={href} key={href}><Icon aria-hidden="true" />{label}</a>
              ))}
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
