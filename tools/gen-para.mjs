// Crea las páginas de Citaly por tipo de negocio: /para/ (índice) y /para/<tipo>/.
// Se corre a mano: node tools/gen-para.mjs   (el resultado se sube al repo; no depende de Firebase).
// Los precios, planes y servicios salen de cfg.js, así que si cambian allá, se vuelve a correr.
// El diseño (CSS y script) sale de la página de venta, index.html: si cambia allá, también se vuelve a correr.
// OJO: el script de index.html corre aquí en páginas que no tienen todas sus secciones (/para/ no tiene capó, demo ni
// calculadora). Todo lo que se agregue allá tiene que revisar primero que el elemento exista (if(hay), if(pant), if(cR)…),
// y después de regenerar hay que correr tools/pruebas/venta/.
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
const crc = n => "₡" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");   // igual que en la página de venta: ₡4.900
const today = new Date().toISOString().slice(0, 10);
const CTA = tipo => `/app/?nuevo=1&desde=para-${tipo}`;
const WA = `https://api.whatsapp.com/send?phone=${C.wa}&text=${encodeURIComponent("Hola, quiero información sobre Citaly")}`;
const WA_TXT = "6150-6610";

const TIPOS = {
  detailing: {
    corto: "detailing",
    unico: { t: "Pensado para servicios largos y de precio alto", items: [["Citas de varias horas sin traslapes", "Cada servicio tiene su duración. Una corrección de pintura larga bloquea ese tiempo y nadie más puede reservar encima."], ["Precio según el tamaño del vehículo", "Sedán, SUV o pick-up: el cliente elige su vehículo y ve el precio exacto antes de reservar."], ["Adelanto por SINPE", "Con el plan Turbo podés pedir un adelanto para asegurar la hora de servicios grandes, como un tratamiento cerámico."], ["Antes y después que venden", "El detailing se vende con resultados. Tu página muestra tus mejores trabajos para que el cliente llegue convencido."]] },
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
    unico: { t: "Pensado para el día a día de un lavacar", items: [["Varios carros a la misma hora", "Con el plan Turbo definís cuántos clientes atendés al mismo tiempo y la agenda no deja reservar de más."], ["Clientes fijos y placa", "Buscás por placa y ves qué le hiciste a cada carro la última vez."], ["Avisa cuándo toca volver", "En Turbo, Citaly te muestra qué clientes ya deberían volver para escribirles por WhatsApp."], ["Agenda por día y semana", "Ves el día completo en el celular, con las horas libres y las ocupadas."]] },
    h1: "Sistema de citas para lavacar en Costa Rica",
    title: "Sistema de citas para lavacar en Costa Rica | Citaly",
    desc: "Agenda para lavacar: tus clientes reservan solos y vos ves el día en el celular. Página web y app incluidas. 7 días gratis, sin tarjeta. Desde ₡4.900/mes.",
    lead: "Que tus clientes reserven su lavado solos y que cada hora de tu día esté clara en el celular. Se acabaron los mensajes de «¿tiene campo hoy?».",
    dolor: ["Cada «¿tiene campo hoy?» es un mensaje que hay que contestar con las manos mojadas.", "Los clientes llegan todos a la misma hora y otras horas del día quedan vacías.", "Sin historial por vehículo, cada visita empieza de cero."],
    serviciosTitulo: "Servicios típicos de un lavacar",
    extra: [["¿Puedo manejar varios carros a la misma hora?", "Sí. En el plan Turbo definís cuántos clientes atendés al mismo tiempo (cupos) y la agenda no deja reservar de más."], ["¿Sirve si el lavado es a domicilio?", "Sí. El plan Turbo trae zonas, tiempo de traslado y aviso de «voy en camino»."]]
  },
  pulido: {
    corto: "pulido de focos y vidrios",
    unico: { t: "Pensado para pulido de focos y vidrios", items: [["Un servicio por cada trabajo", "Focos, parabrisas, rayones y gota seca como servicios separados, cada uno con su precio y duración."], ["Servicio a domicilio", "En Turbo cargás tus zonas y el tiempo de traslado, y avisás a tus clientes cuando vas en camino."], ["Reseñas de Google con un toque", "Cuando terminás un trabajo, le pedís su reseña al cliente desde Citaly, sin escribir el mensaje."], ["Tus trabajos a la vista", "Mostrás tus fotos y hasta 6 videos de TikTok, Instagram, Facebook o YouTube en tu propia página."]] },
    h1: "Sistema de citas para pulido de focos y parabrisas",
    title: "Sistema de citas para pulido de focos y parabrisas | Citaly",
    desc: "Agenda y página de reservas para pulido de focos y parabrisas. Tus clientes reservan solos. 7 días gratis, sin tarjeta. Plan Arranque desde ₡4.900/mes.",
    lead: "Tus clientes reservan el pulido de sus focos o su parabrisas sin escribirte, y vos llegás con la agenda del día ya armada.",
    dolor: ["El cliente pregunta el precio, desaparece, y vos ya perdiste media hora contestando.", "Con servicios a domicilio, una cita mal agendada te cuesta el viaje completo.", "Sin recordatorio, el cliente se olvida y la hora queda vacía."],
    serviciosTitulo: "Servicios típicos de pulido de focos y vidrios",
    extra: [["¿Sirve para quitar la gota seca del parabrisas?", "Sí. Cargás «Remoción de gota seca» como un servicio más, con su precio y duración, y el cliente lo elige al reservar."], ["¿Sirve si trabajo a domicilio?", "Sí. El plan Turbo trae servicio a domicilio con zonas, tiempo de traslado y aviso de «voy en camino»."]]
  },
  polarizado: {"corto": "polarizado de vidrios", "unico": {"t": "Pensado para polarizado de vidrios", "items": [["Citas de varias horas sin traslapes", "Un polarizado completo toma horas. Cada servicio tiene su duración y nadie más puede reservar encima de ese tiempo."], ["Precio por tipo de vehículo", "Sedán, SUV o pick-up: el cliente elige su vehículo y ve el precio exacto antes de reservar."], ["Retiro y parabrisas como servicios aparte", "Polarizado completo, parabrisas y retiro de polarizado, cada uno con su precio y su duración."], ["Adelanto por SINPE", "Con el plan Turbo podés pedir un adelanto para asegurar la hora de un trabajo largo."]]}, "h1": "Sistema de citas para polarizado de vidrios en Costa Rica", "title": "Sistema de citas para polarizado de vidrios | Citaly", "desc": "Agenda y página de reservas para polarizado de vidrios. Tus clientes reservan solos. 7 días gratis, sin tarjeta. Plan Arranque desde ₡4.900/mes.", "lead": "Tus clientes eligen su vehículo y reservan el polarizado sin escribirte, y vos ves en el celular qué carro entra cada hora.", "dolor": ["El cliente pregunta cuánto cuesta el polarizado de su carro, y vos contestás lo mismo todos los días.", "Un trabajo de varias horas mal agendado deja el taller parado o a un cliente esperando.", "Sin recordatorio, el cliente se olvida y esa hora no se vuelve a vender."], "serviciosTitulo": "Servicios típicos de polarizado", "extra": [["¿Puedo cobrar distinto según el vehículo?", "Sí. Marcás los servicios que cambian de precio y el cliente elige su tipo de vehículo al reservar: ve el precio exacto antes de confirmar."], ["¿Puedo cargar el retiro de polarizado?", "Sí. «Retiro de polarizado» es un servicio más, con su precio y duración."]]},
  taller: {"corto": "taller mecánico", "unico": {"t": "Pensado para talleres", "items": [["Un servicio por cada trabajo", "Diagnóstico, cambio de aceite, revisión de frenos: cada uno con su precio y duración para que el cliente elija."], ["Cupos por hora", "Con el plan Turbo definís cuántos vehículos recibís al mismo tiempo y la agenda no deja reservar de más."], ["El cliente cuenta qué necesita", "Al reservar deja una nota con lo que le pasa a su carro, y cuando entra el carro ya sabés qué revisar."], ["Historial del cliente", "Buscás al cliente por nombre o placa y ves todo lo que le has hecho."]]}, "h1": "Sistema de citas para taller mecánico en Costa Rica", "title": "Sistema de citas y agenda para taller mecánico | Citaly", "desc": "Agenda y página de reservas para talleres mecánicos. Tus clientes reservan solos. 7 días gratis, sin tarjeta. Plan Arranque desde ₡4.900/mes.", "lead": "Tus clientes reservan su cita y te cuentan qué necesita el carro, mientras vos y tus mecánicos siguen con las manos en el motor.", "dolor": ["Con las manos llenas de grasa nadie contesta WhatsApp, y el cliente se va con otro taller.", "Los carros llegan sin cita y el taller se llena un día y queda vacío al siguiente.", "Sin historial, cada visita empieza de cero y el cliente tiene que volver a explicar todo."], "serviciosTitulo": "Servicios típicos de un taller", "extra": [["¿Puedo manejar varios carros a la vez?", "Sí. En el plan Turbo definís cuántos vehículos atendés al mismo tiempo (cupos) y la agenda no deja reservar de más."], ["¿El cliente puede explicar qué le pasa al carro?", "Sí. Al reservar puede dejar una nota para que sepás qué revisar."]]}
};


