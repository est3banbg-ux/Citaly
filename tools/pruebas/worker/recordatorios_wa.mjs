/* Pruebas del Worker: recordatorios automáticos por WhatsApp.
   Corre el worker.js REAL en Node con internet falso (Firestore, Meta, FCM y Resend en memoria). No manda nada de verdad.
   Uso: node tools/pruebas/worker/recordatorios_wa.mjs   (o python3 tools/pruebas/correr.py worker) */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const copia = path.join(os.tmpdir(), "citaly-worker-" + process.pid + ".mjs");
fs.copyFileSync(path.join(aqui, "..", "..", "..", "webhook", "worker.js"), copia);
const W = (await import(pathToFileURL(copia).href)).default;
fs.unlinkSync(copia);

/* ---------- reloj falso ---------- */
const realNow = Date.now.bind(Date);
let AHORA = realNow();
Date.now = () => AHORA;
const cr = (iso) => Date.parse(iso + "-06:00"); // hora de Costa Rica → ms
const dia = (ms) => new Date(ms - 6 * 3600e3).toISOString().slice(0, 10);

/* ---------- llaves ---------- */
const P = "citaly-prueba";
const gen = () => crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const b64 = (buf) => Buffer.from(buf).toString("base64");
const b64u = (x) => Buffer.from(x).toString("base64url");
const svc = await gen(), idk = await gen();
const PEM = "-----BEGIN PRIVATE KEY-----\n" + b64(await crypto.subtle.exportKey("pkcs8", svc.privateKey)) + "\n-----END PRIVATE KEY-----\n";
const JWK = { ...(await crypto.subtle.exportKey("jwk", idk.publicKey)), kid: "k1", alg: "RS256", use: "sig" };
async function idToken(uid, email, verificado = true) {
  const now = Math.floor(AHORA / 1000), h = b64u(JSON.stringify({ alg: "RS256", kid: "k1", typ: "JWT" }));
  const p = b64u(JSON.stringify({ aud: P, iss: "https://securetoken.google.com/" + P, sub: uid, iat: now - 10, exp: now + 3000, email, email_verified: verificado }));
  return h + "." + p + "." + b64u(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", idk.privateKey, new TextEncoder().encode(h + "." + p)));
}
const ENV0 = { FB_PROJECT: P, FB_CLIENT_EMAIL: "svc@prueba", FB_PRIVATE_KEY: PEM, WA_TOKEN: "tok-secreto", WA_PHONE_ID: "111222", WA_VERIFY: "verifica", WA_APP_SECRET: "appsecreto" };

/* ---------- Firestore falso ---------- */
let DB, LOG, META;
const BASE = `https://firestore.googleapis.com/v1/projects/${P}/databases/(default)/documents`;
const NAME = `projects/${P}/databases/(default)/documents/`;
const fv = (x) => x === null || x === undefined ? { nullValue: null } : typeof x === "string" ? { stringValue: x } : typeof x === "boolean" ? { booleanValue: x } : typeof x === "number" ? { integerValue: String(Math.round(x)) }
  : x instanceof Date ? { timestampValue: x.toISOString() } : Array.isArray(x) ? { arrayValue: { values: x.map(fv) } } : { mapValue: { fields: ff(x) } };
const ff = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, fv(v)]));
const uv = (v) => !v ? undefined : "stringValue" in v ? v.stringValue : "integerValue" in v ? Number(v.integerValue) : "booleanValue" in v ? v.booleanValue : "timestampValue" in v ? Date.parse(v.timestampValue)
  : "mapValue" in v ? uf(v.mapValue.fields) : "arrayValue" in v ? (v.arrayValue.values || []).map(uv) : null;
const uf = (f) => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, uv(v)]));
const put = (p, o) => DB.set(p, ff(o));
const doc = (p) => (DB.has(p) ? uf(DB.get(p)) : null);
const campo = (fields, fp) => fp.split(".").reduce((a, k) => (a && a.mapValue ? a.mapValue.fields[k] : a && a[k]), { mapValue: { fields } });
const J = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json" } });
const ut = (p) => "u" + [...JSON.stringify(DB.get(p) || null)].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7); // «updateTime»: cambia cada vez que cambia el documento

async function falso(url, init = {}) {
  url = String(url); const m = (init.method || "GET").toUpperCase(), body = init.body ? String(init.body) : "";
  LOG.push({ m, url, body });
  if (META.max && LOG.length > META.max) throw new Error("Too many subrequests."); // como el límite de Cloudflare
  if (META.romper && META.romper(url, m, body)) throw new Error("falla de red provocada");
  if (META.lat) await new Promise((r) => setTimeout(r, 5 + Math.random() * META.lat));
  if (url.startsWith("https://oauth2.googleapis.com/token")) return J({ access_token: "tk" });
  if (url.includes("/jwk/securetoken@system.gserviceaccount.com")) return J({ keys: [JWK] });
  if (url.startsWith("https://fcm.googleapis.com/")) { META.push.push(JSON.parse(body).message.data); return J({ name: "ok" }); }
  if (url.startsWith("https://api.resend.com/")) { META.mail.push(JSON.parse(body)); return J({ id: "m" }); }
  if (url.startsWith("https://graph.facebook.com/")) {
    const b = JSON.parse(body); META.wa.push({ url, auth: (init.headers || {}).authorization, ...b });
    return META.falla ? J({ error: { code: 131026, message: "no" } }, 400) : J({ messages: [{ id: "wamid." + META.wa.length }] });
  }
  if (url.startsWith("https://firestore.googleapis.com/v1/" + NAME) && m === "DELETE") { DB.delete(url.split(NAME)[1]); return J({}); }
  if (!url.startsWith(BASE)) throw new Error("internet falso: no conozco " + url);
  let rest = url.slice(BASE.length);
  if (rest === ":commit") {
    if (META.choque > 0) { META.choque--; return J({ error: { code: 409, status: "ABORTED" } }, 409); } // choque de escrituras
    const res = [], writes = JSON.parse(body).writes;
    for (const w of writes) if (w.currentDocument && w.currentDocument.exists === false && DB.has(w.update.name.replace(NAME, ""))) return J({ error: { code: 409, status: "ALREADY_EXISTS" } }, 409); // todo o nada
    for (const w of writes) if (w.currentDocument && w.currentDocument.exists === true && !DB.has(w.update.name.replace(NAME, ""))) return J({ error: { code: 404, status: "NOT_FOUND" } }, 404);
    for (const w of writes) if (w.currentDocument && w.currentDocument.updateTime !== undefined && (!DB.has(w.update.name.replace(NAME, "")) || ut(w.update.name.replace(NAME, "")) !== w.currentDocument.updateTime)) return J({ error: { code: 400, status: "FAILED_PRECONDITION" } }, 400);
    for (const w of writes) {
      if (w.delete) { DB.delete(w.delete.replace(NAME, "")); res.push({}); continue; }
      const p = w.update.name.replace(NAME, ""), f = w.updateMask ? DB.get(p) || {} : { ...w.update.fields }; DB.set(p, f);
      for (const k of (w.updateMask || {}).fieldPaths || []) { if (k in w.update.fields) f[k] = w.update.fields[k]; else delete f[k]; }
      const tr = [];
      for (const t of w.updateTransforms || []) { const n = Number((f[t.fieldPath] || {}).integerValue || 0) + Number(t.increment.integerValue); f[t.fieldPath] = { integerValue: String(n) }; tr.push({ integerValue: String(n) }); }
      res.push({ transformResults: tr });
    }
    return J({ writeResults: res });
  }
  if (rest.endsWith(":runQuery")) {
    const padre = rest.slice(0, -":runQuery".length).replace(/^\//, ""), q = JSON.parse(body).structuredQuery, col = (padre ? padre + "/" : "") + q.from[0].collectionId + "/";
    const f = q.where.fieldFilter, out = [];
    for (const [p, fields] of DB) {
      if (!p.startsWith(col) || p.slice(col.length).includes("/")) continue;
      let ok;
      if (f.field.fieldPath === "__name__") ok = NAME + p === f.value.referenceValue;
      else { const a = uv(campo(fields, f.field.fieldPath)), z = uv(f.value); ok = f.op === "EQUAL" ? a === z : f.op === "GREATER_THAN_OR_EQUAL" ? a !== undefined && a >= z : false; }
      if (ok) out.push({ document: { name: NAME + p, fields } });
    }
    return J(out.length ? out.slice(0, q.limit || 999) : [{ readTime: "x" }]);
  }
  const [ruta, qs] = rest.replace(/^\//, "").split("?"), seg = ruta.split("/");
  if (m === "PATCH") {
    const f = DB.get(ruta) || {}, nuevo = JSON.parse(body).fields || {}; DB.set(ruta, f);
    for (const k of new URLSearchParams(qs || "").getAll("updateMask.fieldPaths")) { if (k in nuevo) f[k] = nuevo[k]; else delete f[k]; }
    return J({ name: NAME + ruta, fields: f });
  }
  if (seg.length % 2) { // colección
    const docs = [...DB].filter(([p]) => p.startsWith(ruta + "/") && !p.slice(ruta.length + 1).includes("/")).map(([p, fields]) => ({ name: NAME + p, fields }));
    return J(docs.length ? { documents: docs } : {});
  }
  return DB.has(ruta) ? J({ name: NAME + ruta, fields: DB.get(ruta), updateTime: ut(ruta) }) : J({ error: { code: 404 } }, 404);
}
globalThis.fetch = falso;

/* ---------- ayudas ---------- */
function limpio() { DB = new Map(); LOG = []; META = { wa: [], push: [], mail: [], falla: false, lat: 0, romper: null, max: 0, choque: 0 }; }
const post = (ruta, o, env = ENV0, headers = {}) => W.fetch(new Request("https://w.prueba" + ruta, { method: "POST", headers: { origin: "https://citalyapp.com", "content-type": "application/json", ...headers }, body: typeof o === "string" ? o : JSON.stringify(o) }), env);
async function cron(env = ENV0, cual = "0 * * * *") { const p = []; LOG = []; await W.scheduled({ cron: cual, scheduledTime: AHORA }, env, { waitUntil: (x) => p.push(x) }); await Promise.all(p); return LOG.length; }
function negocio(bid, extra = {}, sub = {}) {
  put("biz/" + bid, { name: "Car Keyss Detailing", slug: "car-keyss", wa: "61506610", country: "CR", waAuto: { on: true }, ...extra });
  put("subs/" + bid, { plan: "mensual", tier: "nitro", status: "active", until: new Date(AHORA + 20 * 864e5), ...sub });
  put(`biz/${bid}/push/p1`, { t: "celular-del-dueno" });
}
const TK = "abcdefghijkmnpqrstuvwxyz"; // 24 letras, como newTok() de la página de reservas
function cita(bid, jid, extra = {}) { put(`biz/${bid}/jobs/${jid}`, { cli: "Ana María Rojas", tel: "88887777", date: dia(AHORA + 864e5), time: "10:00", items: ["Lavado completo"], st: "Por confirmar", web: true, at: AHORA, tk: TK, ...extra }); }
const J_ = (bid, jid) => doc(`biz/${bid}/jobs/${jid}`);
const usados = (bid, prueba) => (doc(prueba ? `wa/${bid}_prueba` : `wa/${bid}_${dia(AHORA).slice(0, 7)}`) || {}).n || 0;
const PRUEBA = { plan: "trial", status: "trial", tier: null };
let mal = 0, n = 0;
function ok(cond, que) { n++; if (cond) console.log("  ✅ " + que); else { mal++; console.log("  ❌ " + que); } }
const igual = (a, b, que) => ok(JSON.stringify(a) === JSON.stringify(b), que + (JSON.stringify(a) === JSON.stringify(b) ? "" : `\n       esperaba ${JSON.stringify(b)}\n       llegó    ${JSON.stringify(a)}`));
const titulo = (t) => console.log("\n" + t);
const firma = async (cuerpo, secreto = ENV0.WA_APP_SECRET) => { const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(secreto), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return "sha256=" + Buffer.from(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(cuerpo))).toString("hex"); };

/* =====================  CONFIRMACIÓN AL RESERVAR  ===================== */
titulo("Confirmación al reservar (ruta /push)");
AHORA = cr("2026-12-03T09:15:00"); // jueves 3 dic, 9:15 a. m.
limpio(); negocio("b1"); cita("b1", "j1");
let r = await (await post("/push", { ev: "new", biz: "b1", job: "j1" })).json();
ok(r.ok && r.w === 1, "responde ok y dice que mandó 1 WhatsApp");
igual(META.wa.length, 1, "sale UN mensaje a Meta");
let w = META.wa[0] || { template: { components: [] } };
ok(w.url === "https://graph.facebook.com/v25.0/111222/messages" && w.auth === "Bearer tok-secreto", "usa el número y la llave de Citaly");
igual(w.to, "50688887777", "le agrega el 506 al número del cliente");
igual(w.template.name, "reserva_recibida", "usa la plantilla de reserva recibida");
igual(w.template.language, { code: "es" }, "plantilla en español");
igual((w.template.components[0] || {}).parameters, [{ type: "text", text: "Ana" }, { type: "text", text: "Car Keyss Detailing" }, { type: "text", text: "viernes 4 de diciembre a las 10:00 am" }], "nombre, negocio y fecha bien escritos");
igual(w.template.components[1], { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: "car-keyss." + TK }] }, "el botón lleva al link corto de «Mi cita»");
ok(J_("b1", "j1").waC === AHORA && !J_("b1", "j1").waE, "la cita queda marcada con waC y sin error");
igual(usados("b1"), 1, "cuenta 1 mensaje en el mes");
igual([doc("waTo/50688887777").biz, doc("waTo/50688887777").job, doc("waTo/50688887777").bwa, doc("waTo/50688887777").cli], ["b1", "j1", "50661506610", "Ana"], "guarda de qué negocio y cita fue (solo el primer nombre), para cuando el cliente conteste");
ok(!!doc("wa/c_b1_j1") && doc("wa/t_50688887777_2026-12-03").n === 1 && doc("wa/d_b1_2026-12-03").n === 1 && doc("wa/_dia_2026-12-03").n === 1, "deja el candado del mensaje y suma en las cuentas del día (número, negocio y plataforma)");
ok(META.push.length === 1, "el aviso al celular del dueño sigue saliendo igual");
r = await (await post("/push", { ev: "new", biz: "b1", job: "j1" })).json();
ok(META.wa.length === 1 && usados("b1") === 1, "si la página avisa dos veces, NO se manda ni se cuenta dos veces");

