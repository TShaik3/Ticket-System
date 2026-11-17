import { requireAdmin } from "@/lib/auth";
import EventForm from "@/components/EventForm";

export default async function NewEvent({ searchParams }: PageProps<"/admin/events/new">) {
  await requireAdmin();
  const sp = await searchParams;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New event</h1>
      {sp.error && <p role="alert" className="text-red-600">{sp.error}</p>}
      <EventForm />
      <p className="text-sm text-muted">After saving you can add ticket types, promo codes and sponsors.</p>
    </div>
  );
}
