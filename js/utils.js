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
// Guardamos { photoId: likeRowId } para saber exatamente qual linha da
// tabela `likes` apagar quando o convidado descurtir. Não é um mecanismo
// de segurança — é só a interface lembrar o que esse navegador já curtiu.
const LIKED_PHOTOS_KEY = "sofia18-liked-photos";

function readLikedMap() {
  try {
    const raw = localStorage.getItem(LIKED_PHOTOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLikedMap(map) {
  try {
    localStorage.setItem(LIKED_PHOTOS_KEY, JSON.stringify(map));
  } catch {
    // Se o localStorage falhar (modo privado, cota cheia etc.), a curtida
    // já foi salva/removida no banco — só perdemos a marcação visual local.
  }
}

export function getLikedPhotosMap() {
  return readLikedMap();
}

export function saveLikedPhoto(photoId, likeRowId) {
  const map = readLikedMap();
  map[photoId] = likeRowId;
  writeLikedMap(map);
}

export function removeLikedPhoto(photoId) {
  const map = readLikedMap();
  delete map[photoId];
  writeLikedMap(map);
}