// ---- Diseño: el mismo de la página de venta. Se toma de index.html para que haya una sola fuente.
const VENTA = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const ESTILO = (VENTA.match(/<style>([\s\S]*?)<\/style>/) || [])[1];
const GUION = [...VENTA.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes("50/50 de la portada"));
const DEMO = (VENTA.match(/<section class="demo clara" id="demo">[\s\S]*?<\/section>/) || [])[0];
if (!ESTILO || !GUION || !DEMO) throw new Error("No encontré el <style>, el script de la portada o la demo en index.html");

// Lo que se ve en la portada 50/50 de cada rubro: mensajes sin contestar y el servicio que entra reservado.
const PORTADA = {
  detailing: { chat: ["¿Cuánto cuesta para mi carro?", "¿Tiene campo esta semana?", "Hola??"], svc: "Corrección de pintura" },
  lavacar: { chat: ["¿Tiene campo hoy?", "¿Cuánto el lavado completo?", "Hola??"], svc: "Lavado completo" },
  pulido: { chat: ["¿Cuánto por pulir los focos?", "¿Llega a domicilio?", "Hola??"], svc: "Pulido de focos" },
  polarizado: { chat: ["¿Cuánto cuesta el polarizado?", "¿Tiene campo mañana?", "Hola??"], svc: "Polarizado completo" },
  taller: { chat: ["¿Me lo puede revisar hoy?", "¿Cuánto el cambio de aceite?", "Hola??"], svc: "Cambio de aceite" }
};

