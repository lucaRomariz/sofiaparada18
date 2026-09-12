// ============================================================
// SOFIA 18 — Utilitários compartilhados
// Evita duplicar getPhotoUrl/formatDateTime/safeFileName entre
// album.js, admin.js e upload.js.
// ============================================================

import { supabase } from "./supabase.js";

export function getPhotoUrl(filePath) {
  const { data } = supabase.storage.from("photos").getPublicUrl(filePath);
  return data.publicUrl;
}

export function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function safeFileName(name, id) {
  const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `sofia-18-${cleanName}-${id.slice(0, 8)}.jpg`;
}

// --- Curtidas (localStorage do navegador do convidado) --------------------
// Não é um mecanismo de segurança — é só para a interface não deixar a
// mesma pessoa curtir a mesma foto várias vezes por engano no mesmo aparelho.
const LIKED_PHOTOS_KEY = "sofia18-liked-photos";

export function getLikedPhotoIds() {
  try {
    const raw = localStorage.getItem(LIKED_PHOTOS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function markPhotoAsLiked(photoId) {
  const liked = getLikedPhotoIds();
  liked.add(photoId);
  try {
    localStorage.setItem(LIKED_PHOTOS_KEY, JSON.stringify([...liked]));
  } catch {
    // Se o localStorage falhar (modo privado, cota cheia etc.), a curtida
    // já foi salva no banco — só perdemos a marcação visual local.
  }
}
