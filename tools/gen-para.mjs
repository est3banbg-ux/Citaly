// Crea las páginas de Citaly por tipo de negocio: /para/ (índice) y /para/<tipo>/.
// Se corre a mano: node tools/gen-para.mjs   (el resultado se sube al repo; no depende de Firebase).
// Los precios, planes y servicios salen de cfg.js, así que si cambian allá, se vuelve a correr.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const ORIGIN = "https://citalyapp.com";
const ctx = { window: {}, console };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, "cfg.js"), "utf8") + "\n;this.__C = CITALY;", ctx);
const C = ctx.__C;

const esc = s => String(s ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const crc = n => "₡" + Math.round(n).toLocaleString("es-CR");
const today = new Date().toISOString().slice(0, 10);
const CTA = tipo => `/app/?nuevo=1&desde=para-${tipo}`;
const WA = `https://api.whatsapp.com/send?phone=${C.wa}&text=${encodeURIComponent("Hola, quiero información sobre Citaly")}`;
const WA_TXT = "6150-6610";

const TIPOS = {
  detailing: {
    corto: "detailing",
    h1: "Sistema de citas para detailing en Costa Rica",
    title: "Sistema de citas para detailing en Costa Rica | Citaly",
    desc: "Tus clientes eligen su vehículo, ven el precio y reservan solos. Página web y app incluidas. 7 días gratis, sin tarjeta. Plan Arranque desde ₡4.900/mes.",
    lead: "Tus clientes eligen su vehículo, ven el precio y reservan la hora solos, aunque estés en medio de una corrección de pintura. Vos solo atendés carros.",
    dolor: ["Un detailing no puede contestar mensajes con la pulidora en la mano, y el cliente le escribe al siguiente.", "Los servicios largos (de 3 a 8 horas) se traslapan si la agenda vive en un cuaderno.", "El cliente pregunta cuánto cuesta para su carro y hay que cotizar uno por uno."],
    serviciosTitulo: "Servicios típicos de un detailing",
    extra: [["¿Puedo cobrar distinto según el tamaño del vehículo?", "Sí. Marcás los servicios que cambian de precio y el cliente elige su tipo de vehículo al reservar: ve el precio exacto antes de confirmar."], ["¿Sirve si trabajo a domicilio?", "Sí. El plan Turbo trae servicio a domicilio con zonas, tiempo de traslado y aviso de «voy en camino»."]]
  },
  lavacar: {
    corto: "lavacar",
    h1: "Sistema de citas para lavacar en Costa Rica",
    title: "Sistema de citas para lavacar en Costa Rica | Citaly",
    desc: "Agenda para lavacar: tus clientes reservan solos, tú ves el día en el celular. Página web y app incluidas. 7 días gratis, sin tarjeta. Desde ₡4.900/mes.",
    lead: "Que tus clientes reserven su lavado solos y que cada hora de tu día esté clara en el celular. Se acabaron los mensajes de «¿tiene campo hoy?».",
    dolor: ["Cada «¿tiene campo hoy?» es un mensaje que hay que contestar con las manos mojadas.", "Los clientes llegan todos a la misma hora y otras horas del día quedan vacías.", "Sin historial por vehículo, cada visita empieza de cero."],
    serviciosTitulo: "Servicios típicos de un lavacar",
    extra: [["¿Puedo manejar varios carros a la misma hora?", "Sí. En el plan Turbo definís cuántos clientes atendés al mismo tiempo (cupos) y la agenda no deja reservar de más."], ["¿Sirve si el lavado es a domicilio?", "Sí. El plan Turbo trae zonas, tiempo de traslado y aviso de «voy en camino»."]]
  },
  pulido: {
    corto: "pulido de focos y vidrios",
    h1: "Sistema de citas para pulido de focos y parabrisas",
    title: "Sistema de citas para pulido de focos y parabrisas | Citaly",
    desc: "Agenda y página de reservas para pulido de focos y parabrisas. Tus clientes reservan solos. 7 días gratis, sin tarjeta. Plan Arranque desde ₡4.900/mes.",
    lead: "Tus clientes reservan el pulido de sus focos o su parabrisas sin escribirte, y vos llegás con la agenda del día ya armada.",
    dolor: ["El cliente pregunta el precio, desaparece, y vos ya perdiste media hora contestando.", "Con servicios a domicilio, una cita mal agendada te cuesta el viaje completo.", "Sin recordatorio, el cliente se olvida y la hora queda vacía."],
    serviciosTitulo: "Servicios típicos de pulido de focos y vidrios",
    extra: [["¿Sirve para quitar la gota seca del parabrisas?", "Sí. Cargás «Remoción de gota seca» como un servicio más, con su precio y duración, y el cliente lo elige al reservar."], ["¿Sirve si trabajo a domicilio?", "Sí. El plan Turbo trae servicio a domicilio con zonas, tiempo de traslado y aviso de «voy en camino»."]]
  }
};

const css = `
:root{--ink:#17123A;--mut:#5B5680;--brand:#2A1A7A;--acc:#FFB84D;--bg:#F7F5FB;--card:#fff;--line:#E3DFF1;--soft:#EFEBFA}
@media(prefers-color-scheme:dark){:root{--ink:#F1EFFB;--mut:#B9B4D8;--brand:#9C8CFF;--acc:#FFB84D;--bg:#100C2A;--card:#1A1540;--line:#2E2766;--soft:#221B55}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font:400 17px/1.55 Figtree,system-ui,sans-serif;padding-bottom:84px}
h1,h2,h3{font-family:'Bricolage Grotesque',Figtree,sans-serif;line-height:1.12;margin:0;text-wrap:balance}
a{color:var(--brand)}
.w{max-width:1100px;margin:0 auto;padding:0 20px}
nav{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:space-between;padding:16px 0}
.logo{font:700 26px 'Bricolage Grotesque',sans-serif;color:var(--brand);text-decoration:none}
.btn{display:inline-block;background:var(--acc);color:#17123A;padding:15px 26px;border-radius:12px;font-weight:700;text-decoration:none;text-align:center}
.btn.alt{background:transparent;color:var(--brand);border:2px solid var(--brand);padding:13px 24px}
.hero{display:flex;flex-wrap:wrap;gap:40px;align-items:center;padding:28px 0 56px}
.hero>div{flex:1 1 440px;min-width:0}
.kick{font-weight:700;font-size:14px;letter-spacing:.08em;text-transform:uppercase;color:var(--mut)}
h1{font-size:clamp(34px,6vw,54px)}h2{font-size:clamp(28px,4.4vw,38px)}h3{font-size:20px}
.lead{font-size:20px;color:var(--mut);max-width:34em}
.row{display:flex;flex-wrap:wrap;gap:14px;align-items:center}
.sub{color:var(--mut);font-size:15px}
.mock{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:22px;display:flex;flex-direction:column;gap:14px;box-shadow:0 12px 32px rgba(42,26,122,.12)}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chip{padding:8px 14px;border-radius:999px;border:1px solid var(--line);font-size:15px}.chip.on{background:var(--brand);color:#fff;border-color:var(--brand);font-weight:700}
.band{background:var(--card);border-block:1px solid var(--line)}
.grid{display:flex;flex-wrap:wrap;gap:20px}.grid>*{flex:1 1 300px;min-width:0}
.card{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px}
.card p,.band p{margin:6px 0 0;color:var(--mut)}
section{padding:56px 0}
ol.steps{margin:0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:20px;counter-reset:s}
ol.steps li{flex:1 1 280px;counter-increment:s;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px}
ol.steps li:before{content:counter(s);display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;background:var(--brand);color:#fff;font-weight:700;margin-bottom:10px}
.tags{display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 0;padding:0;list-style:none}.tags li{background:var(--soft);padding:9px 16px;border-radius:999px;font-weight:600}
.plan{display:flex;flex-direction:column;gap:8px}.plan.pop{border:2px solid var(--brand)}
.amt{font:700 38px 'Bricolage Grotesque',sans-serif}.amt small{font:400 16px Figtree;color:var(--mut)}
.plan ul{margin:6px 0 0;padding-left:20px;color:var(--mut)}
details{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 20px;margin-bottom:12px}
summary{font-weight:700;cursor:pointer}details p{margin:10px 0 0;color:var(--mut)}
.who{background:var(--brand);color:#fff;border-radius:24px;padding:36px;display:flex;flex-wrap:wrap;gap:24px;align-items:center}
.who>div{flex:1 1 380px;min-width:0}.who p{margin:10px 0 0;color:#DAD5F5}.who a.btn{background:#fff;color:var(--brand)}
.links{display:flex;flex-wrap:wrap;gap:10px 22px}
footer{border-top:1px solid var(--line);padding:28px 0;color:var(--mut);font-size:15px}
.dock{position:fixed;left:0;right:0;bottom:0;z-index:9;display:flex;gap:10px;padding:10px 14px calc(10px + env(safe-area-inset-bottom));background:var(--card);border-top:1px solid var(--line)}
.dock .btn{flex:1;padding:13px 12px}.dock .btn.alt{flex:0 0 auto}
@media(min-width:900px){.dock{display:none}body{padding-bottom:0}}
`;

const head = (t, desc, pathUrl, ld) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(t)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${ORIGIN}${pathUrl}">
<meta property="og:type" content="website"><meta property="og:locale" content="es_CR"><meta property="og:site_name" content="Citaly">
<meta property="og:url" content="${ORIGIN}${pathUrl}"><meta property="og:title" content="${esc(t)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${ORIGIN}/img/og-citaly.png"><meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#2a1a7a">
<link rel="icon" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Figtree:wght@400;600;700&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<style>${css}</style>
</head>
<body>`;

const nav = tipo => `<div class="w"><nav><a class="logo" href="/">Citaly</a><span class="row"><a href="/para/">Para tu negocio</a><a href="/#precio">Planes</a><a class="btn" href="${CTA(tipo)}">Probar gratis</a></span></nav></div>`;
const dock = tipo => `<div class="dock"><a class="btn" href="${CTA(tipo)}">Probar gratis 7 días</a><a class="btn alt" href="${WA}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">WhatsApp</a></div>`;
const foot = `<footer><div class="w">Hecho en Costa Rica · <a href="${WA}" target="_blank" rel="noopener">WhatsApp ${WA_TXT}</a> · <a href="https://www.tiktok.com/@citaly444" target="_blank" rel="noopener">TikTok</a> · <a href="/terminos.html">Términos</a> · <a href="/privacidad.html">Privacidad</a></div></footer>`;

function planes() {
  const P = C.plans, sel = { arranque: P.arranque.inc.slice(0, 6), turbo: P.turbo.inc.slice(1, 8), nitro: P.nitro.inc.slice(1, 7) };
  return ["arranque", "turbo", "nitro"].map(k => {
    const p = P[k];
    const precio = k === C.promoPlan
      ? `<div class="sub">Primeros ${C.monthly.promoMonths} meses</div><div class="amt">${crc(C.monthly.promo)}<small>/mes</small></div><div class="sub">después ${crc(p.crc)}/mes</div>`
      : `<div class="sub">Precio mensual</div><div class="amt">${crc(p.crc)}<small>/mes</small></div>`;
    return `<div class="card plan${p.pop ? " pop" : ""}"><h3>${esc(p.n)}</h3><div class="sub">${esc(p.tag)}</div>${precio}<ul>${sel[k].map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
  }).join("");
}

