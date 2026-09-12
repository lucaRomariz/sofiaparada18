// ============================================================
// SOFIA 18 — Álbum
// Responsável por: buscar fotos, montar a galeria, filtrar por
// desafio, ordenar (recentes/antigas/curtidas), abrir o modal com
// nome/horário/desafio de quem enviou, curtidas e comentários.
// ============================================================

import { supabase } from "./supabase.js";
import { CHALLENGES } from "./config.js";
import {
  getPhotoUrl,
  formatDateTime,
  getLikedPhotoIds,
  markPhotoAsLiked,
} from "./utils.js";

// --- Elementos ---------------------------------------------------
const galleryEl = document.getElementById("album-gallery");
const emptyEl = document.getElementById("album-empty");
const filterChallengeEl = document.getElementById("filter-challenge");
const sortOrderEl = document.getElementById("sort-order");

const modalEl = document.getElementById("photo-modal");
const modalBackdropEl = document.getElementById("modal-backdrop");
const modalCloseEl = document.getElementById("modal-close");
const modalImageEl = document.getElementById("modal-image");
const modalNameEl = document.getElementById("modal-name");
const modalDateEl = document.getElementById("modal-date");
const modalChallengeEl = document.getElementById("modal-challenge");
const modalLikeBtn = document.getElementById("modal-like-btn");
const modalLikeCountEl = document.getElementById("modal-like-count");

const commentsListEl = document.getElementById("modal-comments-list");
const commentFormEl = document.getElementById("modal-comment-form");
const commentNameInput = document.getElementById("comment-name");
const commentMessageInput = document.getElementById("comment-message");

let currentPhotoId = null;
let allPhotos = [];
let likeCounts = {};
let commentCounts = {};
const likedByMe = getLikedPhotoIds();

const CHALLENGES_BY_ID = new Map(CHALLENGES.map((c) => [c.id, c]));

// --- Filtro de desafio: populado só com desafios que têm foto -------------
function populateChallengeFilter(photos) {
  const usedIds = new Set(
    photos.map((p) => p.challenge_id).filter((id) => id !== null && id !== undefined)
  );

  filterChallengeEl.innerHTML = '<option value="">Todos os desafios</option>';

  CHALLENGES.filter((c) => usedIds.has(c.id))
    .sort((a, b) => a.id - b.id)
    .forEach((challenge) => {
      const option = document.createElement("option");
      option.value = challenge.id;
      option.textContent = `${challenge.id}. ${challenge.label}`;
      filterChallengeEl.appendChild(option);
    });
}

// --- Carregar fotos ----------------------------------------------------
async function loadPhotos() {
  const { data, error } = await supabase
    .from("photos")
    .select("id, name, file_path, created_at, challenge_id")
    .order("created_at", { ascending: false });

  const loadingEl = document.getElementById("album-loading");
  if (loadingEl) loadingEl.remove();

  if (error) {
    console.error("Erro ao carregar álbum:", error);
    emptyEl.hidden = false;
    emptyEl.textContent =
      "Não foi possível carregar o álbum agora. Tente novamente em instantes.";
    return;
  }

  if (!data || data.length === 0) {
    emptyEl.hidden = false;
    return;
  }

  emptyEl.hidden = true;
  allPhotos = data;

  const [loadedCommentCounts, loadedLikeCounts] = await Promise.all([
    loadCounts("comments"),
    loadCounts("likes"),
  ]);
  commentCounts = loadedCommentCounts;
  likeCounts = loadedLikeCounts;

  populateChallengeFilter(allPhotos);
  renderGallery();
}

// Busca todos os photo_id de uma tabela (comments ou likes) e conta
// ocorrências no cliente — mais simples que agregação no banco para o
// volume esperado de um álbum de festa.
async function loadCounts(table) {
  const { data, error } = await supabase.from(table).select("photo_id");

  if (error) {
    console.error(`Erro ao carregar contagem de ${table}:`, error);
    return {};
  }

  const counts = {};
  (data || []).forEach((row) => {
    counts[row.photo_id] = (counts[row.photo_id] || 0) + 1;
  });
  return counts;
}

