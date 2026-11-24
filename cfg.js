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

  /* Íconos de servicio: set Phosphor Icons (MIT, phosphoricons.com) en dúo-tono con el color de marca. Se guardan como "i:nombre" en el campo ic del servicio. */
  icons: {"parabrisas": "<path d=\"M36,184 L68,76 Q72,60 90,60 H166 Q184,60 188,76 L220,184 Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M36,184 L68,76 Q72,60 90,60 H166 Q184,60 188,76 L220,184 Z\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M28,212 H228\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M70,168 L134,100\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M176,88 L183.2,104.8 L200,112 L183.2,119.2 L176,136 L168.8,119.2 L152,112 L168.8,104.8 Z\" fill=\"currentColor\"/>", "foco": "<path d=\"M64,64 C124,44 160,76 176,128 C160,180 124,212 64,192 C44,164 44,92 64,64 Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M64,64 C124,44 160,76 176,128 C160,180 124,212 64,192 C44,164 44,92 64,64 Z\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"112\" cy=\"128\" r=\"26\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"112\" cy=\"128\" r=\"7\" fill=\"currentColor\"/><path d=\"M204,92 H236 M208,128 H244 M204,164 H236\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>", "foco_brillo": "<path d=\"M56,72 C116,52 152,84 168,136 C152,188 116,220 56,200 C36,172 36,100 56,72 Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M56,72 C116,52 152,84 168,136 C152,188 116,220 56,200 C36,172 36,100 56,72 Z\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"104\" cy=\"136\" r=\"24\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M206,44 L214.4,63.6 L234,72 L214.4,80.4 L206,100 L197.6,80.4 L178,72 L197.6,63.6 Z\" fill=\"currentColor\"/><path d=\"M228,120 L232.2,129.8 L242,134 L232.2,138.2 L228,148 L223.8,138.2 L214,134 L223.8,129.8 Z\" fill=\"currentColor\"/>", "ventana": "<rect x=\"40\" y=\"40\" width=\"176\" height=\"176\" rx=\"18\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><rect x=\"40\" y=\"40\" width=\"176\" height=\"176\" rx=\"18\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M128,40 V216 M40,128 H216\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M84,64 L90.0,78.0 L104,84 L90.0,90.0 L84,104 L78.0,90.0 L64,84 L78.0,78.0 Z\" fill=\"currentColor\"/><path d=\"M172,158 L176.2,167.8 L186,172 L176.2,176.2 L172,186 L167.8,176.2 L158,172 L167.8,167.8 Z\" fill=\"currentColor\"/>", "gota": "<path d=\"M128,28 C112,52 60,108 60,152 a68,68 0 0 0 136,0 C196,108 144,52 128,28 Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M128,28 C112,52 60,108 60,152 a68,68 0 0 0 136,0 C196,108 144,52 128,28 Z\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M96,156 a32,32 0 0 0 26,32\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>", "rayon": "<rect x=\"40\" y=\"40\" width=\"176\" height=\"176\" rx=\"18\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><rect x=\"40\" y=\"40\" width=\"176\" height=\"176\" rx=\"18\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M84,64 L120,118 L96,134 L148,198\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M184,66 L189.4,78.6 L202,84 L189.4,89.4 L184,102 L178.6,89.4 L166,84 L178.6,78.6 Z\" fill=\"currentColor\"/>", "pulido": "<circle cx=\"128\" cy=\"128\" r=\"84\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><circle cx=\"128\" cy=\"128\" r=\"84\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"128\" cy=\"128\" r=\"26\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"128\" cy=\"128\" r=\"7\" fill=\"currentColor\"/><path d=\"M128,76 a52,52 0 0 1 48,32 M176,108 l-4,-22 M176,108 l-22,2\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M206,30 L212.0,44.0 L226,50 L212.0,56.0 L206,70 L200.0,56.0 L186,50 L200.0,44.0 Z\" fill=\"currentColor\"/>", "lavado": "<g transform=\"translate(26 66) scale(.85)\"><path d=\"M88,176a24,24,0,1,1-24-24A24,24,0,0,1,88,176Zm104-24a24,24,0,1,0,24,24A24,24,0,0,0,192,152ZM162.34,74.34A8,8,0,0,0,156.69,72H44.28a8,8,0,0,0-6.66,3.56L8,120H208Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M240,112H211.31L168,68.69A15.86,15.86,0,0,0,156.69,64H44.28A16,16,0,0,0,31,71.12L1.34,115.56A8.07,8.07,0,0,0,0,120v48a16,16,0,0,0,16,16H33a32,32,0,0,0,62,0h66a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V128A16,16,0,0,0,240,112ZM44.28,80H156.69l32,32H23ZM64,192a16,16,0,1,1,16-16A16,16,0,0,1,64,192Zm128,0a16,16,0,1,1,16-16A16,16,0,0,1,192,192Zm48-24H223a32,32,0,0,0-62,0H95a32,32,0,0,0-62,0H16V128H240Z\"/></g><g transform=\"translate(34 20) scale(.26)\"><path d=\"M208,144a80,80,0,0,1-160,0c0-72,80-128,80-128S208,72,208,144Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75ZM128,216a72.08,72.08,0,0,1-72-72c0-57.23,55.47-105,72-118,16.53,13,72,60.75,72,118A72.08,72.08,0,0,1,128,216Zm55.89-62.66a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z\"/></g><g transform=\"translate(98 4) scale(.26)\"><path d=\"M208,144a80,80,0,0,1-160,0c0-72,80-128,80-128S208,72,208,144Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75ZM128,216a72.08,72.08,0,0,1-72-72c0-57.23,55.47-105,72-118,16.53,13,72,60.75,72,118A72.08,72.08,0,0,1,128,216Zm55.89-62.66a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z\"/></g><g transform=\"translate(162 20) scale(.26)\"><path d=\"M208,144a80,80,0,0,1-160,0c0-72,80-128,80-128S208,72,208,144Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75ZM128,216a72.08,72.08,0,0,1-72-72c0-57.23,55.47-105,72-118,16.53,13,72,60.75,72,118A72.08,72.08,0,0,1,128,216Zm55.89-62.66a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z\"/></g>", "tapiceria": "<path d=\"M200,211.47V224a8,8,0,0,1-8,8H88a8,8,0,0,1-8-8V167.38a32,32,0,0,1,12-25l16-12.78a32,32,0,0,0,12-25V72h40A263.14,263.14,0,0,1,200,211.47Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M200,80a8,8,0,0,0,8-8,56.06,56.06,0,0,0-56-56H80A16,16,0,0,0,64,32V80a24,24,0,0,1-24,24,8,8,0,0,0,0,16A40,40,0,0,0,80,80h32v24.62a23.87,23.87,0,0,1-9,18.74L87,136.15a39.79,39.79,0,0,0-15,31.23V224a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V211.47A270.88,270.88,0,0,0,174,80ZM80,32h72a40.08,40.08,0,0,1,39.2,32H80ZM192,211.47V224H88V167.38a23.87,23.87,0,0,1,9-18.74l16-12.79a39.79,39.79,0,0,0,15-31.23V80h27.52A254.86,254.86,0,0,1,192,211.47Z\"/>", "asiento": "<path d=\"M216,160v32a8,8,0,0,1-8,8H114.11a8,8,0,0,1-7.15-4.42l-58.12-116a8,8,0,0,1,0-7.16L71,28.42a8,8,0,0,1,10.73-3.57l33.89,14.31a8,8,0,0,1,3.57,10.73L104.84,76.42a8,8,0,0,0,0,7.16l31.78,64a8,8,0,0,0,7.16,4.42H208A8,8,0,0,1,216,160Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M224,232a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16H216A8,8,0,0,1,224,232Zm0-72v32a16,16,0,0,1-16,16H114.11a15.93,15.93,0,0,1-14.32-8.85l-58.11-116a16.1,16.1,0,0,1,0-14.32l22.12-44A16,16,0,0,1,85,17.56l33.69,14.22.47.22a16,16,0,0,1,7.15,21.46,1.51,1.51,0,0,1-.11.22L112,80l31.78,64L208,144A16,16,0,0,1,224,160Zm-16,0H143.77a15.91,15.91,0,0,1-14.31-8.85l-31.79-64a16.07,16.07,0,0,1,0-14.29l.12-.22L112,46.32,78.57,32.21c-.16-.06-.31-.14-.46-.21L56,76,114.1,192H208Z\"/>", "vidrio": "<path d=\"M40 192L68 90Q128 70 188 90L216 192Z\" style=\"fill:var(--acc,#2f6df6);fill-opacity:.3;stroke:currentColor;stroke-width:16;stroke-linejoin:round\"/><path d=\"M84 176L104 112M122 176L138 108\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"12\" stroke-linecap=\"round\" opacity=\".55\"/><g transform=\"translate(118 6) scale(.5)\"><path d=\"M194.82,151.43l-55.09,20.3-20.3,55.09a7.92,7.92,0,0,1-14.86,0l-20.3-55.09-55.09-20.3a7.92,7.92,0,0,1,0-14.86l55.09-20.3,20.3-55.09a7.92,7.92,0,0,1,14.86,0l20.3,55.09,55.09,20.3A7.92,7.92,0,0,1,194.82,151.43Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z\"/></g><g transform=\"translate(14 48) scale(.2)\"><path d=\"M194.82,151.43l-55.09,20.3-20.3,55.09a7.92,7.92,0,0,1-14.86,0l-20.3-55.09-55.09-20.3a7.92,7.92,0,0,1,0-14.86l55.09-20.3,20.3-55.09a7.92,7.92,0,0,1,14.86,0l20.3,55.09,55.09,20.3A7.92,7.92,0,0,1,194.82,151.43Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z\"/></g>", "ceramico": "<path d=\"M216,56v56c0,96-88,120-88,120S40,208,40,112V56a8,8,0,0,1,8-8H208A8,8,0,0,1,216,56Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z\"/>", "ppf": "<g transform=\"translate(4 14) scale(.72)\"><path d=\"M88,176a24,24,0,1,1-24-24A24,24,0,0,1,88,176Zm104-24a24,24,0,1,0,24,24A24,24,0,0,0,192,152ZM162.34,74.34A8,8,0,0,0,156.69,72H44.28a8,8,0,0,0-6.66,3.56L8,120H208Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M240,112H211.31L168,68.69A15.86,15.86,0,0,0,156.69,64H44.28A16,16,0,0,0,31,71.12L1.34,115.56A8.07,8.07,0,0,0,0,120v48a16,16,0,0,0,16,16H33a32,32,0,0,0,62,0h66a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V128A16,16,0,0,0,240,112ZM44.28,80H156.69l32,32H23ZM64,192a16,16,0,1,1,16-16A16,16,0,0,1,64,192Zm128,0a16,16,0,1,1,16-16A16,16,0,0,1,192,192Zm48-24H223a32,32,0,0,0-62,0H95a32,32,0,0,0-62,0H16V128H240Z\"/></g><g transform=\"translate(138 120) scale(.5)\"><path d=\"M216,56v56c0,96-88,120-88,120S40,208,40,112V56a8,8,0,0,1,8-8H208A8,8,0,0,1,216,56Z\" style=\"fill:var(--card,#fff);stroke:var(--card,#fff);stroke-width:30;stroke-linejoin:round\"/><path d=\"M216,56v56c0,96-88,120-88,120S40,208,40,112V56a8,8,0,0,1,8-8H208A8,8,0,0,1,216,56Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z\"/></g>", "polarizado": "<path d=\"M32,136h72v28a36,36,0,0,1-72,0Zm120,0v28a36,36,0,0,0,72,0V136Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M200,40a8,8,0,0,0,0,16,16,16,0,0,1,16,16v56H40V72A16,16,0,0,1,56,56a8,8,0,0,0,0-16A32,32,0,0,0,24,72v92a44,44,0,0,0,88,0V144h32v20a44,44,0,0,0,88,0V72A32,32,0,0,0,200,40Zm12.63,137.31L179.31,144H216v20A27.8,27.8,0,0,1,212.63,177.31ZM40,164V147.31l41.31,41.32A28,28,0,0,1,40,164Zm56,0a27.8,27.8,0,0,1-3.37,13.31L59.31,144H96Zm64,0V147.31l41.31,41.32A28,28,0,0,1,160,164Z\"/>", "ruedas": "<path d=\"M164,224H92c-28.72,0-52-43-52-96S63.28,32,92,32h72c-28.72,0-52,43-52,96S135.28,224,164,224Zm4-136c-8.84,0-16,17.91-16,40s7.16,40,16,40,16-17.91,16-40S176.84,88,168,88Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M149.26,159.26C155.09,173.82,163.5,176,168,176s12.91-2.18,18.74-16.74c3.39-8.48,5.26-19.58,5.26-31.26s-1.87-22.78-5.26-31.26C180.91,82.18,172.5,80,168,80s-12.91,2.18-18.74,16.74C145.87,105.22,144,116.32,144,128S145.87,150.78,149.26,159.26ZM168,96.2c2.62,2.06,8,13,8,31.8s-5.38,29.74-8,31.8c-2.62-2.06-8-13-8-31.8S165.38,98.26,168,96.2ZM232,216H196.41C213.12,197.73,224,165.47,224,128c0-58.32-26.35-104-60-104H92C58.35,24,32,69.68,32,128S58.35,232,92,232H232a8,8,0,0,0,0-16ZM193.74,63.93C202.93,80.91,208,103.67,208,128s-5.07,47.09-14.26,64.07C185.38,207.5,174.82,216,164,216s-21.38-8.5-29.74-23.93C125.07,175.09,120,152.33,120,128s5.07-47.09,14.26-64.07C142.62,48.5,153.18,40,164,40S185.38,48.5,193.74,63.93ZM48,128c0-2.5.07-5,.17-7.44L80,97.83l24.43,17.45c-.28,4.16-.43,8.41-.43,12.72a179.89,179.89,0,0,0,3.07,33.5l-22.42-16a8,8,0,0,0-9.3,0l-23.74,17A161,161,0,0,1,48,128ZM62.26,63.93C70.62,48.5,81.18,40,92,40h39.59c-11.9,13-20.84,33.12-25,57.16L84.65,81.49a8,8,0,0,0-9.3,0L50.49,99.25C52.85,86,56.83,74,62.26,63.93Zm0,128.14a100.08,100.08,0,0,1-5.94-13.32L80,161.83l33.94,24.24c4.6,12,10.6,22.22,17.65,29.93H92C81.18,216,70.62,207.5,62.26,192.07Z\"/>", "suv": "<path d=\"M224,96H32L42.65,46.32A8,8,0,0,1,50.47,40H205.53a8,8,0,0,1,7.82,6.32Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M240,88h-9.53l-9.29-43.35A16.08,16.08,0,0,0,205.53,32H50.47A16.08,16.08,0,0,0,34.82,44.65L25.53,88H16a8,8,0,0,0,0,16h8v96a16,16,0,0,0,16,16H64a16,16,0,0,0,16-16V176h96v24a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V104h8a8,8,0,0,0,0-16ZM50.47,48H205.53l8.57,40H41.9ZM64,200H40V176H64Zm128,0V176h24v24Zm24-40H152V128a8,8,0,0,0-16,0v32H120V128a8,8,0,0,0-16,0v32H40V104H216ZM56,132a12,12,0,1,1,12,12A12,12,0,0,1,56,132Zm120,0a12,12,0,1,1,12,12A12,12,0,0,1,176,132Z\"/>", "brillo": "<path d=\"M194.82,151.43l-55.09,20.3-20.3,55.09a7.92,7.92,0,0,1-14.86,0l-20.3-55.09-55.09-20.3a7.92,7.92,0,0,1,0-14.86l55.09-20.3,20.3-55.09a7.92,7.92,0,0,1,14.86,0l20.3,55.09,55.09,20.3A7.92,7.92,0,0,1,194.82,151.43Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z\"/>", "llave": "<path d=\"M224,96a64,64,0,0,1-94.94,56L73,217A24,24,0,0,1,39,183L104,126.94a64,64,0,0,1,80-90.29L144,80l5.66,26.34L176,112l43.35-40A63.8,63.8,0,0,1,224,96Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M226.76,69a8,8,0,0,0-12.84-2.88l-40.3,37.19-17.23-3.7-3.7-17.23,37.19-40.3A8,8,0,0,0,187,29.24,72,72,0,0,0,88,96,72.34,72.34,0,0,0,94,124.94L33.79,177c-.15.12-.29.26-.43.39a32,32,0,0,0,45.26,45.26c.13-.13.27-.28.39-.42L131.06,162A72,72,0,0,0,232,96,71.56,71.56,0,0,0,226.76,69ZM160,152a56.14,56.14,0,0,1-27.07-7,8,8,0,0,0-9.92,1.77L67.11,211.51a16,16,0,0,1-22.62-22.62L109.18,133a8,8,0,0,0,1.77-9.93,56,56,0,0,1,58.36-82.31l-31.2,33.81a8,8,0,0,0-1.94,7.1L141.83,108a8,8,0,0,0,6.14,6.14l26.35,5.66a8,8,0,0,0,7.1-1.94l33.81-31.2A56.06,56.06,0,0,1,160,152Z\"/>", "volante": "<path d=\"M222.4,145.55A96.6,96.6,0,0,1,218.54,160h-53a8,8,0,0,0-7.5,5.19l-21.9,58.47c-2.69.22-5.41.34-8.15.34s-5.5-.12-8.2-.35L97.94,165.2a8,8,0,0,0-7.49-5.2h-53a96.6,96.6,0,0,1-3.86-14.45,128,128,0,0,1,188.8,0Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M128,152a12,12,0,1,1,12-12A12,12,0,0,1,128,152Zm104-24A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128ZM40,128v.33a135.93,135.93,0,0,1,176,0V128a88,88,0,0,0-176,0Zm67.5,85.58L90.45,168H49.63A88.35,88.35,0,0,0,107.5,213.58ZM128,216c.83,0,1.66,0,2.49,0l20.07-53.57a16.07,16.07,0,0,1,15-10.39h47.12c.38-1.31.72-2.64,1-4a120,120,0,0,0-171.4,0c.31,1.34.65,2.67,1,4H90.45a16.08,16.08,0,0,1,15,10.4l20,53.56C126.31,216,127.15,216,128,216Zm78.37-48H165.55l-17.09,45.59A88.34,88.34,0,0,0,206.37,168Z\"/>"},
  iconNames: ["img:parabrisas_pulidora","img:foco_pulidora","img:brillo_final","i:parabrisas","i:foco","i:foco_brillo","i:ventana","i:gota","i:rayon","i:pulido","img:lavados","img:tapiceria","img:vidrios","img:ceramico","img:ppf","img:polarizado","img:pulidora","img:accesorios","img:suv4x4","i:lavado","i:tapiceria","i:vidrio","i:ceramico","i:ppf","i:polarizado","i:ruedas","i:suv","i:brillo","i:llave","i:asiento","i:volante"],
  imgIcons: ["parabrisas_pulidora","foco_pulidora","brillo_final","lavados","tapiceria","vidrios","ceramico","ppf","polarizado","pulidora","accesorios","suv4x4"],
  ico: function (ic) {
    ic = String(ic || "");
    if (ic === "i:pulido") ic = "i:brillo";
    if (ic.indexOf("data:image/") === 0 && ic.length < 90000) return '<img class="ics ico-img" src="' + ic.replace(/"/g, "") + '" alt="" decoding="async">';
    if (ic.indexOf("img:") === 0 && this.imgIcons.indexOf(ic.slice(4)) >= 0) return '<img class="ics ico-img" src="/img/ic/' + ic.slice(4) + '.png" alt="" loading="lazy" decoding="async">';
    if (ic.indexOf("i:") === 0 && this.icons[ic.slice(2)]) return '<svg class="ics" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">' + this.icons[ic.slice(2)] + '</svg>';
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
