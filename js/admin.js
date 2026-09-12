// ============================================================
// SOFIA 18 — Admin
// Responsável por: login, sessão, dashboard, exclusão de fotos
// (arquivo + registro), moderação de comentários e download
// individual/em lote.
// ============================================================

import { supabase } from "./supabase.js";
import { getPhotoUrl, formatDateTime, safeFileName } from "./utils.js";

// --- Elementos ---------------------------------------------------
const loginSection = document.getElementById("admin-login");
const dashboardSection = document.getElementById("admin-dashboard");

const loginForm = document.getElementById("admin-login-form");
const emailInput = document.getElementById("admin-email");
const passwordInput = document.getElementById("admin-password");
const loginErrorEl = document.getElementById("admin-login-error");
const loginSubmitBtn = document.getElementById("admin-login-submit");

const logoutBtn = document.getElementById("admin-logout");
const toastEl = document.getElementById("admin-toast");

const statTotalPhotosEl = document.getElementById("stat-total-photos");
const statTotalPeopleEl = document.getElementById("stat-total-people");
const statTotalCommentsEl = document.getElementById("stat-total-comments");
const statTotalLikesEl = document.getElementById("stat-total-likes");

const gridEl = document.getElementById("admin-grid");
const commentsListEl = document.getElementById("admin-comments-list");
const downloadAllBtn = document.getElementById("admin-download-all");
const downloadAllStatusEl = document.getElementById("admin-download-all-status");

let photosCache = [];

function showToast(message) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  // Reinicia a animação caso o toast já tenha sido exibido antes
  toastEl.style.animation = "none";
  void toastEl.offsetWidth;
  toastEl.style.animation = "";
  toastEl.addEventListener(
    "animationend",
    () => {
      toastEl.hidden = true;
    },
    { once: true }
  );
}

// --- Sessão / autenticação -----------------------------------------------
async function checkSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    showDashboard();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginSection.hidden = false;
  dashboardSection.hidden = true;
}

function showDashboard() {
  loginSection.hidden = true;
  dashboardSection.hidden = false;
  loadDashboard();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginErrorEl.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  loginSubmitBtn.disabled = true;
  loginSubmitBtn.textContent = "Entrando...";

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  loginSubmitBtn.disabled = false;
  loginSubmitBtn.textContent = "Entrar";

  if (error) {
    loginErrorEl.textContent = "E-mail ou senha incorretos.";
    return;
  }

  passwordInput.value = "";
  showDashboard();
  showToast("Login realizado com sucesso. Bem-vinda de volta! ✦");
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  showLogin();
});