// --- Filtro + ordenação + render ------------------------------------------
function getFilteredSortedPhotos() {
  const challengeFilter = filterChallengeEl.value;
  const sortMode = sortOrderEl.value;

  let list = allPhotos;

  if (challengeFilter) {
    const challengeId = Number(challengeFilter);
    list = list.filter((p) => p.challenge_id === challengeId);
  }

  list = [...list];

  if (sortMode === "oldest") {
    list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (sortMode === "likes") {
    list.sort((a, b) => (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0));
  } else {
    // "recent" (padrão): já vem ordenado por created_at desc do Supabase,
    // mas reordenamos aqui também para garantir consistência após filtrar.
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return list;
}

function renderGallery() {
  const photos = getFilteredSortedPhotos();

  galleryEl.innerHTML = "";

  if (photos.length === 0) {
    const msg = document.createElement("p");
    msg.className = "album-empty";
    msg.textContent = "Nenhuma foto encontrada para esse desafio ainda.";
    galleryEl.appendChild(msg);
    return;
  }

  photos.forEach((photo, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "album-item album-item--enter";
    item.style.animationDelay = `${Math.min(index, 20) * 35}ms`;
    item.dataset.photoId = photo.id;

    const img = document.createElement("img");
    img.src = getPhotoUrl(photo.file_path);
    img.alt = `Foto enviada por ${photo.name}`;
    img.loading = "lazy";

    const caption = document.createElement("div");
    caption.className = "album-item__caption";

    const nameEl = document.createElement("span");
    nameEl.className = "album-item__name";
    nameEl.textContent = photo.name;

    const timeEl = document.createElement("span");
    timeEl.className = "album-item__time";
    timeEl.textContent = formatDateTime(photo.created_at);

    caption.appendChild(nameEl);
    caption.appendChild(timeEl);

    item.appendChild(img);
    item.appendChild(caption);

    const commentCount = commentCounts[photo.id] || 0;
    if (commentCount > 0) {
      const badge = document.createElement("span");
      badge.className = "album-item__comment-badge";
      badge.textContent = commentCount;
      item.appendChild(badge);
    }

    const likeCount = likeCounts[photo.id] || 0;
    if (likeCount > 0) {
      const likeBadge = document.createElement("span");
      likeBadge.className = "album-item__like-badge";
      likeBadge.textContent = likeCount;
      item.appendChild(likeBadge);
    }

    item.addEventListener("click", () => openModal(photo));
    galleryEl.appendChild(item);
  });
}

filterChallengeEl.addEventListener("change", renderGallery);
sortOrderEl.addEventListener("change", renderGallery);

// --- Curtidas --------------------------------------------------------------
function updateLikeButtonUI(photoId) {
  const count = likeCounts[photoId] || 0;
  const isLiked = likedByMe.has(photoId);

  modalLikeCountEl.textContent = count;
  modalLikeBtn.classList.toggle("modal__like-btn--liked", isLiked);
  modalLikeBtn.disabled = isLiked;
}

function updateGridLikeBadge(photoId) {
  const item = [...galleryEl.children].find(
    (el) => el.dataset && el.dataset.photoId === photoId
  );
  if (!item) return;

  let badge = item.querySelector(".album-item__like-badge");
  const count = likeCounts[photoId] || 0;

  if (count > 0 && !badge) {
    badge = document.createElement("span");
    badge.className = "album-item__like-badge";
    item.appendChild(badge);
  }
  if (badge) badge.textContent = count;
}

modalLikeBtn.addEventListener("click", async () => {
  if (!currentPhotoId || likedByMe.has(currentPhotoId)) return;

  const photoId = currentPhotoId;
  modalLikeBtn.disabled = true;

  try {
    const { error } = await supabase.from("likes").insert({ photo_id: photoId });

    if (error) {
      console.error("Erro ao curtir (resposta do Supabase):", error);
      modalLikeBtn.disabled = false;
      return;
    }

    markPhotoAsLiked(photoId);
    likedByMe.add(photoId);
    likeCounts[photoId] = (likeCounts[photoId] || 0) + 1;

    updateLikeButtonUI(photoId);
    updateGridLikeBadge(photoId);
    modalLikeBtn.classList.add("modal__like-btn--pulse");
    modalLikeBtn.addEventListener(
      "animationend",
      () => modalLikeBtn.classList.remove("modal__like-btn--pulse"),
      { once: true }
    );
  } catch (err) {
    // Falha de rede/conexão (não uma resposta de erro "normal" da API) —
    // sem isso, o botão ficava desabilitado para sempre e nada acontecia.
    console.error("Erro de conexão ao curtir:", err);
    modalLikeBtn.disabled = false;
  }
});

// --- Modal ---------------------------------------------------------------
async function openModal(photo) {
  currentPhotoId = photo.id;

  modalImageEl.src = getPhotoUrl(photo.file_path);
  modalImageEl.alt = `Foto enviada por ${photo.name}`;
  modalNameEl.textContent = photo.name;
  modalDateEl.textContent = formatDateTime(photo.created_at);

  const challenge = CHALLENGES_BY_ID.get(photo.challenge_id);
  if (challenge) {
    modalChallengeEl.textContent = `Desafio ${challenge.id}: ${challenge.label}`;
    modalChallengeEl.hidden = false;
  } else {
    modalChallengeEl.hidden = true;
  }

  updateLikeButtonUI(photo.id);

  commentsListEl.innerHTML = "";
  commentFormEl.reset();

  modalEl.hidden = false;
  document.body.style.overflow = "hidden";

  await loadComments(photo.id);
}

function closeModal() {
  modalEl.hidden = true;
  document.body.style.overflow = "";
  currentPhotoId = null;
}

modalCloseEl.addEventListener("click", closeModal);
modalBackdropEl.addEventListener("click", closeModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modalEl.hidden) closeModal();
});

