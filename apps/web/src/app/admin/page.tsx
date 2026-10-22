import { redirect } from "next/navigation";
import { adminAuthConfigurationReady, auth, signOut } from "@/auth";
import { AdminConsole } from "@/components/admin-console";

export const metadata = { title: "Content administration | DevAtlas", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!adminAuthConfigurationReady()) redirect("/admin/login");
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/admin/login");
  return <main id="main-content" className="mx-auto min-h-[70vh] w-[min(1120px,calc(100%-40px))] py-12 md:py-16">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-7"><div><p className="font-mono text-xs uppercase tracking-widest text-text-soft">Private area</p><h1 className="mt-3 text-4xl font-semibold">Content administration</h1><p className="mt-2 text-text-soft">Signed in as {session.user.email}</p></div><form action={async () => { "use server"; await signOut({ redirectTo: "/admin/login" }); }}><button className="rounded-md border border-border px-4 py-2 text-sm font-semibold hover:bg-surface" type="submit">Sign out</button></form></header>
    <AdminConsole />
  </main>;
}
