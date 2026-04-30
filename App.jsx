import { useState, useEffect, useCallback } from "react";

// ─── SUPABASE CLIENTE DIRECTO (sin librería, compatible con nuevo formato) ────

const SUPABASE_URL = "https://qrdsokwtlucsouvsiqxe.supabase.co";
const SUPABASE_KEY = "sb_publishable_Vkj0geal-b7-meX1f9ijCg_j-OSeDVV";

async function sbFetch(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${options._token || SUPABASE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options._prefer || "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Auth helpers
const authHeaders = (token) => ({ _token: token });

async function signUp(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.error || data.error_description) throw new Error(data.error_description || data.error || data.msg);
  return data;
}

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (data.error || data.error_description) throw new Error(data.error_description || data.error || "Credenciales incorrectas");
  return data;
}

async function signOut(token) {
  await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
    method: "POST",
    headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${token}` },
  });
}

// DB helpers
async function select(table, query = "", token) {
  return sbFetch(`/${table}?${query}`, { _token: token, _prefer: "" });
}

async function insert(table, body, token) {
  return sbFetch(`/${table}`, {
    method: "POST", body: JSON.stringify(body), _token: token,
  });
}

async function upsert(table, body, token) {
  return sbFetch(`/${table}`, {
    method: "POST", body: JSON.stringify(body), _token: token,
    headers: { "Prefer": "resolution=merge-duplicates,return=representation" },
  });
}

async function update(table, body, filter, token) {
  return sbFetch(`/${table}?${filter}`, {
    method: "PATCH", body: JSON.stringify(body), _token: token,
  });
}

// ─── BANDERAS ─────────────────────────────────────────────────────────────────

const BANDERAS = {
  México:"🇲🇽",EEUU:"🇺🇸",Canadá:"🇨🇦",Argentina:"🇦🇷",
  Brasil:"🇧🇷",Francia:"🇫🇷",Portugal:"🇵🇹",Alemania:"🇩🇪",
  España:"🇪🇸",Inglaterra:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",Holanda:"🇳🇱",Italia:"🇮🇹",
  Uruguay:"🇺🇾",Colombia:"🇨🇴",Chile:"🇨🇱",Ecuador:"🇪🇨",
  Bélgica:"🇧🇪",Croacia:"🇭🇷",Marruecos:"🇲🇦",Senegal:"🇸🇳",
  Japón:"🇯🇵","Corea del Sur":"🇰🇷",Australia:"🇦🇺","Arabia Saudita":"🇸🇦",
  Nigeria:"🇳🇬",Ghana:"🇬🇭",Camerún:"🇨🇲","Costa de Marfil":"🇨🇮",
  Irán:"🇮🇷",Turquía:"🇹🇷",Dinamarca:"🇩🇰",Suecia:"🇸🇪",
};

function calcularPuntos(pL, pV, gL, gV) {
  if (gL === null || gV === null) return null;
  if (pL === gL && pV === gV) return 3;
  if (Math.sign(pL - pV) === Math.sign(gL - gV)) return 2;
  return 0;
}

function formatFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-MX", { day: "numeric", month: "short" }) +
    " · " + d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

// ─── SESIÓN LOCAL ─────────────────────────────────────────────────────────────

function getSesion() {
  try { return JSON.parse(localStorage.getItem("qg_sesion") || "null"); } catch { return null; }
}
function setSesion(s) {
  if (s) localStorage.setItem("qg_sesion", JSON.stringify(s));
  else localStorage.removeItem("qg_sesion");
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600&display=swap');
:root{--v:#00c853;--n:#0a0a0a;--go:#161616;--gm:#222;--gb:#2e2e2e;--b:#f5f5f0;--y:#ffd600;--r:#ff3d3d;}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--n);color:var(--b);font-family:'DM Sans',sans-serif;min-height:100vh;}
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
.pc{background:var(--gm);border:1px solid var(--gb);border-radius:10px;padding:14px;margin-bottom:8px;}
.pm{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
.pg2{font-size:10px;color:var(--v);font-weight:700;letter-spacing:1px;text-transform:uppercase;}
.pf{font-size:10px;color:#666;}
.pe{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.eq{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;}
.ef{font-size:28px;line-height:1;}
.en{font-size:11px;font-weight:600;text-align:center;line-height:1.2;}
.va{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:80px;}
.vs{font-family:'Bebas Neue',sans-serif;font-size:13px;color:#555;letter-spacing:2px;}
.rr{font-family:'Bebas Neue',sans-serif;font-size:26px;color:var(--b);letter-spacing:2px;}
.pi{display:flex;align-items:center;gap:6px;}
.inp{width:40px;height:40px;background:var(--go);border:1.5px solid var(--gb);border-radius:8px;color:var(--b);font-family:'Bebas Neue',sans-serif;font-size:22px;text-align:center;outline:none;transition:border-color .2s;}
.inp:focus{border-color:var(--v);}
.inp::-webkit-inner-spin-button{-webkit-appearance:none;}
.dash{font-family:'Bebas Neue',sans-serif;font-size:20px;color:#555;}
.pg3{font-family:'Bebas Neue',sans-serif;font-size:22px;color:#aaa;letter-spacing:2px;}
.pl{font-size:10px;color:#555;text-align:center;margin-top:2px;letter-spacing:.5px;}
.pb{padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;}
.p3{background:rgba(0,200,83,.15);color:var(--v);border:1px solid rgba(0,200,83,.3);}
.p2{background:rgba(255,214,0,.15);color:var(--y);border:1px solid rgba(255,214,0,.3);}
.p0{background:rgba(255,61,61,.1);color:var(--r);border:1px solid rgba(255,61,61,.2);}
.pn{background:rgba(255,255,255,.05);color:#666;border:1px solid var(--gb);}
.tr{display:flex;align-items:center;padding:12px 14px;border-radius:10px;margin-bottom:6px;background:var(--gm);border:1px solid var(--gb);gap:12px;}
.tr.yo{background:rgba(0,200,83,.08);border-color:rgba(0,200,83,.3);}
.tp{font-family:'Bebas Neue',sans-serif;font-size:20px;color:#555;width:24px;text-align:center;}
.tp.t{color:var(--y);}
.tpt{font-family:'Bebas Neue',sans-serif;font-size:22px;color:var(--v);}
.tpl{font-size:9px;color:#666;text-transform:uppercase;letter-spacing:1px;}
.ai{width:44px;height:36px;background:var(--n);border:1.5px solid var(--gb);border-radius:6px;color:var(--b);font-family:'Bebas Neue',sans-serif;font-size:20px;text-align:center;outline:none;}
.ai:focus{border-color:var(--y);}
.ai::-webkit-inner-spin-button{-webkit-appearance:none;}
.btn{background:var(--v);color:var(--n);border:none;border-radius:8px;padding:10px 20px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .2s,transform .1s;}
.btn:hover{opacity:.9;}
.btn:active{transform:scale(.97);}
.btn:disabled{opacity:.4;cursor:not-allowed;}
.bsm{padding:6px 14px;font-size:11px;border-radius:6px;}
.bol{background:transparent;border:1.5px solid var(--v);color:var(--v);}
.bfl{width:100%;padding:14px;font-size:15px;margin-top:8px;border-radius:10px;}
.tg{display:inline-block;background:rgba(0,200,83,.1);border:1px solid rgba(0,200,83,.25);color:var(--v);font-size:10px;font-weight:700;letter-spacing:1px;padding:2px 8px;border-radius:4px;text-transform:uppercase;margin-right:6px;margin-bottom:8px;cursor:pointer;}
.tg.on,.tg:hover{background:rgba(0,200,83,.25);}
.sx{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin-bottom:16px;scrollbar-width:none;}
.sx::-webkit-scrollbar{display:none;}
.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--v);color:var(--n);padding:10px 20px;border-radius:20px;font-size:13px;font-weight:700;z-index:999;animation:ti .3s ease;white-space:nowrap;}
@keyframes ti{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
.spin{display:flex;align-items:center;justify-content:center;padding:60px 20px;}
.ring{width:36px;height:36px;border:3px solid var(--gb);border-top-color:var(--v);border-radius:50%;animation:sp .8s linear infinite;}
@keyframes sp{to{transform:rotate(360deg);}}
.empty{text-align:center;padding:40px 20px;color:#555;font-size:13px;}
.empty .em{font-size:36px;margin-bottom:12px;}
.ls{min-height:100vh;background:var(--n);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 24px;max-width:430px;margin:0 auto;}
.ll{font-family:'Bebas Neue',sans-serif;font-size:52px;letter-spacing:4px;color:var(--v);line-height:1;margin-bottom:4px;}
.lsub{font-size:12px;color:#666;letter-spacing:3px;text-transform:uppercase;margin-bottom:40px;text-align:center;}
.ig{width:100%;margin-bottom:12px;}
.il{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;display:block;}
.if{width:100%;background:var(--go);border:1.5px solid var(--gb);border-radius:8px;color:var(--b);font-family:'DM Sans',sans-serif;font-size:15px;padding:12px 14px;outline:none;transition:border-color .2s;}
.if:focus{border-color:var(--v);}
.ltg{margin-top:20px;font-size:13px;color:#666;cursor:pointer;}
.ltg span{color:var(--v);font-weight:600;}
.err{background:rgba(255,61,61,.1);border:1px solid rgba(255,61,61,.3);color:var(--r);border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:12px;width:100%;text-align:center;}
.fv{position:fixed;width:300px;height:300px;background:radial-gradient(circle,rgba(0,200,83,.08) 0%,transparent 70%);border-radius:50%;pointer-events:none;top:-100px;right:-100px;}
.chip{display:inline-flex;align-items:center;background:var(--gm);border:1px solid var(--gb);border-radius:20px;padding:4px 10px;font-size:11px;color:#aaa;margin-top:6px;}
.prow{background:var(--gm);border:1px solid var(--gb);border-radius:10px;padding:14px;margin-bottom:10px;}
.prow .lbl{font-size:11px;color:#666;margin-bottom:4px;}
.prow .val{font-weight:600;}
`;

// ─── COMPONENTES PEQUEÑOS ─────────────────────────────────────────────────────

function Pts({ p }) {
  if (p === null || p === undefined) return <span className="pb pn">—</span>;
  if (p === 3) return <span className="pb p3">+3 pts</span>;
  if (p === 2) return <span className="pb p2">+2 pts</span>;
  return <span className="pb p0">0 pts</span>;
}

function Spin() { return <div className="spin"><div className="ring" /></div>; }

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function Login({ onLogin }) {
  const [modo, setModo] = useState("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setErr("");
    if (!email || !pw) { setErr("Completa email y contraseña"); return; }
    if (modo === "registro" && !nombre) { setErr("Escribe tu nombre"); return; }
    setLoading(true);
    try {
      if (modo === "registro") {
        const data = await signUp(email, pw);
        if (!data.access_token && !data.user) throw new Error("Revisa tu email para confirmar la cuenta");
        const token = data.access_token;
        const uid = data.user?.id;
        if (uid && token) {
          await insert("usuarios", { id: uid, nombre, email, es_admin: false }, token);
        }
        onLogin({ ...data.user, nombre, token });
      } else {
        const data = await signIn(email, pw);
        const token = data.access_token;
        const uid = data.user?.id;
        const rows = await select("usuarios", `id=eq.${uid}`, token);
        const perfil = rows?.[0] || { nombre: email, es_admin: false };
        setSesion({ token, uid, ...perfil });
        onLogin({ uid, token, ...perfil });
      }
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="ls">
      <div className="fv" />
      <div className="ll">QUINIELA</div>
      <div className="lsub">Mundial 2026 · México · EE.UU. · Canadá</div>
      {err && <div className="err">{err}</div>}
      {modo === "registro" && (
        <div className="ig">
          <label className="il">Tu nombre</label>
          <input className="if" placeholder="Ej: Carlota" value={nombre} onChange={e => setNombre(e.target.value)} />
        </div>
      )}
      <div className="ig">
        <label className="il">Email</label>
        <input className="if" type="email" placeholder="tu@correo.com" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="ig">
        <label className="il">Contraseña</label>
        <input className="if" type="password" placeholder="••••••••" value={pw}
          onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
      </div>
      <button className="btn bfl" onClick={submit} disabled={loading}>
        {loading ? "Cargando..." : modo === "login" ? "Entrar" : "Crear cuenta"}
      </button>
      <div className="ltg" onClick={() => { setModo(m => m === "login" ? "registro" : "login"); setErr(""); }}>
        {modo === "login" ? <>¿No tienes cuenta? <span>Regístrate</span></> : <>¿Ya tienes cuenta? <span>Inicia sesión</span></>}
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
  const pend = partidos.filter(p => p.goles_local === null && !predIds.has(p.id)).slice(0, 3);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: "#666", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>Bienvenido</div>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, letterSpacing: 2 }}>{usuario.nombre}</div>
        {usuario.es_admin && <div className="chip">⚡ Administrador</div>}
      </div>
      <div className="sg">
        <div className="sc"><div className="sn">{total}</div><div className="sl">Mis puntos</div></div>
        <div className="sc"><div className="sn g">{pos || "—"}°</div><div className="sl">Posición</div></div>
        <div className="sc"><div className="sn">{mias.length}</div><div className="sl">Predicciones</div></div>
        <div className="sc"><div className="sn">{partidos.filter(p => p.goles_local !== null).length}</div><div className="sl">Resultados</div></div>
      </div>
      <div className="ttl">Pendientes <em>por predecir</em></div>
      {pend.length === 0
        ? <div className="empty"><div className="em">✅</div>¡Al día con tus predicciones!</div>
        : pend.map(p => (
          <div key={p.id} className="pc">
            <div className="pm"><span className="pg2">Grupo {p.grupo}</span><span className="pf">{formatFecha(p.fecha)}</span></div>
            <div className="pe">
              <div className="eq"><div className="ef">{BANDERAS[p.local] || "🏳️"}</div><div className="en">{p.local}</div></div>
              <div className="va"><div className="vs">VS</div></div>
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
  const [inp, setInp] = useState({});
  const [saving, setSaving] = useState({});
  const grupos = [...new Set(partidos.map(p => p.grupo))].sort();

  async function guardar(p) {
    const v = inp[p.id];
    if (!v || v.l === undefined || v.v === undefined || v.l === "" || v.v === "") { toast("⚠️ Ingresa ambos marcadores"); return; }
    setSaving(s => ({ ...s, [p.id]: true }));
    try {
      await upsert("predicciones", {
        usuario_id: usuario.uid, partido_id: p.id,
        pred_local: parseInt(v.l), pred_visitante: parseInt(v.v), puntos: null,
      }, usuario.token);
      toast("✅ Predicción guardada");
      await reload();
      setInp(prev => { const n = { ...prev }; delete n[p.id]; return n; });
    } catch (e) { toast("❌ " + e.message); }
    finally { setSaving(s => ({ ...s, [p.id]: false })); }
  }

  return (
    <div>
      <div className="ttl">Quiniela <em>Mundial 2026</em></div>
      <div className="sx">
        {grupos.map(g => <span key={g} className={`tg ${grupo === g ? "on" : ""}`} onClick={() => setGrupo(g)}>Grupo {g}</span>)}
      </div>
      {partidos.filter(p => p.grupo === grupo).length === 0 &&
        <div className="empty"><div className="em">📅</div>No hay partidos en este grupo todavía.</div>}
      {partidos.filter(p => p.grupo === grupo).map(p => {
        const pred = preds.find(x => x.usuario_id === usuario.uid && x.partido_id === p.id);
        const tieneRes = p.goles_local !== null;
        const pts = pred ? calcularPuntos(pred.pred_local, pred.pred_visitante, p.goles_local, p.goles_visitante) : null;
        const v = inp[p.id] || {};
        return (
          <div key={p.id} className="pc">
            <div className="pm">
              <span className="pg2">Grupo {p.grupo}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="pf">{formatFecha(p.fecha)}</span>
                {pred && <Pts p={pts} />}
              </div>
            </div>
            <div className="pe">
              <div className="eq"><div className="ef">{BANDERAS[p.local] || "🏳️"}</div><div className="en">{p.local}</div></div>
              <div className="va">
                {tieneRes ? (
                  <><div className="rr">{p.goles_local} – {p.goles_visitante}</div>
                  <div style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>RESULTADO</div>
                  {pred && <div style={{ fontSize: 10, color: "#666" }}>Pred: {pred.pred_local}–{pred.pred_visitante}</div>}</>
                ) : pred ? (
                  <><div className="pg3">{pred.pred_local} – {pred.pred_visitante}</div><div className="pl">TU PRED</div></>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div className="pi">
                      <input type="number" min="0" max="20" className="inp" value={v.l ?? ""} placeholder="–"
                        onChange={e => setInp(prev => ({ ...prev, [p.id]: { ...prev[p.id], l: e.target.value } }))} />
                      <span className="dash">–</span>
                      <input type="number" min="0" max="20" className="inp" value={v.v ?? ""} placeholder="–"
                        onChange={e => setInp(prev => ({ ...prev, [p.id]: { ...prev[p.id], v: e.target.value } }))} />
                    </div>
                    <button className="btn bsm" disabled={saving[p.id]} onClick={() => guardar(p)}>
                      {saving[p.id] ? "..." : "Guardar"}
                    </button>
                  </div>
                )}
              </div>
              <div className="eq"><div className="ef">{BANDERAS[p.visitante] || "🏳️"}</div><div className="en">{p.visitante}</div></div>
            </div>
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
    return { ...u, pts: mp.reduce((a, p) => a + p.puntos, 0), ex: mp.filter(p => p.puntos === 3).length, gn: mp.filter(p => p.puntos === 2).length };
  }).sort((a, b) => b.pts - a.pts || b.ex - a.ex);

  return (
    <div>
      <div className="ttl">Tabla <em>de posiciones</em></div>
      <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, textAlign: "right" }}>Exacto=3pts · Ganador=2pts</div>
      {rank.length === 0 && <div className="empty"><div className="em">👥</div>Aún no hay participantes</div>}
      {rank.map((u, i) => (
        <div key={u.id} className={`tr ${u.id === usuario.uid ? "yo" : ""}`}>
          <div className={`tp ${i < 3 ? "t" : ""}`}>{i + 1}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: 14 }}>
              {u.nombre} {u.id === usuario.uid && <span style={{ fontSize: 10, color: "var(--v)" }}>· tú</span>}
            </div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{u.ex} exactos · {u.gn} ganadores</div>
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
  const [inp, setInp] = useState({});
  const [saving, setSaving] = useState({});
  const grupos = [...new Set(partidos.map(p => p.grupo))].sort();

  async function guardar(p) {
    const r = inp[p.id];
    if (!r || r.l === "" || r.v === "" || r.l === undefined || r.v === undefined) { toast("⚠️ Ingresa ambos goles"); return; }
    setSaving(s => ({ ...s, [p.id]: true }));
    const gL = parseInt(r.l), gV = parseInt(r.v);
    try {
      await update("partidos", { goles_local: gL, goles_visitante: gV }, `id=eq.${p.id}`, usuario.token);
      const mp = preds.filter(x => x.partido_id === p.id);
      for (const pred of mp) {
        const pts = calcularPuntos(pred.pred_local, pred.pred_visitante, gL, gV);
        await update("predicciones", { puntos: pts }, `id=eq.${pred.id}`, usuario.token);
      }
      toast(`⚡ Guardado · ${mp.length} predicciones actualizadas`);
      await reload();
      setInp(prev => { const n = { ...prev }; delete n[p.id]; return n; });
    } catch (e) { toast("❌ " + e.message); }
    finally { setSaving(s => ({ ...s, [p.id]: false })); }
  }

  async function limpiar(id) {
    try {
      await update("partidos", { goles_local: null, goles_visitante: null }, `id=eq.${id}`, usuario.token);
      await reload(); toast("🗑️ Resultado eliminado");
    } catch (e) { toast("❌ " + e.message); }
  }

  return (
    <div>
      <div className="ttl">Admin <em>· Resultados</em></div>
      <div style={{ background: "rgba(255,214,0,.07)", border: "1px solid rgba(255,214,0,.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#aaa" }}>
        ⚡ Ingresa los resultados reales. Los puntos se calculan automáticamente.
      </div>
      <div className="sx">
        {grupos.map(g => <span key={g} className={`tg ${grupo === g ? "on" : ""}`} onClick={() => setGrupo(g)}>Grupo {g}</span>)}
      </div>
      {partidos.filter(p => p.grupo === grupo).map(p => {
        const r = inp[p.id] || {};
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
            <div className="pe">
              <div className="eq"><div className="ef">{BANDERAS[p.local] || "🏳️"}</div><div className="en">{p.local}</div></div>
              <div className="va">
                {p.goles_local !== null ? (
                  <div style={{ textAlign: "center" }}>
                    <div className="rr">{p.goles_local} – {p.goles_visitante}</div>
                    <button className="btn bsm bol" style={{ marginTop: 6 }} onClick={() => limpiar(p.id)}>Editar</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div className="pi">
                      <input type="number" min="0" max="20" className="ai" value={r.l ?? ""} placeholder="–"
                        onChange={e => setInp(prev => ({ ...prev, [p.id]: { ...prev[p.id], l: e.target.value } }))} />
                      <span className="dash">–</span>
                      <input type="number" min="0" max="20" className="ai" value={r.v ?? ""} placeholder="–"
                        onChange={e => setInp(prev => ({ ...prev, [p.id]: { ...prev[p.id], v: e.target.value } }))} />
                    </div>
                    <button className="btn bsm" disabled={saving[p.id]} onClick={() => guardar(p)}>
                      {saving[p.id] ? "..." : "Guardar"}
                    </button>
                  </div>
                )}
              </div>
              <div className="eq"><div className="ef">{BANDERAS[p.visitante] || "🏳️"}</div><div className="en">{p.visitante}</div></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PERFIL ───────────────────────────────────────────────────────────────────

function Perfil({ usuario, onLogout }) {
  async function logout() {
    try { await signOut(usuario.token); } catch {}
    setSesion(null);
    onLogout();
  }
  return (
    <div>
      <div className="ttl">Mi <em>perfil</em></div>
      <div className="prow"><div className="lbl">Nombre</div><div className="val">{usuario.nombre}</div></div>
      <div className="prow"><div className="lbl">Email</div><div className="val">{usuario.email}</div></div>
      {usuario.es_admin && <div className="prow"><div className="lbl">Rol</div><div className="val" style={{ color: "var(--y)" }}>⚡ Administrador</div></div>}
      <button className="btn bol bfl" style={{ marginTop: 8 }} onClick={logout}>Cerrar sesión</button>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [iniciando, setIniciando] = useState(true);
  const [tab, setTab] = useState("inicio");
  const [partidos, setPartidos] = useState([]);
  const [preds, setPreds] = useState([]);
  const [users, setUsers] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [msg, setMsg] = useState(null);

  function toast(m) { setMsg(m); setTimeout(() => setMsg(null), 2500); }

  // Restaurar sesión
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
        select("partidos", "order=fecha.asc", token),
        select("predicciones", "", token),
        select("usuarios", "", token),
      ]);
      setPartidos(parts || []);
      setPreds(ps || []);
      setUsers(us || []);
    } catch (e) { toast("❌ Error cargando datos: " + e.message); }
    finally { setCargando(false); }
  }, []);

  useEffect(() => { if (usuario?.token) cargar(usuario.token); }, [usuario, cargar]);

  async function reloadPreds() {
    const ps = await select("predicciones", "", usuario.token);
    setPreds(ps || []);
  }

  async function reloadTodo() { await cargar(usuario.token); }

  function handleLogin(u) {
    const sesion = { uid: u.uid || u.id, token: u.token || u.access_token, nombre: u.nombre, email: u.email, es_admin: u.es_admin || false };
    setSesion(sesion);
    setUsuario(sesion);
  }

  const TABS = [
    { id: "inicio", label: "Inicio", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { id: "quiniela", label: "Quiniela", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
    { id: "tabla", label: "Tabla", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> },
    ...(usuario?.es_admin ? [{ id: "admin", label: "Admin", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg> }] : []),
    { id: "perfil", label: "Perfil", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  ];

  if (iniciando) return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 36, color: "#00c853", letterSpacing: 4 }}>QUINIELA 2026</div>
        <div className="ring" />
      </div>
    </>
  );

  if (!usuario) return <><style>{CSS}</style><Login onLogin={handleLogin} /></>;

  if (cargando) return (
    <>
      <style>{CSS}</style>
      <div style={{ minHeight: "100vh", background: "#0a0a0a" }}><Spin /></div>
    </>
  );

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
          {tab === "inicio" && <Inicio usuario={usuario} partidos={partidos} preds={preds} users={users} />}
          {tab === "quiniela" && <Quiniela usuario={usuario} partidos={partidos} preds={preds} reload={reloadPreds} toast={toast} />}
          {tab === "tabla" && <Tabla usuario={usuario} preds={preds} users={users} />}
          {tab === "admin" && <Admin usuario={usuario} partidos={partidos} preds={preds} reload={reloadTodo} toast={toast} />}
          {tab === "perfil" && <Perfil usuario={usuario} onLogout={() => { setUsuario(null); setTab("inicio"); }} />}
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
