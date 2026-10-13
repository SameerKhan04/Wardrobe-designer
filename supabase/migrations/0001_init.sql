-- Run once in the Supabase SQL editor (or `supabase db push`).
-- Timestamps are device epoch milliseconds so last-write-wins compares the same clock both ways.

create table public.garments (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (category in ('top','bottom','shoes','outerwear','dress','accessory')),
  color text not null default '',
  formality text not null default 'casual' check (formality in ('casual','smart','formal')),
  warmth text not null default 'mid' check (warmth in ('light','mid','heavy')),
  rainproof boolean not null default false,
  breathable boolean not null default false,
  availability text not null default 'clean' check (availability in ('clean','laundry','dry_cleaners')),
  image_path text,
  updated_at bigint not null,
  deleted_at bigint
);

create table public.outfits (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text,
  tags text[] not null default '{}',
  top_id uuid,       -- may be a dress; a dress means no bottom
  bottom_id uuid,
  shoes_id uuid,
  outerwear_id uuid, -- null = no jacket
  updated_at bigint not null,
  deleted_at bigint
);

create index on public.garments (user_id);
create index on public.outfits (user_id);

alter table public.garments enable row level security;
alter table public.outfits enable row level security;

create policy "own garments" on public.garments for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own outfits" on public.outfits for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Private bucket; each user can only touch files under their own `{user_id}/` folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('garments', 'garments', false, 5242880, array['image/png','image/jpeg'])
on conflict (id) do nothing;

create policy "own files read" on storage.objects for select
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files insert" on storage.objects for insert
  with check (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files update" on storage.objects for update
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete
  using (bucket_id = 'garments' and (storage.foldername(name))[1] = auth.uid()::text);