titulo("Quién NO recibe confirmación");
const caso = async (que, armar, espera = 0, prueba = false) => { limpio(); armar(); const x = await (await post("/push", { ev: "new", biz: "b1", job: "j1" })).json(); ok(x.ok === true && META.wa.length === espera && usados("b1", prueba) === espera && META.push.length === 1, que); };
await caso("negocio con la función apagada", () => { negocio("b1", { waAuto: { on: false } }); cita("b1", "j1"); });
await caso("negocio que nunca la encendió (sin waAuto)", () => { negocio("b1", { waAuto: null }); cita("b1", "j1"); });
await caso("apagó solo la confirmación", () => { negocio("b1", { waAuto: { on: true, conf: false } }); cita("b1", "j1"); });
await caso("plan Arranque sin el extra", () => { negocio("b1", {}, { tier: "arranque" }); cita("b1", "j1"); });
await caso("plan Turbo sin el extra", () => { negocio("b1", {}, { tier: "turbo" }); cita("b1", "j1"); });
await caso("plan suspendido", () => { negocio("b1", {}, { status: "suspended" }); cita("b1", "j1"); });
await caso("plan vencido", () => { negocio("b1", {}, { until: new Date(AHORA - 864e5) }); cita("b1", "j1"); });
await caso("cita sin link «Mi cita» (sin tk)", () => { negocio("b1"); cita("b1", "j1", { tk: null }); });
await caso("cuenta demo", () => { negocio("b1", {}, { demo: true }); cita("b1", "j1"); });
await caso("cita con la hora mal escrita", () => { negocio("b1"); cita("b1", "j1", { time: "mañana" }); });
await caso("cita con fecha imposible (mes 13)", () => { negocio("b1"); cita("b1", "j1", { date: "2026-13-04" }); });
titulo("Quién SÍ la recibe");
await caso("Arranque CON el extra (subs.waauto)", () => { negocio("b1", {}, { tier: "arranque", waauto: true }); cita("b1", "j1"); }, 1);
await caso("prueba gratis", () => { negocio("b1", {}, PRUEBA); cita("b1", "j1"); }, 1, true);
await caso("cuenta vieja sin tier y sin mensualidad (se trata como Nitro, igual que la app)", () => { negocio("b1", {}, { plan: "setup", tier: null }); cita("b1", "j1"); }, 1);

titulo("Sin WhatsApp conectado en el servidor");
limpio(); negocio("b1"); cita("b1", "j1");
r = await (await post("/push", { ev: "new", biz: "b1", job: "j1" }, { ...ENV0, WA_TOKEN: "" })).json();
ok(r.ok && r.w === 0 && META.wa.length === 0 && META.push.length === 1, "no manda nada y el aviso al dueño funciona igual que antes");

titulo("Números, nombres y países");
limpio(); negocio("b1"); cita("b1", "j1", { tel: "123" });
await post("/push", { ev: "new", biz: "b1", job: "j1" });
ok(META.wa.length === 0 && J_("b1", "j1").waE === "tel" && usados("b1") === 0, "número inválido: no manda, no cuenta y deja waE = tel");
limpio(); negocio("b1", { country: "PA" }); cita("b1", "j1", { tel: "61234567", cli: "  José\nLuis   Mora " });
await post("/push", { ev: "new", biz: "b1", job: "j1" });
igual([META.wa[0].to, META.wa[0].template.components[0].parameters[0].text], ["50761234567", "José"], "negocio de Panamá usa 507; el nombre va limpio, sin saltos de línea");
limpio(); negocio("b1"); cita("b1", "j1", { tel: "50688887777", time: "13:05" });
await post("/push", { ev: "new", biz: "b1", job: "j1" });
igual([META.wa[0].to, META.wa[0].template.components[0].parameters[2].text], ["50688887777", "viernes 4 de diciembre a la 1:05 pm"], "número que ya trae el 506 se respeta; «a la 1:05 pm»");
for (const tel of ["50761234567", "447700900123", "12025550123"]) {
  limpio(); negocio("b1"); cita("b1", "j1", { tel }); await post("/push", { ev: "new", biz: "b1", job: "j1" });
  ok(META.wa.length === 0 && J_("b1", "j1").waE === "tel" && usados("b1") === 0, "negocio de Costa Rica NO le escribe a un número de otro país (" + tel + ")");
}
limpio(); negocio("b1", { name: "Banco X: entre ya a www.robo.com/clave o llame al 8888-9999 ahora" }); cita("b1", "j1", { cli: "http://malo.ly/x Pedro" });
await post("/push", { ev: "new", biz: "b1", job: "j1" });
igual(META.wa[0].template.components[0].parameters.slice(0, 2).map((x) => x.text), ["👋", "Banco X: entre ya a o llame al ahora"], "a los nombres se les quitan los links y los teléfonos (nadie puede usar los avisos para mandar otra cosa)");

titulo("Cuando Meta no acepta el mensaje");
limpio(); negocio("b1"); cita("b1", "j1"); META.falla = true;
r = await (await post("/push", { ev: "new", biz: "b1", job: "j1" })).json();
ok(r.ok && r.w === 0 && !J_("b1", "j1").waC && J_("b1", "j1").waE === "error" && usados("b1") === 0, "no marca enviado, deja waE = error y devuelve el mensaje a la cuenta");

