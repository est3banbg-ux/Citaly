/* Citaly · webhook de Polar → activa el plan solo.
   Cloudflare Worker. Variables (secretos): POLAR_WEBHOOK_SECRET, FB_PROJECT (citaly-cb101),
   FB_CLIENT_EMAIL, FB_PRIVATE_KEY (de la cuenta de servicio de Firebase). Guía: LEEME.md */
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

export default {
  async fetch(req, env) {
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