function paginaTipo(tipo, T) {
  const svc = (C.types[tipo] && C.types[tipo].svc || []).map(s => s[0]);
  const faq = [
    ["¿Necesito tarjeta para probar Citaly?", `No. Son ${C.trialDays} días gratis con el plan Nitro completo, sin tarjeta y sin contrato. Después elegís tu plan.`],
    ["¿Cuánto cuesta?", `El plan Arranque cuesta ${crc(C.monthly.promo)} al mes los primeros ${C.monthly.promoMonths} meses y después ${crc(C.plans.arranque.crc)}. Si una sola cita al mes que hoy se te pierde vale más que eso, el plan se paga solo.`],
    ["¿Sigo usando mi WhatsApp?", "Sí. Confirmar y recordar citas con un toque desde tu propio WhatsApp es gratis en todos los planes. Citaly agenda; vos seguís hablando con tus clientes como siempre."],
    ["¿Funciona en iPhone y Android?", "Sí. Se instala desde el navegador del celular y también se usa en computadora."],
    ["¿Es difícil de configurar?", `Elegís «${T.corto}» al crear tu cuenta y Citaly carga servicios de ejemplo para que solo cambiés nombres, precios y horario. Si te trabás, te ayudamos por WhatsApp al ${WA_TXT}.`],
    ...T.extra
  ];
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "SoftwareApplication", name: "Citaly", description: T.desc, url: `${ORIGIN}/para/${tipo}/`, applicationCategory: "BusinessApplication", operatingSystem: "Web, Android, iOS",
      offers: ["arranque", "turbo", "nitro"].map(k => ({ "@type": "Offer", name: C.plans[k].n, price: String(C.plans[k].crc), priceCurrency: "CRC" })) },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Citaly", item: ORIGIN + "/" },
      { "@type": "ListItem", position: 2, name: "Para tu negocio", item: ORIGIN + "/para/" },
      { "@type": "ListItem", position: 3, name: "Citas para " + T.corto, item: `${ORIGIN}/para/${tipo}/` } ] } ] };
  const otros = Object.entries(TIPOS).filter(([k]) => k !== tipo).map(([k, v]) => `<a href="/para/${k}/">Sistema de citas para ${esc(v.corto)}</a>`).join("");
  return head(T.title, T.desc, `/para/${tipo}/`, ld) + nav(tipo) + `
<main>
<div class="w"><div class="hero"><div>
<div class="kick">Para ${esc(T.corto)}</div>
<h1>${esc(T.h1)}</h1>
<p class="lead">${esc(T.lead)}</p>
<div class="row"><a class="btn" href="${CTA(tipo)}">Crear mi cuenta gratis</a><span class="sub">${C.trialDays} días gratis · sin tarjeta · sin contrato</span></div>
</div>
<div><div class="mock" aria-label="Ejemplo de la página de reservas">
<div class="sub">Así reserva tu cliente (ejemplo)</div>
<div><div class="sub">Tipo de vehículo</div><div class="chips"><span class="chip">Pequeño</span><span class="chip on">Mediano</span><span class="chip">Grande</span></div></div>
<div class="card"><b>${esc(svc[0] || "Tu servicio")}</b><div class="sub">El precio cambia según el vehículo elegido</div></div>
<div><div class="sub">Horas libres</div><div class="chips"><span class="chip">8:00 am</span><span class="chip on">10:00 am</span><span class="chip">1:00 pm</span></div></div>
<span class="btn" style="background:var(--brand);color:#fff">Confirmar reserva</span></div></div></div></div>

<div class="band"><div class="w"><section style="padding:36px 0"><h2 style="font-size:26px;margin-bottom:16px">Lo que le pasa a casi todo negocio de ${esc(T.corto)}</h2><div class="grid">${T.dolor.map(d => `<p style="margin:0">${esc(d)}</p>`).join("")}</div></section></div></div>

<div class="w"><section><h2>Cómo funciona</h2><ol class="steps" style="margin-top:22px">
<li><h3>Creás tu cuenta</h3><p>Elegís «${esc(T.corto)}» y en 2 minutos tenés tu página con servicios de ejemplo.</p></li>
<li><h3>Ajustás lo tuyo</h3><p>Cambiás servicios, precios, horario, logo y color. Sin programar nada.</p></li>
<li><h3>Compartís tu link</h3><p>Lo ponés en WhatsApp, Instagram y TikTok. Tus clientes reservan solos, a toda hora.</p></li></ol></section></div>

<div class="w"><section style="padding-top:0"><h2>${esc(T.serviciosTitulo)}</h2>
<p class="lead" style="font-size:18px">Citaly te los carga como ejemplo. Vos cambiás nombres, precios y duración.</p>
<ul class="tags">${svc.map(s => `<li>${esc(s)}</li>`).join("")}</ul></section></div>

<div class="band"><div class="w"><section><h2>Lo que incluye para tu negocio</h2><div class="grid" style="margin-top:22px">
<div class="card"><h3>Página de reservas 24/7</h3><p>El cliente elige servicio, vehículo, día y hora, y ve el precio antes de confirmar.</p></div>
<div class="card"><h3>Página web con tus trabajos</h3><p>Fotos, reseñas, preguntas frecuentes y hasta ${C.plans.arranque.inc.find(x => /videos/.test(x)).match(/\d+/)[0]} videos de TikTok, Instagram, Facebook o YouTube.</p></div>
<div class="card"><h3>Clientes e historial por vehículo</h3><p>Buscás por placa y ves qué servicios le hiciste a cada carro.</p></div>
<div class="card"><h3>Aviso de cada reserva</h3><p>Te llega al celular apenas alguien reserva, y podés pedir reseñas de Google con un toque.</p></div>
<div class="card"><h3>Avisa cuándo toca volver</h3><p>En Turbo, Citaly te muestra qué clientes ya deberían volver para escribirles por WhatsApp.</p></div>
<div class="card"><h3>Tu equipo y tus cuentas</h3><p>Desde Turbo sumás a tu equipo y llevás cierre de caja, gastos y ganancia del mes.</p></div>
</div></section></div></div>

<div class="w"><section><div class="who"><div><div class="kick" style="color:#FFB84D">Quién está detrás</div><h2 style="margin-top:6px">Hecho por un dueño de negocio de carros</h2>
<p>Citaly nació en GlassStudioCR, mi negocio de pulido de parabrisas y focos en Alajuela. Lo armé primero para mis propias reservas y hoy lo abro a otros negocios de carros. Si algo no te funciona, me escribís por WhatsApp al ${WA_TXT} y te ayudo.</p></div>
<a class="btn" href="https://citas.glassstudiocr.com/reservar" target="_blank" rel="noopener">Ver cómo reservan sus clientes</a></div></section></div>

<div class="w"><section id="planes" style="padding-top:0"><h2>Empezá gratis. Pagás cuando te sirva.</h2>
<div class="grid" style="margin-top:22px">${planes()}</div>
<p class="sub" style="margin-top:16px">Pagás con tarjeta o por SINPE Móvil. <a href="/#precio">Ver todos los planes y extras</a>.</p></section></div>

<div class="w"><section style="padding-top:0"><h2 style="margin-bottom:20px">Preguntas frecuentes</h2>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section></div>

<div class="w"><section style="padding-top:0"><div class="card" style="text-align:center"><h2>Probá Citaly ${C.trialDays} días, gratis</h2><p class="sub" style="margin:10px 0 18px">Sin tarjeta, sin contrato y listo en 2 minutos.</p><a class="btn" href="${CTA(tipo)}">Crear mi cuenta gratis</a></div></section></div>

<div class="w"><section style="padding-top:0"><h3>Citaly también para</h3><div class="links" style="margin-top:12px">${otros}<a href="/para/">Todos los tipos de negocio</a></div></section></div>
</main>` + foot + dock(tipo) + `
</body></html>
`;
}