titulo("Tope de mensajes");
limpio(); negocio("b1", {}, PRUEBA); cita("b1", "j1"); cita("b1", "j2", { tel: "88886666" });
put("wa/b1_prueba", { n: 20 });
await post("/push", { ev: "new", biz: "b1", job: "j1" });
ok(META.wa.length === 0 && J_("b1", "j1").waE === "tope" && usados("b1", true) === 20 && !doc("wa/c_b1_j1") && !doc("wa/_dia_2026-12-03").n, "en la prueba, con 20 usados no manda más, la cuenta se queda en 20 y no queda nada apartado");
ok(META.push.length === 2 && /Se acabaron/.test(META.push[1].title) && /20 mensajes de tu prueba/.test(META.push[1].body), "le avisa al dueño que se acabaron");
await post("/push", { ev: "new", biz: "b1", job: "j2" });
ok(META.push.filter((p) => /Se acabaron/.test(p.title)).length === 1, "ese aviso sale una sola vez al mes");
limpio(); negocio("b1"); cita("b1", "j1"); put("wa/b1_2026-12", { n: 149 });
await post("/push", { ev: "new", biz: "b1", job: "j1" });
ok(META.wa.length === 1 && usados("b1") === 150, "Nitro: el mensaje 150 sí sale");
AHORA = cr("2026-11-30T10:00:00"); limpio(); negocio("b1", {}, PRUEBA); put("wa/b1_prueba", { n: 20 }); cita("b1", "j1");
AHORA = cr("2026-12-01T10:00:00"); put("biz/b1/jobs/j1", { ...J_("b1", "j1"), at: AHORA });
await post("/push", { ev: "new", biz: "b1", job: "j1" });
igual(META.wa.length, 0, "la prueba gratis NO recibe otros 20 mensajes al cambiar de mes");
AHORA = cr("2026-12-03T09:15:00");

titulo("Frenos contra abuso");
limpio(); negocio("b1"); negocio("b2", { slug: "otro-negocio" });
for (let i = 0; i < 4; i++) { cita(i % 2 ? "b2" : "b1", "j" + i); await post("/push", { ev: "new", biz: i % 2 ? "b2" : "b1", job: "j" + i }); }
ok(META.wa.length === 3 && J_("b2", "j3").waE === "freno" && usados("b1") + usados("b2") === 3, "un mismo número recibe como mucho 3 mensajes al día entre todos los negocios; el cuarto no sale ni se cuenta");
limpio(); negocio("b1"); put("wa/d_b1_2026-12-03", { n: 50 }); cita("b1", "j1");
await post("/push", { ev: "new", biz: "b1", job: "j1" });
ok(META.wa.length === 0 && J_("b1", "j1").waE === "freno" && usados("b1") === 0, "un negocio manda como mucho 50 al día");
limpio(); negocio("b1"); put("wa/_dia_2026-12-03", { n: 300 }); cita("b1", "j1");
await post("/push", { ev: "new", biz: "b1", job: "j1" }, { ...ENV0, RESEND_KEY: "re" });
ok(META.wa.length === 0 && J_("b1", "j1").waE === "freno" && doc("wa/_dia_2026-12-03").n === 300, "freno de toda la plataforma: 300 al día");
ok(META.mail.length === 1 && /freno de WhatsApp/.test(META.mail[0].subject), "y le llega un correo al admin");
cita("b1", "j2", { tel: "88880009" }); await post("/push", { ev: "new", biz: "b1", job: "j2" }, { ...ENV0, RESEND_KEY: "re" });
igual(META.mail.length, 1, "ese correo sale una sola vez al día");
limpio(); negocio("b1"); put("wa/_dia_2026-12-03", { n: 300 }); cita("b1", "j1");
await post("/push", { ev: "new", biz: "b1", job: "j1" }, { ...ENV0, WA_DIA_MAX: "500" });
igual(META.wa.length, 1, "el freno de la plataforma se puede subir con WA_DIA_MAX");
limpio(); negocio("b1", {}, PRUEBA); put("wa/_diap_2026-12-03", { n: 60 }); cita("b1", "j1");
await post("/push", { ev: "new", biz: "b1", job: "j1" });
ok(META.wa.length === 0 && usados("b1", true) === 0, "todas las pruebas gratis juntas mandan como mucho 60 al día");

titulo("Avisos repetidos al mismo tiempo");
limpio(); negocio("b1"); cita("b1", "j1"); META.lat = 60;
const varias = await Promise.all([1, 2, 3, 4, 5, 6].map(() => post("/push", { ev: "new", biz: "b1", job: "j1" }).then((x) => x.json())));
ok(META.wa.length === 1 && usados("b1") === 1 && doc("wa/t_50688887777_2026-12-03").n === 1, `6 avisos de la misma reserva a la vez: sale UN solo WhatsApp y se cuenta una vez (salieron ${META.wa.length})`);
META.lat = 0;

/* =====================  RECORDATORIO DEL DÍA ANTES  ===================== */
titulo("Recordatorio del día antes (cron)");
AHORA = cr("2026-12-03T16:05:00"); // jueves 4:05 p. m.
limpio(); negocio("b1");
const man = "2026-12-04", ayer = AHORA - 26 * 3600e3;
cita("b1", "web", { at: ayer, waC: ayer });                                  // reservó ayer por la página
cita("b1", "mano", { tk: null, web: false, time: "08:30", tel: "88880001" }); // la agendó el dueño a mano
cita("b1", "cancel", { st: "Cancelada", tel: "88880002" });
cita("b1", "lista", { st: "Lista", tel: "88880003" });
cita("b1", "recien", { waC: AHORA - 2 * 3600e3, tel: "88880004", time: "15:00" }); // reservó hace 2 horas
cita("b1", "yasalio", { waR: ayer, waRd: man, waRt: man, tel: "88880005" });
cita("b1", "hoy", { date: "2026-12-03", tel: "88880006" });
cita("b1", "pasado", { date: "2026-12-05", tel: "88880007" });
cita("b1", "malnum", { tel: "12", time: "09:00" });
await cron();
igual(META.wa.map((x) => x.to + " " + x.template.name), ["50688880001 cita_recordatorio", "50688887777 cita_recordatorio"], "solo salen los 2 que tocan, en orden de hora, con la misma plantilla");
igual(META.wa[1].template.components[0].parameters[2].text, "mañana viernes 4 de diciembre a las 10:00 am", "el texto dice «mañana viernes 4 de diciembre…»");
const qr = (i, p) => ({ type: "button", sub_type: "quick_reply", index: String(i), parameters: [{ type: "payload", payload: p }] });
igual(META.wa[1].template.components.slice(1), [qr(0, "ok.b1.web.202612041000"), qr(1, "no.b1.web.202612041000")], "lleva los dos botones de respuesta («Confirmo» y «No puedo ir»), cada uno con su cita, su día y su hora");
igual(META.wa[0].template.components.slice(1), [qr(0, "ok.b1.mano.202612040830"), qr(1, "no.b1.mano.202612040830")], "la cita hecha a mano lleva los mismos botones");
ok(!META.wa.some((x) => x.template.components.some((c) => c.sub_type === "url")), "el recordatorio no mezcla botón de link con botones de respuesta (Meta no muestra esa mezcla en WhatsApp de computadora)");
igual([J_("b1", "web").waR, J_("b1", "web").waRd, J_("b1", "mano").waRd], [AHORA, man, man], "las citas quedan marcadas con waR y waRd");
igual(J_("b1", "malnum").waE, "tel", "el número inválido queda con waE = tel");
ok(!J_("b1", "recien").waR && doc("biz/b1").waDay !== man, "al que reservó hace 2 horas no se le escribe todavía, y el negocio queda pendiente");
igual(usados("b1"), 2, "cuenta 2 mensajes");
META.wa = []; await cron();
igual(META.wa.length, 0, "una hora después no repite ninguno");
AHORA = cr("2026-12-03T20:10:00"); await cron();
igual(META.wa.map((x) => x.to), ["50688880004"], "a las 8 p. m. ya le toca al que reservó a las 2 p. m. (pasaron 6 horas)");
igual(doc("biz/b1").waDay, man, "el negocio queda listo por hoy");
META.wa = []; const llamadas = await cron();
ok(META.wa.length === 0 && llamadas === 2, "con el negocio listo, la siguiente corrida casi no gasta (2 llamadas)");

titulo("Fuera de horario y funciones apagadas");
AHORA = cr("2026-12-03T10:00:00"); limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1 });
ok((await cron()) <= 2 && META.wa.length === 0 && !doc("biz/b1").waDay, "a las 10 a. m. de Costa Rica no manda nada (solo mira si hay negocios de otro país en su hora)");
AHORA = cr("2026-12-03T21:30:00"); igual([await cron(), META.wa.length], [0, 0], "a las 9:30 p. m. tampoco");
AHORA = cr("2026-12-03T17:00:00");
for (const [que, extra, sub] of [["recordatorio apagado (rem: false)", { waAuto: { on: true, rem: false } }, {}], ["función apagada", { waAuto: { on: false } }, {}], ["plan Turbo sin extra", {}, { tier: "turbo" }], ["plan vencido", {}, { until: new Date(AHORA - 1) }]]) {
  limpio(); negocio("b1", extra, sub); cita("b1", "j1", { at: 1, waC: 1 }); await cron(); igual(META.wa.length, 0, que + ": no manda");
}
limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1 });
await cron({ ...ENV0, WA_TOKEN: "" }); igual(META.wa.length, 0, "sin WhatsApp conectado: no manda");