const css = ESTILO + `
/* --- propio de las páginas por rubro y de /para/ --- */
.portada h1.largo{font-size:clamp(32px,7.4vw,60px);max-width:17em;margin-inline:auto}
.portada.sola{padding-bottom:clamp(64px,9vw,120px)}
.sobre{font:700 clamp(17px,1.9vw,21px)/1.25 var(--h);letter-spacing:-.01em;color:var(--humo);margin-bottom:20px}
.tags{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.tags li{padding:10px 16px;border-radius:999px;background:#fff;box-shadow:inset 0 0 0 1.5px var(--raya);font-weight:600}
.trae.sin li{grid-template-columns:1fr}.trae.sin p{grid-column:1}
.otro{margin-top:clamp(56px,7vw,96px)}
.caso.osc{padding:clamp(72px,9vw,130px) 0}
.caso.osc .pie,.caso.osc .quien small{color:var(--humo)}
.caso.osc .texto{color:#d5d0ea;margin-top:18px;font-size:clamp(17px,1.5vw,19px)}
.vermas{margin-top:22px;color:var(--gris)}.vermas a{color:var(--tinta);font-weight:600;text-underline-offset:4px}
.rubros-l{margin-top:8px;display:grid}
.rubros-l li{padding:26px 0;border-top:1px solid var(--raya)}
.rubros-l h2{font-size:clamp(24px,3vw,34px)}.rubros-l h2 a{text-decoration:none}
.rubros-l p{color:var(--gris);margin-top:8px;max-width:40em}
.rubros-l .enlace{display:inline-block;margin-top:12px}
.pega.dos{display:flex;gap:8px}
.pega.dos .btn{flex:1 1 0;width:auto;min-width:0;padding:0 14px;white-space:nowrap}
.pega.dos .btn-w{flex:0 0 auto;padding:0 18px;background:#fff;color:var(--tinta);box-shadow:0 16px 34px -10px rgba(0,0,0,.7)}
@media(min-width:860px){.pega.dos{display:none}.trae.dos{grid-template-columns:1fr 1fr}.rubros-l{grid-template-columns:1fr 1fr;column-gap:64px}}
`;

