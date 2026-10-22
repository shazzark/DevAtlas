import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: "DevAtlas — Stay current. Understand the tools.",
  description: "A clear path through the tools, releases, and connections that shape modern software development.",
};

// Set the saved or system theme before hydration so the page does not flash in the wrong palette.
const themeBootstrap = `(()=>{try{const saved=localStorage.getItem('devatlas-theme');const theme=saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme}catch{}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBootstrap }} /></head>
      <body className="min-h-screen antialiased">
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <LinkBrand />
          <p>Stay current. Understand the tools. Connect the stack. Build better.</p>
          <span>Core learning, always free.</span>
        </footer>
      </body>
    </html>
  );
}

function LinkBrand() {
  return <a aria-label="DevAtlas home" className="wordmark footer-brand" href="/"><span aria-hidden="true" className="brand-mark"><span /></span><span>devatlas</span></a>;
}