titulo("Negocios de otros países: cada uno a su hora");
AHORA = Date.parse("2026-12-03T16:30:00Z"); // 10:30 a. m. en Costa Rica, 5:30 p. m. en España
limpio(); negocio("cr1"); cita("cr1", "j1", { at: 1, waC: 1 });
negocio("es1", { country: "ES", slug: "taller-madrid", wa: "612345678" }); cita("es1", "j1", { at: 1, waC: 1, tel: "612345679", date: "2026-12-04" });
await cron();
igual(META.wa.map((x) => x.to), ["34612345679"], "a las 5:30 p. m. de España sale el de España (con +34) y el de Costa Rica espera");
AHORA = Date.parse("2026-12-04T01:30:00Z"); // 7:30 p. m. del jueves 3 en Costa Rica, 2:30 a. m. del viernes 4 en España
limpio(); negocio("es1", { country: "ES", slug: "taller-madrid" }); cita("es1", "j1", { at: 1, waC: 1, tel: "612345679", date: "2026-12-05" });
negocio("cr1"); cita("cr1", "j1", { at: 1, waC: 1, date: "2026-12-04" });
await cron();
igual(META.wa.map((x) => x.to), ["50688887777"], "a las 2:30 a. m. de España no se le escribe a nadie allá; en Costa Rica sí, para el día que es «mañana» allí");
AHORA = Date.parse("2026-12-03T09:00:00Z"); // 3 a. m. en Costa Rica: no es hora en ningún país
limpio(); negocio("cr1"); cita("cr1", "j1", { at: 1, waC: 1 });
igual([await cron(), META.wa.length], [0, 0], "cuando no es hora en ningún país no hace ni una llamada");

titulo("Cita que se movió de día");
AHORA = cr("2026-12-03T17:00:00");
limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1, waR: 5, waRd: "2026-12-02", waRt: "2026-12-02" });
await cron(); ok(META.wa.length === 1 && J_("b1", "j1").waRd === man, "si ya había recibido recordatorio para OTRO día, recibe el del día nuevo");

titulo("Errores pasajeros y tope en el cron");
limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1 }); META.falla = true;
await cron(); ok(J_("b1", "j1").waE === "error" && !J_("b1", "j1").waRd && doc("biz/b1").waDay !== man && usados("b1") === 0 && !doc("wa/r_b1_j1_" + man), "si Meta falla, queda pendiente, no se cuenta y se suelta el candado");
META.falla = false; AHORA += 3600e3; await cron();
ok(J_("b1", "j1").waRd === man && !J_("b1", "j1").waE && usados("b1") === 1, "en la corrida siguiente sí sale y se limpia el error");
AHORA = cr("2026-12-03T16:00:00"); limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1 }); META.falla = true;
for (let i = 0; i < 5; i++) { await cron(); AHORA += 3600e3; }
ok(META.wa.length === 2 && J_("b1", "j1").waRn === 2 && doc("biz/b1").waDay === man, "si Meta rechaza siempre la misma cita, se intenta 2 veces y no más (no se come las corridas)");

titulo("Si algo falla justo después de mandar, no se manda dos veces");
AHORA = cr("2026-12-03T17:00:00"); limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1, time: "08:00" }); cita("b1", "j2", { at: 1, waC: 1, time: "09:00", tel: "88880002" });
META.romper = (url, m) => m === "PATCH" && url.includes("/biz/b1/jobs/j1"); // se cae justo al anotar la primera cita
await cron(); META.romper = null;
ok(META.wa.length === 1 && !J_("b1", "j1").waRd, "la corrida se corta después de mandar el primero, sin anotarlo");
AHORA += 10 * 60e3; await cron();
ok(META.wa.length === 2 && META.wa[1].to === "50688880002" && J_("b1", "j1").waRd === man && !!J_("b1", "j1").waR && usados("b1") === 2, "la corrida siguiente NO le repite al primero (solo lo anota) y sigue con el segundo");
limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1 }); put("wa/r_b1_j1_" + man, { at: AHORA - 30e3 });
await cron(); ok(META.wa.length === 0 && !J_("b1", "j1").waRd, "si otra corrida lo está mandando en este momento (candado de hace 30 s), no se toca");

titulo("Choques de escritura en Firestore (409 ABORTED no es «ya salió»)");
limpio(); negocio("b1"); cita("b1", "j1", { at: AHORA }); META.choque = 1;
r = await (await post("/push", { ev: "new", biz: "b1", job: "j1" })).json();
ok(r.w === 1 && META.wa.length === 1 && usados("b1") === 1, "confirmación: si la primera escritura choca, se reintenta y el mensaje sale");
limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1 }); META.choque = 2;
await cron(); ok(META.wa.length === 0 && !J_("b1", "j1").waRd && !J_("b1", "j1").waR && doc("biz/b1").waDay !== man, "recordatorio: si chocan los dos intentos NO se da por enviado, queda pendiente");
AHORA += 10 * 60e3; await cron(); ok(META.wa.length === 1 && J_("b1", "j1").waRd === man, "y en la corrida siguiente sale");
limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1 }); put("wa/r_b1_j1_" + man, { nada: 1 }); // candado sin fecha (dato raro)
await cron(); ok(META.wa.length === 0 && !J_("b1", "j1").waRd, "un candado que no se puede leer bien tampoco se toma como enviado");

titulo("Un negocio con problemas no frena a los demás");
limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1 }); negocio("b2", { slug: "otro-negocio" }); cita("b2", "j1", { at: 1, waC: 1, tel: "88880002" });
put("subs/b1", { ...doc("subs/b1"), until: "no es una fecha" }); // dato dañado
await cron(); igual(META.wa.map((x) => x.to), ["50688880002"], "con los datos de un negocio dañados, el otro recibe su recordatorio");
AHORA = cr("2026-12-03T17:00:00"); limpio(); negocio("b1"); put("wa/b1_2026-12", { n: 150 });
put("biz/b1/push/p2", { t: "celular-2" }); put("biz/b1/push/p3", { t: "celular-3" });
for (let i = 0; i < 4; i++) cita("b1", "j" + i, { at: 1, waC: 1, tel: "8888000" + i, time: String(8 + i).padStart(2, "0") + ":00" });
const llTope = await cron();
ok(META.wa.length === 0 && J_("b1", "j0").waE === "tope" && !J_("b1", "j1").waE && doc("biz/b1").waDay === man && usados("b1") === 150, "con 150 usados: marca la primera con «tope», no sigue intentando y cierra el día");
ok(META.push.filter((p) => /Se acabaron/.test(p.title)).length === 3 && llTope <= 2 + 2 + 16 + 1, `y le avisa al dueño en sus 3 celulares sin pasarse de lo calculado (${llTope} llamadas)`);

titulo("Muchos negocios: límite de llamadas por corrida");
limpio();
for (let b = 0; b < 6; b++) { negocio("n" + b, { slug: "negocio-" + b }); for (let i = 0; i < 8; i++) cita("n" + b, "c" + i, { at: 1, waC: 1, tel: "8" + b + "00000" + i, time: "0" + (i + 1) + ":00" }); }
let corridas = 0, maxLl = 0, total = 0;
for (; corridas < 40 && total < 48; corridas++) { META.wa = []; maxLl = Math.max(maxLl, await cron()); total += META.wa.length; AHORA += 60e3; }
ok(total === 48 && maxLl <= 46, `salen los 48 recordatorios sin pasar de 46 llamadas por corrida (máximo visto: ${maxLl}, en ${corridas} corridas)`);
let dobles = 0; for (let b = 0; b < 6; b++) dobles += usados("n" + b) === 8 ? 0 : 1;
igual(dobles, 0, "cada negocio cuenta exactamente 8: nadie recibe doble");
limpio(); for (let b = 0; b < 6; b++) { negocio("n" + b, { slug: "negocio-" + b }); for (let i = 0; i < 8; i++) cita("n" + b, "c" + i, { at: 1, waC: 1, tel: "8" + b + "00000" + i }); }
maxLl = 0; total = 0;
for (corridas = 0; corridas < 40 && total < 48; corridas++) { META.wa = []; maxLl = Math.max(maxLl, await cron({ ...ENV0, WA_CRON: "*/10 * * * *" }, "*/10 * * * *")); total += META.wa.length; AHORA += 60e3; }
ok(total === 48 && maxLl <= 46, `con cron aparte tampoco pasa de 46 llamadas (máximo visto: ${maxLl}, en ${corridas} corridas)`);
// correos y recordatorios en la misma corrida: juntos no pueden pasar de 50 llamadas (límite del plan gratis de Cloudflare)
AHORA = cr("2026-12-03T17:00:00"); limpio();
for (let b = 0; b < 12; b++) { negocio("m" + b, { slug: "correo-" + b, email: "d" + b + "@prueba.com", waAuto: null }, { ...PRUEBA, start: AHORA - 3600e3, until: new Date(AHORA + 6 * 864e5) }); }
for (let b = 0; b < 4; b++) { negocio("n" + b, { slug: "negocio-" + b }); for (let i = 0; i < 8; i++) cita("n" + b, "c" + i, { at: 1, waC: 1, tel: "8" + b + "00000" + i }); }
META.max = 50; const juntas = await cron({ ...ENV0, RESEND_KEY: "re" }); META.max = 0;
ok(META.mail.length === 12 && juntas <= 50 && META.wa.length > 0, `12 correos y recordatorios en la misma corrida: ${juntas} llamadas en total (máximo 50), salieron ${META.wa.length} recordatorios`);
let pendientes = 0; for (let b = 0; b < 4; b++) for (let i = 0; i < 8; i++) { const j = J_("n" + b, "c" + i); if (j.waRd && !j.waR) pendientes++; }
igual(pendientes, 0, "y ninguna cita queda a medias");

