-- ============================================================
-- SOFIA 18 — Migration: tabela de comentários públicos
-- Rodar no SQL Editor do Supabase
-- ============================================================

create table comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  author_name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table comments enable row level security;

-- Convidados podem comentar
create policy "Guests can insert comments"
on comments
for insert
to anon
with check (true);

-- Qualquer um pode ler os comentários (públicos, como o álbum)
create policy "Anyone can view comments"
on comments
for select
to anon
using (true);

-- Convidados NÃO podem excluir comentários (moderação fica só com admin)

-- Administrador: acesso completo, mesmo padrão já usado em `photos`
create policy "Admins can view comments"
on comments
for select
to authenticated
using (true);

create policy "Admins can insert comments"
on comments
for insert
to authenticated
with check (true);

create policy "Admins can delete comments"
on comments
for delete
to authenticated
using (true);
