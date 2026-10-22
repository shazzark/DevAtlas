import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import dockerfile from "highlight.js/lib/languages/dockerfile";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import { CopyCodeButton } from "@/components/copy-code-button";

const languages = { bash, css, dockerfile, javascript, json, jsx: javascript, plaintext, sql, ts: typescript, tsx: typescript, typescript, xml, html: xml };
for (const [name, language] of Object.entries(languages)) if (!hljs.getLanguage(name)) hljs.registerLanguage(name, language);

export function SyntaxCode({ title, language, code }: { title: string; language: string; code: string }) {
  const normalizedLanguage = language.toLowerCase();
  const safeLanguage = Object.hasOwn(languages, normalizedLanguage) ? normalizedLanguage : "plaintext";
  // Highlight.js escapes source text while generating span markup; only its output is inserted into the code element.
  const highlighted = hljs.highlight(code, { language: safeLanguage, ignoreIllegals: true }).value;
  return <figure className="overflow-hidden rounded-xl border border-border bg-[#171916] text-[#eeefe9]">
    <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3"><span className="min-w-0 truncate text-sm font-medium">{title}</span><div className="flex shrink-0 items-center gap-3"><span className="font-mono text-[10px] uppercase tracking-wide text-white/50">{language}</span><CopyCodeButton code={code} /></div></figcaption>
    <pre className="max-h-[560px] overflow-auto p-4 text-[13px] leading-6"><code className={`hljs language-${safeLanguage}`} dangerouslySetInnerHTML={{ __html: highlighted }} /></pre>
  </figure>;
}