// --- Comentários -----------------------------------------------------------
async function loadComments(photoId) {
  const { data, error } = await supabase
    .from("comments")
    .select("author_name, message, created_at")
    .eq("photo_id", photoId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao carregar comentários:", error);
    commentsListEl.innerHTML =
      '<p class="modal__comment-error">Não foi possível carregar os comentários.</p>';
    return;
  }

  renderComments(data || []);
}

function renderComments(comments) {
  commentsListEl.innerHTML = "";

  if (comments.length === 0) {
    commentsListEl.innerHTML =
      '<p class="modal__comment-empty">Nenhum comentário ainda. Seja o primeiro!</p>';
    return;
  }

  comments.forEach((comment) => {
    const item = document.createElement("div");
    item.className = "modal__comment";

    const author = document.createElement("span");
    author.className = "modal__comment-author";
    author.textContent = comment.author_name;

    const text = document.createElement("p");
    text.className = "modal__comment-text";
    text.textContent = comment.message;

    item.appendChild(author);
    item.appendChild(text);
    commentsListEl.appendChild(item);
  });

  commentsListEl.scrollTop = commentsListEl.scrollHeight;
}

commentFormEl.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!currentPhotoId) return;

  const authorName = commentNameInput.value.trim();
  const message = commentMessageInput.value.trim();
  if (!authorName || !message) return;

  const submitBtn = commentFormEl.querySelector("button");
  submitBtn.disabled = true;

  const { error } = await supabase
    .from("comments")
    .insert({ photo_id: currentPhotoId, author_name: authorName, message });

  submitBtn.disabled = false;

  if (error) {
    console.error("Erro ao enviar comentário:", error);
    return;
  }

  commentMessageInput.value = "";
  await loadComments(currentPhotoId);
});

// --- Início ----------------------------------------------------------------
loadPhotos();
