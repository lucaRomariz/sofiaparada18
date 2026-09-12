// ============================================================
// SOFIA 18 — Cliente Supabase
// ============================================================
// Ponto único de inicialização do Supabase. Toda página que
// precisar falar com o banco, storage ou auth deve importar
// o `supabase` exportado aqui — nunca criar um novo client
// solto em outro arquivo.
// ============================================================

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
