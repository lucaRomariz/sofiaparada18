// ============================================================
// SOFIA 18 — Configurações centralizadas
// ============================================================
// Este arquivo concentra tudo que antes estaria espalhado pelo
// código: credenciais públicas do Supabase, regras de upload e
// informações do evento. Nada aqui é secreto — a anon key do
// Supabase é feita para rodar no navegador, desde que as
// políticas de RLS estejam corretas (já revisamos e confirmamos).
//
// NUNCA coloque a SUPABASE_SERVICE_ROLE_KEY neste arquivo.
// ============================================================

// --- Supabase -------------------------------------------------
export const SUPABASE_URL = "https://jjctwvkwtofuflktoaxb.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqY3R3dmt3dG9mdWZsa3RvYXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MDk3NDcsImV4cCI6MjEwMzI4NTc0N30.7yzb4n3yOUzbigU3nsV2X2Riuw7wwajwzq7wcqkyhMk";

// --- Regras de upload ------------------------------------------
export const UPLOAD_CONFIG = {
  maxFiles: 10,
  maxFileSize: 10 * 1024 * 1024, // 10 MB por arquivo
  allowedTypes: ["image/jpeg", "image/png", "image/webp"],
  maxImageWidth: 1920,
  maxImageHeight: 1920,
  imageQuality: 0.82,
  storagePrefix: "2026/sofia-18", // pasta dentro do bucket "photos"
};

// --- Informações do evento --------------------------------------
export const EVENT_INFO = {
  guestOfHonor: "Sofia Parada",
  age: 18,
  eventDateISO: "2026-09-12",
  eventDateDisplay: "12 DE SETEMBRO DE 2026",
  domain: "sofiaparada18.vercel.app",
  messages: {
    hero: "Você foi convidado para guardar os momentos desta noite.",
    upload: "Escolha as fotos que mostram como foi essa noite pela sua lente.",
    success:
      "Obrigada por fazer parte da noite da Sofia. Suas fotos já estão no álbum!",
  },
  // --- Fotos da Sofia usadas na Home --------------------------
  // Basta salvar um arquivo com o nome exato em assets/images/sofia/
  // que ele aparece automaticamente — não precisa mexer em código.
  // Enquanto o arquivo não existir, o espaço mostra um estado
  // vazio estilizado (ver .home-photo-frame--empty em home.css).
  heroPhoto: "assets/images/sofia/foto-principal.jpeg",
  // Cartão fotomatic da esquerda (fica atrás do ticket, no desktop)
  galleryPhotosLeft: [
    "assets/images/sofia/foto-01.jpeg",
    "assets/images/sofia/foto-02.jpeg",
    "assets/images/sofia/foto-03.jpg",
  ],
  // Cartão fotomatic da direita
  galleryPhotosRight: [
    "assets/images/sofia/foto-04.jpeg",
    "assets/images/sofia/foto-05.jpg",
    "assets/images/sofia/foto-06.jpeg",
  ],
};

// --- Desafios (caça ao tesouro fotográfico) --------------------------
// Lista estática — vem da planilha de desafios da festa. Cada foto
// enviada pode (opcionalmente) ser associada a um destes desafios via
// photos.challenge_id (ver supabase/004_challenge_id.sql).
export const CHALLENGES = [
  { id: 1, label: "Tire uma foto simulando um fundamento do futevôlei com a Sofia" },
  { id: 2, label: "Tire uma foto mostrando o muque com a Sofia" },
  { id: 3, label: "Tire uma foto com a pessoa mais bem vestida da festa" },
  { id: 4, label: "Tire uma foto com alguém que vc não via a um ano" },
  { id: 5, label: "Tire uma foto com as três gerações da família da Sofia" },
  { id: 6, label: "Tire uma foto com alguém que está de animal print" },
  { id: 7, label: "Tire uma foto de galera que ninguém pode estar sorrindo" },
  { id: 8, label: "Tire uma foto da Sofia quando ela voltar com outra roupa 🤫" },
  { id: 9, label: "Encontre a Sofia e tire uma foto com ela sem avisar" },
  { id: 10, label: "Tire uma foto da Sofia quando começar o pagode" },
  { id: 11, label: "Tire uma foto fingindo que vcs são da banda de pagode" },
  { id: 12, label: "Tire uma foto da Sofia conversando" },
  { id: 13, label: "Tire uma foto da Sofia dando risada" },
  { id: 14, label: "Tire uma foto da Sofia abraçando alguém" },
  { id: 15, label: "Tire uma foto da Sofia dançando" },
  { id: 16, label: "Tire uma foto da Sofia ouvindo uma fofoca" },
  { id: 17, label: "Tire uma foto com quem vacilou no dress code" },
  { id: 18, label: "Tire uma foto da Sofia virando um shot" },
  { id: 19, label: "Reproduza uma foto que vc já tem com a Sofia" },
  { id: 20, label: "Tire uma foto vc a Sofia e uma foto que vc aparece no mural" },
  { id: 21, label: "Tire uma foto da Sofia e a galera do judô" },
  { id: 22, label: "Tire uma foto da Sofia e a galera do futevôlei" },
  { id: 23, label: "Tire uma foto da Sofia e a galera ex serios" },
  { id: 24, label: "Tire uma foto com alguém da família da Sofia" },
  { id: 25, label: "Tire uma foto com alguém que tem mais de 3 mil seguidores" },
  { id: 26, label: "Tire uma foto da Sofia dançando forró com alguém" },
  { id: 27, label: "Tire uma foto com a Sofia fazendo careta" },
  { id: 28, label: "Tire uma foto tirando a Sofia do chão" },
  { id: 29, label: "Tire uma foto fazendo um golpe de judô na Sofia" },
  { id: 30, label: "Tire uma foto com cinco amigos" },
  { id: 31, label: "Tire uma foto com quatro amigos" },
  { id: 32, label: "Tire uma foto com três amigos" },
  { id: 33, label: "Tire uma foto com seis amigos" },
  { id: 34, label: "Tire uma foto com uma pessoa que você não conhece" },
  { id: 35, label: "Tire uma foto da comida mais gostosa da festa" },
  { id: 36, label: "Tire foto do que vc está bebendo" },
  { id: 37, label: "Tire uma foto da pessoa que você acha que vai se divertir mais na festa" },
  { id: 38, label: "Tire uma foto com alguém que queimou a largada (se passou)" },
  { id: 39, label: "Tire uma foto da parte mais legal da decoração" },
  { id: 40, label: "Tire uma foto do casal mais fofo da festa" },
  { id: 41, label: "Tire uma foto com alguém da banda" },
  { id: 42, label: "Tire uma foto com o DJ" },
  { id: 43, label: "Tire uma foto com fotógrafo" },
  { id: 44, label: "Leve uma pessoa que vc acha que combina com a Sofia e tire foto dos dois (não precisa explicar)" },
  { id: 45, label: "Provavelmente tem alguém na festa que não conhece a Sofia (o acompanhante de um convidado...) faça uma foto da Sofia com esse convidado" },
  { id: 46, label: "Faça uma chamada de vídeo com alguém que não conseguiu ir para a festa e tire uma foto com a Sofia" },
  { id: 47, label: "Tire uma foto com a Sofia recriando uma figurinha que ela usa" },
];

