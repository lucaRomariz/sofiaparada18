-- ============================================================
-- SOFIA 18 — Migration: desafios (caça ao tesouro fotográfico)
-- Rodar no SQL Editor do Supabase
-- ============================================================

-- challenge_id é opcional (nullable): nem toda foto precisa estar
-- associada a um desafio. A lista de desafios em si vive no código
-- (js/config.js CHALLENGES), não em uma tabela própria — é conteúdo
-- estático definido antes da festa, sem necessidade de edição via
-- banco de dados.
alter table photos
  add column if not exists challenge_id integer;

comment on column photos.challenge_id is
  'Referência opcional a um item de EVENT_INFO.CHALLENGES (js/config.js). Não é uma foreign key porque a lista de desafios é estática, definida no frontend.';
