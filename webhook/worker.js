/* Citaly · webhook de Polar → activa el plan solo.
   Cloudflare Worker. Variables (secretos): POLAR_WEBHOOK_SECRET, FB_PROJECT (citaly-cb101),
   FB_CLIENT_EMAIL, FB_PRIVATE_KEY (de la cuenta de servicio de Firebase). Guía: LEEME.md
   Asistente con IA (ruta /ia): además ANTHROPIC_API_KEY (secreto) y FB_API_KEY (la apiKey pública de Firebase, de cfg.js). */
const TIERS = { arranque: 4900, turbo: 9900, nitro: 19900 };
const PROMO = { plan: "arranque", price: 500, months: 3 };
const enc = new TextEncoder();
const b64 = (u8) => btoa(String.fromCharCode(...new Uint8Array(u8)));
const b64u = (s) => (typeof s === "string" ? btoa(s) : b64(s)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

async function verify(req, body, secret) {
  const id = req.headers.get("webhook-id"), ts = req.headers.get("webhook-timestamp"), sig = req.headers.get("webhook-signature") || "";
  if (!id || !ts || Math.abs(Date.now() / 1000 - +ts) > 300) return false;
  secret = (secret || "").trim();
  const keys = [enc.encode(secret)];
  try { keys.push(Uint8Array.from(atob(secret.replace(/^whsec_/, "")), (c) => c.charCodeAt(0))); } catch (e) {}
  const sigs = sig.split(" ").map((s) => s.split(",")[1]);
  for (const k of keys) {
    const key = await crypto.subtle.importKey("raw", k, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const mac = b64(await crypto.subtle.sign("HMAC", key, enc.encode(`${id}.${ts}.${body}`)));
    if (sigs.includes(mac)) return true;
  }
  return false;
}
async function token(env) {
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64u(JSON.stringify({ iss: env.FB_CLIENT_EMAIL, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3000 }));
  const pem = env.FB_PRIVATE_KEY.replace(/\\n/g, "\n").replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
  const key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), (c) => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = b64u(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(`${head}.${claim}`)));
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${head}.${claim}.${sig}` });
  return (await r.json()).access_token;
}
const fs = (env) => `https://firestore.googleapis.com/v1/projects/${env.FB_PROJECT}/databases/(default)/documents`;
const V = (x) => typeof x === "string" ? { stringValue: x } : typeof x === "boolean" ? { booleanValue: x } : { integerValue: String(Math.round(x)) };
const T = (ms) => ({ timestampValue: new Date(ms).toISOString() });
async function find(env, tk, email) {
  const r = await fetch(`${fs(env)}:runQuery`, { method: "POST", headers: { authorization: "Bearer " + tk }, body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "own" }], where: { fieldFilter: { field: { fieldPath: "__name__" }, op: "EQUAL", value: { referenceValue: `projects/${env.FB_PROJECT}/databases/(default)/documents/own/${email}` } } }, limit: 1 } }) });
  const j = await r.json(); const f = j[0] && j[0].document && j[0].document.fields;
  return f && f.biz && f.biz.stringValue;
}
async function get(env, tk, path) { const r = await fetch(`${fs(env)}/${path}`, { headers: { authorization: "Bearer " + tk } }); return r.ok ? (await r.json()).fields || {} : null; }
async function patch(env, tk, path, fields) {
  const mask = Object.keys(fields).map((k) => "updateMask.fieldPaths=" + k).join("&");
  return fetch(`${fs(env)}/${path}?${mask}`, { method: "PATCH", headers: { authorization: "Bearer " + tk, "content-type": "application/json" }, body: JSON.stringify({ fields }) });
}
function addMonth(ms) { const d = new Date(ms); d.setMonth(d.getMonth() + 1); return d.getTime(); }