titulo("Quién corre qué en el cron");
AHORA = cr("2026-12-03T17:00:00");
const armar = () => { limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1 }); };
const correos = () => LOG.some((l) => l.url.includes("/documents/biz?pageSize"));
armar(); await cron({ ...ENV0, RESEND_KEY: "re" }); ok(correos() && META.wa.length === 1, "cron de cada hora, sin cron aparte: correos Y recordatorios");
armar(); await cron({ ...ENV0, RESEND_KEY: "re", WA_CRON: "*/10 * * * *" }); ok(correos() && META.wa.length === 0, "cron de cada hora, habiendo cron aparte: solo correos");
armar(); await cron({ ...ENV0, RESEND_KEY: "re", WA_CRON: "*/10 * * * *" }, "*/10 * * * *"); ok(!correos() && META.wa.length === 1, "cron aparte: solo recordatorios");

/* =====================  RUTAS PARA LA APP  ===================== */
titulo("Ruta /wa/uso");
AHORA = cr("2026-12-03T11:00:00"); limpio(); negocio("b1"); put("wa/b1_2026-12", { n: 37 });
let tok = await idToken("b1", "dueno@prueba.com");
igual(await (await post("/wa/uso", { idToken: tok })).json(), { ok: true, live: true, plan: "nitro", max: 150, n: 37, on: true }, "Nitro encendido con 37 usados");
igual(await (await post("/wa/uso", { idToken: tok }, { ...ENV0, WA_PHONE_ID: "" })).json(), { ok: true, live: false, plan: "nitro", max: 150, n: 37, on: true }, "sin WhatsApp conectado dice live: false");
limpio(); negocio("b1", { waAuto: null }, { tier: "arranque" });
igual(await (await post("/wa/uso", { idToken: tok })).json(), { ok: true, live: true, plan: "", max: 0, n: 0, on: false }, "Arranque sin extra: plan vacío");
igual((await post("/wa/uso", { idToken: "malo.malo.malo" })).status, 401, "sesión inválida → 401");
igual((await post("/wa/uso", { idToken: await idToken("nadie", "x@y.com") })).status, 404, "usuario sin negocio → 404");
put("own/ayuda@prueba.com", { biz: "b1", rol: "equipo" }); negocio("b1");
igual((await (await post("/wa/uso", { idToken: await idToken("u9", "ayuda@prueba.com") })).json()).plan, "nitro", "alguien del equipo también lo puede ver");
const op = await W.fetch(new Request("https://w.prueba/wa/uso", { method: "OPTIONS", headers: { origin: "https://citalyapp.com" } }), ENV0);
ok(op.status === 204 && op.headers.get("access-control-allow-origin") === "https://citalyapp.com", "la app puede llamarla desde citalyapp.com (CORS)");

titulo("Ruta /wa/prueba");
limpio(); negocio("b1");
r = await (await post("/wa/prueba", { idToken: tok })).json();
igual(r, { ok: true, to: "6610" }, "manda la muestra al WhatsApp del negocio");
igual([META.wa[0].to, META.wa[0].template.name, META.wa[0].template.components[0].parameters.map((x) => x.text).join("|")], ["50661506610", "cita_recordatorio", "Ana|Car Keyss Detailing|mañana viernes 4 de diciembre a las 10:00 am"], "con un recordatorio de ejemplo");
igual(META.wa[0].template.components.slice(1).map((c) => c.parameters[0].payload), ["ok.prueba", "no.prueba"], "la muestra lleva los botones marcados como prueba");
igual(usados("b1"), 1, "la muestra cuenta como mensaje");
await post("/wa/prueba", { idToken: tok }); await post("/wa/prueba", { idToken: tok });
r = await post("/wa/prueba", { idToken: tok });
ok(r.status === 429 && (await r.json()).error === "limite" && META.wa.length === 3 && usados("b1") === 3, "la cuarta del día se rechaza y no se cuenta");
limpio(); negocio("b1", {}, { tier: "turbo" }); igual((await (await post("/wa/prueba", { idToken: tok })).json()).error, "plan", "plan que no lo incluye → error plan");
limpio(); negocio("b1", { wa: "" }); igual((await (await post("/wa/prueba", { idToken: tok })).json()).error, "tel", "negocio sin WhatsApp guardado → error tel");
limpio(); negocio("b1"); put("wa/b1_2026-12", { n: 150 }); igual((await (await post("/wa/prueba", { idToken: tok })).json()).error, "tope", "sin mensajes → error tope");
limpio(); negocio("b1"); META.falla = true; r = await (await post("/wa/prueba", { idToken: tok })).json();
ok(r.error === "wa" && usados("b1") === 0, "si Meta falla → error wa y no se cuenta");
igual((await (await post("/wa/prueba", { idToken: tok }, { ...ENV0, WA_TOKEN: "" })).json()).error, "no_config", "sin WhatsApp conectado → no_config");

/* =====================  LO QUE CONTESTA EL CLIENTE  ===================== */
titulo("Ruta /wa/meta (respuestas de los clientes)");
const get = (qs, env = ENV0) => W.fetch(new Request("https://w.prueba/wa/meta?" + qs), env);
r = await get("hub.mode=subscribe&hub.verify_token=verifica&hub.challenge=4242");
ok(r.status === 200 && (await r.text()) === "4242", "verificación de Meta correcta devuelve el reto");
igual((await get("hub.mode=subscribe&hub.verify_token=otra&hub.challenge=1")).status, 403, "con otra palabra → 403");
igual((await get("hub.mode=subscribe&hub.verify_token=&hub.challenge=1", { ...ENV0, WA_VERIFY: "" })).status, 403, "sin WA_VERIFY configurado → 403");
const entra = (m, tel = "111222") => JSON.stringify({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: tel }, messages: [m] } }] }] });
const meta = async (cuerpo, sig) => post("/wa/meta", cuerpo, ENV0, { "x-hub-signature-256": sig === undefined ? await firma(cuerpo) : sig });
AHORA = cr("2026-12-03T18:00:00"); limpio(); negocio("b1"); put("biz/b1", { ...doc("biz/b1"), mailTo: "dueno@prueba.com" });
put("waTo/50688887777", { biz: "b1", job: "j1", cli: "Ana", name: "Car Keyss Detailing", bwa: "50661506610", at: AHORA - 3600e3 });
let c = entra({ from: "50688887777", id: "wamid.A", type: "text", text: { body: "No puedo llegar mañana, ¿la pasamos al sábado?" } });
igual((await meta(c, "sha256=" + "0".repeat(64))).status, 401, "firma falsa → 401");
ok(META.push.length === 0 && META.wa.length === 0, "y no hace nada");
igual((await post("/wa/meta", c, { ...ENV0, WA_APP_SECRET: "" }, { "x-hub-signature-256": await firma(c) })).status, 401, "sin WA_APP_SECRET configurado no acepta nada");
igual((await meta(c)).status, 200, "firma correcta → 200");
ok(META.push.length === 1 && /Ana respondió al aviso de su cita/.test(META.push[0].title) && /No puedo llegar mañana/.test(META.push[0].body) && META.push[0].url === "/app/?cita=j1", "el dueño recibe en el celular lo que escribió el cliente, con link a la cita");
igual(META.wa.length === 1 && [META.wa[0].to, META.wa[0].type], ["50688887777", "text"], "al cliente se le contesta sola");
ok(/Car Keyss Detailing/.test(META.wa[0].text.body) && /wa\.me\/50661506610/.test(META.wa[0].text.body), "con el nombre y el WhatsApp del negocio");
await meta(c); ok(META.push.length === 1 && META.wa.length === 1, "si Meta repite el mismo mensaje, no se duplica nada");
await meta(entra({ from: "50688887777", id: "wamid.B", type: "text", text: { body: "¿Hola?" } }));
ok(META.push.length === 2 && META.wa.length === 1, "un segundo mensaje sí le llega al dueño, pero al cliente no se le vuelve a contestar (1 vez cada 12 h)");
await meta(entra({ from: "50688887777", id: "wamid.C", type: "reaction", reaction: { emoji: "👍" } }));
ok(META.push.length === 3 && /👍 Ana reaccionó/.test(META.push[2].title) && META.wa.length === 1, "una reacción 👍 le llega al dueño y no dispara respuesta");
await meta(entra({ from: "50688887777", id: "wamid.D", type: "audio", audio: {} }));
igual(META.push.length, 3, "el cuarto mensaje de la misma hora ya no molesta al dueño (máximo 3 por hora por cliente)");
AHORA += 3600e3; await meta(entra({ from: "50688887777", id: "wamid.D2", type: "audio", audio: {} }));
ok(META.push.length === 4 && /Mandó 🎤 un audio/.test(META.push[3].body), "a la hora siguiente vuelve a avisar; un audio se avisa como audio");
await meta(entra({ from: "50670000000", id: "wamid.E", type: "text", text: { body: "hola" } }));
ok(META.push.length === 4 && META.wa.length === 2 && /nadie lee los mensajes/.test(META.wa[1].text.body) && !/wa\.me/.test(META.wa[1].text.body), "un número desconocido recibe la respuesta general y no molesta a ningún dueño");
await meta(entra({ from: "50688887777", id: "wamid.F", type: "text", text: { body: "x" } }, "999"));
ok(META.push.length === 4, "mensajes de otro número de Meta se ignoran");
put("waTo/50688881111", { biz: "b1", job: "j9", cli: "Luis", name: "Car Keyss Detailing", bwa: "50661506610", at: AHORA - 9 * 864e5 });
await meta(entra({ from: "50688881111", id: "wamid.G", type: "text", text: { body: "hola" } }));
ok(META.push.length === 4 && META.wa.length === 3, "si el aviso fue hace más de 7 días, ya no se le pasa al dueño");

