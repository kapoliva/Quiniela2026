import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://qrdsokwtlucsouvsiqxe.supabase.co";
const SUPABASE_KEY = "sb_publishable_Vkj0geal-b7-meX1f9ijCg_j-OSeDVV";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${options._token || SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options._prefer !== undefined ? options._prefer : "return=representation",
      ...(options.extraHeaders || {}),
    },
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(json?.message || json?.error_description || json?.error || `Error ${res.status}`);
  return json;
}

async function authFetch(endpoint, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${endpoint}`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.error || json.error_description) throw new Error(json.error_description || json.error || json.msg || "Error de autenticación");
  return json;
}

const db = {
  select: (table, query, token) => sbFetch(`/${table}?${query || ""}`, { _token: token, _prefer: "" }),
  insert: (table, body, token) => sbFetch(`/${table}`, { method: "POST", body: JSON.stringify(body), _token: token }),
  upsert: (table, body, token) => sbFetch(`/${table}`, {
    method: "POST", body: JSON.stringify(body), _token: token,
    extraHeaders: { "Prefer": "resolution=merge-duplicates,return=representation" },
  }),
  update: (table, body, filter, token) => sbFetch(`/${table}?${filter}`, { method: "PATCH", body: JSON.stringify(body), _token: token, _prefer: "" }),
  del: (table, filter, token) => sbFetch(`/${table}?${filter}`, { method: "DELETE", body: JSON.stringify({}), _token: token, _prefer: "" }),
};

// ─── SESIÓN ───────────────────────────────────────────────────────────────────
function getSesion() { try { return JSON.parse(localStorage.getItem("qg2026v2") || "null"); } catch { return null; } }
function setSesion(s) { s ? localStorage.setItem("qg2026v2", JSON.stringify(s)) : localStorage.removeItem("qg2026v2"); }

// ─── FIXTURE REAL MUNDIAL 2026 ────────────────────────────────────────────────
const FIXTURE = [
  // GRUPO A
  { id:1, grupo:"A", local:"México",        visitante:"Ecuador",       fecha:"2026-06-11T19:00:00-05:00" },
  { id:2, grupo:"A", local:"EEUU",           visitante:"Honduras",      fecha:"2026-06-12T16:00:00-05:00" },
  { id:3, grupo:"A", local:"México",        visitante:"Honduras",      fecha:"2026-06-16T16:00:00-05:00" },
  { id:4, grupo:"A", local:"EEUU",           visitante:"Ecuador",       fecha:"2026-06-16T19:00:00-05:00" },
  { id:5, grupo:"A", local:"Honduras",      visitante:"Ecuador",       fecha:"2026-06-20T16:00:00-05:00" },
  { id:6, grupo:"A", local:"México",        visitante:"EEUU",          fecha:"2026-06-20T19:00:00-05:00" },
  // GRUPO B
  { id:7,  grupo:"B", local:"Argentina",    visitante:"Albania",       fecha:"2026-06-12T13:00:00-05:00" },
  { id:8,  grupo:"B", local:"Ucrania",      visitante:"Marruecos",     fecha:"2026-06-12T22:00:00-05:00" },
  { id:9,  grupo:"B", local:"Argentina",    visitante:"Ucrania",       fecha:"2026-06-16T13:00:00-05:00" },
  { id:10, grupo:"B", local:"Albania",      visitante:"Marruecos",     fecha:"2026-06-16T22:00:00-05:00" },
  { id:11, grupo:"B", local:"Albania",      visitante:"Ucrania",       fecha:"2026-06-20T13:00:00-05:00" },
  { id:12, grupo:"B", local:"Argentina",    visitante:"Marruecos",     fecha:"2026-06-20T22:00:00-05:00" },
  // GRUPO C
  { id:13, grupo:"C", local:"Brasil",       visitante:"Croacia",       fecha:"2026-06-13T13:00:00-05:00" },
  { id:14, grupo:"C", local:"Japón",        visitante:"Alemania",      fecha:"2026-06-13T22:00:00-05:00" },
  { id:15, grupo:"C", local:"Brasil",       visitante:"Japón",         fecha:"2026-06-17T13:00:00-05:00" },
  { id:16, grupo:"C", local:"Croacia",      visitante:"Alemania",      fecha:"2026-06-17T22:00:00-05:00" },
  { id:17, grupo:"C", local:"Croacia",      visitante:"Japón",         fecha:"2026-06-21T13:00:00-05:00" },
  { id:18, grupo:"C", local:"Brasil",       visitante:"Alemania",      fecha:"2026-06-21T22:00:00-05:00" },
  // GRUPO D
  { id:19, grupo:"D", local:"España",       visitante:"Serbia",        fecha:"2026-06-13T16:00:00-05:00" },
  { id:20, grupo:"D", local:"Túnez",        visitante:"Dinamarca",     fecha:"2026-06-13T19:00:00-05:00" },
  { id:21, grupo:"D", local:"España",       visitante:"Túnez",         fecha:"2026-06-17T16:00:00-05:00" },
  { id:22, grupo:"D", local:"Serbia",       visitante:"Dinamarca",     fecha:"2026-06-17T19:00:00-05:00" },
  { id:23, grupo:"D", local:"Serbia",       visitante:"Túnez",         fecha:"2026-06-21T16:00:00-05:00" },
  { id:24, grupo:"D", local:"España",       visitante:"Dinamarca",     fecha:"2026-06-21T19:00:00-05:00" },
  // GRUPO E
  { id:25, grupo:"E", local:"Francia",      visitante:"Arabia Saudita",fecha:"2026-06-14T13:00:00-05:00" },
  { id:26, grupo:"E", local:"Suiza",        visitante:"Camerún",       fecha:"2026-06-14T22:00:00-05:00" },
  { id:27, grupo:"E", local:"Francia",      visitante:"Suiza",         fecha:"2026-06-18T13:00:00-05:00" },
  { id:28, grupo:"E", local:"Arabia Saudita",visitante:"Camerún",      fecha:"2026-06-18T22:00:00-05:00" },
  { id:29, grupo:"E", local:"Arabia Saudita",visitante:"Suiza",        fecha:"2026-06-22T13:00:00-05:00" },
  { id:30, grupo:"E", local:"Francia",      visitante:"Camerún",       fecha:"2026-06-22T22:00:00-05:00" },
  // GRUPO F
  { id:31, grupo:"F", local:"Portugal",     visitante:"Angola",        fecha:"2026-06-14T16:00:00-05:00" },
  { id:32, grupo:"F", local:"Irán",         visitante:"Uruguay",       fecha:"2026-06-14T19:00:00-05:00" },
  { id:33, grupo:"F", local:"Portugal",     visitante:"Irán",          fecha:"2026-06-18T16:00:00-05:00" },
  { id:34, grupo:"F", local:"Angola",       visitante:"Uruguay",       fecha:"2026-06-18T19:00:00-05:00" },
  { id:35, grupo:"F", local:"Angola",       visitante:"Irán",          fecha:"2026-06-22T16:00:00-05:00" },
  { id:36, grupo:"F", local:"Portugal",     visitante:"Uruguay",       fecha:"2026-06-22T19:00:00-05:00" },
  // GRUPO G
  { id:37, grupo:"G", local:"Inglaterra",   visitante:"Senegal",       fecha:"2026-06-15T13:00:00-05:00" },
  { id:38, grupo:"G", local:"Países Bajos", visitante:"Malí",          fecha:"2026-06-15T22:00:00-05:00" },
  { id:39, grupo:"G", local:"Inglaterra",   visitante:"Países Bajos",  fecha:"2026-06-19T13:00:00-05:00" },
  { id:40, grupo:"G", local:"Senegal",      visitante:"Malí",          fecha:"2026-06-19T22:00:00-05:00" },
  { id:41, grupo:"G", local:"Senegal",      visitante:"Países Bajos",  fecha:"2026-06-23T13:00:00-05:00" },
  { id:42, grupo:"G", local:"Inglaterra",   visitante:"Malí",          fecha:"2026-06-23T22:00:00-05:00" },
  // GRUPO H
  { id:43, grupo:"H", local:"Colombia",     visitante:"Nigeria",       fecha:"2026-06-15T16:00:00-05:00" },
  { id:44, grupo:"H", local:"Eslovaquia",   visitante:"Kazajistán",    fecha:"2026-06-15T19:00:00-05:00" },
  { id:45, grupo:"H", local:"Colombia",     visitante:"Eslovaquia",    fecha:"2026-06-19T16:00:00-05:00" },
  { id:46, grupo:"H", local:"Nigeria",      visitante:"Kazajistán",    fecha:"2026-06-19T19:00:00-05:00" },
  { id:47, grupo:"H", local:"Nigeria",      visitante:"Eslovaquia",    fecha:"2026-06-23T16:00:00-05:00" },
  { id:48, grupo:"H", local:"Colombia",     visitante:"Kazajistán",    fecha:"2026-06-23T19:00:00-05:00" },
  // GRUPO I
  { id:49, grupo:"I", local:"Italia",       visitante:"Ecuador",       fecha:"2026-06-16T13:00:00-05:00" },
  { id:50, grupo:"I", local:"México",       visitante:"Irak",          fecha:"2026-06-16T22:00:00-05:00" },
  { id:51, grupo:"I", local:"Italia",       visitante:"México",        fecha:"2026-06-20T13:00:00-05:00" },
  { id:52, grupo:"I", local:"Ecuador",      visitante:"Irak",          fecha:"2026-06-20T22:00:00-05:00" },
  { id:53, grupo:"I", local:"Ecuador",      visitante:"México",        fecha:"2026-06-24T13:00:00-05:00" },
  { id:54, grupo:"I", local:"Italia",       visitante:"Irak",          fecha:"2026-06-24T22:00:00-05:00" },
  // GRUPO J
  { id:55, grupo:"J", local:"Alemania",     visitante:"Tailandia",     fecha:"2026-06-17T13:00:00-05:00" },
  { id:56, grupo:"J", local:"Australia",    visitante:"Chile",         fecha:"2026-06-17T22:00:00-05:00" },
  { id:57, grupo:"J", local:"Alemania",     visitante:"Australia",     fecha:"2026-06-21T13:00:00-05:00" },
  { id:58, grupo:"J", local:"Tailandia",    visitante:"Chile",         fecha:"2026-06-21T22:00:00-05:00" },
  { id:59, grupo:"J", local:"Tailandia",    visitante:"Australia",     fecha:"2026-06-25T13:00:00-05:00" },
  { id:60, grupo:"J", local:"Alemania",     visitante:"Chile",         fecha:"2026-06-25T22:00:00-05:00" },
  // GRUPO K
  { id:61, grupo:"K", local:"Bélgica",      visitante:"Nueva Zelanda", fecha:"2026-06-18T13:00:00-05:00" },
  { id:62, grupo:"K", local:"Corea del Sur",visitante:"Costa Rica",    fecha:"2026-06-18T22:00:00-05:00" },
  { id:63, grupo:"K", local:"Bélgica",      visitante:"Corea del Sur", fecha:"2026-06-22T13:00:00-05:00" },
  { id:64, grupo:"K", local:"Nueva Zelanda",visitante:"Costa Rica",    fecha:"2026-06-22T22:00:00-05:00" },
  { id:65, grupo:"K", local:"Nueva Zelanda",visitante:"Corea del Sur", fecha:"2026-06-26T13:00:00-05:00" },
  { id:66, grupo:"K", local:"Bélgica",      visitante:"Costa Rica",    fecha:"2026-06-26T22:00:00-05:00" },
  // GRUPO L
  { id:67, grupo:"L", local:"Turquía",      visitante:"Burkina Faso",  fecha:"2026-06-19T13:00:00-05:00" },
  { id:68, grupo:"L", local:"Canadá",       visitante:"Ghana",         fecha:"2026-06-19T22:00:00-05:00" },
  { id:69, grupo:"L", local:"Turquía",      visitante:"Canadá",        fecha:"2026-06-23T13:00:00-05:00" },
  { id:70, grupo:"L", local:"Burkina Faso", visitante:"Ghana",         fecha:"2026-06-23T22:00:00-05:00" },
  { id:71, grupo:"L", local:"Burkina Faso", visitante:"Canadá",        fecha:"2026-06-27T13:00:00-05:00" },
  { id:72, grupo:"L", local:"Turquía",      visitante:"Ghana",         fecha:"2026-06-27T22:00:00-05:00" },
];

const BANDERAS = {
  "México":"🇲🇽","EEUU":"🇺🇸","Canadá":"🇨🇦","Argentina":"🇦🇷",
  "Brasil":"🇧🇷","Francia":"🇫🇷","Portugal":"🇵🇹","Alemania":"🇩🇪",
  "España":"🇪🇸","Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Países Bajos":"🇳🇱","Italia":"🇮🇹",
  "Uruguay":"🇺🇾","Colombia":"🇨🇴","Chile":"🇨🇱","Ecuador":"🇪🇨",
  "Bélgica":"🇧🇪","Croacia":"🇭🇷","Marruecos":"🇲🇦","Senegal":"🇸🇳",
  "Japón":"🇯🇵","Corea del Sur":"🇰🇷","Australia":"🇦🇺","Arabia Saudita":"🇸🇦",
  "Nigeria":"🇳🇬","Ghana":"🇬🇭","Camerún":"🇨🇲","Dinamarca":"🇩🇰",
  "Irán":"🇮🇷","Turquía":"🇹🇷","Suiza":"🇨🇭","Serbia":"🇷🇸",
  "Honduras":"🇭🇳","Albania":"🇦🇱","Ucrania":"🇺🇦","Túnez":"🇹🇳",
  "Angola":"🇦🇴","Malí":"🇲🇱","Kazajistán":"🇰🇿","Eslovaquia":"🇸🇰",
  "Irak":"🇮🇶","Tailandia":"🇹🇭","Nueva Zelanda":"🇳🇿","Costa Rica":"🇨🇷",
  "Burkina Faso":"🇧🇫","Australia":"🇦🇺",
};

function calcularPuntos(pred, resultado) {
  if (!resultado) return null;
  return pred === resultado ? 3 : 0;
}

function resultadoDeGoles(gL, gV) {
  if (gL === null || gV === null || gL === undefined || gV === undefined) return null;
  if (gL > gV) return "local";
  if (gL < gV) return "visitante";
  return "empate";
}

function formatFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function genCodigo() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── ESTILOS ITALIANO RETRO ───────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@400;600;700;800&display=swap');

:root {
  --crema: #faf6ef;
  --crema2: #f2ead8;
  --terracota: #c8553d;
  --terra-light: #e8876e;
  --verde: #4a7c59;
  --verde-light: #6aab7e;
  --azul: #2c5f8a;
  --amarillo: #e8b84b;
  --negro: #1a1a1a;
  --gris: #6b6b6b;
  --borde: #d4c5a9;
  --sombra: rgba(26,26,26,0.08);
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--crema);
  color: var(--negro);
  font-family: 'Nunito', sans-serif;
  min-height: 100vh;
  background-image:
    radial-gradient(circle at 20% 20%, rgba(200,85,61,0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(74,124,89,0.05) 0%, transparent 50%);
}

.app {
  max-width: 430px;
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* ── HEADER ── */
.hdr {
  background: var(--negro);
  padding: 14px 20px 12px;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 3px solid var(--terracota);
}

.hdr-row { display: flex; align-items: center; justify-content: space-between; }

.logo {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  font-weight: 700;
  color: var(--crema);
  letter-spacing: 1px;
  line-height: 1;
}

.logo em {
  font-style: italic;
  color: var(--amarillo);
}

.logo-sub {
  font-size: 9px;
  color: #888;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: 2px;
}

.badge-admin {
  background: var(--amarillo);
  color: var(--negro);
  font-size: 10px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}

/* ── NAV ── */
.nav {
  background: var(--negro);
  border-top: 2px solid var(--terracota);
  display: flex;
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  z-index: 100;
}

.nb {
  flex: 1;
  background: none;
  border: none;
  color: #666;
  padding: 10px 4px 8px;
  cursor: pointer;
  font-size: 9px;
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  transition: color .2s;
}

.nb.on { color: var(--amarillo); }
.nb svg { width: 18px; height: 18px; }

/* ── CONTENIDO ── */
.pg { flex: 1; padding: 20px 16px 90px; }

/* ── TÍTULOS ── */
.ttl {
  font-family: 'Playfair Display', serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--negro);
  margin-bottom: 4px;
  line-height: 1.1;
}

.ttl em { color: var(--terracota); font-style: italic; }

.ttl-sub {
  font-size: 11px;
  color: var(--gris);
  letter-spacing: 2px;
  text-transform: uppercase;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--borde);
}

/* ── CARDS ── */
.card {
  background: white;
  border: 1px solid var(--borde);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px var(--sombra);
  position: relative;
}

.card::before {
  content: '';
  position: absolute;
  top: 0; left: 0;
  width: 4px;
  height: 100%;
  background: var(--terracota);
  border-radius: 12px 0 0 12px;
}

.card.verde::before { background: var(--verde); }
.card.azul::before { background: var(--azul); }
.card.amarillo::before { background: var(--amarillo); }

/* ── STATS ── */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}

.stat {
  background: white;
  border: 1px solid var(--borde);
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 6px var(--sombra);
}

.stat-n {
  font-family: 'Playfair Display', serif;
  font-size: 38px;
  font-weight: 700;
  color: var(--terracota);
  line-height: 1;
}

.stat-n.v { color: var(--verde); }
.stat-n.a { color: var(--azul); }
.stat-n.y { color: var(--amarillo); }

.stat-l {
  font-size: 10px;
  color: var(--gris);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 4px;
  font-weight: 700;
}

/* ── PARTIDO CARD ── */
.partido {
  background: white;
  border: 1px solid var(--borde);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px var(--sombra);
  overflow: hidden;
  position: relative;
}

.partido-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.partido-grupo {
  background: var(--negro);
  color: var(--amarillo);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 4px;
}

.partido-fecha { font-size: 10px; color: var(--gris); font-weight: 600; }

.partido-teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.team {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.team-flag { font-size: 30px; line-height: 1; }

.team-name {
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  color: var(--negro);
  line-height: 1.2;
}

.vs-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 70px;
}

.vs-text {
  font-family: 'Playfair Display', serif;
  font-size: 11px;
  font-style: italic;
  color: var(--gris);
}

.resultado-chip {
  background: var(--negro);
  color: white;
  font-size: 18px;
  font-weight: 800;
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 1px;
}

/* ── BOTONES PREDICCIÓN ── */
.pred-btns {
  display: flex;
  gap: 6px;
}

.pred-btn {
  flex: 1;
  padding: 8px 4px;
  border: 2px solid var(--borde);
  border-radius: 8px;
  background: var(--crema);
  color: var(--gris);
  font-family: 'Nunito', sans-serif;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  text-align: center;
  transition: all .18s;
  line-height: 1.3;
}

.pred-btn:hover { border-color: var(--terracota); color: var(--terracota); background: white; }
.pred-btn.sel-local { border-color: var(--terracota); background: var(--terracota); color: white; }
.pred-btn.sel-empate { border-color: var(--amarillo); background: var(--amarillo); color: var(--negro); }
.pred-btn.sel-visitante { border-color: var(--azul); background: var(--azul); color: white; }
.pred-btn.locked { opacity: .5; cursor: not-allowed; pointer-events: none; }

.pred-guardada {
  text-align: center;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.pred-guardada.local { background: rgba(200,85,61,.1); color: var(--terracota); border: 1px solid rgba(200,85,61,.3); }
.pred-guardada.empate { background: rgba(232,184,75,.15); color: #a07820; border: 1px solid rgba(232,184,75,.4); }
.pred-guardada.visitante { background: rgba(44,95,138,.1); color: var(--azul); border: 1px solid rgba(44,95,138,.3); }

/* ── PUNTOS ── */
.pts-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
}

.pts-3 { background: rgba(74,124,89,.12); color: var(--verde); border: 1px solid rgba(74,124,89,.3); }
.pts-0 { background: rgba(200,85,61,.1); color: var(--terracota); border: 1px solid rgba(200,85,61,.2); }
.pts-n { background: var(--crema2); color: var(--gris); border: 1px solid var(--borde); }

/* ── TABLA ── */
.tabla-row {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  background: white;
  border: 1px solid var(--borde);
  border-radius: 10px;
  margin-bottom: 8px;
  gap: 12px;
  box-shadow: 0 1px 4px var(--sombra);
}

.tabla-row.yo {
  background: rgba(200,85,61,.04);
  border-color: rgba(200,85,61,.4);
}

.tabla-pos {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--borde);
  width: 28px;
  text-align: center;
}

.tabla-pos.top { color: var(--amarillo); }
.tabla-pos.p1 { color: var(--terracota); }

.tabla-pts {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--terracota);
}

.tabla-pts-l { font-size: 9px; color: var(--gris); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }

/* ── GRUPOS TABS ── */
.grupos-scroll {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-bottom: 16px;
  scrollbar-width: none;
}

.grupos-scroll::-webkit-scrollbar { display: none; }

.grupo-tab {
  flex-shrink: 0;
  padding: 5px 12px;
  border: 2px solid var(--borde);
  border-radius: 20px;
  background: white;
  color: var(--gris);
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: all .15s;
}

.grupo-tab.on {
  background: var(--negro);
  border-color: var(--negro);
  color: var(--amarillo);
}

/* ── EQUIPOS/GRUPOS ── */
.equipo-card {
  background: white;
  border: 1px solid var(--borde);
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 10px;
  box-shadow: 0 2px 8px var(--sombra);
}

.equipo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.equipo-nombre {
  font-family: 'Playfair Display', serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--negro);
}

.equipo-codigo {
  background: var(--crema2);
  border: 1px dashed var(--borde);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--terracota);
  font-family: monospace;
}

.miembro-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: var(--crema);
  border: 1px solid var(--borde);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  margin: 3px;
  color: var(--negro);
}

/* ── BOTONES ── */
.btn {
  background: var(--terracota);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity .2s, transform .1s;
  letter-spacing: 0.3px;
}

.btn:hover { opacity: .88; }
.btn:active { transform: scale(.97); }
.btn:disabled { opacity: .4; cursor: not-allowed; }
.btn-sm { padding: 6px 14px; font-size: 11px; border-radius: 6px; }
.btn-outline { background: transparent; border: 2px solid var(--terracota); color: var(--terracota); }
.btn-verde { background: var(--verde); }
.btn-azul { background: var(--azul); }
.btn-full { width: 100%; padding: 14px; font-size: 15px; border-radius: 10px; margin-top: 8px; }

/* ── INPUTS ── */
.ig { width: 100%; margin-bottom: 12px; }
.il { font-size: 11px; color: var(--gris); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; display: block; font-weight: 700; }
.if {
  width: 100%;
  background: white;
  border: 2px solid var(--borde);
  border-radius: 8px;
  color: var(--negro);
  font-family: 'Nunito', sans-serif;
  font-size: 15px;
  padding: 11px 14px;
  outline: none;
  transition: border-color .2s;
}
.if:focus { border-color: var(--terracota); }

/* ── LOGIN ── */
.login-wrap {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  max-width: 430px;
  margin: 0 auto;
  background: var(--crema);
}

.login-sello {
  width: 90px;
  height: 90px;
  border: 3px solid var(--negro);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  margin-bottom: 20px;
  box-shadow: 4px 4px 0 var(--terracota);
}

.login-titulo {
  font-family: 'Playfair Display', serif;
  font-size: 38px;
  font-weight: 700;
  color: var(--negro);
  text-align: center;
  line-height: 1;
  margin-bottom: 4px;
}

.login-titulo em { color: var(--terracota); font-style: italic; }

.login-sub {
  font-size: 11px;
  color: var(--gris);
  letter-spacing: 3px;
  text-transform: uppercase;
  text-align: center;
  margin-bottom: 32px;
}

.login-sep {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
  color: var(--borde);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.login-sep::before, .login-sep::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--borde);
}

.login-toggle {
  margin-top: 20px;
  font-size: 13px;
  color: var(--gris);
  cursor: pointer;
  text-align: center;
  font-weight: 600;
}

.login-toggle span { color: var(--terracota); font-weight: 800; }

/* ── MENSAJES ── */
.err { background: rgba(200,85,61,.08); border: 1px solid rgba(200,85,61,.3); color: var(--terracota); border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; width: 100%; text-align: center; font-weight: 700; }
.ok { background: rgba(74,124,89,.08); border: 1px solid rgba(74,124,89,.3); color: var(--verde); border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px; width: 100%; text-align: center; font-weight: 700; }

/* ── TOAST ── */
.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--negro);
  color: var(--amarillo);
  padding: 10px 22px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 800;
  z-index: 999;
  animation: toastIn .3s ease;
  white-space: nowrap;
  border: 1px solid var(--terracota);
}

@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* ── SPINNER ── */
.spin-wrap { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--crema); flex-direction: column; gap: 20px; }
.spin-logo { font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; color: var(--negro); }
.spin-logo em { color: var(--terracota); font-style: italic; }
.ring { width: 36px; height: 36px; border: 3px solid var(--borde); border-top-color: var(--terracota); border-radius: 50%; animation: sp .8s linear infinite; }
@keyframes sp { to { transform: rotate(360deg); } }

.empty { text-align: center; padding: 40px 20px; color: var(--gris); font-size: 13px; font-weight: 600; }
.empty .em { font-size: 40px; margin-bottom: 12px; }

.divider { height: 1px; background: var(--borde); margin: 20px 0; }

.prow { background: white; border: 1px solid var(--borde); border-radius: 10px; padding: 14px; margin-bottom: 10px; }
.prow .lbl { font-size: 10px; color: var(--gris); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: 700; }
.prow .val { font-weight: 700; font-size: 15px; color: var(--negro); }

.aviso { background: rgba(232,184,75,.1); border: 1px solid rgba(232,184,75,.4); border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #8a6820; margin-bottom: 16px; font-weight: 600; }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function PtsBadge({ p }) {
  if (p === null || p === undefined) return <span className="pts-badge pts-n">—</span>;
  if (p === 3) return <span className="pts-badge pts-3">✓ +3</span>;
  return <span className="pts-badge pts-0">✗ 0</span>;
}

function Spinner() {
  return (
    <div className="spin-wrap">
      <div className="spin-logo">Quiniela <em>2026</em></div>
      <div className="ring" />
    </div>
  );
}

function etiq(op, local, visitante) {
  if (op === "local") return `🏆 ${local}`;
  if (op === "empate") return "🤝 Empate";
  return `🏆 ${visitante}`;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function Login({ onLogin }) {
  const [modo, setModo] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(""); setInfo("");
    if (!email || !pw) { setErr("Completa todos los campos"); return; }
    if (modo === "registro" && !username.trim()) { setErr("Elige un nombre de usuario"); return; }
    if (pw.length < 6) { setErr("La contraseña necesita al menos 6 caracteres"); return; }
    setLoading(true);
    try {
      if (modo === "registro") {
        // Verificar que username no exista
        const existing = await db.select("usuarios", `username=eq.${encodeURIComponent(username.trim())}`, SUPABASE_KEY);
        if (existing && existing.length > 0) { setErr("Ese nombre de usuario ya está tomado"); setLoading(false); return; }
        const data = await authFetch("signup", { email, password: pw });
        const token = data.access_token;
        const uid = data.user?.id;
        if (!uid || !token) {
          setInfo("✅ Revisa tu email para confirmar tu cuenta, luego inicia sesión.");
          setLoading(false); return;
        }
        try {
          await db.insert("usuarios", { id: uid, username: username.trim(), email, es_admin: false }, token);
        } catch (e) {
          if (!e.message.includes("duplicate") && !e.message.includes("23505")) throw e;
        }
        const sesion = { uid, token, username: username.trim(), email, es_admin: false };
        setSesion(sesion); onLogin(sesion);
      } else {
        const data = await authFetch("token?grant_type=password", { email, password: pw });
        const token = data.access_token;
        const uid = data.user?.id;
        let perfil = { username: email.split("@")[0], es_admin: false };
        try {
          const rows = await db.select("usuarios", `id=eq.${uid}`, token);
          if (rows?.[0]) perfil = rows[0];
          else await db.insert("usuarios", { id: uid, username: email.split("@")[0], email, es_admin: false }, token);
        } catch {}
        const sesion = { uid, token, username: perfil.username, email: perfil.email || email, es_admin: perfil.es_admin || false };
        setSesion(sesion); onLogin(sesion);
      }
    } catch (e) {
      const m = e.message || "";
      if (m.includes("already registered")) setErr("Este email ya está registrado. Inicia sesión.");
      else if (m.includes("Invalid login") || m.includes("invalid_credentials")) setErr("Email o contraseña incorrectos.");
      else if (m.includes("Email not confirmed")) setErr("Confirma tu email primero. Revisa tu bandeja.");
      else setErr(m || "Error desconocido");
    }
    setLoading(false);
  }

  return (
    <div className="login-wrap">
      <div className="login-sello">⚽</div>
      <div className="login-titulo">Quiniela <em>2026</em></div>
      <div className="login-sub">México · EE.UU. · Canadá</div>

      {err && <div className="err">{err}</div>}
      {info && <div className="ok">{info}</div>}

      {modo === "registro" && (
        <div className="ig">
          <label className="il">Nombre de usuario</label>
          <input className="if" placeholder="Ej: carlota22" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
      )}
      <div className="ig">
        <label className="il">Email</label>
        <input className="if" type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="ig">
        <label className="il">Contraseña (mín. 6 caracteres)</label>
        <input className="if" type="password" placeholder="••••••••" value={pw}
          onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
      </div>
      <button className="btn btn-full" onClick={submit} disabled={loading}>
        {loading ? "Cargando..." : modo === "login" ? "Entrar" : "Crear cuenta"}
      </button>
      <div className="login-toggle" onClick={() => { setModo(m => m === "login" ? "registro" : "login"); setErr(""); setInfo(""); }}>
        {modo === "login"
          ? <>¿No tienes cuenta? <span>Regístrate aquí</span></>
          : <>¿Ya tienes cuenta? <span>Inicia sesión</span></>}
      </div>
    </div>
  );
}

// ─── INICIO ───────────────────────────────────────────────────────────────────

function Inicio({ usuario, partidos, preds, users, equipos }) {
  const mias = preds.filter(p => p.usuario_id === usuario.uid);
  const total = mias.reduce((a, p) => a + (p.puntos || 0), 0);
  const rank = users.map(u => ({
    ...u, pts: preds.filter(p => p.usuario_id === u.id).reduce((a, x) => a + (x.puntos || 0), 0)
  })).sort((a, b) => b.pts - a.pts);
  const pos = rank.findIndex(r => r.id === usuario.uid) + 1;
  const predIds = new Set(mias.map(p => p.partido_id));
  const pend = partidos.filter(p => !resultadoDeGoles(p.goles_local, p.goles_visitante) && !predIds.has(p.id)).slice(0, 3);
  const misEquipos = equipos.filter(e => e.creador_id === usuario.uid || e.miembros?.includes(usuario.uid));

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "var(--gris)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2, fontWeight: 700 }}>Bienvenido</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700 }}>{usuario.username}</div>
        {misEquipos.length > 0 && (
          <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {misEquipos.map(e => (
              <span key={e.id} style={{ background: "var(--negro)", color: "var(--amarillo)", fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, letterSpacing: 1 }}>
                ⚽ {e.nombre}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat"><div className="stat-n">{total}</div><div className="stat-l">Mis puntos</div></div>
        <div className="stat"><div className="stat-n a">{pos || "—"}°</div><div className="stat-l">Posición</div></div>
        <div className="stat"><div className="stat-n v">{mias.length}</div><div className="stat-l">Predicciones</div></div>
        <div className="stat"><div className="stat-n y">{partidos.filter(p => p.goles_local !== null).length}</div><div className="stat-l">Jugados</div></div>
      </div>

      {pend.length > 0 && (
        <>
          <div className="ttl" style={{ fontSize: 20 }}>Pendientes <em>por predecir</em></div>
          <div className="ttl-sub">Partidos sin tu predicción</div>
          {pend.map(p => (
            <div key={p.id} className="partido">
              <div className="partido-meta">
                <span className="partido-grupo">Grupo {p.grupo}</span>
                <span className="partido-fecha">{formatFecha(p.fecha)}</span>
              </div>
              <div className="partido-teams">
                <div className="team"><div className="team-flag">{BANDERAS[p.local] || "🏳️"}</div><div className="team-name">{p.local}</div></div>
                <div className="vs-box"><span className="vs-text">versus</span></div>
                <div className="team"><div className="team-flag">{BANDERAS[p.visitante] || "🏳️"}</div><div className="team-name">{p.visitante}</div></div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── QUINIELA ─────────────────────────────────────────────────────────────────

function Quiniela({ usuario, partidos, preds, reload, toast }) {
  const [grupo, setGrupo] = useState("A");
  const [saving, setSaving] = useState({});
  const grupos = [...new Set(partidos.map(p => p.grupo))].sort();

  async function handleSelect(partido, opcion) {
    setSaving(s => ({ ...s, [partido.id]: true }));
    try {
      await db.upsert("predicciones", {
        usuario_id: usuario.uid,
        partido_id: partido.id,
        pred_local: opcion === "local" ? 1 : 0,
        pred_visitante: opcion === "visitante" ? 1 : 0,
        prediccion: opcion,
        puntos: null,
      }, usuario.token);
      await reload();
    } catch (e) { toast("❌ " + e.message); }
    setSaving(s => ({ ...s, [partido.id]: false }));
  }

  return (
    <div>
      <div className="ttl">Mi <em>Quiniela</em></div>
      <div className="ttl-sub">Mundial 2026 · Selecciona quién gana</div>

      <div className="grupos-scroll">
        {grupos.map(g => (
          <button key={g} className={`grupo-tab ${grupo === g ? "on" : ""}`} onClick={() => setGrupo(g)}>
            Grupo {g}
          </button>
        ))}
      </div>

      {partidos.filter(p => p.grupo === grupo).length === 0 &&
        <div className="empty"><div className="em">📅</div>Sin partidos en este grupo.</div>}

      {partidos.filter(p => p.grupo === grupo).map(p => {
        const pred = preds.find(x => x.usuario_id === usuario.uid && x.partido_id === p.id);
        const resultado = p.resultado || resultadoDeGoles(p.goles_local, p.goles_visitante);
        const predOp = pred?.prediccion;
        const pts = predOp && resultado ? calcularPuntos(predOp, resultado) : null;
        const bloqueado = !!resultado;

        return (
          <div key={p.id} className="partido">
            <div className="partido-meta">
              <span className="partido-grupo">Grupo {p.grupo}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="partido-fecha">{formatFecha(p.fecha)}</span>
                {pred && <PtsBadge p={pts} />}
              </div>
            </div>

            <div className="partido-teams">
              <div className="team">
                <div className="team-flag">{BANDERAS[p.local] || "🏳️"}</div>
                <div className="team-name">{p.local}</div>
              </div>
              <div className="vs-box">
                {resultado ? (
                  <div className="resultado-chip">{p.goles_local ?? "?"} – {p.goles_visitante ?? "?"}</div>
                ) : (
                  <span className="vs-text">versus</span>
                )}
              </div>
              <div className="team">
                <div className="team-flag">{BANDERAS[p.visitante] || "🏳️"}</div>
                <div className="team-name">{p.visitante}</div>
              </div>
            </div>

            {bloqueado ? (
              predOp ? (
                <div className={`pred-guardada ${predOp}`}>
                  {etiq(predOp, p.local, p.visitante)}
                  {resultado && <span style={{ marginLeft: 6, opacity: .7 }}>{predOp === resultado ? "✓ correcto" : "✗ incorrecto"}</span>}
                </div>
              ) : (
                <div style={{ textAlign: "center", fontSize: 11, color: "var(--gris)", fontWeight: 700 }}>No predijiste este partido</div>
              )
            ) : (
              <div className="pred-btns">
                {["local", "empate", "visitante"].map(op => (
                  <button key={op}
                    className={`pred-btn ${predOp === op ? `sel-${op}` : ""} ${saving[p.id] ? "locked" : ""}`}
                    onClick={() => handleSelect(p, op)}>
                    {op === "local" ? `🏆 ${p.local}` : op === "empate" ? "🤝 Empate" : `🏆 ${p.visitante}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── TABLA ────────────────────────────────────────────────────────────────────

function Tabla({ usuario, preds, users }) {
  const rank = users.map(u => {
    const mp = preds.filter(p => p.usuario_id === u.id && p.puntos !== null);
    return { ...u, pts: mp.reduce((a, p) => a + (p.puntos || 0), 0), aciertos: mp.filter(p => p.puntos > 0).length };
  }).sort((a, b) => b.pts - a.pts || b.aciertos - a.aciertos);

  return (
    <div>
      <div className="ttl">Tabla <em>General</em></div>
      <div className="ttl-sub">Acierto = 3 puntos</div>
      {rank.length === 0 && <div className="empty"><div className="em">🏆</div>Aún no hay participantes</div>}
      {rank.map((u, i) => (
        <div key={u.id} className={`tabla-row ${u.id === usuario.uid ? "yo" : ""}`}>
          <div className={`tabla-pos ${i === 0 ? "p1" : i < 3 ? "top" : ""}`}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 14 }}>
              {u.username || u.nombre || "Usuario"}
              {u.id === usuario.uid && <span style={{ fontSize: 10, color: "var(--terracota)", marginLeft: 6 }}>· tú</span>}
            </div>
            <div style={{ fontSize: 11, color: "var(--gris)", marginTop: 2, fontWeight: 600 }}>{u.aciertos} aciertos</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="tabla-pts">{u.pts}</div>
            <div className="tabla-pts-l">pts</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── EQUIPOS ──────────────────────────────────────────────────────────────────

function Equipos({ usuario, equipos, users, reload, toast }) {
  const [vista, setVista] = useState("lista");
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [saving, setSaving] = useState(false);

  const misEquipos = equipos.filter(e => e.creador_id === usuario.uid || (e.miembros || []).includes(usuario.uid));

  async function crearEquipo() {
    if (!nombre.trim()) { toast("⚠️ Escribe un nombre para tu equipo"); return; }
    setSaving(true);
    try {
      const cod = genCodigo();
      await db.insert("grupos", {
        nombre: nombre.trim(),
        codigo_invitacion: cod,
        creador_id: usuario.uid,
        miembros: [usuario.uid],
      }, usuario.token);
      toast("✅ Equipo creado · Código: " + cod);
      setNombre("");
      setVista("lista");
      await reload();
    } catch (e) { toast("❌ " + e.message); }
    setSaving(false);
  }

  async function unirse() {
    if (!codigo.trim()) { toast("⚠️ Ingresa el código del equipo"); return; }
    setSaving(true);
    try {
      const rows = await db.select("grupos", `codigo_invitacion=eq.${codigo.trim().toUpperCase()}`, usuario.token);
      if (!rows || rows.length === 0) { toast("❌ Código no encontrado"); setSaving(false); return; }
      const equipo = rows[0];
      const miembros = equipo.miembros || [];
      if (miembros.includes(usuario.uid)) { toast("Ya eres miembro de este equipo"); setSaving(false); return; }
      await db.update("grupos", { miembros: [...miembros, usuario.uid] }, `id=eq.${equipo.id}`, usuario.token);
      toast("✅ Te uniste a " + equipo.nombre);
      setCodigo("");
      setVista("lista");
      await reload();
    } catch (e) { toast("❌ " + e.message); }
    setSaving(false);
  }

  if (vista === "crear") return (
    <div>
      <div className="ttl">Crear <em>Equipo</em></div>
      <div className="ttl-sub">Tu equipo privado de quiniela</div>
      <div className="ig">
        <label className="il">Nombre del equipo</label>
        <input className="if" placeholder="Ej: Equipo Dinamita" value={nombre} onChange={e => setNombre(e.target.value)} />
      </div>
      <button className="btn btn-full" onClick={crearEquipo} disabled={saving}>{saving ? "Creando..." : "Crear equipo"}</button>
      <button className="btn btn-outline btn-full" onClick={() => setVista("lista")}>Cancelar</button>
    </div>
  );

  if (vista === "unirse") return (
    <div>
      <div className="ttl">Unirse a <em>Equipo</em></div>
      <div className="ttl-sub">Ingresa el código que te compartieron</div>
      <div className="ig">
        <label className="il">Código de invitación</label>
        <input className="if" placeholder="Ej: AB12CD" value={codigo}
          onChange={e => setCodigo(e.target.value.toUpperCase())}
          style={{ letterSpacing: 4, fontFamily: "monospace", fontSize: 20, textAlign: "center" }} />
      </div>
      <button className="btn btn-full btn-verde" onClick={unirse} disabled={saving}>{saving ? "Buscando..." : "Unirme al equipo"}</button>
      <button className="btn btn-outline btn-full" onClick={() => setVista("lista")}>Cancelar</button>
    </div>
  );

  return (
    <div>
      <div className="ttl">Mis <em>Equipos</em></div>
      <div className="ttl-sub">Quinielas privadas con amigos</div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button className="btn btn-sm" onClick={() => setVista("crear")}>+ Crear equipo</button>
        <button className="btn btn-sm btn-azul" onClick={() => setVista("unirse")}>Unirme con código</button>
      </div>

      {misEquipos.length === 0 && (
        <div className="empty"><div className="em">👥</div>Aún no perteneces a ningún equipo.<br />¡Crea uno o únete con un código!</div>
      )}

      {misEquipos.map(e => {
        const miembros = (e.miembros || []).map(id => users.find(u => u.id === id)).filter(Boolean);
        const esAdmin = e.creador_id === usuario.uid;
        return (
          <div key={e.id} className="equipo-card">
            <div className="equipo-header">
              <div>
                <div className="equipo-nombre">{e.nombre}</div>
                {esAdmin && <div style={{ fontSize: 10, color: "var(--terracota)", fontWeight: 800, marginTop: 2 }}>⚡ Tú eres el admin</div>}
              </div>
              <div className="equipo-codigo">{e.codigo_invitacion}</div>
            </div>
            <div style={{ fontSize: 10, color: "var(--gris)", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              {miembros.length} miembro{miembros.length !== 1 ? "s" : ""}
            </div>
            <div>
              {miembros.map(m => (
                <span key={m.id} className="miembro-chip">
                  {m.id === e.creador_id ? "⚡ " : ""}{m.username || m.nombre || "Usuario"}
                </span>
              ))}
            </div>
            {esAdmin && (
              <div className="aviso" style={{ marginTop: 12 }}>
                📤 Comparte el código <strong>{e.codigo_invitacion}</strong> por WhatsApp para que tus amigos se unan.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

function Admin({ usuario, partidos, preds, reload, toast }) {
  const [grupo, setGrupo] = useState("A");
  const [selAdmin, setSelAdmin] = useState({});
  const [saving, setSaving] = useState({});
  const grupos = [...new Set(partidos.map(p => p.grupo))].sort();

  async function guardar(p, resultado) {
    setSaving(s => ({ ...s, [p.id]: true }));
    try {
      const gL = resultado === "local" ? 1 : resultado === "empate" ? 0 : 0;
      const gV = resultado === "visitante" ? 1 : resultado === "empate" ? 0 : 0;
      await db.update("partidos", { goles_local: gL, goles_visitante: gV, resultado }, `id=eq.${p.id}`, usuario.token);
      const mp = preds.filter(x => x.partido_id === p.id);
      for (const pred of mp) {
        const pts = calcularPuntos(pred.prediccion, resultado);
        await db.update("predicciones", { puntos: pts }, `id=eq.${pred.id}`, usuario.token);
      }
      toast(`✅ ${p.local} vs ${p.visitante} · ${mp.length} predicciones actualizadas`);
      await reload();
      setSelAdmin(s => { const n = { ...s }; delete n[p.id]; return n; });
    } catch (e) { toast("❌ " + e.message); }
    setSaving(s => ({ ...s, [p.id]: false }));
  }

  async function limpiar(p) {
    try {
      await db.update("partidos", { goles_local: null, goles_visitante: null, resultado: null }, `id=eq.${p.id}`, usuario.token);
      await reload(); toast("🗑️ Resultado eliminado");
    } catch (e) { toast("❌ " + e.message); }
  }

  return (
    <div>
      <div className="ttl">Panel <em>Admin</em></div>
      <div className="ttl-sub">Ingresa los resultados de cada partido</div>

      <div className="aviso">
        ⚽ Selecciona quién ganó cada partido. Los puntos se calculan solos para todos los jugadores.
      </div>

      <div className="grupos-scroll">
        {grupos.map(g => (
          <button key={g} className={`grupo-tab ${grupo === g ? "on" : ""}`} onClick={() => setGrupo(g)}>
            Grupo {g}
          </button>
        ))}
      </div>

      {partidos.filter(p => p.grupo === grupo).map(p => {
        const resultado = p.resultado || resultadoDeGoles(p.goles_local, p.goles_visitante);
        const sel = selAdmin[p.id];
        const cnt = preds.filter(x => x.partido_id === p.id).length;

        return (
          <div key={p.id} className="partido">
            <div className="partido-meta">
              <span className="partido-grupo">Grupo {p.grupo}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="partido-fecha">{formatFecha(p.fecha)}</span>
                <span style={{ fontSize: 10, color: "var(--gris)", fontWeight: 700 }}>{cnt} pred.</span>
              </div>
            </div>

            <div className="partido-teams">
              <div className="team"><div className="team-flag">{BANDERAS[p.local] || "🏳️"}</div><div className="team-name">{p.local}</div></div>
              <div className="vs-box"><span className="vs-text">versus</span></div>
              <div className="team"><div className="team-flag">{BANDERAS[p.visitante] || "🏳️"}</div><div className="team-name">{p.visitante}</div></div>
            </div>

            {resultado ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ marginBottom: 8, padding: "8px 0", fontWeight: 800, fontSize: 14, color: "var(--verde)" }}>
                  ✓ {resultado === "local" ? p.local : resultado === "visitante" ? p.visitante : "Empate"}
                </div>
                <button className="btn btn-sm btn-outline" onClick={() => limpiar(p)}>Cambiar resultado</button>
              </div>
            ) : (
              <div>
                <div className="pred-btns" style={{ marginBottom: sel ? 8 : 0 }}>
                  {["local", "empate", "visitante"].map(op => (
                    <button key={op}
                      className={`pred-btn ${sel === op ? `sel-${op}` : ""}`}
                      onClick={() => setSelAdmin(s => ({ ...s, [p.id]: op }))}>
                      {op === "local" ? `🏆 ${p.local}` : op === "empate" ? "🤝 Empate" : `🏆 ${p.visitante}`}
                    </button>
                  ))}
                </div>
                {sel && (
                  <button className="btn btn-full btn-verde" disabled={saving[p.id]} onClick={() => guardar(p, sel)}>
                    {saving[p.id] ? "Guardando..." : `Confirmar: ${sel === "local" ? p.local : sel === "visitante" ? p.visitante : "Empate"}`}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── PERFIL ───────────────────────────────────────────────────────────────────

function Perfil({ usuario, onLogout }) {
  async function logout() {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST", headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${usuario.token}` }
      });
    } catch {}
    setSesion(null); onLogout();
  }
  return (
    <div>
      <div className="ttl">Mi <em>Perfil</em></div>
      <div className="ttl-sub">Tu información</div>
      <div className="prow"><div className="lbl">Nombre de usuario</div><div className="val">{usuario.username}</div></div>
      <div className="prow"><div className="lbl">Email</div><div className="val" style={{ fontSize: 13, color: "var(--gris)" }}>{usuario.email}</div></div>
      {usuario.es_admin && <div className="prow"><div className="lbl">Rol</div><div className="val" style={{ color: "var(--terracota)" }}>⚡ Administrador</div></div>}
      <div className="divider" />
      <button className="btn btn-outline btn-full" onClick={logout}>Cerrar sesión</button>
    </div>
  );
}

// ─── APP PRINCIPAL ────────────────────────────────────────────────────────────

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [iniciando, setIniciando] = useState(true);
  const [tab, setTab] = useState("inicio");
  const [partidos, setPartidos] = useState([]);
  const [preds, setPreds] = useState([]);
  const [users, setUsers] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState(null);

  function toast(m) { setMsg(m); setTimeout(() => setMsg(null), 3000); }

  useEffect(() => {
    const s = getSesion();
    if (s?.token) setUsuario(s);
    setIniciando(false);
  }, []);

  const cargar = useCallback(async (token) => {
    if (!token) return;
    setCargando(true);
    try {
      const [parts, ps, us, eqs] = await Promise.all([
        db.select("partidos", "order=fecha.asc", token),
        db.select("predicciones", "", token),
        db.select("usuarios", "", token),
        db.select("grupos", "", token),
      ]);

      // Deduplicar partidos por id
      const partMap = {};
      (parts || []).forEach(p => { partMap[p.id] = p; });
      const partUnicos = Object.values(partMap);

      setPartidos(partUnicos);
      setPreds(ps || []);
      setUsers(us || []);
      setEquipos(eqs || []);
    } catch (e) { toast("❌ Error: " + e.message); }
    setCargando(false);
  }, []);

  useEffect(() => { if (usuario?.token) cargar(usuario.token); }, [usuario, cargar]);

  function handleLogin(s) { setUsuario(s); }
  function handleLogout() { setUsuario(null); setTab("inicio"); setPartidos([]); setPreds([]); setUsers([]); setEquipos([]); }

  const TABS = [
    { id: "inicio", label: "Inicio", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: "quiniela", label: "Quiniela", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
    { id: "tabla", label: "Tabla", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
    { id: "equipos", label: "Equipos", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
    ...(usuario?.es_admin ? [{ id: "admin", label: "Admin", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> }] : []),
    { id: "perfil", label: "Perfil", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  if (iniciando) return <><style>{CSS}</style><Spinner /></>;
  if (!usuario) return <><style>{CSS}</style><Login onLogin={handleLogin} /></>;
  if (cargando) return <><style>{CSS}</style><Spinner /></>;

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        <header className="hdr">
          <div className="hdr-row">
            <div>
              <div className="logo">Quiniela <em>2026</em></div>
              <div className="logo-sub">México · EE.UU. · Canadá</div>
            </div>
            {usuario.es_admin && <span className="badge-admin">⚡ Admin</span>}
          </div>
        </header>

        <main className="pg">
          {tab === "inicio"   && <Inicio   usuario={usuario} partidos={partidos} preds={preds} users={users} equipos={equipos} />}
          {tab === "quiniela" && <Quiniela usuario={usuario} partidos={partidos} preds={preds} reload={() => cargar(usuario.token)} toast={toast} />}
          {tab === "tabla"    && <Tabla    usuario={usuario} preds={preds} users={users} />}
          {tab === "equipos"  && <Equipos  usuario={usuario} equipos={equipos} users={users} reload={() => cargar(usuario.token)} toast={toast} />}
          {tab === "admin"    && <Admin    usuario={usuario} partidos={partidos} preds={preds} reload={() => cargar(usuario.token)} toast={toast} />}
          {tab === "perfil"   && <Perfil   usuario={usuario} onLogout={handleLogout} />}
        </main>

        <nav className="nav">
          {TABS.map(t => (
            <button key={t.id} className={`nb ${tab === t.id ? "on" : ""}`} onClick={() => setTab(t.id)}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>

        {msg && <div className="toast">{msg}</div>}
      </div>
    </>
  );
}