const head = (t, desc, pathUrl, ld, conCarro) => `<!DOCTYPE html>
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
<meta name="theme-color" content="#07060c">
<link rel="icon" href="/favicon-32.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Figtree:wght@400;600;700&display=swap" rel="stylesheet">
${conCarro ? `<link rel="preload" as="image" href="/img/venta/capo-m.webp" media="(max-width:760px)">
<link rel="preload" as="image" href="/img/venta/capo.webp" media="(min-width:761px)">
` : ""}<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<style>${css}</style>
</head>
<body>`;

const promoTxt = () => { const p = crc(C.monthly.promo), m = C.monthly.promoMonths; return `<span class="largo">Promo de lanzamiento: plan Arranque a <b>${p} al mes</b> los primeros ${m} meses. <u>Quiero la promo</u></span><span class="corto">Promo: Arranque a <b>${p} al mes</b> por ${m} meses</span>`; };
const nav = tipo => `
<a class="promo" href="${CTA(tipo)}">${promoTxt()}</a>
<header class="menu"><div class="caja">
  <a class="logo" href="/"><img src="/icon-192.png" alt="" width="30" height="30">citaly</a>
  <nav aria-label="Principal"><a class="solo-compu" href="/para/">Para tu negocio</a><a class="solo-compu" href="/#precio">Planes</a><a href="/app/">Entrar</a><a class="btn btn-p" href="${CTA(tipo)}">Probar gratis</a></nav>
</div></header>`;
const dock = tipo => `<div class="pega dos" id="pega"><a class="btn btn-p" href="${CTA(tipo)}">Probar gratis ${C.trialDays} días</a><a class="btn btn-w" href="${WA}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp">WhatsApp</a></div>`;
const foot = otros => `<footer class="pata"><div class="caja">
  <a class="logo" href="/" style="color:#fff;font-size:19px"><img src="/icon-192.png" alt="" width="24" height="24" style="width:24px;height:24px;border-radius:7px">citaly</a>
  <nav aria-label="Pie de página"><a href="${WA}" target="_blank" rel="noopener">WhatsApp ${WA_TXT}</a><a href="https://www.tiktok.com/@citaly444" target="_blank" rel="noopener">TikTok</a><a href="/para/">Todos los tipos de negocio</a>${otros}<a href="/terminos.html">Términos</a><a href="/privacidad.html">Privacidad</a></nav>
  <span>Hecho en Costa Rica.</span>
</div></footer>`;
const guion = datos => `${datos ? `<script>window.CITALY_DEMO=${JSON.stringify(datos).replace(/</g, "\\u003c")}</script>\n` : ""}<script>${GUION}</script>`;

const foto = (archivo, extra = "") => `<picture><source media="(max-width:760px)" srcset="/img/venta/${archivo}-m.webp"><img ${extra}src="/img/venta/${archivo}.webp" alt="" width="1920" height="1080" loading="lazy"></picture>`;
const cierre = (titulo, texto, tipo) => `
<section class="cierre osc" id="cierre">
  <div class="fondo" aria-hidden="true">${foto("capo-opaco")}${foto("capo", 'class="brillo" id="brillo" ')}<i class="raya" id="raya"></i></div>
  <div class="caja">
    <h2>${titulo}</h2>
    <p class="bajada">${texto}</p>
    <div class="hacer"><a class="btn btn-p" href="${CTA(tipo)}">Crear mi cuenta gratis</a><a class="btn btn-s" href="${WA}" target="_blank" rel="noopener">Escribinos por WhatsApp</a></div>
  </div>
</section>`;

