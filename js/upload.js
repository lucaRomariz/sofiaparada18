// ============================================================
// SOFIA 18 — Upload
// Responsável por: formulário, validação, preview, compressão,
// upload para o Storage, gravação na tabela `photos` e feedback.
// ============================================================

import { supabase } from "./supabase.js";
import { UPLOAD_CONFIG, EVENT_INFO, CHALLENGES } from "./config.js";

// --- Elementos ---------------------------------------------------
const form = document.getElementById("upload-form");
const nameInput = document.getElementById("guest-name");
const challengeSelect = document.getElementById("challenge-select");

CHALLENGES.forEach((challenge) => {
  const option = document.createElement("option");
  option.value = challenge.id;
  option.textContent = `${challenge.id}. ${challenge.label}`;
  challengeSelect.appendChild(option);
});
const fileInput = document.getElementById("file-input");
const previewsEl = document.getElementById("upload-previews");
const feedbackEl = document.getElementById("upload-feedback");
const submitBtn = document.getElementById("upload-submit");
const progressEl = document.getElementById("upload-progress");
const progressBarEl = document.getElementById("upload-progress-bar");
const subtitleEl = document.getElementById("upload-subtitle");
const successCheckEl = document.getElementById("upload-success-check");

subtitleEl.textContent = EVENT_INFO.messages.upload;

// --- Animação de sucesso -------------------------------------------
const CONFETTI_COLORS = ["#c41414", "#e01e1e", "#f5f5f0"];

function triggerSuccessAnimation() {
  successCheckEl.classList.remove("upload-success-check--visible");
  // Força reflow para reiniciar a animação se o usuário enviar de novo
  void successCheckEl.offsetWidth;
  successCheckEl.classList.add("upload-success-check--visible");

  const piecesCount = 18;
  for (let i = 0; i < piecesCount; i += 1) {
    const piece = document.createElement("div");
    piece.className = "upload-confetti-piece";
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.backgroundColor =
      CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    piece.style.animationDuration = `${1.1 + Math.random() * 0.8}s`;
    piece.style.animationDelay = `${Math.random() * 0.3}s`;
    if (Math.random() > 0.5) {
      piece.style.transform = "rotate(45deg)"; // metade losango, metade quadrado
    }
    document.body.appendChild(piece);
    piece.addEventListener("animationend", () => piece.remove());
  }
}

// --- Estado --------------------------------------------------------
// Guardamos os arquivos num array próprio (não a FileList nativa)
// porque precisamos remover itens individualmente antes do envio.
let selectedFiles = [];
let isSubmitting = false;

// --- Utilitários de feedback ----------------------------------------
function setFeedback(message, type = "") {
  feedbackEl.textContent = message;
  feedbackEl.className = "upload-feedback" + (type ? ` upload-feedback--${type}` : "");
}

function setProgress(current, total) {
  if (total === 0) {
    progressEl.classList.remove("upload-progress--visible");
    return;
  }
  progressEl.classList.add("upload-progress--visible");
  const percent = Math.round((current / total) * 100);
  progressBarEl.style.width = `${percent}%`;
  setFeedback(`Enviando... ${current} de ${total} fotos`);
}

// --- Seleção de arquivos ---------------------------------------------
fileInput.addEventListener("change", () => {
  const incoming = Array.from(fileInput.files || []);
  fileInput.value = ""; // permite selecionar o mesmo arquivo de novo depois de remover

  const combined = [...selectedFiles, ...incoming];

  if (combined.length > UPLOAD_CONFIG.maxFiles) {
    setFeedback(
      `Você pode enviar no máximo ${UPLOAD_CONFIG.maxFiles} fotos por vez.`,
      "error"
    );
    return;
  }

  const invalidType = incoming.find((f) => !UPLOAD_CONFIG.allowedTypes.includes(f.type));
  if (invalidType) {
    setFeedback(`Este tipo de arquivo não é aceito: ${invalidType.name}`, "error");
    return;
  }

  const tooLarge = incoming.find((f) => f.size > UPLOAD_CONFIG.maxFileSize);
  if (tooLarge) {
    const maxMb = UPLOAD_CONFIG.maxFileSize / (1024 * 1024);
    setFeedback(`"${tooLarge.name}" é maior que ${maxMb}MB.`, "error");
    return;
  }

  setFeedback("");
  selectedFiles = combined;
  renderPreviews();
});

// --- Prévias ------------------------------------------------------
function renderPreviews() {
  previewsEl.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const url = URL.createObjectURL(file);

    const wrapper = document.createElement("div");
    wrapper.className = "upload-preview";

    const img = document.createElement("img");
    img.src = url;
    img.alt = `Prévia ${index + 1}`;
    img.onload = () => URL.revokeObjectURL(url);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "upload-preview__remove";
    removeBtn.setAttribute("aria-label", "Remover foto");
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", () => {
      selectedFiles.splice(index, 1);
      renderPreviews();
    });

    wrapper.appendChild(img);
    wrapper.appendChild(removeBtn);
    previewsEl.appendChild(wrapper);
  });
}

// --- Compressão de imagem (Canvas) ------------------------------------
function compressImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;
      const { maxImageWidth, maxImageHeight, imageQuality } = UPLOAD_CONFIG;

      if (width > maxImageWidth || height > maxImageHeight) {
        const ratio = Math.min(maxImageWidth / width, maxImageHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("compress-failed"));
          }
        },
        "image/jpeg",
        imageQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("read-failed"));
    };

    img.src = objectUrl;
  });
}

// --- Envio de um único arquivo -----------------------------------------
async function uploadOnePhoto(file, guestName, challengeId) {
  const compressedBlob = await compressImage(file);
  const uniqueId = crypto.randomUUID();
  const filePath = `${UPLOAD_CONFIG.storagePrefix}/${uniqueId}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(filePath, compressedBlob, {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { error: insertError } = await supabase
    .from("photos")
    .insert({ name: guestName, file_path: filePath, challenge_id: challengeId });

  if (insertError) {
    throw insertError;
  }
}

// --- Envio do formulário -------------------------------------------------
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (isSubmitting) return;

  const guestName = nameInput.value.trim();
  const challengeId = challengeSelect.value ? Number(challengeSelect.value) : null;

  if (!guestName) {
    setFeedback("Digite seu nome antes de enviar.", "error");
    nameInput.focus();
    return;
  }

  if (selectedFiles.length === 0) {
    setFeedback("Selecione ao menos uma foto.", "error");
    return;
  }

  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";
  successCheckEl.classList.remove("upload-success-check--visible");

  const total = selectedFiles.length;
  let sentCount = 0;
  setProgress(sentCount, total);

  try {
    for (const file of selectedFiles) {
      await uploadOnePhoto(file, guestName, challengeId);
      sentCount += 1;
      setProgress(sentCount, total);
    }

    setFeedback(EVENT_INFO.messages.success, "success");
    setProgress(0, 0);
    triggerSuccessAnimation();
    selectedFiles = [];
    renderPreviews();
    form.reset();
  } catch (err) {
    // Nunca expor o erro técnico bruto para o convidado (ex: PostgrestError).
    console.error("Erro no upload:", err);
    setProgress(0, 0);
    setFeedback(
      "Não foi possível enviar suas fotos. Verifique sua conexão e tente novamente.",
      "error"
    );
  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar fotos";
  }
});