titulo("El cliente toca «Confirmo» o «No puedo ir» en el recordatorio");
const ENVM = { ...ENV0, RESEND_KEY: "re" };
const metaE = async (cuerpo) => post("/wa/meta", cuerpo, ENVM, { "x-hub-signature-256": await firma(cuerpo) });
const btn = (id, payload, text, ctx, from = "50688887777", extra = {}) => ({ from, id, type: "button", button: { payload, text }, context: { from: "50600000000", id: ctx }, ...extra });
const boton = (...a) => entra(btn(...a));
/* Deja una cita con su recordatorio ya enviado (jueves 4:05 p. m.) y avanza 20 minutos */
const recordar = async (extraCita = {}, extraBiz = {}) => {
  AHORA = cr("2026-12-03T16:05:00"); limpio(); negocio("b1", { mailTo: "dueno@prueba.com", ...extraBiz }); cita("b1", "j1", { at: 1, waC: 1, ...extraCita }); await cron();
  const t = META.wa[0].template.components, o = { ok: t[1].parameters[0].payload, no: t[2].parameters[0].payload, wid: doc("waTo/" + META.wa[0].to).wid };
  META.wa = []; META.push = []; META.mail = []; AHORA += 20 * 60e3; return o;
};
const resp = (i = 0) => ((META.wa[i] || {}).text || {}).body || "";
let B = await recordar();
igual([B.ok, B.no], ["ok.b1.j1.202612041000", "no.b1.j1.202612041000"], "(el recordatorio salió con sus dos botones)");
LOG = []; await metaE(boton("wamid.T1", B.ok, "Confirmo", B.wid)); const llToque = LOG.length;
igual([J_("b1", "j1").waA, J_("b1", "j1").waAt, J_("b1", "j1").waAd, J_("b1", "j1").st], ["si", AHORA, "2026-12-04 10:00", "Por confirmar"], "«Confirmo»: queda anotado en la cita (waA = si) y el estado de la cita NO cambia");
ok(META.push.length === 1 && META.push[0].title === "✅ Ana confirmó que llega" && META.push[0].body === "Mañana viernes 4 de diciembre a las 10:00 am · Tocá para ver la cita." && META.push[0].url === "/app/?cita=j1" && META.push[0].biz === "b1", "al dueño le llega el aviso al celular, con link a la cita");
igual(META.mail.length, 0, "una confirmación no manda correo (solo el aviso al celular)");
ok(META.wa.length === 1 && META.wa[0].type === "text" && META.wa[0].to === "50688887777", "al cliente se le contesta con un texto normal (no es plantilla)");
igual(resp(), "¡Listo, Ana! ✅ Ya le avisamos a *Car Keyss Detailing* que vas a llegar mañana viernes 4 de diciembre a las 10:00 am. ¡Te esperamos!", "y le dice que ya se le avisó al negocio (no promete que el negocio la «confirmó»)");
igual(usados("b1"), 1, "esa respuesta no gasta mensajes del plan (solo contó el recordatorio)");
ok(llToque <= 16, `un toque gasta pocas llamadas (${llToque}; Cloudflare gratis permite unas 50)`);
await metaE(boton("wamid.T1", B.ok, "Confirmo", B.wid));
ok(META.push.length === 1 && META.wa.length === 1, "si Meta repite el mismo toque, no se avisa ni se contesta dos veces");
await metaE(boton("wamid.T2", B.ok, "Confirmo", B.wid));
ok(META.push.length === 1 && META.wa.length === 2 && /Ya le avisamos/.test(resp(1)), "si el cliente vuelve a tocar «Confirmo», se le contesta otra vez pero al dueño no se le repite el aviso");
await metaE(boton("wamid.T3", B.no, "No puedo ir", B.wid));
igual([J_("b1", "j1").waA, J_("b1", "j1").waAd, J_("b1", "j1").st], ["no", "2026-12-04 10:00", "Por confirmar"], "«No puedo ir»: queda anotado (waA = no) y la cita NO se cancela sola");
ok(META.push.length === 2 && META.push[1].title === "⚠️ Ana avisó que no puede llegar" && META.push[1].body === "Cita de mañana viernes 4 de diciembre a las 10:00 am. Sigue en tu agenda: tocá para verla y escribirle." && META.push[1].url === "/app/?cita=j1", "al dueño le llega el aviso al celular");
ok(META.mail.length === 1 && META.mail[0].subject === "⚠️ Ana avisó que no puede llegar" && META.mail[0].to[0] === "dueno@prueba.com", "y también por correo, porque es el que más importa");
igual(resp(2), "Gracias por avisar, Ana. Ya le dijimos a *Car Keyss Detailing* que no puedes llegar. Tu cita sigue apartada: para pasarla a otro día o cancelarla, entra aquí: https://citalyapp.com/r/?wa=car-keyss." + TK, "al cliente se le da su link para cambiarla o cancelarla");
await metaE(boton("wamid.T1", B.ok, "Confirmo", B.wid));
ok(J_("b1", "j1").waA === "no" && META.push.length === 2 && META.wa.length === 3, "si Meta vuelve a mandar un toque viejo mucho después, no revive la respuesta anterior");
await metaE(boton("wamid.T4", B.ok, "Confirmo", B.wid));
ok(J_("b1", "j1").waA === "si" && META.push.length === 2 && META.wa.length === 3, "cuarto toque en la misma hora: ya no avisa ni contesta, pero la cita SÍ queda con lo último que tocó (si)");
await metaE(boton("wamid.T5", B.no, "No puedo ir", B.wid));
ok(J_("b1", "j1").waA === "no" && META.push.length === 2 && META.wa.length === 3, "quinto toque: igual, queda anotado lo último (no). El dueño nunca ve un estado viejo");
AHORA += 3600e3; await metaE(boton("wamid.T6", B.ok, "Confirmo", B.wid));
ok(J_("b1", "j1").waA === "si" && META.push.length === 3 && META.wa.length === 4, "a la hora siguiente vuelve a avisar y a contestar");
igual(usados("b1"), 1, "y nada de eso gastó mensajes del plan");

B = await recordar(); put("waTo/50688887777", { ...doc("waTo/50688887777"), at: AHORA - 60e3 });
for (const [i, t] of ["hola", "¿puedo llegar 15 min tarde?", "¿me escuchan?"].entries()) await metaE(entra({ from: "50688887777", id: "wamid.TX" + i, type: "text", text: { body: t } }));
igual(META.push.length, 3, "(el cliente escribió 3 textos y al dueño le llegaron los 3)");
await metaE(boton("wamid.TX9", B.no, "No puedo ir", B.wid));
ok(J_("b1", "j1").waA === "no" && META.push.length === 4 && META.push[3].title === "⚠️ Ana avisó que no puede llegar" && /Gracias por avisar/.test(resp(1)), "si después de escribir 3 textos toca «No puedo ir», el toque NO se pierde: se anota, se avisa y se contesta");

B = await recordar({ tk: null, web: false });
await metaE(boton("wamid.M1", B.no, "No puedo ir", B.wid));
ok(J_("b1", "j1").waA === "no" && resp().endsWith("para pasarla a otro día o cancelarla, escríbeles: https://wa.me/50661506610"), "cita hecha a mano (sin link): se le da el WhatsApp del negocio");
B = await recordar({ web: false });
await metaE(boton("wamid.M2", B.no, "No puedo ir", B.wid));
ok(resp().endsWith("escríbeles: https://wa.me/50661506610"), "cita que no se reservó en la página: tampoco se le manda el link (con él no podría cambiarla)");
B = await recordar({ time: "07:00" }); AHORA = cr("2026-12-03T20:00:00");
await metaE(boton("wamid.M3", B.no, "No puedo ir", B.wid));
ok(resp().endsWith("escríbeles: https://wa.me/50661506610"), "si faltan menos de 12 horas (con el link ya no puede cambiarla), se le da el WhatsApp del negocio");
B = await recordar({ time: "09:00" }); AHORA = cr("2026-12-03T20:00:00");
await metaE(boton("wamid.M4", B.no, "No puedo ir", B.wid));
ok(resp().endsWith("entra aquí: https://citalyapp.com/r/?wa=car-keyss." + TK), "si faltan 13 horas, todavía se le manda su link");
B = await recordar({ cli: "" });
await metaE(boton("wamid.N1", B.ok, "Confirmo", B.wid));
ok(resp().startsWith("¡Listo! ✅ Ya le avisamos") && META.push[0].title === "✅ Tu cliente confirmó que llega", "cita sin nombre: los textos salen bien igual");
B = await recordar(); put("biz/b1/jobs/j1", { ...J_("b1", "j1"), time: "15:00" });
await metaE(boton("wamid.H1", B.ok, "Confirmo", B.wid));
ok(J_("b1", "j1").waAd === "2026-12-04 15:00" && resp() === "¡Listo, Ana! ✅ Ojo, la hora cambió: tu cita en *Car Keyss Detailing* es mañana viernes 4 de diciembre a las 3:00 pm. Ya les avisamos que vas a llegar; si a esa hora no puedes, toca *No puedo ir*.", "si el dueño le cambió la hora (mismo día), se anota con la hora nueva y al cliente se le advierte del cambio");
B = await recordar(); AHORA = cr("2026-12-04T08:00:00");
await metaE(boton("wamid.H2", B.ok, "Confirmo", B.wid));
ok(J_("b1", "j1").waA === "si" && /vas a llegar hoy viernes 4 de diciembre a las 10:00 am/.test(resp()) && META.push[0].body.startsWith("Hoy viernes 4"), "si toca el botón la mañana de la cita, dice «hoy»");