/* ---------- Asistente con IA para los negocios (POST /ia) ---------- */
const IA_LIM = { turbo: 5, nitro: 30, trial: 10 }; // usos por día
const ORIGINS = ["https://citalyapp.com", "https://www.citalyapp.com", "https://est3banbg-ux.github.io"];
const cors = (req) => { const o = req.headers.get("origin") || ""; return { "access-control-allow-origin": ORIGINS.includes(o) ? o : ORIGINS[0], "access-control-allow-headers": "content-type", "access-control-allow-methods": "POST, OPTIONS", vary: "origin" }; };
const jr = (req, obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", ...cors(req) } });
const clip = (x, n) => String(x == null ? "" : x).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n);
const GUARD = "Eres el asistente de un negocio pequeño de Costa Rica que usa Citaly. Solo ayudas con la página web del negocio, sus servicios, textos de WhatsApp y respuestas a clientes. Si piden algo que no tenga que ver con eso (tareas, código, política, otros temas), responde en una frase que solo puedes ayudar con el negocio. Escribe en español de Costa Rica, trato de tú, cercano y profesional, sin inventar precios, garantías ni datos que no te dieron. Sé breve.";
function iaPrompt(mode, ctx) {
  const info = `Negocio: ${ctx.name}${ctx.type ? " (" + ctx.type + ")" : ""}.${ctx.services.length ? " Servicios: " + ctx.services.join(", ") + "." : ""}`;
  if (mode === "desc") return GUARD + " " + info + ' Mejora la frase de portada (máx. 8 palabras) y la descripción corta (máx. 25 palabras) de su página. Responde SOLO con JSON válido: {"tagline":"...","blurb":"..."}';
  if (mode === "faq") return GUARD + " " + info + ' Crea 5 preguntas frecuentes con respuesta corta (máx. 35 palabras cada una) que harían sus clientes. No inventes políticas: si no sabes algo (garantía, precios), da una respuesta neutral. Responde SOLO con JSON válido: [{"q":"...","a":"..."}]';
  if (mode === "resp") return GUARD + " " + info + " Redacta una respuesta lista para enviar por WhatsApp al mensaje del cliente. Máximo 60 palabras.";
  return GUARD + " " + info;
}
async function ia(req, env) {
  if (!env.ANTHROPIC_API_KEY || !env.FB_API_KEY) return jr(req, { error: "no_config" }, 503);
  let b; try { b = await req.json(); } catch (e) { return jr(req, { error: "datos" }, 400); }
  const idToken = clip(b.idToken, 4000), mode = ["desc", "faq", "resp", "libre"].includes(b.mode) ? b.mode : "libre", text = clip(b.text, 500);
  if (!idToken) return jr(req, { error: "sesion" }, 401);
  if (mode !== "desc" && mode !== "faq" && text.length < 3) return jr(req, { error: "vacio" }, 400);
  const lk = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + env.FB_API_KEY, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ idToken }) });
  const u = lk.ok ? ((await lk.json()).users || [])[0] : null;
  if (!u || !u.emailVerified) return jr(req, { error: "sesion" }, 401);
  const tk = await token(env), email = String(u.email || "").toLowerCase();
  let bid = (await get(env, tk, "subs/" + u.localId)) ? u.localId : await find(env, tk, email);
  const s = bid && (await get(env, tk, "subs/" + bid));
  if (!s) return jr(req, { error: "plan" }, 403);
  const until = s.until && s.until.timestampValue ? Date.parse(s.until.timestampValue) : 0, st = (s.status || {}).stringValue || "", t = (s.tier || {}).stringValue || "";
  if (st === "suspended" || until < Date.now()) return jr(req, { error: "plan" }, 403);
  const max = st === "trial" ? IA_LIM.trial : IA_LIM[t] || 0;
  if (!max) return jr(req, { error: "plan" }, 403);
  const day = new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10), path = "ia/" + bid + "_" + day;
  const used = +((((await get(env, tk, path)) || {}).n || {}).integerValue || 0);
  if (used >= max) return jr(req, { error: "limite", max, left: 0 }, 429);
  await patch(env, tk, path, { n: V(used + 1), biz: V(bid) }); // se cuenta antes de llamar a la IA
  const c = b.ctx || {}, ctx = { name: clip(c.name, 60) || "el negocio", type: clip(c.type, 40), services: (Array.isArray(c.services) ? c.services : []).slice(0, 8).map((x) => clip(x, 40)).filter(Boolean) };
  const msg = text || (mode === "desc" ? "Mejora los textos de mi página." : "Crea las preguntas frecuentes.");
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: env.IA_MODEL || "claude-haiku-5-5", max_tokens: 600, system: iaPrompt(mode, ctx), messages: [{ role: "user", content: msg }] }) });
  if (!r.ok) { await patch(env, tk, path, { n: V(used) }); return jr(req, { error: "ia" }, 502); }
  const out = ((await r.json()).content || []).map((x) => x.text || "").join("").trim();
  return jr(req, { ok: true, text: out, max, left: max - used - 1 });
}

export default {
  async fetch(req, env) {
    const path = new URL(req.url).pathname;
    if (path === "/ia") return req.method === "OPTIONS" ? new Response(null, { status: 204, headers: cors(req) }) : req.method === "POST" ? ia(req, env) : new Response("ok");
    if (req.method !== "POST") return new Response("ok");
    const body = await req.text();
    if (!(await verify(req, body, env.POLAR_WEBHOOK_SECRET))) return new Response("firma inválida", { status: 401 });
    const ev = JSON.parse(body);
    if (ev.type !== "order.paid") return new Response("ignorado");
    const o = ev.data || {}, email = String((o.customer && o.customer.email) || "").toLowerCase();
    const name = String((o.product && o.product.name) || "").toLowerCase();
    const tier = Object.keys(TIERS).find((t) => name.includes(t)) || "arranque";
    const usd = (o.net_amount != null ? o.net_amount : o.amount || 0) / 100, tk = await token(env);
    const md = Object.assign({}, (o.subscription && o.subscription.metadata) || {}, (o.checkout && o.checkout.metadata) || {}, o.metadata || {});
    const ref = String(md.reference_id || md.ref || "").replace(/[^A-Za-z0-9_-]/g, "");
    let bid = ref && (await get(env, tk, "subs/" + ref)) ? ref : null; // 1° por el id que manda la app
    if (!bid && email) bid = await find(env, tk, email); // 2° por correo
    const amt = Math.round(usd * 520); // aprox. en colones, solo para el reporte
    const pay = { name: V(email || "?"), amt: V(amt), usd: V(usd), at: V(Date.now()), type: V("mes"), what: V("Polar · " + name), src: V("polar") };
    if (bid) pay.biz = V(bid);
    await patch(env, tk, "payments/polar_" + o.id, pay);
    if (!bid) return new Response("pago guardado sin cuenta");
    const s = (await get(env, tk, "subs/" + bid)) || {};
    const months = +((s.months || {}).integerValue || 0), until = s.until && s.until.timestampValue ? Date.parse(s.until.timestampValue) : 0;
    const left = !!(s.leftPromo || {}).booleanValue, promo = tier === PROMO.plan && !left && months < PROMO.months;
    const base = (s.demo || {}).booleanValue ? Date.now() : Math.max(Date.now(), until);
    await patch(env, tk, "subs/" + bid, { plan: V("mensual"), demo: V(false), tier: V(tier), status: V("active"), price: V(promo ? PROMO.price : TIERS[tier]), months: V(months + 1), until: T(addMonth(base)) });
    return new Response("plan activado");
  },
};