function paginaIndice() {
  const t = "Citaly: sistema de citas para negocios de carros";
  const desc = "Sistema de citas y reservas en línea para detailing, lavacar y pulido de focos y parabrisas en Costa Rica. 7 días gratis, sin tarjeta.";
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: t, url: ORIGIN + "/para/", hasPart: Object.entries(TIPOS).map(([k, v]) => ({ "@type": "WebPage", name: v.h1, url: `${ORIGIN}/para/${k}/` })) };
  return head(t, desc, "/para/", ld) + nav("inicio") + `
<main><div class="w"><section style="padding-bottom:24px"><div class="kick">Citaly por tipo de negocio</div>
<h1 style="margin-top:8px">Un sistema de citas hecho para tu tipo de negocio</h1>
<p class="lead" style="margin-top:14px">Elegís tu rubro y Citaly te arma la página de reservas, la agenda y los servicios de ejemplo. ${C.trialDays} días gratis, sin tarjeta.</p></section></div>
<div class="w"><div class="grid" style="padding-bottom:56px">${Object.entries(TIPOS).map(([k, v]) => `<div class="card"><h2 style="font-size:24px"><a href="/para/${k}/" style="text-decoration:none">Sistema de citas para ${esc(v.corto)}</a></h2><p>${esc(v.lead)}</p><p style="margin-top:14px"><a href="/para/${k}/">Ver cómo funciona para ${esc(v.corto)} →</a></p></div>`).join("")}</div></div>
<div class="w"><section style="padding-top:0"><p class="sub">¿Tu negocio es de otro tipo, como polarizado, taller o refrigeración? También funciona. Escribinos por WhatsApp al <a href="${WA}" target="_blank" rel="noopener">${WA_TXT}</a>.</p></section></div></main>` + foot + dock("inicio") + `
</body></html>
`;
}

