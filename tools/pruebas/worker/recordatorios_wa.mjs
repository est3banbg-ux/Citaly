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

async function falso(url, init = {}) {
  url = String(url); const m = (init.method || "GET").toUpperCase(), body = init.body ? String(init.body) : "";
  LOG.push({ m, url, body });
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
    const res = [];
    for (const w of JSON.parse(body).writes) {
      const p = w.update.name.replace(NAME, ""), f = DB.get(p) || {}; DB.set(p, f);
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
  return DB.has(ruta) ? J({ name: NAME + ruta, fields: DB.get(ruta) }) : J({ error: { code: 404 } }, 404);
}
globalThis.fetch = falso;

/* ---------- ayudas ---------- */
function limpio() { DB = new Map(); LOG = []; META = { wa: [], push: [], mail: [], falla: false }; }
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
const usados = (bid) => (doc(`wa/${bid}_${dia(AHORA).slice(0, 7)}`) || {}).n || 0;
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
igual([doc("waTo/50688887777").biz, doc("waTo/50688887777").job, doc("waTo/50688887777").bwa], ["b1", "j1", "50661506610"], "guarda de qué negocio y cita fue, para cuando el cliente conteste");
ok(META.push.length === 1, "el aviso al celular del dueño sigue saliendo igual");
r = await (await post("/push", { ev: "new", biz: "b1", job: "j1" })).json();
ok(META.wa.length === 1 && usados("b1") === 1, "si la página avisa dos veces, NO se manda ni se cuenta dos veces");

titulo("Quién NO recibe confirmación");
const caso = async (que, armar, espera = 0) => { limpio(); armar(); const x = await (await post("/push", { ev: "new", biz: "b1", job: "j1" })).json(); ok(x.ok === true && META.wa.length === espera && usados("b1") === espera && META.push.length === 1, que); };
await caso("negocio con la función apagada", () => { negocio("b1", { waAuto: { on: false } }); cita("b1", "j1"); });
await caso("negocio que nunca la encendió (sin waAuto)", () => { negocio("b1", { waAuto: null }); cita("b1", "j1"); });
await caso("apagó solo la confirmación", () => { negocio("b1", { waAuto: { on: true, conf: false } }); cita("b1", "j1"); });
await caso("plan Arranque sin el extra", () => { negocio("b1", {}, { tier: "arranque" }); cita("b1", "j1"); });
await caso("plan Turbo sin el extra", () => { negocio("b1", {}, { tier: "turbo" }); cita("b1", "j1"); });
await caso("plan suspendido", () => { negocio("b1", {}, { status: "suspended" }); cita("b1", "j1"); });
await caso("plan vencido", () => { negocio("b1", {}, { until: new Date(AHORA - 864e5) }); cita("b1", "j1"); });
await caso("cita sin link «Mi cita» (sin tk)", () => { negocio("b1"); cita("b1", "j1", { tk: null }); });
titulo("Quién SÍ la recibe");
await caso("Arranque CON el extra (subs.waauto)", () => { negocio("b1", {}, { tier: "arranque", waauto: true }); cita("b1", "j1"); }, 1);
await caso("prueba gratis", () => { negocio("b1", {}, { plan: "trial", status: "trial", tier: null, until: new Date(AHORA + 5 * 864e5) }); cita("b1", "j1"); }, 1);
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
limpio(); negocio("b1"); cita("b1", "j1", { tel: "50761234567", time: "13:05" });
await post("/push", { ev: "new", biz: "b1", job: "j1" });
igual([META.wa[0].to, META.wa[0].template.components[0].parameters[2].text], ["50761234567", "viernes 4 de diciembre a la 1:05 pm"], "número que ya trae código de país se respeta; «a la 1:05 pm»");

titulo("Cuando Meta no acepta el mensaje");
limpio(); negocio("b1"); cita("b1", "j1"); META.falla = true;
r = await (await post("/push", { ev: "new", biz: "b1", job: "j1" })).json();
ok(r.ok && r.w === 0 && !J_("b1", "j1").waC && J_("b1", "j1").waE === "error" && usados("b1") === 0, "no marca enviado, deja waE = error y devuelve el mensaje a la cuenta");

titulo("Tope de mensajes");
limpio(); negocio("b1", {}, { plan: "trial", status: "trial", tier: null, until: new Date(AHORA + 5 * 864e5) }); cita("b1", "j1"); cita("b1", "j2", { tel: "88886666" });
put("wa/b1_2026-12", { n: 20 });
await post("/push", { ev: "new", biz: "b1", job: "j1" });
ok(META.wa.length === 0 && J_("b1", "j1").waE === "tope" && usados("b1") === 20, "en la prueba, con 20 usados no manda más y la cuenta se queda en 20");
ok(META.push.length === 2 && /Se acabaron/.test(META.push[1].title) && /20 mensajes de tu prueba/.test(META.push[1].body), "le avisa al dueño que se acabaron");
await post("/push", { ev: "new", biz: "b1", job: "j2" });
ok(META.push.filter((p) => /Se acabaron/.test(p.title)).length === 1, "ese aviso sale una sola vez al mes");
limpio(); negocio("b1"); cita("b1", "j1"); put("wa/b1_2026-12", { n: 149 });
await post("/push", { ev: "new", biz: "b1", job: "j1" });
ok(META.wa.length === 1 && usados("b1") === 150, "Nitro: el mensaje 150 sí sale");

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
igual(META.wa.map((x) => x.to + " " + x.template.name), ["50688880001 cita_recordatorio_simple", "50688887777 cita_recordatorio"], "solo salen los 2 que tocan, en orden de hora");
igual(META.wa[1].template.components[0].parameters[2].text, "mañana viernes 4 de diciembre a las 10:00 am", "el texto dice «mañana viernes 4 de diciembre…»");
ok(META.wa[0].template.components.length === 1 && META.wa[1].template.components[1].parameters[0].text === "car-keyss." + TK, "con link lleva botón; la cita hecha a mano va sin botón");
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
igual([await cron(), META.wa.length], [0, 0], "a las 10 a. m. no hace ni una llamada");
AHORA = cr("2026-12-03T21:30:00"); igual([await cron(), META.wa.length], [0, 0], "a las 9:30 p. m. tampoco");
AHORA = cr("2026-12-03T17:00:00");
for (const [que, extra, sub] of [["recordatorio apagado (rem: false)", { waAuto: { on: true, rem: false } }, {}], ["función apagada", { waAuto: { on: false } }, {}], ["plan Turbo sin extra", {}, { tier: "turbo" }], ["plan vencido", {}, { until: new Date(AHORA - 1) }]]) {
  limpio(); negocio("b1", extra, sub); cita("b1", "j1", { at: 1, waC: 1 }); await cron(); igual(META.wa.length, 0, que + ": no manda");
}
limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1 });
await cron({ ...ENV0, WA_TOKEN: "" }); igual(META.wa.length, 0, "sin WhatsApp conectado: no manda");