// --- Dashboard -------------------------------------------------------------
async function loadDashboard() {
  gridEl.innerHTML = '<p class="admin-loading">Carregando fotos...</p>';
  commentsListEl.innerHTML = '<p class="admin-loading">Carregando comentários...</p>';

  const [photosResult, commentsResult, likesResult] = await Promise.all([
    supabase
      .from("photos")
      .select("id, name, file_path, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("comments")
      .select("id, author_name, message, created_at, photo_id, photos(name, file_path)")
      .order("created_at", { ascending: false }),
    supabase.from("likes").select("id"),
  ]);

  if (photosResult.error) {
    console.error("Erro ao carregar fotos:", photosResult.error);
    gridEl.innerHTML = '<p class="admin-loading">Não foi possível carregar as fotos.</p>';
    return;
  }

  photosCache = photosResult.data || [];

  const comments = commentsResult.error ? [] : commentsResult.data || [];
  if (commentsResult.error) {
    console.error("Erro ao carregar comentários:", commentsResult.error);
    commentsListEl.innerHTML =
      '<p class="admin-loading">Não foi possível carregar os comentários.</p>';
  } else {
    renderComments(comments);
  }

  const totalLikes = likesResult.error ? 0 : (likesResult.data || []).length;

  renderStats(comments.length, totalLikes);
  renderGrid();
}

function renderStats(totalComments, totalLikes) {
  statTotalPhotosEl.textContent = photosCache.length;

  const uniquePeople = new Set(photosCache.map((p) => p.name.trim().toLowerCase()));
  statTotalPeopleEl.textContent = uniquePeople.size;

  statTotalCommentsEl.textContent = totalComments;
  statTotalLikesEl.textContent = totalLikes;
}

function renderGrid() {
  gridEl.innerHTML = "";

  if (photosCache.length === 0) {
    gridEl.innerHTML = '<p class="admin-loading">Nenhuma foto enviada ainda.</p>';
    return;
  }

  photosCache.forEach((photo) => {
    gridEl.appendChild(buildPhotoCard(photo));
  });
}

function renderComments(comments) {
  commentsListEl.innerHTML = "";

  if (comments.length === 0) {
    commentsListEl.innerHTML = '<p class="admin-loading">Nenhum comentário ainda.</p>';
    return;
  }

  comments.forEach((comment) => {
    const item = document.createElement("div");
    item.className = "admin-comment";

    const thumb = document.createElement("img");
    thumb.className = "admin-comment__thumb";
    thumb.alt = "";
    if (comment.photos?.file_path) {
      thumb.src = getPhotoUrl(comment.photos.file_path);
    }

    const body = document.createElement("div");
    body.className = "admin-comment__body";

    const author = document.createElement("p");
    author.className = "admin-comment__author";
    author.textContent = `${comment.author_name} → foto de ${comment.photos?.name || "?"}`;

    const text = document.createElement("p");
    text.className = "admin-comment__text";
    text.textContent = comment.message;

    const date = document.createElement("p");
    date.className = "admin-comment__date";
    date.textContent = formatDateTime(comment.created_at);

    body.appendChild(author);
    body.appendChild(text);
    body.appendChild(date);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "btn btn--filled admin-comment__delete";
    deleteBtn.textContent = "Excluir";
    deleteBtn.addEventListener("click", () => deleteComment(comment.id, item));

    item.appendChild(thumb);
    item.appendChild(body);
    item.appendChild(deleteBtn);
    commentsListEl.appendChild(item);
  });
}

async function deleteComment(commentId, itemEl) {
  const confirmed = confirm("Excluir este comentário? Essa ação não pode ser desfeita.");
  if (!confirmed) return;

  itemEl.style.opacity = "0.4";

  const { error } = await supabase.from("comments").delete().eq("id", commentId);

  if (error) {
    console.error("Erro ao excluir comentário:", error);
    alert("Não foi possível excluir o comentário. Tente novamente.");
    itemEl.style.opacity = "1";
    return;
  }

  itemEl.remove();
  statTotalCommentsEl.textContent = Math.max(0, Number(statTotalCommentsEl.textContent) - 1);

  if (commentsListEl.children.length === 0) {
    commentsListEl.innerHTML = '<p class="admin-loading">Nenhum comentário ainda.</p>';
  }
}

function buildPhotoCard(photo) {
  const card = document.createElement("div");
  card.className = "admin-card";

  const imageWrap = document.createElement("div");
  imageWrap.className = "admin-card__image";
  const img = document.createElement("img");
  img.src = getPhotoUrl(photo.file_path);
  img.alt = `Foto enviada por ${photo.name}`;
  img.loading = "lazy";
  imageWrap.appendChild(img);

  const meta = document.createElement("div");
  meta.className = "admin-card__meta";
  const nameEl = document.createElement("p");
  nameEl.className = "admin-card__name";
  nameEl.textContent = photo.name;
  const dateEl = document.createElement("p");
  dateEl.className = "admin-card__date";
  dateEl.textContent = formatDateTime(photo.created_at);
  meta.appendChild(nameEl);
  meta.appendChild(dateEl);

  const actions = document.createElement("div");
  actions.className = "admin-card__actions";

  const downloadBtn = document.createElement("button");
  downloadBtn.type = "button";
  downloadBtn.className = "btn";
  downloadBtn.textContent = "Baixar";
  downloadBtn.addEventListener("click", () => downloadPhoto(photo, downloadBtn));

  const deleteBtn = document.createElement("button");
  deleteBtn.type = "button";
  deleteBtn.className = "btn btn--filled";
  deleteBtn.textContent = "Excluir";
  deleteBtn.addEventListener("click", () => deletePhoto(photo, card));

  actions.appendChild(downloadBtn);
  actions.appendChild(deleteBtn);

  card.appendChild(imageWrap);
  card.appendChild(meta);
  card.appendChild(actions);

  return card;
}

// --- Download individual -----------------------------------------------
async function downloadPhoto(photo, buttonEl) {
  const originalText = buttonEl.textContent;
  buttonEl.disabled = true;
  buttonEl.textContent = "...";

  try {
    const response = await fetch(getPhotoUrl(photo.file_path));
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = safeFileName(photo.name, photo.id);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (err) {
    console.error("Erro ao baixar foto:", err);
    alert("Não foi possível baixar esta foto. Tente novamente.");
  } finally {
    buttonEl.disabled = false;
    buttonEl.textContent = originalText;
  }
}

// --- Download em lote (.zip) ---------------------------------------------
downloadAllBtn.addEventListener("click", async () => {
  if (photosCache.length === 0) return;

  downloadAllBtn.disabled = true;

  try {
    const { default: JSZip } = await import("https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm");
    const zip = new JSZip();

    for (let i = 0; i < photosCache.length; i += 1) {
      const photo = photosCache[i];
      downloadAllStatusEl.textContent = `Baixando ${i + 1} de ${photosCache.length}...`;

      const response = await fetch(getPhotoUrl(photo.file_path));
      const blob = await response.blob();
      zip.file(safeFileName(photo.name, photo.id), blob);
    }

    downloadAllStatusEl.textContent = "Compactando...";
    const content = await zip.generateAsync({ type: "blob" });

    const objectUrl = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "sofia-18-fotos.zip";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);

    downloadAllStatusEl.textContent = "";
  } catch (err) {
    console.error("Erro ao gerar .zip:", err);
    downloadAllStatusEl.textContent = "Não foi possível gerar o arquivo .zip.";
  } finally {
    downloadAllBtn.disabled = false;
  }
});

// --- Exclusão --------------------------------------------------------------
async function deletePhoto(photo, cardEl) {
  const confirmed = confirm(
    `Excluir a foto enviada por ${photo.name}? Essa ação não pode ser desfeita.`
  );
  if (!confirmed) return;

  cardEl.style.opacity = "0.4";
  cardEl.style.pointerEvents = "none";

  // 1. Remove o arquivo do Storage
  const { error: storageError } = await supabase.storage
    .from("photos")
    .remove([photo.file_path]);

  if (storageError) {
    console.error("Erro ao excluir arquivo:", storageError);
    alert("Não foi possível excluir o arquivo. Tente novamente.");
    cardEl.style.opacity = "1";
    cardEl.style.pointerEvents = "auto";
    return;
  }

  // 2. Remove o registro da tabela `photos`.
  // Os comentários e curtidas dessa foto são removidos automaticamente
  // pelo "on delete cascade" nas foreign keys de `comments.photo_id`
  // e `likes.photo_id`.
  const { error: dbError } = await supabase.from("photos").delete().eq("id", photo.id);

  if (dbError) {
    console.error("Erro ao excluir registro:", dbError);
    alert(
      "O arquivo foi removido, mas houve um erro ao remover o registro. Atualize a página."
    );
    cardEl.style.opacity = "1";
    cardEl.style.pointerEvents = "auto";
    return;
  }

  photosCache = photosCache.filter((p) => p.id !== photo.id);
  renderStats(
    Number(statTotalCommentsEl.textContent) || 0,
    Number(statTotalLikesEl.textContent) || 0
  );
  cardEl.remove();

  if (photosCache.length === 0) {
    gridEl.innerHTML = '<p class="admin-loading">Nenhuma foto enviada ainda.</p>';
  }
}

// --- Início ------------------------------------------------------------------
checkSession();