titulo("Botones que NO se anotan");
B = await recordar(); AHORA = cr("2026-12-04T10:30:00");
await metaE(boton("wamid.V1", B.ok, "Confirmo", B.wid));
ok(!J_("b1", "j1").waA && META.push.length === 0 && /ya no está pendiente en la agenda de \*Car Keyss Detailing\*/.test(resp()) && /wa\.me\/50661506610/.test(resp()), "cita que ya pasó: no se anota, no molesta al dueño y al cliente se le explica");
for (const st of ["Cancelada", "No vino", "Lista"]) {
  B = await recordar(); put("biz/b1/jobs/j1", { ...J_("b1", "j1"), st });
  await metaE(boton("wamid.V2", B.no, "No puedo ir", B.wid));
  ok(!J_("b1", "j1").waA && META.push.length === 0 && /ya no está pendiente/.test(resp()), "cita «" + st + "»: no se anota ni se avisa");
}
B = await recordar(); put("biz/b1/jobs/j1", { ...J_("b1", "j1"), date: "2026-12-06" });
await metaE(boton("wamid.V3", B.ok, "Confirmo", B.wid));
ok(!J_("b1", "j1").waA && META.push.length === 0 && resp() === "Tu cita en *Car Keyss Detailing* cambió: ahora es el domingo 6 de diciembre a las 10:00 am. Puedes verla aquí: https://citalyapp.com/r/?wa=car-keyss." + TK, "cita que se movió a otro día: no se confirma con el botón viejo, se le dice la fecha nueva");
B = await recordar();
await metaE(boton("wamid.V4", B.ok, "Confirmo", B.wid, "50670000000"));
ok(!J_("b1", "j1").waA && META.push.length === 0 && !/vas a llegar/.test(resp()), "el mismo botón desde OTRO número: no se anota ni se le avisa al dueño");
for (const p of ["ok.b1.j1", "ok.b1.j1.2026-12-04", "ok.b1/jobs.j1.20261204", "si.b1.j1.20261204", "ok..j1.20261204", "ok.b1.j1.20261204.x", "ok.b1.j1.2026120410", ""]) {
  B = await recordar(); await metaE(boton("wamid.V5", p, "Otra cosa", "wamid.otro"));
  ok(!J_("b1", "j1").waA && !/vas a llegar/.test(resp()), "botón con un dato raro (" + (p || "vacío") + "): no se anota nada");
}
B = await recordar(); await metaE(boton("wamid.V6", "ok.b1.noexiste.202612041000", "Confirmo", "wamid.otro"));
ok(!DB.has("biz/b1/jobs/noexiste") && !/vas a llegar/.test(resp()), "botón de una cita que no existe: no crea nada");
B = await recordar(); META.romper = (url) => { if (url.endsWith(":commit")) DB.delete("biz/b1/jobs/j1"); return false; };
await metaE(boton("wamid.V7", B.ok, "Confirmo", B.wid)); META.romper = null;
ok(!DB.has("biz/b1/jobs/j1") && ![...DB.keys()].some((k) => k.startsWith("wa/b_")) && META.push.length === 0 && META.wa.length === 0, "si la cita se borra justo en ese momento: no queda una cita fantasma y no se avisa nada");
B = await recordar(); await metaE(entra({ ...btn("wamid.V8", B.ok, "Confirmo", B.wid), from: undefined }));
ok(!J_("b1", "j1").waA && META.push.length === 0 && META.wa.length === 0, "si Meta no manda el número de quien tocó, no se hace nada");

titulo("Botones: orden, carreras y casos de Meta");
const seg = (d) => String(Math.floor(AHORA / 1000) + d);
B = await recordar();
await metaE(boton("wamid.O2", B.no, "No puedo ir", B.wid, undefined, { timestamp: seg(-5) }));
await metaE(boton("wamid.O1", B.ok, "Confirmo", B.wid, undefined, { timestamp: seg(-9) }));
ok(J_("b1", "j1").waA === "no" && J_("b1", "j1").waAt === (Math.floor(AHORA / 1000) - 5) * 1000 && META.push.length === 1 && META.wa.length === 1, "si Meta entrega dos toques al revés, vale el que el cliente tocó de último (el más viejo se ignora)");
let malOrden = 0;
for (let k = 0; k < 8; k++) {
  B = await recordar(); META.lat = 40;
  await Promise.all([metaE(boton("wamid.C1", B.ok, "Confirmo", B.wid, undefined, { timestamp: seg(-9) })), metaE(boton("wamid.C2", B.no, "No puedo ir", B.wid, undefined, { timestamp: seg(-5) }))]); META.lat = 0;
  if (J_("b1", "j1").waA !== "no") malOrden++;
}
igual(malOrden, 0, "dos toques distintos procesados a la vez (8 intentos): siempre queda el último que tocó");
B = await recordar(); await metaE(boton("wamid.L1", "Confirmo", "Confirmo", B.wid));
ok(J_("b1", "j1").waA === "si" && META.push.length === 1 && /Ya le avisamos/.test(resp()), "si Meta devuelve solo el texto del botón, se reconoce por el recordatorio al que responde");
B = await recordar(); await metaE(boton("wamid.L2", "No puedo ir", "No puedo ir", B.wid));
igual(J_("b1", "j1").waA, "no", "igual con «No puedo ir»");
B = await recordar(); await metaE(boton("wamid.L3", "Confirmo", "Confirmo", "wamid.otro"));
ok(!J_("b1", "j1").waA && META.push.length === 1 && /respondió al aviso de su cita/.test(META.push[0].title), "solo el texto y respondiendo a OTRO mensaje: no se anota; le llega al dueño como una respuesta cualquiera");
B = await recordar(); negocio("b2", { slug: "otro-negocio" }); cita("b2", "j1", { at: 1, waC: 1, time: "14:00" }); await cron(); META.wa = []; META.push = [];
igual(doc("waTo/50688887777").biz, "b2", "(el mismo cliente tiene cita en otro negocio y ese fue el último recordatorio)");
await metaE(boton("wamid.L4", B.ok, "Confirmo", B.wid));
ok(J_("b1", "j1").waA === "si" && !J_("b2", "j1").waA && META.push.length === 1 && META.push[0].biz === "b1" && /\*Car Keyss Detailing\*/.test(resp()), "con citas en dos negocios, el botón confirma la cita correcta y avisa al negocio correcto");
B = await recordar(); META.lat = 40;
await Promise.all([1, 2, 3, 4].map(() => metaE(boton("wamid.P1", B.ok, "Confirmo", B.wid)))); META.lat = 0;
ok(META.push.length === 1 && META.wa.length === 1 && J_("b1", "j1").waA === "si", `el mismo toque 4 veces a la vez: un solo aviso y una sola respuesta (avisos: ${META.push.length}, respuestas: ${META.wa.length})`);
B = await recordar(); META.choque = 1; await metaE(boton("wamid.Q1", B.ok, "Confirmo", B.wid));
ok(J_("b1", "j1").waA === "si" && META.push.length === 1 && META.wa.length === 1, "si la primera escritura choca en Firestore, se reintenta y queda anotado");
B = await recordar(); META.choque = 2; await metaE(boton("wamid.Q2", B.ok, "Confirmo", B.wid)); META.choque = 0;
ok(!J_("b1", "j1").waA && META.push.length === 0 && META.wa.length === 0, "si no se pudo anotar, no se le dice a nadie que quedó anotado");
B = await recordar(); let cambios = 0; META.romper = (url) => { if (url.endsWith(":commit") && !cambios++) put("biz/b1/jobs/j1", { ...J_("b1", "j1"), note: "el dueño la editó justo ahora" }); return false; };
await metaE(boton("wamid.Q3", B.ok, "Confirmo", B.wid)); META.romper = null;
ok(J_("b1", "j1").waA === "si" && J_("b1", "j1").note === "el dueño la editó justo ahora" && META.push.length === 1, "si el dueño edita la cita justo en ese momento, se lee otra vez y se anota sin pisarle nada");
B = await recordar(); await post("/wa/meta", boton("wamid.S1", B.ok, "Confirmo", B.wid), ENVM, { "x-hub-signature-256": "sha256=" + "0".repeat(64) });
ok(!J_("b1", "j1").waA && META.push.length === 0, "un toque con firma falsa no anota nada");
limpio(); negocio("b1"); await metaE(boton("wamid.PR1", "ok.prueba", "Confirmo", "wamid.x", "50661506610"));
ok(META.wa.length === 1 && /Así se ve cuando tu cliente confirma/.test(resp()) && META.push.length === 0, "en la muestra que se manda el dueño, «Confirmo» le explica qué va a pasar");
await metaE(boton("wamid.PR2", "no.prueba", "No puedo ir", "wamid.x", "50661506610"));
ok(META.wa.length === 2 && /Así se ve cuando tu cliente avisa que no puede llegar/.test(resp(1)), "y «No puedo ir» también");
B = await recordar({ tel: "5512345678" }, { country: "MX", wa: "5587654321" });
igual(doc("waTo/525512345678").job, "j1", "(negocio de México: el recordatorio salió al 52 + 10 dígitos)");
await metaE(boton("wamid.MX1", B.ok, "Confirmo", B.wid, "5215512345678"));
ok(J_("b1", "j1").waA === "si" && META.push.length === 1 && META.wa[0].to === "525512345678", "México: Meta manda el número con un 1 de más (521…) y el toque se reconoce igual");

titulo("Varios toques en un mismo aviso de Meta: límite de llamadas");
AHORA = cr("2026-12-03T16:05:00"); limpio(); negocio("b1", { mailTo: "dueno@prueba.com" }); put("biz/b1/push/p2", { t: "celular-2" }); put("biz/b1/push/p3", { t: "celular-3" });
for (let i = 1; i <= 3; i++) cita("b1", "j" + i, { at: 1, waC: 1, tel: "8888000" + i, time: "1" + i + ":00" });
await cron(); const ps = META.wa.map((x) => [x.to, x.template.components[2].parameters[0].payload, doc("waTo/" + x.to).wid]); META.wa = []; META.push = []; META.mail = []; AHORA += 20 * 60e3;
const tres = JSON.stringify({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "111222" }, messages: ps.map((x, i) => btn("wamid.Z" + i, x[1], "No puedo ir", x[2], x[0])) } }] }] });
META.max = 50; LOG = []; const rz = await metaE(tres); META.max = 0;
const anotadas = [1, 2, 3].filter((i) => J_("b1", "j" + i).waA === "no").length;
ok(rz.status === 200 && ps.length === 3 && anotadas === 2 && LOG.length <= 50 && META.wa.length === 2 && META.mail.length === 2, `3 «No puedo ir» en un mismo aviso y dueño con 3 celulares: se atienden 2 completos sin pasarse de 50 llamadas (${LOG.length}); el tercero no queda a medias`);