function carro(svc, varia, chat) {
  const horas = ["9:47", "9:52", "10:15"];
  return `
  <div class="carro" id="carro">
    <picture><source media="(max-width:760px)" srcset="/img/venta/capo-m.webp"><img class="foto" src="/img/venta/capo.webp" alt="Capó de un carro negro recién pulido, con el reflejo de dos luces de taller" width="1920" height="1080" fetchpriority="high"></picture>
    <div class="lado sin" id="ladoSin">
      <picture><source media="(max-width:760px)" srcset="/img/venta/capo-opaco-m.webp"><img class="foto" src="/img/venta/capo-opaco.webp" alt="" width="1920" height="1080"></picture>
      <span class="cinta">Sin Citaly</span>
      <div class="chat" aria-hidden="true">${chat.map((m, i) => `<div class="msj">${esc(m)}<time>${horas[i]} p. m.</time></div>`).join("")}<span class="sinresp"><i>${chat.length}</i> sin contestar</span></div>
    </div>
    <div class="lado con" id="ladoCon">
      <span class="cinta">Con Citaly</span>
      <div class="aviso" aria-hidden="true">
        <div class="tarj"><img src="/icon-192.png" alt="" width="36" height="36"><b>Nueva reserva</b><span>${esc(svc)}${varia ? ", SUV" : ""}. Sábado 9:00&nbsp;a.&nbsp;m.</span></div>
        <div class="tarj fila"><span class="hora">9:00<br>a.&nbsp;m.</span><b>Carlos Jiménez</b><span class="que">${esc(svc)}</span><span class="ok">Confirmada</span></div>
      </div>
    </div>
    <div class="linea" id="linea">
      <div class="perilla" id="perilla" tabindex="0" role="slider" aria-orientation="horizontal" aria-label="Comparar: sin Citaly y con Citaly" aria-valuemin="4" aria-valuemax="96" aria-valuenow="50" aria-valuetext="50 % con Citaly"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg></div>
      <span class="pista" aria-hidden="true">Deslizá la cinta</span>
    </div>
  </div>`;
}

// Servicios de ejemplo del rubro (cfg.js) para la demo que se toca. Si el servicio cambia por vehículo, SUV y pick-up
// salen un poco más caros: es solo para que se vea cómo cambia el precio (cada negocio pone los suyos).
const dur = m => m < 60 ? m + " min" : (m % 60 ? Math.floor(m / 60) + " h " + (m % 60) + " min" : (m / 60) + " h");
const icono = n => /lavado|chas/i.test(n) ? "gota" : /interior|tapic/i.test(n) ? "asiento" : /foco/i.test(n) ? "foco" : /diagn|aceite|freno|revisi/i.test(n) ? "llave" : "brillo";
const redondo = n => { const paso = n < 20000 ? 500 : n < 50000 ? 1000 : 5000; return Math.round(n / paso) * paso; };
const demoDatos = S => ({ veh: S.some(s => s[4]), svc: S.slice(0, 4).map(s => ({ n: s[0], p: s[4] ? [s[1], redondo(s[1] * 115 / 100), redondo(s[1] * 125 / 100)] : [s[1], s[1], s[1]], t: dur(s[2]), i: icono(s[0]) })) });

function planes(tipo) {
  const P = C.plans, sel = { arranque: P.arranque.inc.slice(0, 6), turbo: P.turbo.inc.slice(1, 8), nitro: P.nitro.inc.slice(1, 7) };
  return ["arranque", "turbo", "nitro"].map(k => {
    const p = P[k], promo = k === C.promoPlan;
    const precio = promo
      ? `<p class="precio"><b>${crc(C.monthly.promo)}</b>al mes</p><p class="luego">los primeros ${C.monthly.promoMonths} meses. Después, ${crc(p.crc)} al mes.</p>`
      : `<p class="precio"><b>${crc(p.crc)}</b>al mes</p><p class="luego">Sin contrato.</p>`;
    return `<article class="plan${p.pop ? " pop" : ""}">${promo ? '<span class="cinta">Promo de lanzamiento</span>' : p.pop ? '<span class="cinta">El más elegido</span>' : ""}<h3>${esc(p.n)}</h3><p class="para">${esc(p.tag)}</p>${precio}<ul>${sel[k].map(x => `<li>${esc(x.replace("que tú editas", "que vos editás"))}</li>`).join("")}</ul><div class="abajo"><a class="btn ${p.pop ? "btn-p" : "btn-s"}" href="${CTA(tipo)}" style="width:100%">Probar ${esc(p.n)} gratis</a></div></article>`;
  }).join("");
}

