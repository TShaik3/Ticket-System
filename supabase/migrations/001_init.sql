-- Ticket system schema. Run in the Supabase SQL editor (or via supabase CLI).
create extension if not exists pgcrypto;

-- Who can use the admin area. Add more rows later to give others access.
-- role: owner (everything), admin (manage events), staff (check-in only)
create table admins (
  user_id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'admin' check (role in ('owner','admin','staff')),
  created_at timestamptz not null default now()
);

create table events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  description text,
  location text,
  address text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  image_url text,
  capacity int check (capacity is null or capacity >= 0),
  status text not null default 'draft' check (status in ('draft','published','closed')),
  created_at timestamptz not null default now()
);

create table ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  name text not null,
  description text,
  price_cents int not null default 0 check (price_cents >= 0),
  quantity_total int not null check (quantity_total >= 0),
  sale_start timestamptz,
  sale_end timestamptz,
  max_per_order int not null default 4 check (max_per_order > 0),
  sort int not null default 0,
  active boolean not null default true
);

create table promo_codes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  code text not null,
  percent_off int check (percent_off between 1 and 100),
  amount_off_cents int check (amount_off_cents > 0),
  usage_limit int,
  used_count int not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  unique (event_id, code),
  check (percent_off is not null or amount_off_cents is not null)
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  event_id uuid not null references events,
  buyer_name text not null,
  buyer_email text not null,
  subtotal_cents int not null,
  discount_cents int not null default 0,
  total_cents int not null,
  promo_code_id uuid references promo_codes,
  status text not null default 'pending' check (status in ('pending','paid','cancelled','refunded')),
  stripe_session_id text,
  stripe_payment_intent text,
  expires_at timestamptz,
  refund_reason text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index on orders (event_id);
create index on orders (stripe_session_id);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  event_id uuid not null references events,
  ticket_type_id uuid not null references ticket_types,
  attendee_name text not null,
  code text unique not null default encode(gen_random_bytes(12), 'hex'),
  status text not null default 'pending' check (status in ('pending','valid','used','cancelled')),
  checked_in_at timestamptz
);
create index on tickets (event_id);
create index on tickets (ticket_type_id);

create table waitlist (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  name text not null,
  email text not null,
  quantity int not null default 1,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

create table sponsors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events on delete cascade,
  name text not null,
  logo_url text,
  link_url text,
  sort int not null default 0
);

-- All tables are locked down. The app reads/writes through the server using the
-- service-role key, so no public policies are needed.
alter table admins enable row level security;
alter table events enable row level security;
alter table ticket_types enable row level security;
alter table promo_codes enable row level security;
alter table orders enable row level security;
alter table tickets enable row level security;
alter table waitlist enable row level security;
alter table sponsors enable row level security;

-- Atomically reserves tickets (prevents overselling) and creates a pending order.
-- Pending orders hold seats until expires_at.
create or replace function create_pending_order(
  p_ticket_type_id uuid,
  p_qty int,
  p_name text,
  p_email text,
  p_promo text,
  p_expires_at timestamptz
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  tt ticket_types%rowtype;
  ev events%rowtype;
  pc promo_codes%rowtype;
  type_taken int;
  event_taken int;
  sub int;
  disc int := 0;
  oid uuid;
  i int;
begin
  select * into tt from ticket_types where id = p_ticket_type_id and active;
  if not found then raise exception 'ticket_type_not_found'; end if;

  -- Lock the event row so concurrent checkouts for one event run one at a time.
  select * into ev from events where id = tt.event_id for update;
  if ev.status <> 'published' then raise exception 'event_closed'; end if;
  if tt.sale_start is not null and now() < tt.sale_start then raise exception 'sale_not_open'; end if;
  if tt.sale_end is not null and now() > tt.sale_end then raise exception 'sale_ended'; end if;
  if p_qty < 1 or p_qty > tt.max_per_order then raise exception 'bad_quantity'; end if;

  select count(*) into type_taken
    from tickets t join orders o on o.id = t.order_id
   where t.ticket_type_id = tt.id and t.status <> 'cancelled'
     and (o.status = 'paid' or (o.status = 'pending' and o.expires_at > now()));
  if type_taken + p_qty > tt.quantity_total then raise exception 'sold_out'; end if;

  if ev.capacity is not null then
    select count(*) into event_taken
      from tickets t join orders o on o.id = t.order_id
     where t.event_id = ev.id and t.status <> 'cancelled'
       and (o.status = 'paid' or (o.status = 'pending' and o.expires_at > now()));
    if event_taken + p_qty > ev.capacity then raise exception 'sold_out'; end if;
  end if;

  sub := tt.price_cents * p_qty;

  if p_promo is not null and length(trim(p_promo)) > 0 then
    select * into pc from promo_codes
     where event_id = ev.id and upper(code) = upper(trim(p_promo)) and active
       and (expires_at is null or expires_at > now())
       and (usage_limit is null or used_count < usage_limit)
     for update;
    if not found then raise exception 'invalid_promo'; end if;
    if pc.percent_off is not null then
      disc := (sub * pc.percent_off) / 100;
    else
      disc := least(pc.amount_off_cents, sub);
    end if;
    update promo_codes set used_count = used_count + 1 where id = pc.id;
  end if;

  insert into orders (event_id, buyer_name, buyer_email, subtotal_cents, discount_cents,
                      total_cents, promo_code_id, expires_at)
  values (ev.id, p_name, p_email, sub, disc, greatest(sub - disc, 0), pc.id, p_expires_at)
  returning id into oid;

  for i in 1..p_qty loop
    insert into tickets (order_id, event_id, ticket_type_id, attendee_name)
    values (oid, ev.id, tt.id, p_name);
  end loop;

  return oid;
end;
$$;

revoke all on function create_pending_order from public, anon, authenticated;
