"use client";

import { useState } from "react";
import { FiCheck, FiCopy } from "react-icons/fi";

export function CopyCodeButton({ code }: { code: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1800);
    } catch { setStatus("failed"); }
  }
  return <button className="inline-flex items-center gap-1.5 rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-[#b3b7af] hover:bg-white/10" onClick={copy} type="button">{status === "copied" ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}{status === "copied" ? "Copied" : "Copy"}<span aria-live="polite" className="sr-only">{status === "copied" ? "Code copied to clipboard" : status === "failed" ? "Could not copy code. Select and copy it manually." : ""}</span></button>;
}
