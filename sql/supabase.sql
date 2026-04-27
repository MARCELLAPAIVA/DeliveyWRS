-- Extensões
create extension if not exists "pgcrypto";

-- Tipos
create type public.order_status as enum ('novo', 'preparo', 'entrega', 'finalizado');
create type public.payment_method as enum ('dinheiro', 'cartao', 'pix');

-- Profiles (1:1 com auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  address text,
  neighborhood text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  neighborhood text not null unique,
  fee numeric(10,2) not null check (fee >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  delivery_zone_id uuid references public.delivery_zones(id) on delete set null,
  status public.order_status not null default 'novo',
  payment_method public.payment_method not null,
  change_for numeric(10,2),
  notes text,
  address text not null,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  delivery_fee numeric(10,2) not null default 0,
  total numeric(10,2) not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  total_price numeric(10,2) not null check (total_price >= 0)
);

create table if not exists public.settings (
  id bigint primary key,
  store_name text not null default 'Delivery WRS',
  logo_url text,
  banner_url text,
  whatsapp text not null default '5521985529198',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- Bucket de imagens
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Função helper de papel admin
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
as $$
  select exists(
    select 1 from public.profiles p where p.id = uid and p.is_admin = true
  );
$$;

-- Relatório: top produtos
create or replace function public.top_selling_products()
returns table(product_name text, qty bigint)
language sql
stable
as $$
  select p.name, sum(oi.quantity)::bigint as qty
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  join public.orders o on o.id = oi.order_id
  where o.status = 'finalizado'
  group by p.name
  order by qty desc
  limit 10;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.settings enable row level security;

-- profiles
create policy "profiles_self_select" on public.profiles
for select using (auth.uid() = id or public.is_admin(auth.uid()));
create policy "profiles_self_update" on public.profiles
for update using (auth.uid() = id or public.is_admin(auth.uid()))
with check (auth.uid() = id or public.is_admin(auth.uid()));
create policy "profiles_self_insert" on public.profiles
for insert with check (auth.uid() = id or public.is_admin(auth.uid()));

-- catálogo público autenticado
create policy "categories_read" on public.categories
for select using (auth.role() = 'authenticated');
create policy "products_read" on public.products
for select using (auth.role() = 'authenticated');
create policy "zones_read" on public.delivery_zones
for select using (auth.role() = 'authenticated');
create policy "settings_read" on public.settings
for select using (auth.role() = 'authenticated');

-- admin gerencia catálogo
create policy "categories_admin_all" on public.categories
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "products_admin_all" on public.products
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "zones_admin_all" on public.delivery_zones
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "settings_admin_update" on public.settings
for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- storage: leitura autenticada e escrita apenas admin
create policy "product_images_read" on storage.objects
for select using (bucket_id = 'products' and auth.role() = 'authenticated');
create policy "product_images_admin_insert" on storage.objects
for insert with check (bucket_id = 'products' and public.is_admin(auth.uid()));
create policy "product_images_admin_update" on storage.objects
for update using (bucket_id = 'products' and public.is_admin(auth.uid()))
with check (bucket_id = 'products' and public.is_admin(auth.uid()));
create policy "product_images_admin_delete" on storage.objects
for delete using (bucket_id = 'products' and public.is_admin(auth.uid()));

-- pedidos
create policy "orders_self_insert" on public.orders
for insert with check (auth.uid() = user_id);
create policy "orders_self_select" on public.orders
for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "orders_admin_update" on public.orders
for update using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "items_self_insert" on public.order_items
for insert with check (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);
create policy "items_self_select" on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and (o.user_id = auth.uid() or public.is_admin(auth.uid()))
  )
);

-- Trigger updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at before update on public.orders
for each row execute function public.touch_updated_at();

-- Auto-cria profile quando usuário cria conta
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
