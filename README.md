# Sofia 18 — Álbum Colaborativo de Fotos

Aplicação web para o aniversário de 18 anos da Sofia Parada, em **12 de setembro de 2026**.

Convidados escaneiam um QR Code, enviam fotos da festa e visualizam um álbum colaborativo — tudo pelo navegador, sem criar conta.

## Stack

- HTML5 + CSS3 + JavaScript moderno (sem framework)
- [Supabase](https://supabase.com) — PostgreSQL, Storage e Authentication
- [Vercel](https://vercel.com) — hospedagem

## Estrutura

```
sofia-18/
├── index.html      → Home (identidade visual + acesso)
├── upload.html     → Envio de fotos pelo convidado
├── album.html      → Álbum público colaborativo
├── admin.html      → Painel administrativo (login necessário)
│
├── css/            → Design system e estilos por página
├── js/             → Lógica de cada página + cliente Supabase
└── assets/
    ├── references/ → Convite oficial (fonte de verdade visual)
    ├── images/     → Fotos da Sofia (se usadas)
    ├── icons/      → Ícones SVG
    └── fonts/      → Fontes locais, se houver
```

## Configuração local

1. Preencha `js/config.js` com a URL e a `anon key` do projeto Supabase (não é secreta, mas depende das políticas de RLS estarem corretas).
2. Nunca coloque a `service_role key` neste projeto — ela nunca deve chegar ao navegador.
3. Abra `index.html` com um servidor local (ex: extensão Live Server) — módulos ES exigem `http://`, não `file://`.

## Banco de dados (Supabase)

Tabela `photos`: `id` (uuid), `name` (text), `file_path` (text), `created_at` (timestamptz).

Bucket de Storage: `photos` (público para leitura).

## Deploy

GitHub → Vercel. Variáveis de ambiente configuradas no painel da Vercel (não versionadas).

## Status

Em desenvolvimento — construção por fases (Vibe Coding orientado por especificação).
