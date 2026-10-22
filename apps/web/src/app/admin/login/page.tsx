import { adminAuthConfigurationReady, signIn } from "@/auth";

export const metadata = { title: "Admin sign in | DevAtlas", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  const configured = adminAuthConfigurationReady();
  return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(640px,calc(100%-40px))] py-16"><p className="font-mono text-xs uppercase tracking-widest text-text-soft">Private area</p><h1 className="my-4 text-4xl font-semibold">Admin sign in</h1><p className="max-w-lg text-text-soft">Sign in with an approved GitHub account. Access is restricted to the numeric account IDs configured by the site owner.</p>{configured ? <form action={async () => { "use server"; await signIn("github", { redirectTo: "/admin" }); }}><button className="mt-8 rounded-lg bg-accent px-5 py-3 font-semibold text-white hover:opacity-90" type="submit">Continue with GitHub</button></form> : <p className="mt-8 rounded-lg border border-border bg-surface px-4 py-3 text-sm" role="status">Admin sign in is unavailable until its OAuth and signing settings are configured.</p>}</main>;
}
