create table if not exists public.yazzoon_moments (
  id uuid primary key,
  storage_path text not null unique,
  guest_name text check (char_length(guest_name) <= 80),
  guest_email text check (char_length(guest_email) <= 160),
  caption text check (char_length(caption) <= 240),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  consent_version text not null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.yazzoon_moments enable row level security;

create policy "Guests can submit moments"
on public.yazzoon_moments for insert to anon
with check (status = 'pending' and consent_version is not null);

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('yazzoon-moments','yazzoon-moments',false,12582912,array['image/jpeg'])
on conflict (id) do update set public=false,file_size_limit=12582912,allowed_mime_types=array['image/jpeg'];

create policy "Guests can upload pending moments"
on storage.objects for insert to anon
with check (bucket_id='yazzoon-moments' and (storage.foldername(name))[1]='pending');