titulo("Cita que se movió de día");
limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1, waR: 5, waRd: "2026-12-02", waRt: "2026-12-02" });
await cron(); ok(META.wa.length === 1 && J_("b1", "j1").waRd === man, "si ya había recibido recordatorio para OTRO día, recibe el del día nuevo");

titulo("Errores pasajeros y tope en el cron");
limpio(); negocio("b1"); cita("b1", "j1", { at: 1, waC: 1 }); META.falla = true;
await cron(); ok(J_("b1", "j1").waE === "error" && !J_("b1", "j1").waRd && doc("biz/b1").waDay !== man && usados("b1") === 0, "si Meta falla, queda pendiente y no se cuenta");
META.falla = false; AHORA += 3600e3; await cron();
ok(J_("b1", "j1").waRd === man && !J_("b1", "j1").waE && usados("b1") === 1, "en la corrida siguiente sí sale y se limpia el error");
AHORA = cr("2026-12-03T17:00:00"); limpio(); negocio("b1"); put("wa/b1_2026-12", { n: 150 });
for (let i = 0; i < 4; i++) cita("b1", "j" + i, { at: 1, waC: 1, tel: "8888000" + i, time: String(8 + i).padStart(2, "0") + ":00" });
await cron();
ok(META.wa.length === 0 && J_("b1", "j0").waE === "tope" && !J_("b1", "j1").waE && doc("biz/b1").waDay === man && usados("b1") === 150, "con 150 usados: marca la primera con «tope», no sigue intentando y cierra el día");
ok(META.push.filter((p) => /Se acabaron/.test(p.title)).length === 1, "y le avisa al dueño una vez");

