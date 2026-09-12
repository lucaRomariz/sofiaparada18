-- ============================================================
-- SOFIA 18 — Migration: curtidas públicas nas fotos
-- Rodar no SQL Editor do Supabase
-- ============================================================

create table likes (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table likes enable row level security;

-- Convidados podem curtir
create policy "Guests can insert likes"
on likes
for insert
to anon
with check (true);

-- Qualquer um pode ver a contagem de curtidas (públicas, como o álbum)
create policy "Anyone can view likes"
on likes
for select
to anon
using (true);

-- Convidados NÃO podem excluir curtidas (evita manipulação da contagem)

-- Administrador: mesmo padrão já usado em `photos` e `comments`
create policy "Admins can view likes"
on likes
for select
to authenticated
using (true);

create policy "Admins can delete likes"
on likes
for delete
to authenticated
using (true);
