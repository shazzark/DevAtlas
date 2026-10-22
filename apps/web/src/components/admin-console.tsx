"use client";

import { useEffect, useState } from "react";

type ContentType = "technologies" | "stacks" | "build-guides";
type Tab = ContentType | "releases" | "audit";
type ContentRecord = Record<string, unknown> & { slug: string; status: "draft" | "review" | "published" };
type Candidate = { slug: string; title: string; technologyName: string; version: string; sourceTitle: string; sourceUrl: string; status: "draft" | "review" };
const contentTabs: Array<{ key: ContentType; label: string }> = [
  { key: "technologies", label: "Technologies" }, { key: "stacks", label: "Stack Guides" }, { key: "build-guides", label: "Build Guides" },
];
const blankEditorial = { summary: "", whyItMatters: "", importantChanges: [], breakingChanges: [], migrationGuidance: "", upgradeConsiderations: [], codeExamples: [] };

async function request(path: string, method = "GET", body?: unknown) {
  const response = await fetch(`/api/admin/${path}`, { method, headers: body ? { "content-type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const payload = await response.json().catch(() => ({})) as { items?: unknown[]; item?: unknown; error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? "Admin request could not be completed");
  return payload;
}

function editableContent(value: ContentRecord): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([key]) => !["_id", "__v", "status", "createdAt", "updatedAt"].includes(key)));
}