function paginaTipo(tipo, T) {
  const S = (C.types[tipo] && C.types[tipo].svc) || [], svc = S.map(s => s[0]), rubro = (C.types[tipo] && C.types[tipo].n) || T.corto;
  const estrella = S.find(s => s[0] === PORTADA[tipo].svc) || S[0] || ["Tu servicio"];
  const faq = [
    ["¿Necesito tarjeta para probar Citaly?", `No. Son ${C.trialDays} días gratis con el plan Nitro completo, sin tarjeta y sin contrato. Después elegís tu plan.`],
    ["¿Cuánto cuesta?", `El plan Arranque cuesta ${crc(C.monthly.promo)} al mes los primeros ${C.monthly.promoMonths} meses y después ${crc(C.plans.arranque.crc)}. Si una sola cita al mes que hoy se te pierde vale más que eso, el plan se paga solo.`],
    ["¿Sigo usando mi WhatsApp?", "Sí. Confirmar y recordar citas con un toque desde tu propio WhatsApp es gratis en todos los planes. Citaly agenda; vos seguís hablando con tus clientes como siempre."],
    ["¿Funciona en iPhone y Android?", "Sí. Se instala desde el navegador del celular y también se usa en computadora."],
    ["¿Es difícil de configurar?", `Elegís «${rubro}» al crear tu cuenta y Citaly carga servicios de ejemplo para que solo cambiés nombres, precios y horario. Si te trabás, te ayudamos por WhatsApp al ${WA_TXT}.`],
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
  // Textos de la demo que se ajustan por rubro. Si index.html cambia alguno, esto avisa en vez de dejarlo pasar.
  const cambia = (html, de, a) => { if (!html.includes(de)) throw new Error("Cambió un texto de la demo en index.html («" + de + "»): revisar paginaTipo()"); return html.replace(de, () => a); };
  let demo = DEMO.replace(/src="icon-192\.png"/g, 'src="/icon-192.png"');
  demo = cambia(demo, "Tocá el celular como si fueras el cliente. Son tres toques y no descarga nada.", `Tocá el celular como si fueras tu cliente. Los servicios son los de ejemplo del tipo «${esc(rubro)}»: después ponés los tuyos, con tus precios.`);
  if (!S.some(s => s[4])) {   // rubros donde el precio no cambia por vehículo (taller): la demo no pregunta el vehículo
    demo = cambia(demo, "Elige su carro y el servicio", "Elige el servicio");
    demo = cambia(demo, "Ve el precio exacto para su vehículo, sin preguntarte.", "Ve el precio y cuánto dura, sin preguntarte.");
  }
  return head(T.title, T.desc, `/para/${tipo}/`, ld, true) + nav(tipo) + `
<main>
<section class="portada osc" id="portada">
  <div class="texto">
    <h1 class="largo"><span class="sube">${esc(T.h1)}</span></h1>
    <p class="bajada sube d1">${esc(T.lead)}</p>
    <div class="hacer sube d2"><a class="btn btn-p" href="${CTA(tipo)}">Crear mi cuenta gratis</a><span class="nota">${C.trialDays} días gratis, sin tarjeta y sin contrato.</span></div>
  </div>${carro(estrella[0], !!estrella[4], PORTADA[tipo].chat)}
</section>

<section class="lema osc">
  <div class="caja"><h2 class="sobre">Lo que le pasa a casi todo negocio de ${esc(T.corto)}</h2><p id="lema">${esc(T.dolor.join(" "))}</p></div>
</section>

${demo}

<section class="blanca">
  <div class="caja">
    <h2>${esc(T.unico.t)}</h2>
    <ul class="trae sin dos">${T.unico.items.map(([h, p]) => `<li><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join("")}</ul>
    <div class="otro">
      <h2>Y todo esto viene incluido</h2>
      <ul class="trae sin">
        <li><h3>Página de reservas 24/7</h3><p>El cliente elige servicio, vehículo, día y hora, y ve el precio antes de confirmar.</p></li>
        <li><h3>Página web de tu negocio</h3><p>Con tus servicios, fotos, reseñas y preguntas frecuentes, lista para compartir en tus redes.</p></li>
        <li><h3>Aviso de cada reserva</h3><p>Te llega al celular apenas alguien reserva, para que no te tome por sorpresa.</p></li>
      </ul>
    </div>
  </div>
</section>

<section class="clara">
  <div class="caja">
    <h2>Cómo funciona</h2>
    <ol class="pasos fijos">
      <li><h3>Creás tu cuenta</h3><p>Elegís «${esc(rubro)}» y en 2 minutos tenés tu página con servicios de ejemplo.</p></li>
      <li><h3>Ajustás lo tuyo</h3><p>Cambiás servicios, precios, horario, logo y color. Sin programar nada.</p></li>
      <li><h3>Compartís tu link</h3><p>Lo ponés en WhatsApp, Instagram y TikTok. Tus clientes reservan solos, a toda hora.</p></li>
    </ol>
    <div class="otro">
      <h2>${esc(T.serviciosTitulo)}</h2>
      <p class="bajada">Citaly te los carga como ejemplo. Vos cambiás nombres, precios y duración.</p>
      <ul class="tags">${svc.map(s => `<li>${esc(s)}</li>`).join("")}</ul>
    </div>
  </div>
</section>

<section class="caso osc" id="caso">
  <div class="caja">
    <div>
      <div class="fotos">
        <figure><span class="cinta">Antes</span><img src="/demo/glassstudiocr/antes.jpg" alt="Parabrisas opaco antes del pulido" width="1000" height="750" loading="lazy"></figure>
        <figure><span class="cinta">Después</span><img src="/demo/glassstudiocr/despues.jpg" alt="El mismo parabrisas después del pulido" width="1000" height="750" loading="lazy"></figure>
      </div>
      <p class="pie">Un parabrisas antes y después de pasar por GlassStudioCR.</p>
    </div>
    <div>
      <h2>Hecho por un dueño de negocio de carros</h2>
      <p class="texto">Citaly nació en GlassStudioCR, mi negocio de pulido de parabrisas y focos en Alajuela. Lo armé primero para mis propias reservas y hoy lo abro a otros negocios de carros. Si algo no te funciona, me escribís por WhatsApp al ${WA_TXT} y te ayudo.</p>
      <div class="ligas"><a class="btn btn-s" href="https://citas.glassstudiocr.com/reservar" target="_blank" rel="noopener">Ver cómo reservan sus clientes</a></div>
    </div>
  </div>
</section>

<section class="blanca" id="planes">
  <div class="caja">
    <h2>Empezá gratis. Pagás cuando te sirva.</h2>
    <div class="planes">${planes(tipo)}</div>
    <p class="vermas">Pagás con tarjeta o por SINPE Móvil. <a href="/#precio">Ver todos los planes y extras</a>.</p>
  </div>
</section>

<section class="dudas clara">
  <div class="caja">
    <h2>Preguntas frecuentes</h2>
    <div>${faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
  </div>
</section>
${cierre(`Probá Citaly ${C.trialDays} días, gratis`, "Sin tarjeta, sin contrato y listo en 2 minutos.", tipo)}
</main>
` + foot(otros) + dock(tipo) + "\n" + guion(demoDatos(S)) + `
</body></html>
`;
}

function paginaIndice() {
  const t = "Citaly: sistema de citas para negocios de carros";
  const desc = "Sistema de citas y reservas en línea para detailing, lavacar y pulido de focos y parabrisas en Costa Rica. 7 días gratis, sin tarjeta.";
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: t, url: ORIGIN + "/para/", hasPart: Object.entries(TIPOS).map(([k, v]) => ({ "@type": "WebPage", name: v.h1, url: `${ORIGIN}/para/${k}/` })) };
  const otros = Object.entries(TIPOS).map(([k, v]) => `<a href="/para/${k}/">Sistema de citas para ${esc(v.corto)}</a>`).join("");
  return head(t, desc, "/para/", ld, false) + nav("inicio") + `
<main>
<section class="portada osc sola">
  <div class="texto">
    <h1 class="largo"><span class="sube">Un sistema de citas hecho para tu tipo de negocio</span></h1>
    <p class="bajada sube d1">Elegís tu rubro y Citaly te arma la página de reservas, la agenda y los servicios de ejemplo. ${C.trialDays} días gratis, sin tarjeta.</p>
    <div class="hacer sube d2"><a class="btn btn-p" href="${CTA("inicio")}">Crear mi cuenta gratis</a></div>
  </div>
</section>

<section class="blanca">
  <div class="caja">
    <ul class="rubros-l">${Object.entries(TIPOS).map(([k, v]) => `<li><h2><a href="/para/${k}/">Sistema de citas para ${esc(v.corto)}</a></h2><p>${esc(v.lead)}</p><a class="enlace" href="/para/${k}/">Ver cómo funciona para ${esc(v.corto)}</a></li>`).join("")}</ul>
    <p class="vermas">¿Tu negocio es de otro tipo, como refrigeración, barbería o consultorio? También funciona. Escribinos por WhatsApp al <a href="${WA}" target="_blank" rel="noopener">${WA_TXT}</a>.</p>
  </div>
</section>
${cierre(`Probá Citaly ${C.trialDays} días, gratis`, "Sin tarjeta, sin contrato y listo en 2 minutos.", "inicio")}
</main>
` + foot(otros) + dock("inicio") + "\n" + guion(null) + `
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

