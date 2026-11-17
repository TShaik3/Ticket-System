import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { db } from "@/lib/supabase/admin";
import { dateTime, money } from "@/lib/format";
import AutoRefresh from "@/components/AutoRefresh";
import PrintButton from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your tickets", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[token]">) {
  const { token } = await params;
  const sp = await searchParams;
  const supabase = db();
  const { data: order } = await supabase
    .from("orders")
    .select("*, events(title, starts_at, location, address)")
    .eq("token", token)
    .maybeSingle();
  if (!order) notFound();
  const ev = order.events as { title: string; starts_at: string; location: string | null; address: string | null };

  if (order.status !== "paid") {
    return (
      <div className="card text-center">
        {order.status === "pending" ? (
          <>
            <h1 className="text-xl font-semibold">{sp.paid ? "Finalizing your payment…" : "Payment not completed"}</h1>
            <p className="mt-2 text-muted">{sp.paid ? "This page will update automatically in a moment." : "Your payment hasn't gone through yet."}</p>
            {sp.paid && <AutoRefresh />}
          </>
        ) : (
          <h1 className="text-xl font-semibold">This order was {order.status}.</h1>
        )}
      </div>
    );
  }

  const [{ data: tickets }, { data: types }] = await Promise.all([
    supabase.from("tickets").select("*").eq("order_id", order.id).order("id"),
    supabase.from("ticket_types").select("id, name").eq("event_id", order.event_id),
  ]);
  const typeName = Object.fromEntries((types ?? []).map((t) => [t.id, t.name]));
  const qrs = await Promise.all((tickets ?? []).map((t) => QRCode.toString(t.code, { type: "svg", margin: 1, width: 220 })));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">You&apos;re going to {ev.title}!</h1>
        <p className="text-muted">{dateTime(ev.starts_at)}</p>
        <p className="text-muted">{[ev.location, ev.address].filter(Boolean).join(", ")}</p>
        <p className="mt-2 text-sm text-muted">Order for {order.buyer_name} · {money(order.total_cents)}. Save this page or the link in your email; show a QR code at the door.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {tickets?.map((t, i) => (
          <div key={t.id} className="card text-center">
            <p className="font-semibold">{typeName[t.ticket_type_id]}</p>
            <p className="text-sm text-muted">{t.attendee_name}</p>
            {t.status === "cancelled" ? <p className="my-8 font-semibold text-red-600">Cancelled</p> : (
              // QR is black on white so scanners work in dark mode
              <div className="mx-auto my-3 w-fit rounded-lg bg-white p-2" dangerouslySetInnerHTML={{ __html: qrs[i] }} />
            )}
            {t.status === "used" && <p className="text-sm text-amber-600">Already checked in</p>}
            <p className="font-mono text-xs text-muted">{t.code.slice(0, 8).toUpperCase()}</p>
          </div>
        ))}
      </div>
      <PrintButton />
    </div>
  );
}