export function AdminConsole() {
  const [tab, setTab] = useState<Tab>("technologies");
  const [status, setStatus] = useState("draft");
  const [items, setItems] = useState<ContentRecord[]>([]);
  const [selected, setSelected] = useState<ContentRecord | null>(null);
  const [json, setJson] = useState("{}");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [editorialJson, setEditorialJson] = useState(JSON.stringify(blankEditorial, null, 2));
  const [audit, setAudit] = useState<Array<Record<string, unknown>>>([]);
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadContent(type: ContentType, nextStatus = status) {
    const payload = await request(`content/${type}?status=${nextStatus}`);
    setItems((payload.items ?? []) as ContentRecord[]);
  }
  async function loadCandidates() {
    const payload = await request("releases/candidates");
    setCandidates((payload.items ?? []) as Candidate[]);
  }
  async function loadAudit() {
    const payload = await request("audit");
    setAudit((payload.items ?? []) as Array<Record<string, unknown>>);
  }

  useEffect(() => {
    setMessage("");
    if (contentTabs.some((item) => item.key === tab)) void loadContent(tab as ContentType).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load content"));
    else if (tab === "releases") void loadCandidates().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load release candidates"));
    else void loadAudit().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load audit events"));
  }, [tab, status]);

  async function run(action: () => Promise<void>) {
    setBusy(true); setMessage("");
    try { await action(); setMessage("Saved."); }
    catch (error) { setMessage(error instanceof Error ? error.message : "The request could not be completed"); }
    finally { setBusy(false); }
  }

  async function saveContent() {
    const content = JSON.parse(json) as Record<string, unknown>;
    const path = `content/${tab}`;
    const payload = selected
      ? await request(`${path}/${encodeURIComponent(selected.slug)}`, "PATCH", { content })
      : await request(path, "POST", { content });
    setSelected(payload.item as ContentRecord);
    await loadContent(tab as ContentType);
  }

  async function transition(record: ContentRecord, nextStatus: ContentRecord["status"]) {
    await request(`content/${tab}/${encodeURIComponent(record.slug)}/workflow`, "PATCH", {
      expectedStatus: record.status, status: nextStatus, verificationConfirmed,
    });
    setSelected(null); setJson("{}"); setVerificationConfirmed(false);
    await loadContent(tab as ContentType);
  }

  async function releaseDecision(decision: "submit_for_review" | "return_to_draft" | "publish") {
    if (!candidate) return;
    const body = decision === "return_to_draft" ? { decision } : {
      decision, content: JSON.parse(editorialJson), ...(decision === "publish" ? { verificationConfirmed } : {}),
    };
    await request(`releases/${encodeURIComponent(candidate.slug)}/review`, "PATCH", body);
    setCandidate(null); setEditorialJson(JSON.stringify(blankEditorial, null, 2));
    await loadCandidates();
  }

  return <section aria-label="Admin workspace">
    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Admin sections">
      {[...contentTabs, { key: "releases" as const, label: "Releases" }, { key: "audit" as const, label: "Audit log" }].map((item) => <button aria-pressed={tab === item.key} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${tab === item.key ? "border-accent bg-accent-wash text-accent-strong" : "border-border hover:bg-surface"}`} key={item.key} onClick={() => { setTab(item.key); setSelected(null); }} type="button">{item.label}</button>)}
    </div>
    {message && <p aria-live="polite" className="mb-5 rounded-lg border border-border bg-surface px-4 py-3 text-sm">{message}</p>}
    {contentTabs.some((item) => item.key === tab) && <div className="grid gap-6 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1.2fr)]">
      <section aria-label="Content records" className="rounded-xl border border-border p-4"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">{contentTabs.find((item) => item.key === tab)?.label}</h2><label className="text-sm">Status <select className="ml-2 rounded-md border border-border bg-surface px-2 py-1" onChange={(event) => { setStatus(event.target.value); setSelected(null); }} value={status}><option>draft</option><option>review</option><option>published</option></select></label></div><button className="mb-3 rounded-md border border-border px-3 py-2 text-sm font-semibold hover:bg-surface" onClick={() => { setSelected(null); setJson("{}"); }} type="button">New draft</button><ul className="space-y-2">{items.map((item) => <li key={item.slug}><button className="w-full rounded-lg border border-border p-3 text-left hover:bg-surface" onClick={() => { setSelected(item); setJson(JSON.stringify(editableContent(item), null, 2)); setVerificationConfirmed(false); }} type="button"><span className="block font-semibold">{String(item.title ?? item.name ?? item.slug)}</span><span className="mt-1 block font-mono text-xs text-text-soft">{item.slug} · {item.status}</span></button></li>)}</ul>{items.length === 0 && <p className="py-6 text-sm text-text-soft">No records in this state.</p>}</section>
      <section aria-label="Edit content" className="rounded-xl border border-border p-4"><h2 className="mb-3 text-lg font-semibold">{selected ? `Edit ${selected.slug}` : "Create a draft"}</h2><p className="mb-3 text-sm text-text-soft">Enter the complete content object as JSON. Server-side schemas and MongoDB validation reject unknown or incomplete fields.</p><label className="sr-only" htmlFor="admin-content-json">Content JSON</label><textarea className="min-h-[420px] w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs leading-5" id="admin-content-json" onChange={(event) => setJson(event.target.value)} spellCheck={false} value={json} /><button className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={() => void run(saveContent)} type="button">{selected ? "Save changes" : "Create draft"}</button>{selected && <div className="mt-5 border-t border-border pt-4"><p className="mb-3 text-sm font-semibold">Workflow: {selected.status}</p><div className="flex flex-wrap gap-2">{selected.status === "draft" && <button className="rounded-md border border-border px-3 py-2 text-sm" disabled={busy} onClick={() => void run(() => transition(selected, "review"))} type="button">Submit for review</button>}{selected.status === "review" && <><button className="rounded-md border border-border px-3 py-2 text-sm" disabled={busy} onClick={() => void run(() => transition(selected, "draft"))} type="button">Return to draft</button><button className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={() => void run(() => transition(selected, "published"))} type="button">Publish after verification</button></>}{selected.status === "published" && <button className="rounded-md border border-border px-3 py-2 text-sm" disabled={busy} onClick={() => void run(() => transition(selected, "draft"))} type="button">Withdraw to draft</button>}</div>{selected.status === "review" && <label className="mt-4 flex items-start gap-2 text-sm"><input checked={verificationConfirmed} className="mt-1" onChange={(event) => setVerificationConfirmed(event.target.checked)} type="checkbox" />I checked source links, version details, and code examples before publishing.</label>}</div>}</section>
    </div>}
    {tab === "releases" && <section className="grid gap-6 lg:grid-cols-2"><div className="rounded-xl border border-border p-4"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Release candidates</h2><button className="rounded-md border border-border px-3 py-2 text-sm" disabled={busy} onClick={() => void run(async () => { await request("releases/monitor", "POST", {}); await loadCandidates(); })} type="button">Scan sources</button></div><ul className="space-y-2">{candidates.map((item) => <li className="rounded-lg border border-border p-3" key={item.slug}><button className="w-full text-left" onClick={() => { setCandidate(item); setEditorialJson(JSON.stringify(blankEditorial, null, 2)); setVerificationConfirmed(false); }} type="button"><span className="block font-semibold">{item.title}</span><span className="text-xs text-text-soft">{item.technologyName} {item.version} · {item.status}</span></button><a className="mt-1 inline-block text-xs text-accent-strong underline" href={item.sourceUrl} rel="noreferrer" target="_blank">{item.sourceTitle} (official source)</a></li>)}</ul>{candidates.length === 0 && <p className="py-6 text-sm text-text-soft">No release candidates need review.</p>}</div><div className="rounded-xl border border-border p-4"><h2 className="mb-2 text-lg font-semibold">{candidate ? candidate.title : "Editorial review"}</h2>{candidate ? <><p className="mb-3 text-sm text-text-soft">Author a source-checked summary in the required JSON shape. Candidate metadata remains controlled by the official source record.</p><label className="sr-only" htmlFor="release-editorial-json">Release editorial JSON</label><textarea className="min-h-[360px] w-full rounded-lg border border-border bg-surface p-3 font-mono text-xs leading-5" id="release-editorial-json" onChange={(event) => setEditorialJson(event.target.value)} spellCheck={false} value={editorialJson} /><div className="mt-3 flex flex-wrap gap-2">{candidate.status === "draft" && <button className="rounded-md border border-border px-3 py-2 text-sm" disabled={busy} onClick={() => void run(() => releaseDecision("submit_for_review"))} type="button">Submit for review</button>}{candidate.status === "review" && <><button className="rounded-md border border-border px-3 py-2 text-sm" disabled={busy} onClick={() => void run(() => releaseDecision("return_to_draft"))} type="button">Return to draft</button><button className="rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white" disabled={busy} onClick={() => void run(() => releaseDecision("publish"))} type="button">Publish after verification</button></>}</div>{candidate.status === "review" && <label className="mt-4 flex gap-2 text-sm"><input checked={verificationConfirmed} onChange={(event) => setVerificationConfirmed(event.target.checked)} type="checkbox" />I verified the editorial claims against the official source.</label>}</> : <p className="text-sm text-text-soft">Select a release candidate to prepare its editorial review.</p>}</div></section>}
    {tab === "audit" && <section aria-label="Recent administrative actions" className="rounded-xl border border-border p-4"><h2 className="mb-4 text-lg font-semibold">Recent administrative actions</h2>{audit.length ? <ul className="divide-y divide-border">{audit.map((event, index) => <li className="py-3 text-sm" key={String(event._id ?? index)}><span className="font-semibold">{String(event.action)}</span><span className="ml-2 text-text-soft">{String(event.entityType)}/{String(event.entitySlug)} · {String(event.actorId)} · {String(event.createdAt)}</span></li>)}</ul> : <p className="text-sm text-text-soft">No recorded actions yet.</p>}</section>}
  </section>;
}
