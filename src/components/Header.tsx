import Link from "next/link";
import { SITE_NAME } from "@/lib/format";

export default function Header() {
  return (
    <header className="no-print border-b border-line">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
        {/* BRANDING: replace the text below with your logo, e.g. <img src="/logo.svg" alt={SITE_NAME} className="h-8" /> */}
        <Link href="/" className="text-lg font-bold text-brand">{SITE_NAME}</Link>
        <Link href="/admin" className="text-sm text-muted hover:underline">Admin</Link>
      </div>
    </header>
  );
}
