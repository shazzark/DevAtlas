import Link from "next/link";
import { FiArrowDownRight, FiArrowRight, FiCode, FiCompass, FiGitBranch, FiSearch, FiShield } from "react-icons/fi";

const pillars = [
  { id: "explore", number: "01", icon: FiCompass, title: "Know the tools", description: "Clear, practical context for the technologies you use and the ones you’re considering." },
  { id: "release-intelligence", number: "02", icon: FiGitBranch, title: "Follow what changes", description: "Release notes explained with source links, upgrade context, and room for careful review." },
  { id: "guides", number: "03", icon: FiCode, title: "Connect and build", description: "Understand how tools fit together, then put that knowledge to work in real projects." },
];

export default function HomePage() {
  return (
    <main id="main-content">
      <section aria-labelledby="hero-title" className="hero page-wrap">
        <div className="hero-copy">
          <p className="eyebrow"><span className="status-dot" /> A field guide for the software stack</p>
          <h1 id="hero-title">The tools move fast.<br /><span>Make sense of them.</span></h1>
          <p className="hero-intro">A calmer way to keep up with the technologies behind your work — what they do, what changed, and how they fit together.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#explore">Explore the atlas <FiArrowRight aria-hidden="true" /></a>
            <a className="text-link" href="#whats-new">See what’s new <FiArrowDownRight aria-hidden="true" /></a>
          </div>
          <div aria-label="Search is not available yet" className="search-entry" id="search">
            <FiSearch aria-hidden="true" />
            <span>Search technologies, releases, and guides</span>
            <span className="search-soon">Coming soon</span>
          </div>
        </div>
        <div aria-hidden="true" className="hero-art">
          <div className="orbit orbit-outer" /><div className="orbit orbit-inner" />
          <span className="orbit-node node-a" /><span className="orbit-node node-b" /><span className="orbit-node node-c" />
          <div className="atlas-core"><span className="brand-mark large"><span /></span><small>DEVATLAS</small></div>
          <span className="art-label label-a">learn</span><span className="art-label label-b">connect</span><span className="art-label label-c">build</span>
        </div>
        <div className="hero-caption"><span>01 / A living map of modern development</span><span>Independent · Source-aware · Free to learn</span></div>
      </section>

      <section aria-labelledby="pillars-title" className="pillars-section page-wrap">
        <div className="section-heading">
          <div><p className="eyebrow">A little less noise, a lot more context</p><h2 id="pillars-title">Your stack, in perspective.</h2></div>
          <p>Software knowledge shouldn’t be scattered across changelogs, docs, and half-remembered threads.</p>
        </div>
        <div className="pillar-grid">
          {pillars.map(({ id, number, icon: Icon, title, description }) => (
            <article className="pillar-card" id={id} key={id}>
              <div className="pillar-top"><span>{number}</span><Icon aria-hidden="true" /></div>
              <h3>{title}</h3><p>{description}</p>
              <span className="card-rule" />
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="now-title" className="now-section page-wrap" id="whats-new">
        <div className="now-panel">
          <div className="now-copy">
            <p className="eyebrow">The atlas is taking shape</p>
            <h2 id="now-title">Good context takes<br />careful work.</h2>
            <p>We’re building a dependable home for technology guides and source-traceable release notes. Content will appear here as it’s reviewed and ready.</p>
            <span className="availability"><FiShield aria-hidden="true" /> No unverified release summaries</span>
          </div>
          <div aria-live="polite" className="empty-state">
            <span className="empty-icon"><FiGitBranch aria-hidden="true" /></span>
            <span className="empty-kicker">What’s new</span>
            <p>There are no reviewed releases to show yet.</p>
            <small>Release updates will include links to their official sources.</small>
          </div>
        </div>
      </section>

      <section aria-label="Explore DevAtlas" className="closing page-wrap">
        <p>Keep your curiosity close.</p>
        <Link className="closing-link" href="#explore">Start with the stack <FiArrowRight aria-hidden="true" /></Link>
      </section>
    </main>
  );
}
