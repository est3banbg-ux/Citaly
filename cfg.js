/* Citaly — configuración compartida por todas las páginas */
var CITALY = {
  fb: {
    apiKey: "AIzaSyBaRPjh9RKnAF5ML9QLQfRchy4ktIMiGS0",
    authDomain: "citaly-cb101.firebaseapp.com",
    projectId: "citaly-cb101",
    storageBucket: "citaly-cb101.firebasestorage.app",
    messagingSenderId: "252257950082",
    appId: "1:252257950082:web:c4ffa71662111f0ae0179b"
  },
  site: "https://citalyapp.com",
  admin: "est3banbg@gmail.com",
  price: 0,              // (no se usa)
  // Precio: prueba gratis → promo los primeros meses → precio del plan
  monthly: { promo: 500, promoMonths: 3, std: 4900 },   // colones (Costa Rica). La promo es SOLO para el plan de entrada (promoPlan)
  promoPlan: "arranque",
  usd: { promo: 1, std: 9 },                             // dólares (resto del mundo)
  // Planes. f = funciones que trae (además de lo básico). Durante la prueba gratis se prueba todo (Nitro).
  plans: {
    arranque: { n: "Arranque", ic: "🚗", crc: 4900, usd: 9, staff: 1, svcMax: 10, tag: "Para el que trabaja solo",
      inc: ["Sitio de reservas 24/7 con precio por vehículo", "Agenda por día y semana", "Hasta 10 servicios", "Clientes e historial de cada carro", "Confirmaciones y recordatorios por WhatsApp con un toque", "Página web con estilo Clásico que tú editas", "Hasta 3 fotos, 3 reseñas y 3 preguntas en tu web", "Aviso en tu celular de cada reserva nueva", "Pide reseñas de Google con un toque", "Ingresos del mes, tu logo y tu color"], f: [], payLink: "https://buy.polar.sh/polar_cl_NjvP37NPL5omZAhM3EQ1Ow5qhQD0RXHWhlHmH3q9qTY" },
    turbo:    { n: "Turbo", ic: "⚡", crc: 9900, usd: 19, staff: 5, svcMax: 40, tag: "Para negocios con equipo", pop: true,
      inc: ["Todo lo de Arranque", "Hasta 5 personas en tu equipo", "Servicios ilimitados", "3 estilos de página, incluido el Premium oscuro", "Hasta 8 fotos, 8 reseñas y 8 preguntas", "Secciones «Así funciona» y «Por qué elegirte»", "Adelanto por SINPE para asegurar la hora", "Servicio a domicilio con zonas, tiempo de traslado y «voy en camino»", "Avisa a tus clientes cuándo toca volver (mantenimiento)", "Asistente con IA que escribe tus textos (5 usos al día)", "Cierre de caja, abonos y quién te debe", "Gastos y ganancia real del mes", "Referidos: tus clientes te traen clientes"], f: ["web", "dom", "ref", "gastos"], payLink: "https://buy.polar.sh/polar_cl_atZMWBzWIS2DtqhBXLPuojzpCsRKXxuKshL7Q4KUjCV" },
    nitro:    { n: "Nitro", ic: "🚀", crc: 19900, usd: 35, staff: 99, svcMax: 200, tag: "Para crecer en serio",
      inc: ["Todo lo de Turbo", "Los 5 estilos de página (Atrevido y Elegante incluidos)", "Hasta 12 fotos, 12 reseñas y 12 preguntas", "Asistente con IA: 30 usos al día", "Equipo ilimitado", "Control de insumos", "Recordatorios automáticos por WhatsApp (próximamente)", "Tu propio dominio (tunegocio.com) a pedido", "Soporte prioritario por WhatsApp"], f: ["web", "dom", "ref", "gastos", "insumos", "dominio", "waauto", "prioridad"], payLink: "https://buy.polar.sh/polar_cl_Q2c2h9RLBPjF9UbGOHCY12n18JjVW6yBt5rgQ36XOEJ" }
  },
  // Extras que se suman a cualquier plan
  addons: {
    waauto: { n: "Recordatorios automáticos por WhatsApp", ic: "📲", crc: 2900, usd: 5, d: "150 mensajes al mes que salen solos: confirmación y recordatorio antes de la cita." },
    ia:     { n: "Asistente con IA para WhatsApp", ic: "🤖", crc: 9900, usd: 19, soon: true, d: "Contesta tu WhatsApp como vos, da precios y agenda solo." }
  },
  // Links de pago con tarjeta (TiloPay para Costa Rica, Polar/Paddle para el resto). Vacíos = solo SINPE.
  // Pago con tarjeta: cada plan tiene su payLink de Polar (cobra en USD, para Costa Rica y el resto del mundo).
  // El link de Arranque ya trae el descuento de la promo (US$1 x 3 meses, 1 vez por cliente).
  payLink: "", payLinkUsd: "",
  setup: { promo: 100000, std: 150000, pers: 250000 },  // promo de lanzamiento, Standard, Personalizado
  promoCupos: 5,         // la promo es para los primeros 5 negocios
  modFrom: 40000,        // módulos a la medida, desde
  trialDays: 7,          // días de prueba gratis
  // Módulos que se encienden por negocio desde el admin. Para agregar uno nuevo:
  // 1) se registra aquí, 2) se programa en la app/página revisando modOn(B, "clave").
  mods: {
    vehiculo: { n: "Precio según tipo de vehículo", ic: "🚙", d: "El cliente elige su vehículo al reservar y los servicios marcados cambian de precio según el tipo." },
    insumos:  { n: "Control de insumos", ic: "📦", d: "Lista de materiales con existencias, compras, uso y alerta cuando se están acabando." }
  },
  iaUrl: "https://bitter-brook-9ee2.citalyapp-cr.workers.dev/ia",
  fbLogin: true, // Facebook ya configurado y probado (Meta publicada, Firebase activo)
  pushUrl: "https://bitter-brook-9ee2.citalyapp-cr.workers.dev/push",   // URL del Worker + "/ia" (ej: https://xxxx.workers.dev/ia). Vacío = el asistente dice "muy pronto"
  sinpe: "6320-4942",    // SINPE Móvil de Citaly (personal de Esteban, separado de GlassStudioCR)
  sinpeName: "Esteban Bolaños García",  // a nombre de quién sale el SINPE
  wa: "50661506610",     // WhatsApp de la empresa (soporte y comprobantes)
  // Países para el teléfono del registro: [código ISO, nombre, código de país, dígitos del número]
  countries: [["CR","Costa Rica","506",8],["PA","Panamá","507",8],["NI","Nicaragua","505",8],["HN","Honduras","504",8],["SV","El Salvador","503",8],["GT","Guatemala","502",8],
    ["MX","México","52",10],["CO","Colombia","57",10],["PE","Perú","51",9],["CL","Chile","56",9],["EC","Ecuador","593",9],["DO","Rep. Dominicana","1",10],["PR","Puerto Rico","1",10],
    ["AR","Argentina","54",10],["UY","Uruguay","598",8],["PY","Paraguay","595",9],["BO","Bolivia","591",8],["VE","Venezuela","58",10],["US","Estados Unidos","1",10],["ES","España","34",9]],
  colors: ["#6c4cf5", "#0d7a85", "#e0457b", "#1f8a4c", "#e07a20", "#2563eb", "#b3392f", "#1f2937"],
  // Tipos de negocio. car: true = negocio de carros (se activa precio por vehículo).
  // Cada servicio: [nombre, precio, minutos, ícono, 1 si el precio cambia según el vehículo]
  // Páginas ya armadas por tipo de negocio: frase de portada, descripción, preguntas de ejemplo y cada cuánto toca volver.
  // Son solo un punto de partida: el dueño los edita en Ajustes.
  tpl: {
    "barberia": {
      "tag": "Tu mejor corte, sin hacer fila",
      "blurb": "Reserva tu hora en 1 minuto y llega cuando te toca.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ],
        [
          "¿Necesito cita?",
          "Con cita no haces fila: llegas a tu hora y te atendemos."
        ]
      ],
      "re": {
        "Corte de cabello": 1,
        "Corte + barba": 1,
        "Barba": 1,
        "Corte de niño": 1
      }
    },
    "salon": {
      "tag": "Luce increíble, sin esperas",
      "blurb": "Reserva tu cita en 1 minuto y llega a tu hora.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ],
        [
          "¿Puedo reservar un servicio especial?",
          "Si no ves lo que buscas en la lista, escríbenos por WhatsApp y lo coordinamos."
        ]
      ],
      "re": {
        "Corte y secado": 2,
        "Tinte": 2,
        "Tratamiento capilar": 2
      }
    },
    "unas": {
      "tag": "Uñas perfectas, a tu hora",
      "blurb": "Reserva tu cita en 1 minuto y escoge el servicio que quieres.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ],
        [
          "¿Cada cuánto me conviene volver?",
          "Depende del servicio. Te avisaremos cuando ya sea buen momento de renovarlas."
        ]
      ],
      "re": {
        "Manicure": 1,
        "Pedicure": 1,
        "Acrílicas": 1,
        "Semipermanente": 1
      }
    },
    "lavacar": {
      "tag": "Tu carro limpio, sin perder tiempo",
      "blurb": "Reserva tu lavado en 1 minuto y elige el servicio para tu vehículo.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ],
        [
          "¿El precio cambia según mi vehículo?",
          "Sí. Al reservar eliges el tipo de vehículo y ves el precio exacto antes de confirmar."
        ]
      ],
      "re": {
        "Lavado sencillo": 1,
        "Lavado completo": 1
      }
    },
    "detailing": {
      "tag": "Tu carro como nuevo",
      "blurb": "Reserva tu servicio en 1 minuto y elige lo que necesita tu vehículo.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ],
        [
          "¿El precio cambia según mi vehículo?",
          "Sí. Al reservar eliges el tipo de vehículo y ves el precio exacto antes de confirmar."
        ]
      ],
      "re": {
        "Detailing interior": 6,
        "Detailing exterior": 6,
        "Tratamiento cerámico": 12
      }
    },
    "pulido": {
      "tag": "Vidrios y focos como nuevos",
      "blurb": "Reserva tu pulido en 1 minuto y recupera la claridad.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ],
        [
          "¿El precio cambia según mi vehículo?",
          "Sí. Al reservar eliges el tipo de vehículo y ves el precio exacto antes de confirmar."
        ]
      ],
      "re": {
        "Pulido de focos": 12,
        "Pulido de parabrisas": 12
      }
    },
    "polarizado": {
      "tag": "Privacidad y estilo para tu carro",
      "blurb": "Reserva tu polarizado en 1 minuto y elige el servicio.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ],
        [
          "¿El precio cambia según mi vehículo?",
          "Sí. Al reservar eliges el tipo de vehículo y ves el precio exacto antes de confirmar."
        ]
      ],
      "re": {}
    },
    "autos": {
      "tag": "Cuidamos tu carro como si fuera nuestro",
      "blurb": "Reserva en 1 minuto el servicio que necesita tu vehículo.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ],
        [
          "¿El precio cambia según mi vehículo?",
          "Sí. Al reservar eliges el tipo de vehículo y ves el precio exacto antes de confirmar."
        ]
      ],
      "re": {
        "Lavado completo": 1
      }
    },
    "taller": {
      "tag": "Tu carro en buenas manos",
      "blurb": "Reserva tu cita en 1 minuto y cuéntanos qué necesita tu vehículo.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ],
        [
          "¿Qué hago si mi carro necesita algo que no aparece en la lista?",
          "Reserva un diagnóstico y lo revisamos. También puedes escribirnos por WhatsApp."
        ]
      ],
      "re": {
        "Cambio de aceite": 3,
        "Revisión de frenos": 6
      }
    },
    "spa": {
      "tag": "Tu momento para relajarte",
      "blurb": "Reserva tu cita en 1 minuto y elige tu masaje o tratamiento.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ],
        [
          "¿Cuánto dura una sesión?",
          "Cada servicio indica su duración en la lista. Te recomendamos llegar unos minutos antes."
        ]
      ],
      "re": {
        "Masaje relajante": 1,
        "Limpieza facial": 1,
        "Masaje descontracturante": 1
      }
    },
    "salud": {
      "tag": "Tu cita médica, sin llamadas",
      "blurb": "Reserva tu consulta en 1 minuto, a la hora que mejor te quede.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ],
        [
          "¿Cómo sé qué servicio escoger?",
          "Si tienes dudas, escríbenos por WhatsApp y te orientamos antes de reservar."
        ]
      ],
      "re": {
        "Control": 6
      }
    },
    "otro": {
      "tag": "Reserva tu cita en 1 minuto",
      "blurb": "Elige el día y la hora que mejor te queden.",
      "faq": [
        [
          "¿Cómo reservo?",
          "Elige el servicio, el día y la hora en esta página. Toma menos de un minuto y tu espacio queda apartado."
        ],
        [
          "¿Puedo cambiar o cancelar mi cita?",
          "Sí. Con el link que recibes al reservar puedes cambiarla o cancelarla hasta 12 horas antes."
        ],
        [
          "¿Cuánto dura el servicio?",
          "Depende de cada uno. En la lista de servicios puedes ver la duración y el precio antes de reservar."
        ]
      ],
      "re": {}
    }
  },
  types: {
    barberia: { n: "Barbería", ic: "💈", svc: [["Corte de cabello", 6000, 30, "✂️"], ["Corte + barba", 8000, 45, "🧔"], ["Barba", 4000, 30, "🪒"], ["Corte de niño", 5000, 30, "👦"]] },
    salon:    { n: "Salón de belleza", ic: "💇‍♀️", svc: [["Corte y secado", 10000, 60, "💇‍♀️"], ["Tinte", 25000, 120, "🎨"], ["Peinado", 12000, 60, "✨"], ["Tratamiento capilar", 15000, 60, "🧴"]] },
    unas:     { n: "Uñas", ic: "💅", svc: [["Manicure", 7000, 45, "💅"], ["Pedicure", 9000, 60, "🦶"], ["Acrílicas", 18000, 120, "💎"], ["Semipermanente", 10000, 60, "✨"]] },
    lavacar:  { n: "Lavacar", ic: "🧽", car: true, svc: [["Lavado sencillo", 5000, 45, "🧽", 1], ["Lavado completo", 8000, 60, "🚿", 1], ["Lavado de chasís", 6000, 45, "🔩", 1], ["Encerado", 12000, 90, "✨", 1]] },
    detailing:{ n: "Detailing", ic: "✨", car: true, svc: [["Detailing interior", 35000, 180, "🧼", 1], ["Detailing exterior", 40000, 180, "✨", 1], ["Corrección de pintura", 90000, 360, "🎨", 1], ["Tratamiento cerámico", 150000, 480, "🛡️", 1]] },
    pulido:   { n: "Pulido de focos y vidrios", ic: "💡", car: true, svc: [["Pulido de focos", 20000, 90, "💡", 0], ["Pulido de parabrisas", 25000, 120, "🛡️", 1], ["Remoción de gota seca", 20000, 90, "💧", 1]] },
    polarizado:{ n: "Polarizado", ic: "🕶️", car: true, svc: [["Polarizado completo", 60000, 180, "🕶️", 1], ["Parabrisas", 25000, 60, "🪟", 0], ["Retiro de polarizado", 15000, 60, "🧹", 1]] },
    autos:    { n: "Cuidado de autos", car: true, ic: "🚗", svc: [["Lavado completo", 8000, 60, "🧽"], ["Pulido de focos", 20000, 90, "💡"], ["Pulido de parabrisas", 20000, 120, "🛡️"], ["Detailing interior", 35000, 180, "✨"]] },
    taller:   { n: "Taller", ic: "🔧", car: true, svc: [["Diagnóstico", 15000, 60, "🔍"], ["Cambio de aceite", 25000, 60, "🛢️"], ["Revisión de frenos", 20000, 90, "🛞"]] },
    spa:      { n: "Spa y masajes", ic: "🧖", svc: [["Masaje relajante", 25000, 60, "💆"], ["Limpieza facial", 22000, 60, "🧖"], ["Masaje descontracturante", 30000, 90, "🙌"]] },
    salud:    { n: "Consultorio", ic: "🩺", svc: [["Consulta", 25000, 30, "🩺"], ["Control", 15000, 30, "📋"]] },
    otro:     { n: "Otro", ic: "📅", svc: [["Cita", 10000, 60, "📅"]] }
  },
  /* Fotos de portada listas por tipo de negocio (Unsplash, licencia libre para uso comercial).
     El dueño puede cambiarla o quitarla en la app; si sube fotos propias, en su web manda la suya. */
  covers: {
    detailing:  ["1780558852670-3f49298ecc1f", "1771491237218-cbd4a707497e"],
    lavacar:    ["1761312834165-c27d037b3a6b", "1762933855598-273a51b47649"],
    pulido:     ["1632823469850-2f77dd9c7f93", "1631856507219-d1f3465b4884", "1616761879141-f485e5fed5df"],
    polarizado: ["1758376316871-96e1feea03f4", "1768853143263-72d7e744bbc2"],
    autos:      ["1575844611398-2a68400b437c", "1607860108855-64acf2078ed9"],
    taller:     ["1727893119356-1702fe921cf9", "1632733711679-529326f6db12"],
    barberia:   ["1585747860715-2ba37e788b70", "1621605815971-fbc98d665033"],
    salon:      ["1600948836101-f9ffda59d250", "1580618672591-eb180b1a973f"],
    unas:       ["1522337660859-02fbefca4702", "1632345031435-8727f6897d53"],
    spa:        ["1600334089648-b0d9d3028eb2", "1544161515-4ab6ce6db874"],
    salud:      ["1629909613654-28e377c37b09", "1758691462878-6edc3d3da1be"],
    otro:       ["1790976158663-ccc651ef9805", "1783099779469-5b02ae272c09"]
  },

  /* Íconos de servicio (SVG propios, línea + acento del color de marca). Se guardan como "i:nombre" en el campo ic del servicio. */
  icons: (function () {
    var A = ' style="stroke:var(--acc,#2f6df6)"', AF = ' style="stroke:var(--acc,#2f6df6);fill:var(--acc,#2f6df6);fill-opacity:.22"', W = ' style="fill:var(--card,#fff)"';
    var star = function (x, y, r, f) { return '<path' + (f ? AF : A) + ' d="M' + x + ' ' + (y - r) + 'L' + (x + r * .3) + ' ' + (y - r * .3) + 'L' + (x + r) + ' ' + y + 'L' + (x + r * .3) + ' ' + (y + r * .3) + 'L' + x + ' ' + (y + r) + 'L' + (x - r * .3) + ' ' + (y + r * .3) + 'L' + (x - r) + ' ' + y + 'L' + (x - r * .3) + ' ' + (y - r * .3) + 'Z"/>'; };
    var drop = function (x, y, s) { return '<path' + AF + ' d="M' + x + ' ' + y + 'q' + (2.6 * s) + ' ' + (3.8 * s) + ' ' + (2.6 * s) + ' ' + (6 * s) + 'a' + (2.6 * s) + ' ' + (2.6 * s) + ' 0 0 1 ' + (-5.2 * s) + ' 0q0 ' + (-2.2 * s) + ' ' + (2.6 * s) + ' ' + (-6 * s) + 'z"/>'; };
    var sideCar = '<path d="M7 44V37.5Q7 34.5 10.5 34L18 32.5 24.5 25Q25.6 24 27.5 24H39Q41 24 42.4 25.4L47.5 32.5 53.5 33.6Q57 34.4 57 37.8V44Z"/><path d="M24 32.5 28.5 26.5H38.5L43.5 32.5Z"/><path d="M34 26.5V32.5"/><circle cx="19" cy="44" r="5.6"' + W + '/><circle cx="46" cy="44" r="5.6"' + W + '/><circle cx="19" cy="44" r="1.6"' + A + '/><circle cx="46" cy="44" r="1.6"' + A + '/>';
    return {
      lavado: sideCar.replace('M7 44V37.5', 'M7 46V39.5').replace('Q7 34.5', 'Q7 36.5').replace('V44Z', 'V46Z') + drop(20, 5, 1) + drop(32, 8, 1) + drop(44, 5, 1) + '<circle cx="26" cy="12" r="1.2"' + AF + '/><circle cx="38" cy="14" r="1.2"' + AF + '/><path' + A + ' d="M12 54H52"/>',
      tapiceria: '<rect x="22" y="30" width="22" height="26" rx="6"/><path d="M27 30V24H39V30"/><path d="M27 24V17Q27 14 30 14H42Q46 14 46 18V22H39"/><path d="M46 20H49Q52 20 52 23V27"/><path' + A + ' d="M26 42H40M26 48H40"/><circle cx="56" cy="15" r="1.4"' + AF + '/><circle cx="53" cy="10" r="1.4"' + AF + '/><circle cx="58" cy="21" r="1.4"' + AF + '/>',
      vidrio: '<path d="M8 47L16 22Q32 15 48 22L56 47Z"/><path d="M15 47L21 29M24 47L29 26"/><path d="M8 47H56"/>' + star(49, 12, 8, 1) + star(34, 9, 3.2, 0) + star(57, 29, 3, 0),
      ceramico: '<path d="M32 7L51 13.5V30C51 42 43 50.5 32 57C21 50.5 13 42 13 30V13.5Z"/><path' + A + ' d="M22.5 31.5L29.5 38.5L42 25"  stroke-width="3.4"/>',
      ppf: '<path d="M17 30L21 19.5Q22 17.5 25 17.5H39Q42 17.5 43 19.5L47 30"/><path d="M11.5 30H52.5Q54.5 30 54.5 33V46H9.5V33Q9.5 30 11.5 30Z"/><ellipse cx="18" cy="37" rx="4" ry="2.8"/><ellipse cx="46" cy="37" rx="4" ry="2.8"/><path d="M26 39.5H38"/><path d="M14 46V50.5H20V46M44 46V50.5H50V46"/><path style="stroke:var(--acc,#2f6df6);fill:var(--card,#fff)" d="M50 34L59 37.5V45C59 50.5 55 54 50 56.5C45 54 41 50.5 41 45V37.5Z"/><path' + A + ' d="M45.8 45.5L49 48.7L54.4 42.6" stroke-width="2.8"/>',
      pulido: '<path d="M16 50Q16 31 32 31Q48 31 48 50Z"/><path d="M32 31V19Q32 14 37 14H48"/><rect x="45" y="11" width="10" height="6" rx="3"/><ellipse cx="32" cy="50" rx="20" ry="5.5"' + A + '/><path' + A + ' d="M12 57Q32 63 52 57"/>' + star(14, 22, 5.5, 1) + star(52, 36, 3.4, 0),
      polarizado: '<path d="M9 48L17 17H47L55 48Z"/><path style="fill:currentColor;fill-opacity:.2;stroke:none" d="M12.8 38H51.2L55 48H9Z"/><path d="M12.8 38H51.2"/><path' + A + ' d="M24 25L30 25M22 29.5L34 29.5"/>' + star(46, 25, 4.4, 1),
      ruedas: '<circle cx="32" cy="32" r="23"/><circle cx="32" cy="32" r="15.5"/><circle cx="32" cy="32" r="5"' + AF + '/><path d="M32 17V27M45.3 27.7L36.8 30.5M40.2 43.3L35 36.3M23.8 43.3L29 36.3M18.7 27.7L27.2 30.5"/><path' + A + ' d="M32 9V12M32 52V55M9 32H12M52 32H55" opacity=".0"/>',
      suv: '<path d="M6 43V33Q6 29.6 9.5 29L15 27.8 20 19.5Q21 18 23 18H42Q44 18 45.2 19.4L50.5 27.8H54Q58 28 58 32V43Z"/><path d="M22.5 27.6 26 21H34V27.6ZM37 21H43L47.5 27.6H37Z"/><path' + A + ' d="M21 14H43"/><circle cx="19" cy="43.5" r="8"' + W + '/><circle cx="47" cy="43.5" r="8"' + W + '/><circle cx="19" cy="43.5" r="2.4"' + A + '/><circle cx="47" cy="43.5" r="2.4"' + A + '/>',
      brillo: star(28, 34, 20, 1) + star(51, 13, 7, 0) + star(52, 50, 5, 0),
      llave: '<path d="M29 8.7V16.5H35V8.7A12 12 0 1 1 29 8.7Z"/><path d="M28.5 31V52A3.5 3.5 0 0 0 35.5 52V31"/><circle cx="32" cy="52" r="1.2"' + A + '/>'
    };
  })(),
  iconNames: ["lavado", "tapiceria", "vidrio", "ceramico", "ppf", "pulido", "polarizado", "ruedas", "suv", "brillo", "llave"],
  ico: function (ic) {
    ic = String(ic || "");
    if (ic.indexOf("i:") === 0 && this.icons[ic.slice(2)]) return '<svg class="ics" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + this.icons[ic.slice(2)] + '</svg>';
    return ic.replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; });
  },
  coverUrl: function (id, w) { return /^https:/.test(id) ? id : "https://images.unsplash.com/photo-" + id + "?w=" + (w || 1200) + "&q=70&auto=format&fit=crop"; },
  /* Portada de un negocio: "none" = sin foto; un id o link elegido; si no eligió nada, la primera de su tipo */
  coverOf: function (type, cover, w) {
    if (cover === "none") return "";
    if (typeof cover === "string" && cover.indexOf("data:image/") === 0) return cover;
    var all = [].concat.apply([], Object.keys(this.covers).map(function (k) { return this.covers[k]; }, this));
    if (cover && all.indexOf(cover) >= 0) return this.coverUrl(cover, w);
    return this.coverUrl((this.covers[type] || this.covers.otro)[0], w);
  }
};