const out = { "para/index.html": paginaIndice() };
for (const [k, T] of Object.entries(TIPOS)) out[`para/${k}/index.html`] = paginaTipo(k, T);

const LM = path.join(ROOT, "tools", "para-lastmod.json");
const lm = fs.existsSync(LM) ? JSON.parse(fs.readFileSync(LM, "utf8")) : {};
const urls = [];
for (const [rel, html] of Object.entries(out)) {
  const file = path.join(ROOT, rel); fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  const h = crypto.createHash("sha1").update(html).digest("hex");
  if (!lm[rel] || lm[rel].h !== h) lm[rel] = { h, d: today };
  urls.push([rel === "para/index.html" ? "/para/" : "/" + rel.replace("index.html", ""), lm[rel].d]);
  const m = html.match(/<meta name="description" content="([^"]*)"/), t = html.match(/<title>([^<]*)/);
  console.log(rel, "· title", t[1].length, "· desc", m[1].length);
}
fs.writeFileSync(LM, JSON.stringify(lm, null, 1) + "\n");

const smPath = path.join(ROOT, "sitemap.xml");
let sm = fs.readFileSync(smPath, "utf8").replace(/\s*<url><loc>https:\/\/citalyapp\.com\/para\/[^<]*<\/loc>[^]*?<\/url>/g, "");
sm = sm.replace("</urlset>", urls.map(([u, d]) => `  <url><loc>${ORIGIN}${u}</loc><lastmod>${d}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>\n`).join("") + "</urlset>");
fs.writeFileSync(smPath, sm);
