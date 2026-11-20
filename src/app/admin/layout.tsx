import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { signOut } from "@/app/login/actions";
import Container from "@/components/Container";

export const metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return (
    <Container wide>
      <nav className="no-print mb-6 flex flex-wrap items-center gap-4 border-b border-line pb-3 text-sm">
        {admin.role !== "staff" && <Link href="/admin" className="font-semibold">Events</Link>}
        {admin.role !== "staff" && <Link href="/admin/inquiries" className="font-semibold">Inquiries</Link>}
        <Link href="/admin/scan" className="font-semibold">Scan tickets</Link>
        <span className="ml-auto text-muted">{admin.email} ({admin.role})</span>
        <form action={signOut}><button className="underline">Sign out</button></form>
      </nav>
      {children}
    </Container>
  );
}
