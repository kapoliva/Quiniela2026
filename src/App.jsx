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
};

// ─── SESIÓN ───────────────────────────────────────────────────────────────────
function getSesion() { try { return JSON.parse(localStorage.getItem("qg2026") || "null"); } catch { return null; } }
function setSesion(s) { s ? localStorage.setItem("qg2026", JSON.stringify(s)) : localStorage.removeItem("qg2026"); }

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const BANDERAS = {
  "México":"🇲🇽","EEUU":"🇺🇸","Canadá":"🇨🇦","Argentina":"🇦🇷",
  "Brasil":"🇧🇷","Francia":"🇫🇷","Portugal":"🇵🇹","Alemania":"🇩🇪",
  "España":"🇪🇸","Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Holanda":"🇳🇱","Italia":"🇮🇹",
  "Uruguay":"🇺🇾","Colombia":"🇨🇴","Chile":"🇨🇱","Ecuador":"🇪🇨",
  "Bélgica":"🇧🇪","Croacia":"🇭🇷","Marruecos":"🇲🇦","Senegal":"🇸🇳",
  "Japón":"🇯🇵","Corea del Sur":"🇰🇷","Australia":"🇦🇺","Arabia Saudita":"🇸🇦",
  "Nigeria":"🇳🇬","Ghana":"🇬🇭","Camerún":"🇨🇲","Costa de Marfil":"🇨🇮",
  "Irán":"🇮🇷","Turquía":"🇹🇷","Dinamarca":"🇩🇰","Suecia":"🇸🇪",
};

// prediccion y resultado: "local" | "empate" | "visitante"
function calcularPuntos(pred, resultado) {
  if (!resultado) return null;
  return pred === resultado ? 3 : 0;
}

function resultadoDeGoles(gL, gV) {
  if (gL === null || gV === null) return null;
  if (gL > gV) return "local";
  if (gL < gV) return "visitante";
  return "empate";
}

function formatFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
:root{--v:#00c853;--n:#0a0a0a;--go:#161616;--gm:#222;--gb:#2e2e2e;--b:#f5f5f0;--y:#ffd600;--r:#ff3d3d;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--n);color:var(--b);font-family:'DM Sans',sans-serif;min-height:100vh;overflow-x:hidden;}
.app{max-width:430px;margin:0 auto;min-height:100vh;background:var(--n);display:flex;flex-direction:column;}
.hdr{background:var(--go);border-bottom:1px solid var(--gb);padding:16px 20px 12px;position:sticky;top:0;z-index:100;}
.hdr-row{display:flex;align-items:center;justify-content:space-between;}
.logo{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;color:var(--v);}
.logo span{color:var(--b);}
.badge{background:var(--y);color:var(--n);font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;}
.nav{background:var(--go);border-top:1px solid var(--gb);display:flex;position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:430px;z-index:100;}
.nb{flex:1;background:none;border:none;color:#555;padding:12px 4px 10px;cursor:pointer;font-size:9px;font-family:'DM Sans',sans-serif;font-weight:600;letter-spacing:.5px;text-transform:uppercase;display:flex;flex-direction:column;align-items:center;gap:4px;transition:color .2s;}
.nb.on{color:var(--v);}
.nb svg{width:20px;height:20px;}
.pg{flex:1;padding:20px 16px 90px;overflow-y:auto;}
.ttl{font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;margin-bottom:16px;}
.ttl em{color:var(--v);font-style:normal;}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;}
.sc{background:var(--gm);border:1px solid var(--gb);border-radius:10px;padding:14px;text-align:center;}
.sn{font-family:'Bebas Neue',sans-serif;font-size:40px;line-height:1;color:var(--v);}
.sn.g{color:var(--y);}
.sl{font-size:10px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-top:4px;}
.pc{background:var(--gm);border:1px solid var(--gb);border-radius:12px;padding:16px;margin-bottom:10px;}
.pm{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
.pg2{font-size:10px;color:var(--v);font-weight:700;letter-spacing:1px;text-transform:uppercase;}
.pf{font-size:10px;color:#666;}
.matchrow{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:14px;}
.eq{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;}
.ef{font-size:26px;line-height:1;}
.en{font-size:10px;font-weight:600;text-align:center;line-height:1.2;color:#ccc;}
.vs{font-family:'Bebas Neue',sans-serif;font-size:13px;color:#444;letter-spacing:2px;}

/* Botones de predicción */
.pred-btns{display:flex;gap:6px;width:100%;}
.pred-btn{flex:1;padding:10px 4px;border:1.5px solid var(--gb);border-radius:8px;background:transparent;color:#888;font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;cursor:pointer;text-align:center;transition:all .2s;line-height:1.3;}
.pred-btn:hover{border-color:#555;color:var(--b);}
.pred-btn.sel-local{border-color:var(--v);background:rgba(0,200,83,.15);color:var(--v);}
.pred-btn.sel-empate{border-color:var(--y);background:rgba(255,214,0,.12);color:var(--y);}
.pred-btn.sel-visitante{border-color:#4fc3f7;background:rgba(79,195,247,.12);color:#4fc3f7;}
.pred-btn.disabled{opacity:.4;cursor:not-allowed;pointer-events:none;}

/* Resultado guardado */
.pred-guardada{display:flex;align-items:center;justify-content:center;gap:6px;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;}
.pg-local{background:rgba(0,200,83,.1);color:var(--v);border:1px solid rgba(0,200,83,.25);}
.pg-empate{background:rgba(255,214,0,.1);color:var(--y);border:1px solid rgba(255,214,0,.25);}
.pg-visitante{background:rgba(79,195,247,.1);color:#4fc3f7;border:1px solid rgba(79,195,247,.25);}

/* Resultado real */
.resultado-real{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.05);border:1px solid var(--gb);border-radius:6px;padding:4px 10px;font-size:11px;color:#aaa;margin-bottom:8px;}

/* Puntos badge */
.pb{padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;}
.p3{background:rgba(0,200,83,.15);color:var(--v);border:1px solid rgba(0,200,83,.3);}
.p0{background:rgba(255,61,61,.1);color:var(--r);border:1px solid rgba(255,61,61,.2);}
.pn{background:rgba(255,255,255,.05);color:#555;border:1px solid var(--gb);}

.tr{display:flex;align-items:center;padding:12px 14px;border-radius:10px;margin-bottom:6px;background:var(--gm);border:1px solid var(--gb);gap:12px;}
.tr.yo{background:rgba(0,200,83,.08);border-color:rgba(0,200,83,.3);}
.tp{font-family:'Bebas Neue',sans-serif;font-size:20px;color:#555;width:24px;text-align:center;}
.tp.t{color:var(--y);}
.tpt{font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--v);}
.tpl{font-size:9px;color:#666;text-transform:uppercase;letter-spacing:1px;}

/* Admin opciones */
.admin-btns{display:flex;gap:6px;width:100%;}
.admin-btn{flex:1;padding:8px 4px;border:1.5px solid var(--gb);border-radius:8px;background:transparent;color:#888;font-size:11px;font-weight:600;cursor:pointer;text-align:center;transition:all .2s;}
.admin-btn.sel-local{border-color:var(--v);background:rgba(0,200,83,.15);color:var(--v);}
.admin-btn.sel-empate{border-color:var(--y);background:rgba(255,214,0,.12);color:var(--y);}
.admin-btn.sel-visitante{border-color:#4fc3f7;background:rgba(79,195,247,.12);color:#4fc3f7;}

.btn{background:var(--v);color:var(--n);border:none;border-radius:8px;padding:10px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .2s,transform .1s;}
.btn:hover{opacity:.9;}
.btn:active{transform:scale(.97);}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.bsm{padding:6px 16px;font-size:11px;border-radius:6px;}
.bol{background:transparent;border:1.5px solid var(--v);color:var(--v);}
.bfl{width:100%;padding:14px;font-size:15px;margin-top:8px;border-radius:10px;}
.brd{background:transparent;border:1.5px solid var(--r);color:var(--r);}

.tg{display:inline-block;background:rgba(0,200,83,.1);border:1px solid rgba(0,200,83,.25);color:var(--v);font-size:10px;font-weight:700;letter-spacing:1px;padding:3px 10px;border-radius:4px;text-transform:uppercase;margin-right:6px;margin-bottom:8px;cursor:pointer;white-space:nowrap;}
.tg.on{background:rgba(0,200,83,.25);}
.sx{display:flex;gap:4px;overflow-x:auto;padding-bottom:6px;margin-bottom:16px;scrollbar-width:none;}
.sx::-webkit-scrollbar{display:none;}

.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--v);color:var(--n);padding:10px 20px;border-radius:20px;font-size:13px;font-weight:700;z-index:999;animation:ti .3s ease;white-space:nowrap;}
@keyframes ti{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
.ring{width:36px;height:36px;border:3px solid var(--gb);border-top-color:var(--v);border-radius:50%;animation:sp .8s linear infinite;}
@keyframes sp{to{transform:rotate(360deg);}}
.center{display:flex;align-items:center;justify-content:center;min-height:100vh;background:var(--n);flex-direction:column;gap:16px;}
.empty{text-align:center;padding:40px 20px;color:#555;font-size:13px;}
.empty .em{font-size:36px;margin-bottom:12px;}

/* LOGIN */
.ls{min-height:100vh;background:var(--n);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;max-width:430px;margin:0 auto;}
.ll{font-family:'Bebas Neue',sans-serif;font-size:52px;letter-spacing:4px;color:var(--v);line-height:1;margin-bottom:4px;}
.lsub{font-size:12px;color:#666;letter-spacing:3px;text-transform:uppercase;margin-bottom:40px;text-align:center;}
.ig{width:100%;margin-bottom:12px;}
.il{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block;}
.if{width:100%;background:var(--go);border:1.5px solid var(--gb);border-radius:8px;color:var(--b);font-family:'DM Sans',sans-serif;font-size:15px;padding:12px 14px;outline:none;transition:border-color .2s;}
.if:focus{border-color:var(--v);}
.ltg{margin-top:20px;font-size:13px;color:#666;cursor:pointer;text-align:center;}
.ltg span{color:var(--v);font-weight:600;}
.err{background:rgba(255,61,61,.1);border:1px solid rgba(255,61,61,.3);color:var(--r);border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:12px;width:100%;text-align:center;}
.ok{background:rgba(0,200,83,.1);border:1px solid rgba(0,200,83,.3);color:var(--v);border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:12px;width:100%;text-align:center;}
.fv{position:fixed;width:300px;height:300px;background:radial-gradient(circle,rgba(0,200,83,.07) 0%,transparent 70%);border-radius:50%;pointer-events:none;top:-100px;right:-100px;}
.prow{background:var(--gm);border:1px solid var(--gb);border-radius:10px;padding:14px;margin-bottom:10px;}
.prow .lbl{font-size:11px;color:#666;margin-bottom:4px;}
.prow .val{font-weight:600;font-size:15px;}
.divider{height:1px;background:var(--gb);margin:20px 0;}
`;

// ─── HELPERS UI ───────────────────────────────────────────────────────────────

function PuntosBadge({ p }) {
  if (p === null || p === undefined) return <span className="pb pn">—</span>;
  if (p === 3) return <span className="pb p3">✓ +3 pts</span>;
  return <span className="pb p0">✗ 0 pts</span>;
}

function Spinner() {
  return (
    <div className="center">
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 30, color: "#00c853", letterSpacing: 4 }}>QUINIELA 2026</div>
      <div className="ring" />
    </div>
  );
}

function etiquetaOpcion(opcion, local, visitante) {
  if (opcion === "local") return `🏆 ${local}`;
  if (opcion === "empate") return "🤝 Empate";
  return `🏆 ${visitante}`;
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function Login({ onLogin }) {
  const [modo, setModo] = useState("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr(""); setInfo("");
    if (!email || !pw) { setErr("Completa email y contraseña"); return; }
    if (modo === "registro" && !nombre.trim()) { setErr("Escribe tu nombre"); return; }
    if (pw.length < 6) { setErr("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    try {
      if (modo === "registro") {
        const data = await authFetch("signup", { email, password: pw });
        const token = data.access_token;
        const uid = data.user?.id;
        if (!uid) {
          setInfo("✅ Registro exitoso. Revisa tu email para confirmar tu cuenta, luego inicia sesión.");
          setLoading(false); return;
        }
        // Crear perfil en tabla usuarios
        try {
          await db.insert("usuarios", { id: uid, nombre: nombre.trim(), email, es_admin: false }, token);
        } catch (e) {
          // Si ya existe el perfil, ignorar
          if (!e.message.includes("duplicate") && !e.message.includes("23505")) throw e;
        }
        const sesion = { uid, token, nombre: nombre.trim(), email, es_admin: false };
        setSesion(sesion);
        onLogin(sesion);
      } else {
        const data = await authFetch("token?grant_type=password", { email, password: pw });
        const token = data.access_token;
        const uid = data.user?.id;
        // Cargar perfil
        let perfil = { nombre: email, es_admin: false };
        try {
          const rows = await db.select("usuarios", `id=eq.${uid}`, token);
          if (rows?.[0]) perfil = rows[0];
          else {
            // Crear perfil si no existe
            await db.insert("usuarios", { id: uid, nombre: email, email, es_admin: false }, token);
          }
        } catch {}
        const sesion = { uid, token, nombre: perfil.nombre, email: perfil.email || email, es_admin: perfil.es_admin || false };
        setSesion(sesion);
        onLogin(sesion);
      }
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("already registered") || msg.includes("User already registered")) {
        setErr("Este email ya está registrado. Inicia sesión.");
      } else if (msg.includes("Invalid login") || msg.includes("invalid_credentials")) {
        setErr("Email o contraseña incorrectos.");
      } else if (msg.includes("Email not confirmed")) {
        setErr("Confirma tu email antes de entrar. Revisa tu bandeja.");
      } else {
        setErr(msg || "Error desconocido");
      }
    }
    setLoading(false);
  }

  return (
    <div className="ls">
      <div className="fv" />
      <div className="ll">QUINIELA</div>
      <div className="lsub">Mundial 2026 · México · EE.UU. · Canadá</div>
      {err && <div className="err">{err}</div>}
      {info && <div className="ok">{info}</div>}
      {modo === "registro" && (
        <div className="ig">
          <label className="il">Tu nombre</label>
          <input className="if" placeholder="Ej: Carlota" value={nombre} onChange={e => setNombre(e.target.value)} />
        </div>
      )}
      <div className="ig">
        <label className="il">Email</label>
        <input className="if" type="email" placeholder="tu@correo.com" value={email}
          onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="ig">
        <label className="il">Contraseña (mín. 6 caracteres)</label>
        <input className="if" type="password" placeholder="••••••••" value={pw}
          onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
      </div>
      <button className="btn bfl" onClick={submit} disabled={loading}>
        {loading ? "Cargando..." : modo === "login" ? "Entrar" : "Crear cuenta"}
      </button>
      <div className="ltg" onClick={() => { setModo(m => m === "login" ? "registro" : "login"); setErr(""); setInfo(""); }}>
        {modo === "login"
          ? <>¿No tienes cuenta? <span>Regístrate</span></>
          : <>¿Ya tienes cuenta? <span>Inicia sesión</span></>}
      </div>
    </div>
  );
}

// ─── INICIO ───────────────────────────────────────────────────────────────────

function Inicio({ usuario, partidos, preds, users }) {
  const mias = preds.filter(p => p.usuario_id === usuario.uid);
  const total = mias.reduce((a, p) => a + (p.puntos || 0), 0);
  const rank = users.map(u => ({
    ...u, pts: preds.filter(p => p.usuario_id === u.id).reduce((a, x) => a + (x.puntos || 0), 0)
  })).sort((a, b) => b.pts - a.pts);
  const pos = rank.findIndex(r => r.id === usuario.uid) + 1;
  const predIds = new Set(mias.map(p => p.partido_id));
  const pend = partidos.filter(p => !resultadoDeGoles(p.goles_local, p.goles_visitante) && !predIds.has(p.id)).slice(0, 3);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Bienvenido</div>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2 }}>{usuario.nombre}</div>
      </div>
      <div className="sg">
        <div className="sc"><div className="sn">{total}</div><div className="sl">Mis puntos</div></div>
        <div className="sc"><div className="sn g">{pos || "—"}°</div><div className="sl">Posición</div></div>
        <div className="sc"><div className="sn">{mias.length}</div><div className="sl">Predicciones</div></div>
        <div className="sc"><div className="sn">{partidos.filter(p => p.goles_local !== null).length}</div><div className="sl">Jugados</div></div>
      </div>
      <div className="ttl">Pendientes <em>por predecir</em></div>
      {pend.length === 0
        ? <div className="empty"><div className="em">✅</div>¡Al día con tus predicciones!</div>
        : pend.map(p => (
          <div key={p.id} className="pc">
            <div className="pm"><span className="pg2">Grupo {p.grupo}</span><span className="pf">{formatFecha(p.fecha)}</span></div>
            <div className="matchrow">
              <div className="eq"><div className="ef">{BANDERAS[p.local] || "🏳️"}</div><div className="en">{p.local}</div></div>
              <span className="vs">VS</span>
              <div className="eq"><div className="ef">{BANDERAS[p.visitante] || "🏳️"}</div><div className="en">{p.visitante}</div></div>
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── QUINIELA ─────────────────────────────────────────────────────────────────

function Quiniela({ usuario, partidos, preds, reload, toast }) {
  const [grupo, setGrupo] = useState("A");
  const [saving, setSaving] = useState({});
  const [seleccion, setSeleccion] = useState({});
  const grupos = [...new Set(partidos.map(p => p.grupo))].sort();

  async function guardar(partido, opcion) {
    setSaving(s => ({ ...s, [partido.id]: true }));
    try {
      await db.upsert("predicciones", {
        usuario_id: usuario.uid,
        partido_id: partido.id,
        pred_local: opcion === "local" ? 1 : opcion === "empate" ? 0 : 0,
        pred_visitante: opcion === "visitante" ? 1 : opcion === "empate" ? 0 : 0,
        prediccion: opcion,
        puntos: null,
      }, usuario.token);
      toast("✅ Predicción guardada");
      await reload();
    } catch (e) { toast("❌ " + e.message); }
    setSaving(s => ({ ...s, [partido.id]: false }));
  }

  async function handleSelect(partido, opcion) {
    setSeleccion(s => ({ ...s, [partido.id]: opcion }));
    await guardar(partido, opcion);
  }

  return (
    <div>
      <div className="ttl">Quiniela <em>Mundial 2026</em></div>
      <div style={{ fontSize: 11, color: "#555", marginBottom: 12 }}>Selecciona quién gana cada partido</div>
      <div className="sx">
        {grupos.map(g => <span key={g} className={`tg ${grupo === g ? "on" : ""}`} onClick={() => setGrupo(g)}>Grupo {g}</span>)}
      </div>
      {partidos.filter(p => p.grupo === grupo).length === 0 &&
        <div className="empty"><div className="em">📅</div>No hay partidos en este grupo todavía.</div>}
      {partidos.filter(p => p.grupo === grupo).map(p => {
        const pred = preds.find(x => x.usuario_id === usuario.uid && x.partido_id === p.id);
        const resultado = resultadoDeGoles(p.goles_local, p.goles_visitante);
        const predOpcion = pred?.prediccion || seleccion[p.id];
        const pts = pred && resultado ? calcularPuntos(predOpcion, resultado) : null;
        const bloqueado = !!resultado;

        return (
          <div key={p.id} className="pc">
            <div className="pm">
              <span className="pg2">Grupo {p.grupo}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="pf">{formatFecha(p.fecha)}</span>
                {pred && <PuntosBadge p={pts} />}
              </div>
            </div>

            {/* Equipos */}
            <div className="matchrow">
              <div className="eq">
                <div className="ef">{BANDERAS[p.local] || "🏳️"}</div>
                <div className="en">{p.local}</div>
              </div>
              <span className="vs">VS</span>
              <div className="eq">
                <div className="ef">{BANDERAS[p.visitante] || "🏳️"}</div>
                <div className="en">{p.visitante}</div>
              </div>
            </div>

            {/* Resultado real si ya se jugó */}
            {resultado && (
              <div style={{ marginBottom: 8, textAlign: "center" }}>
                <span className="resultado-real">
                  ⚽ Resultado: {resultado === "local" ? p.local : resultado === "visitante" ? p.visitante : "Empate"}
                </span>
              </div>
            )}

            {/* Opciones */}
            {bloqueado ? (
              predOpcion ? (
                <div className={`pred-guardada pg-${predOpcion}`}>
                  {etiquetaOpcion(predOpcion, p.local, p.visitante)}
                  {resultado && <span style={{ marginLeft: 6, fontSize: 10 }}>{predOpcion === resultado ? "✓" : "✗"}</span>}
                </div>
              ) : (
                <div style={{ textAlign: "center", fontSize: 11, color: "#555" }}>No predijiste este partido</div>
              )
            ) : (
              <div className="pred-btns">
                {["local", "empate", "visitante"].map(op => (
                  <button
                    key={op}
                    className={`pred-btn ${predOpcion === op ? `sel-${op}` : ""} ${saving[p.id] ? "disabled" : ""}`}
                    onClick={() => handleSelect(p, op)}
                  >
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
      <div className="ttl">Tabla <em>de posiciones</em></div>
      <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, textAlign: "right" }}>Acierto = 3 pts</div>
      {rank.length === 0 && <div className="empty"><div className="em">👥</div>Aún no hay participantes</div>}
      {rank.map((u, i) => (
        <div key={u.id} className={`tr ${u.id === usuario.uid ? "yo" : ""}`}>
          <div className={`tp ${i < 3 ? "t" : ""}`}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>
              {u.nombre} {u.id === usuario.uid && <span style={{ fontSize: 10, color: "var(--v)" }}>· tú</span>}
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{u.aciertos} aciertos</div>
          </div>
          <div style={{ textAlign: "right" }}><div className="tpt">{u.pts}</div><div className="tpl">pts</div></div>
        </div>
      ))}
    </div>
  );
}

// ─── ADMIN ────────────────────────────────────────────────────────────────────

function Admin({ usuario, partidos, preds, reload, toast }) {
  const [grupo, setGrupo] = useState("A");
  const [selAdmin, setSelAdmin] = useState({});
  const [saving, setSaving] = useState({});
  const grupos = [...new Set(partidos.map(p => p.grupo))].sort();

  async function guardarResultado(partido, resultado) {
    setSaving(s => ({ ...s, [partido.id]: true }));
    try {
      const gL = resultado === "local" ? 1 : resultado === "empate" ? 0 : 0;
      const gV = resultado === "visitante" ? 1 : resultado === "empate" ? 0 : 0;
      await db.update("partidos", { goles_local: gL, goles_visitante: gV, resultado }, `id=eq.${partido.id}`, usuario.token);

      // Recalcular puntos de todas las predicciones de este partido
      const mp = preds.filter(x => x.partido_id === partido.id);
      for (const pred of mp) {
        const pts = calcularPuntos(pred.prediccion, resultado);
        await db.update("predicciones", { puntos: pts }, `id=eq.${pred.id}`, usuario.token);
      }
      toast(`⚡ Resultado guardado · ${mp.length} predicciones actualizadas`);
      await reload();
      setSelAdmin(s => { const n = { ...s }; delete n[partido.id]; return n; });
    } catch (e) { toast("❌ " + e.message); }
    setSaving(s => ({ ...s, [partido.id]: false }));
  }

  async function limpiar(partido) {
    try {
      await db.update("partidos", { goles_local: null, goles_visitante: null, resultado: null }, `id=eq.${partido.id}`, usuario.token);
      await reload(); toast("🗑️ Resultado eliminado");
    } catch (e) { toast("❌ " + e.message); }
  }

  return (
    <div>
      <div className="ttl">Admin <em>· Resultados</em></div>
      <div style={{ background: "rgba(255,214,0,.07)", border: "1px solid rgba(255,214,0,.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#aaa" }}>
        ⚡ Selecciona el resultado real de cada partido. Los puntos se calculan automáticamente.
      </div>
      <div className="sx">
        {grupos.map(g => <span key={g} className={`tg ${grupo === g ? "on" : ""}`} onClick={() => setGrupo(g)}>Grupo {g}</span>)}
      </div>
      {partidos.filter(p => p.grupo === grupo).map(p => {
        const resultado = p.resultado || resultadoDeGoles(p.goles_local, p.goles_visitante);
        const sel = selAdmin[p.id];
        const cnt = preds.filter(x => x.partido_id === p.id).length;

        return (
          <div key={p.id} className="pc">
            <div className="pm">
              <span className="pg2">Grupo {p.grupo}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span className="pf">{formatFecha(p.fecha)}</span>
                <span style={{ fontSize: 10, color: "#555" }}>{cnt} pred.</span>
              </div>
            </div>
            <div className="matchrow">
              <div className="eq"><div className="ef">{BANDERAS[p.local] || "🏳️"}</div><div className="en">{p.local}</div></div>
              <span className="vs">VS</span>
              <div className="eq"><div className="ef">{BANDERAS[p.visitante] || "🏳️"}</div><div className="en">{p.visitante}</div></div>
            </div>
            {resultado ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ marginBottom: 8, fontSize: 13, fontWeight: 600, color: "var(--v)" }}>
                  ✓ {resultado === "local" ? p.local : resultado === "visitante" ? p.visitante : "Empate"}
                </div>
                <button className="btn bsm brd" onClick={() => limpiar(p)}>Cambiar resultado</button>
              </div>
            ) : (
              <div>
                <div className="admin-btns" style={{ marginBottom: 8 }}>
                  {["local", "empate", "visitante"].map(op => (
                    <button key={op}
                      className={`admin-btn ${sel === op ? `sel-${op}` : ""}`}
                      onClick={() => setSelAdmin(s => ({ ...s, [p.id]: op }))}>
                      {op === "local" ? `🏆 ${p.local}` : op === "empate" ? "🤝 Empate" : `🏆 ${p.visitante}`}
                    </button>
                  ))}
                </div>
                {sel && (
                  <button className="btn bsm" style={{ width: "100%" }}
                    disabled={saving[p.id]} onClick={() => guardarResultado(p, sel)}>
                    {saving[p.id] ? "Guardando..." : "Confirmar resultado"}
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
    setSesion(null);
    onLogout();
  }
  return (
    <div>
      <div className="ttl">Mi <em>perfil</em></div>
      <div className="prow"><div className="lbl">Nombre</div><div className="val">{usuario.nombre}</div></div>
      <div className="prow"><div className="lbl">Email</div><div className="val">{usuario.email}</div></div>
      {usuario.es_admin && <div className="prow"><div className="lbl">Rol</div><div className="val" style={{ color: "var(--y)" }}>⚡ Administrador</div></div>}
      <div className="divider" />
      <button className="btn bol bfl" onClick={logout}>Cerrar sesión</button>
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
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState(null);

  function toast(m) { setMsg(m); setTimeout(() => setMsg(null), 2800); }

  useEffect(() => {
    const s = getSesion();
    if (s?.token) setUsuario(s);
    setIniciando(false);
  }, []);

  const cargar = useCallback(async (token) => {
    if (!token) return;
    setCargando(true);
    try {
      const [parts, ps, us] = await Promise.all([
        db.select("partidos", "order=fecha.asc", token),
        db.select("predicciones", "", token),
        db.select("usuarios", "", token),
      ]);
      setPartidos(parts || []);
      setPreds(ps || []);
      setUsers(us || []);
    } catch (e) { toast("❌ Error: " + e.message); }
    setCargando(false);
  }, []);

  useEffect(() => { if (usuario?.token) cargar(usuario.token); }, [usuario, cargar]);

  function handleLogin(sesion) { setUsuario(sesion); }
  function handleLogout() { setUsuario(null); setTab("inicio"); setPartidos([]); setPreds([]); setUsers([]); }

  const TABS = [
    { id: "inicio", label: "Inicio", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: "quiniela", label: "Quiniela", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
    { id: "tabla", label: "Tabla", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
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
            <div className="logo">QUINIELA <span>2026</span></div>
            {usuario.es_admin && <span className="badge">⚡ Admin</span>}
          </div>
        </header>
        <main className="pg">
          {tab === "inicio"   && <Inicio   usuario={usuario} partidos={partidos} preds={preds} users={users} />}
          {tab === "quiniela" && <Quiniela usuario={usuario} partidos={partidos} preds={preds} reload={() => cargar(usuario.token)} toast={toast} />}
          {tab === "tabla"    && <Tabla    usuario={usuario} preds={preds} users={users} />}
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