titulo("Muchos negocios: límite de llamadas por corrida");
limpio();
for (let b = 0; b < 6; b++) { negocio("n" + b, { slug: "negocio-" + b }); for (let i = 0; i < 8; i++) cita("n" + b, "c" + i, { at: 1, waC: 1, tel: "8" + b + "00000" + i, time: "0" + (i + 1) + ":00" }); }
let corridas = 0, maxLl = 0, total = 0;
for (; corridas < 40 && total < 48; corridas++) { META.wa = []; maxLl = Math.max(maxLl, await cron()); total += META.wa.length; AHORA += 60e3; }
ok(total === 48 && maxLl <= 34, `salen los 48 recordatorios sin pasar de 34 llamadas por corrida (máximo visto: ${maxLl}, en ${corridas} corridas)`);
let dobles = 0; for (let b = 0; b < 6; b++) dobles += usados("n" + b) === 8 ? 0 : 1;
igual(dobles, 0, "cada negocio cuenta exactamente 8: nadie recibe doble");
limpio(); for (let b = 0; b < 6; b++) { negocio("n" + b, { slug: "negocio-" + b }); for (let i = 0; i < 8; i++) cita("n" + b, "c" + i, { at: 1, waC: 1, tel: "8" + b + "00000" + i }); }
maxLl = 0; total = 0;
for (corridas = 0; corridas < 40 && total < 48; corridas++) { META.wa = []; maxLl = Math.max(maxLl, await cron({ ...ENV0, WA_CRON: "*/10 * * * *" }, "*/10 * * * *")); total += META.wa.length; AHORA += 60e3; }
ok(total === 48 && maxLl <= 48, `con cron aparte rinde más por corrida y no pasa de 48 llamadas (máximo visto: ${maxLl}, en ${corridas} corridas)`);

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
igual([META.wa[0].to, META.wa[0].template.name, META.wa[0].template.components[0].parameters.map((x) => x.text).join("|")], ["50661506610", "cita_recordatorio_simple", "Ana|Car Keyss Detailing|mañana viernes 4 de diciembre a las 10:00 am"], "con un recordatorio de ejemplo");
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
put("waTo/50688887777", { biz: "b1", job: "j1", cli: "Ana María Rojas", name: "Car Keyss Detailing", bwa: "50661506610", at: AHORA - 3600e3 });
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
ok(/Mandó 🎤 un audio/.test(META.push[3].body), "un audio se avisa como audio");
await meta(entra({ from: "50670000000", id: "wamid.E", type: "text", text: { body: "hola" } }));
ok(META.push.length === 4 && META.wa.length === 2 && /nadie lee los mensajes/.test(META.wa[1].text.body) && !/wa\.me/.test(META.wa[1].text.body), "un número desconocido recibe la respuesta general y no molesta a ningún dueño");
await meta(entra({ from: "50688887777", id: "wamid.F", type: "text", text: { body: "x" } }, "999"));
ok(META.push.length === 4, "mensajes de otro número de Meta se ignoran");
put("waTo/50688881111", { biz: "b1", job: "j9", cli: "Luis", name: "Car Keyss Detailing", bwa: "50661506610", at: AHORA - 9 * 864e5 });
await meta(entra({ from: "50688881111", id: "wamid.G", type: "text", text: { body: "hola" } }));
ok(META.push.length === 4 && META.wa.length === 3, "si el aviso fue hace más de 7 días, ya no se le pasa al dueño");

titulo("Lo de siempre sigue igual");
r = await W.fetch(new Request("https://w.prueba/", { method: "POST", body: "{}" }), { ...ENV0, POLAR_WEBHOOK_SECRET: "x" });
igual(r.status, 401, "el webhook de Polar sigue pidiendo firma");
igual(await (await W.fetch(new Request("https://w.prueba/wa/uso"), ENV0)).text(), "ok", "GET a una ruta nueva responde ok");

console.log("\n" + (mal ? `❌ ${mal} de ${n} revisiones fallaron` : `✅ ${n} revisiones pasaron`));
process.exit(mal ? 1 : 0);
