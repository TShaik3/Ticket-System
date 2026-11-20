import { saveEvent } from "@/app/admin/actions";
import { isoToLocalInput } from "@/lib/format";

type Ev = {
  id?: string; title?: string; slug?: string; description?: string | null; location?: string | null; address?: string | null;
  summary?: string | null; category?: string; starts_at?: string; ends_at?: string | null; image_url?: string | null; capacity?: number | null; status?: string;
};

export default function EventForm({ event = {} }: { event?: Ev }) {
  return (
    <form action={saveEvent} className="card space-y-4">
      {event.id && <input type="hidden" name="id" value={event.id} />}
      <div><label className="label">Title</label><input name="title" required defaultValue={event.title} className="input" /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label">Starts</label><input type="datetime-local" name="starts_at" required defaultValue={isoToLocalInput(event.starts_at ?? null)} className="input" /></div>
        <div><label className="label">Ends (optional)</label><input type="datetime-local" name="ends_at" defaultValue={isoToLocalInput(event.ends_at ?? null)} className="input" /></div>
        <div><label className="label">Venue name</label><input name="location" defaultValue={event.location ?? ""} className="input" /></div>
        <div><label className="label">Address</label><input name="address" defaultValue={event.address ?? ""} className="input" /></div>
        <div><label className="label">Total capacity (blank = no overall cap)</label><input type="number" min={0} name="capacity" defaultValue={event.capacity ?? ""} className="input" /></div>
        <div><label className="label">URL slug (blank = from title)</label><input name="slug" defaultValue={event.slug} className="input" /></div>
        <div><label className="label">Image URL</label><input name="image_url" defaultValue={event.image_url ?? ""} className="input" /></div>
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={event.status ?? "draft"} className="input">
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published</option>
            <option value="closed">Closed (sales off)</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Category (landing page filter)</label>
          <select name="category" defaultValue={event.category ?? "general"} className="input">
            <option value="general">General (shows under All Events)</option>
            <option value="founders">Founders</option>
            <option value="creatives">Creatives</option>
            <option value="tech">Tech &amp; Industry</option>
          </select>
        </div>
        <div><label className="label">Card summary (about 2 sentences)</label><input name="summary" maxLength={240} defaultValue={event.summary ?? ""} className="input" /></div>
      </div>
      <div><label className="label">Description</label><textarea name="description" rows={6} defaultValue={event.description ?? ""} className="input" /></div>
      <button className="btn">Save event</button>
    </form>
  );
}