titulo("Las respuestas al cliente: cuenta y tope de gasto");
const RESP = () => (doc("wa/_resp_2026-12") || {}).n || 0, RDIA = () => (doc("wa/_rdia_2026-12-03") || {}).n || 0, DIA = () => (doc("wa/_dia_2026-12-03") || {}).n || 0;
B = await recordar(); const dia0 = DIA();
await metaE(boton("wamid.R1", B.ok, "Confirmo", B.wid));
ok(RESP() === 1 && RDIA() === 0 && DIA() === dia0 && META.mail.length === 0, "cada respuesta se cuenta en el mes (wa/_resp_…); mientras sean de las 1.000 gratis no tocan ningún tope de gasto");
B = await recordar(); put("wa/_resp_2026-12", { n: 1000 });
await metaE(boton("wamid.R2", B.ok, "Confirmo", B.wid));
ok(META.wa.length === 1 && RESP() === 1001 && RDIA() === 1 && DIA() === dia0, "pasadas las 1.000 del mes la respuesta sigue saliendo y cuenta en su propio tope del día, sin tocar el de los recordatorios");
ok(META.mail.length === 1 && /respuestas gratis de WhatsApp/.test(META.mail[0].subject) && META.mail[0].to[0] === "est3banbg@gmail.com", "y le llega un correo al admin");
await metaE(boton("wamid.R3", B.no, "No puedo ir", B.wid));
ok(META.wa.length === 2 && META.mail.filter((x) => /respuestas gratis/.test(x.subject)).length === 1, "ese correo sale una sola vez");
B = await recordar(); put("wa/_resp_2026-12", { n: 1500 }); put("wa/_rdia_2026-12-03", { n: 100 });
await metaE(boton("wamid.R4", B.ok, "Confirmo", B.wid));
ok(J_("b1", "j1").waA === "si" && META.push.length === 1 && META.wa.length === 0 && RESP() === 1500 && RDIA() === 100, "con el tope de respuestas pagadas lleno (100 al día): se anota y se le avisa al dueño (eso no cuesta), pero al cliente no se le contesta y no se cuenta nada");
cita("b1", "j2", { at: 1, waC: 1, tel: "88880002" }); put("biz/b1", { ...doc("biz/b1"), waDay: "" }); AHORA = cr("2026-12-03T17:00:00"); await cron();
ok(META.wa.length === 1 && META.wa[0].type === "template" && META.wa[0].to === "50688880002", "y los recordatorios siguen saliendo: las respuestas no les gastan su tope");
B = await recordar(); put("waTo/50688887777", { ...doc("waTo/50688887777"), rd: "2026-12-03", rn: 4 });
await metaE(boton("wamid.R5", B.ok, "Confirmo", B.wid));
ok(J_("b1", "j1").waA === "si" && META.push.length === 1 && META.wa.length === 0 && RESP() === 0, "un mismo número recibe como mucho 4 respuestas al día: la quinta no sale (el aviso al dueño sí)");
B = await recordar(); META.falla = true;
await metaE(boton("wamid.R6", B.ok, "Confirmo", B.wid)); META.falla = false;
ok(J_("b1", "j1").waA === "si" && META.push.length === 1 && RESP() === 0, "si Meta no acepta la respuesta, no se cuenta (la cita queda anotada igual)");
limpio(); await metaE(entra({ from: "50670000000", id: "wamid.R7", type: "text", text: { body: "hola" } }));
ok(META.wa.length === 1 && RESP() === 1, "la respuesta automática a quien le escribe al número de avisos también se cuenta");
limpio(); put("wa/_resp_2026-12", { n: 500 }); await metaE(entra({ from: "50670000001", id: "wamid.R8", type: "text", text: { body: "hola" } }));
ok(META.wa.length === 0 && RESP() === 500, "a números sin cita solo se les contesta con la primera mitad de las gratis: el resto se guarda para los clientes");
B = await recordar(); put("wa/_resp_2026-12", { n: 500 }); await metaE(boton("wamid.R9", B.ok, "Confirmo", B.wid));
ok(META.wa.length === 1 && RESP() === 501, "al cliente con cita sí se le sigue contestando");

titulo("Mensajes que Meta no pudo entregar");
AHORA = cr("2026-12-03T09:15:00"); limpio(); negocio("b1"); cita("b1", "j1");
await post("/push", { ev: "new", biz: "b1", job: "j1" });
const wid = doc("waTo/50688887777").wid, estado = (id, st, code) => JSON.stringify({ entry: [{ changes: [{ field: "messages", value: { metadata: { phone_number_id: "111222" }, statuses: [{ id, status: st, recipient_id: "50688887777", errors: code ? [{ code }] : undefined }] } }] }] });
ok(!!wid && !!J_("b1", "j1").waC && usados("b1") === 1, "(la confirmación salió y quedó guardado su id)");
await meta(estado(wid, "delivered")); ok(!!J_("b1", "j1").waC, "«entregado» no cambia nada");
await meta(estado("wamid.otro", "failed", 131026)); ok(!!J_("b1", "j1").waC, "un fallo de otro mensaje no toca esta cita");
await meta(estado(wid, "failed", 131026));
ok(!J_("b1", "j1").waC && J_("b1", "j1").waE === "tel" && usados("b1") === 0, "si Meta avisa que no se pudo entregar (número sin WhatsApp): se quita el ✓, queda waE = tel y se devuelve el mensaje a la cuenta");
await meta(estado(wid, "failed", 131026)); igual(usados("b1"), 0, "si Meta repite el aviso de fallo, no se devuelve dos veces");

titulo("Fin de mes y de año");
AHORA = cr("2026-12-31T17:00:00"); limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1, date: "2027-01-01", time: "08:00" });
await cron(); igual(META.wa[0] && META.wa[0].template.components[0].parameters[2].text, "mañana viernes 1 de enero a las 8:00 am", "el 31 de diciembre recuerda la cita del 1 de enero");
igual(usados("b1"), 1, "y la cuenta en diciembre");
AHORA = Date.parse("2027-02-28T16:30:00Z"); limpio(); negocio("es1", { country: "ES", slug: "taller-madrid" }); cita("es1", "j1", { at: 1, waC: 1, tel: "612345679", date: "2027-03-01", time: "09:30" });
await cron(); igual(META.wa[0] && META.wa[0].template.components[0].parameters[2].text, "mañana lunes 1 de marzo a las 9:30 am", "el 28 de febrero en España recuerda la del 1 de marzo");

titulo("Lo de siempre sigue igual");
// Sin WhatsApp conectado (así se publica), el Worker debe hacer EXACTAMENTE las mismas llamadas que la versión publicada.
let W0 = null;
try {
  const { execFileSync } = await import("node:child_process");
  const viejo = execFileSync("git", ["show", "main:webhook/worker.js"], { cwd: aqui, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  if (viejo !== fs.readFileSync(path.join(aqui, "..", "..", "..", "webhook", "worker.js"), "utf8")) { const f = path.join(os.tmpdir(), "citaly-worker-main-" + process.pid + ".mjs"); fs.writeFileSync(f, viejo); W0 = (await import(pathToFileURL(f).href)).default; fs.unlinkSync(f); }
} catch (e) {}
if (!W0) console.log("  ⏭️  (sin versión anterior para comparar: se salta la comparación con main)");
else {
  const SIN = { ...ENV0, WA_TOKEN: "", WA_PHONE_ID: "", RESEND_KEY: "re" };
  const huella = () => LOG.map((l) => l.m + " " + l.url + " " + l.body.replace(/"assertion=[^"]*|assertion=\S*/g, "")).join("\n");
  const mundo = () => { limpio(); for (let b = 0; b < 5; b++) { negocio("m" + b, { slug: "correo-" + b, email: "d" + b + "@prueba.com", mailTo: "d" + b + "@prueba.com" }, { ...PRUEBA, start: AHORA - 3600e3, until: new Date(AHORA + 6 * 864e5) }); cita("m" + b, "j1"); } };
  const corre = async (w, f) => { mundo(); LOG = []; await f(w); return huella(); };
  AHORA = cr("2026-12-03T17:00:00");
  const cronDe = async (w) => { const p = []; await w.scheduled({ cron: "0 * * * *", scheduledTime: AHORA }, SIN, { waitUntil: (x) => p.push(x) }); await Promise.all(p); };
  ok((await corre(W0, cronDe)) === (await corre(W, cronDe)) && LOG.length > 5, "cron con correos: mismas llamadas que la versión publicada");
  const pushDe = async (w) => { const r = await w.fetch(new Request("https://w.prueba/push", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ev: "new", biz: "m0", job: "j1" }) }), SIN); await r.text(); };
  ok((await corre(W0, pushDe)) === (await corre(W, pushDe)) && LOG.length > 5, "reserva nueva (/push): mismas llamadas que la versión publicada");
}
r = await W.fetch(new Request("https://w.prueba/", { method: "POST", body: "{}" }), { ...ENV0, POLAR_WEBHOOK_SECRET: "x" });
igual(r.status, 401, "el webhook de Polar sigue pidiendo firma");
igual(await (await W.fetch(new Request("https://w.prueba/wa/uso"), ENV0)).text(), "ok", "GET a una ruta nueva responde ok");

console.log("\n" + (mal ? `❌ ${mal} de ${n} revisiones fallaron` : `✅ ${n} revisiones pasaron`));
process.exit(mal ? 1 : 0);
