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
      inc: ["Sitio de reservas 24/7 con precio por vehículo", "Agenda por día y semana", "Hasta 10 servicios", "Clientes e historial de cada carro", "Confirmaciones y recordatorios por WhatsApp con un toque", "Página web con estilo Clásico que tú editas", "Hasta 3 fotos, 3 reseñas y 3 preguntas en tu web", "Hasta 6 videos de TikTok, Instagram, Facebook o YouTube", "Aviso en tu celular de cada reserva nueva", "Pide reseñas de Google con un toque", "Ingresos del mes, tu logo y tu color"], f: [], payLink: "https://buy.polar.sh/polar_cl_NjvP37NPL5omZAhM3EQ1Ow5qhQD0RXHWhlHmH3q9qTY" },
    turbo:    { n: "Turbo", ic: "⚡", crc: 9900, usd: 19, staff: 5, svcMax: 40, tag: "Para negocios con equipo", pop: true,
      inc: ["Todo lo de Arranque", "Hasta 5 personas en tu equipo", "Hasta 40 servicios", "3 estilos de página, incluido el Premium oscuro", "Hasta 8 fotos, 8 reseñas y 8 preguntas", "Hasta 12 videos de TikTok, Instagram, Facebook o YouTube", "Secciones «Así funciona» y «Por qué elegirte»", "Adelanto por SINPE para asegurar la hora", "Varios clientes a la misma hora (cupos)", "Servicio a domicilio con zonas, tiempo de traslado y «voy en camino»", "Avisa a tus clientes cuándo toca volver (mantenimiento)", "Asistente con IA que escribe tus textos (5 usos al día)", "Cierre de caja, abonos y quién te debe", "Gastos y ganancia real del mes", "Referidos: tus clientes te traen clientes"], f: ["web", "dom", "ref", "gastos"], payLink: "https://buy.polar.sh/polar_cl_atZMWBzWIS2DtqhBXLPuojzpCsRKXxuKshL7Q4KUjCV" },
    nitro:    { n: "Nitro", ic: "🚀", crc: 19900, usd: 35, staff: 99, svcMax: 200, tag: "Para crecer en serio",
      inc: ["Todo lo de Turbo", "Los 5 estilos de página (Atrevido y Elegante incluidos)", "Hasta 12 fotos, 12 reseñas y 12 preguntas", "Hasta 24 videos de TikTok, Instagram, Facebook o YouTube", "Asistente con IA: 30 usos al día", "Equipo ilimitado", "Control de insumos", "Recordatorios automáticos por WhatsApp (próximamente)", "Tu propio dominio (tunegocio.com) a pedido", "Soporte prioritario por WhatsApp"], f: ["web", "dom", "ref", "gastos", "insumos", "dominio", "waauto", "prioridad"], payLink: "https://buy.polar.sh/polar_cl_Q2c2h9RLBPjF9UbGOHCY12n18JjVW6yBt5rgQ36XOEJ" }
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
    barberia: { ico: "img:poste", n: "Barbería", ic: "💈", svc: [["Corte de cabello", 6000, 30, "img:tijeras"], ["Corte + barba", 8000, 45, "img:poste"], ["Barba", 4000, 30, "img:navaja"], ["Corte de niño", 5000, 30, "img:peine"]] },
    salon:    { ico: "img:secador", n: "Salón de belleza", ic: "💇‍♀️", svc: [["Corte y secado", 10000, 60, "img:secador"], ["Tinte", 25000, 120, "img:tinte"], ["Peinado", 12000, 60, "img:peine"], ["Tratamiento capilar", 15000, 60, "img:crema"]] },
    unas:     { ico: "img:esmalte", n: "Uñas", ic: "💅", svc: [["Manicure", 7000, 45, "img:esmalte"], ["Pedicure", 9000, 60, "img:pie"], ["Acrílicas", 18000, 120, "img:gema"], ["Semipermanente", 10000, 60, "img:lampara"]] },
    lavacar:  { ico: "img:lavados", n: "Lavacar", ic: "🧽", car: true, svc: [["Lavado sencillo", 5000, 45, "img:tapiceria", 1], ["Lavado completo", 8000, 60, "img:lavados", 1], ["Lavado de chasís", 6000, 45, "img:suv4x4", 1], ["Encerado", 12000, 90, "img:brillo_final", 1]] },
    detailing:{ ico: "img:pulidora", n: "Detailing", ic: "✨", car: true, svc: [["Detailing interior", 35000, 180, "img:tapiceria", 1], ["Detailing exterior", 40000, 180, "img:ppf", 1], ["Corrección de pintura", 90000, 360, "img:pulidora", 1], ["Tratamiento cerámico", 150000, 480, "img:ceramico", 1]] },
    pulido:   { ico: "img:foco_polimero_real", n: "Pulido de focos y vidrios", ic: "💡", car: true, svc: [["Pulido de focos", 20000, 90, "img:foco_polimero_real", 0], ["Pulido de parabrisas", 25000, 120, "img:parabrisas_real", 1], ["Remoción de gota seca", 20000, 90, "img:gotaseca", 1]] },
    polarizado:{ ico: "img:polarizado", n: "Polarizado", ic: "🕶️", car: true, svc: [["Polarizado completo", 60000, 180, "img:polarizado", 1], ["Parabrisas", 25000, 60, "img:vidrios", 0], ["Retiro de polarizado", 15000, 60, "img:tapiceria", 1]] },
    autos:    { ico: "img:suv4x4", n: "Cuidado de autos", car: true, ic: "🚗", svc: [["Lavado completo", 8000, 60, "img:lavados"], ["Pulido de focos", 20000, 90, "img:foco_polimero_real"], ["Pulido de parabrisas", 20000, 120, "img:parabrisas_real"], ["Detailing interior", 35000, 180, "img:tapiceria"]] },
    taller:   { ico: "img:diagnostico", n: "Taller", ic: "🔧", car: true, svc: [["Diagnóstico", 15000, 60, "img:diagnostico"], ["Cambio de aceite", 25000, 60, "img:aceite"], ["Revisión de frenos", 20000, 90, "img:frenos"]] },
    spa:      { ico: "img:loto", n: "Spa y masajes", ic: "🧖", svc: [["Masaje relajante", 25000, 60, "img:piedras"], ["Limpieza facial", 22000, 60, "img:facial"], ["Masaje descontracturante", 30000, 90, "img:loto"]] },
    salud:    { ico: "img:estetoscopio", n: "Consultorio", ic: "🩺", svc: [["Consulta", 25000, 30, "img:estetoscopio"], ["Control", 15000, 30, "img:clipboard"]] },
    otro:     { ico: "img:calendario", n: "Otro", ic: "📅", svc: [["Cita", 10000, 60, "img:calendario"]] }
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
  icons: {"parabrisas": "<path d=\"M36,184 L68,76 Q72,60 90,60 H166 Q184,60 188,76 L220,184 Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M36,184 L68,76 Q72,60 90,60 H166 Q184,60 188,76 L220,184 Z\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M28,212 H228\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M70,168 L134,100\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M176,88 L183.2,104.8 L200,112 L183.2,119.2 L176,136 L168.8,119.2 L152,112 L168.8,104.8 Z\" fill=\"currentColor\"/>", "foco": "<path d=\"M64,64 C124,44 160,76 176,128 C160,180 124,212 64,192 C44,164 44,92 64,64 Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M64,64 C124,44 160,76 176,128 C160,180 124,212 64,192 C44,164 44,92 64,64 Z\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"112\" cy=\"128\" r=\"26\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"112\" cy=\"128\" r=\"7\" fill=\"currentColor\"/><path d=\"M204,92 H236 M208,128 H244 M204,164 H236\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>", "foco_brillo": "<path d=\"M56,72 C116,52 152,84 168,136 C152,188 116,220 56,200 C36,172 36,100 56,72 Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M56,72 C116,52 152,84 168,136 C152,188 116,220 56,200 C36,172 36,100 56,72 Z\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"104\" cy=\"136\" r=\"24\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M206,44 L214.4,63.6 L234,72 L214.4,80.4 L206,100 L197.6,80.4 L178,72 L197.6,63.6 Z\" fill=\"currentColor\"/><path d=\"M228,120 L232.2,129.8 L242,134 L232.2,138.2 L228,148 L223.8,138.2 L214,134 L223.8,129.8 Z\" fill=\"currentColor\"/>", "ventana": "<rect x=\"40\" y=\"40\" width=\"176\" height=\"176\" rx=\"18\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><rect x=\"40\" y=\"40\" width=\"176\" height=\"176\" rx=\"18\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M128,40 V216 M40,128 H216\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M84,64 L90.0,78.0 L104,84 L90.0,90.0 L84,104 L78.0,90.0 L64,84 L78.0,78.0 Z\" fill=\"currentColor\"/><path d=\"M172,158 L176.2,167.8 L186,172 L176.2,176.2 L172,186 L167.8,176.2 L158,172 L167.8,167.8 Z\" fill=\"currentColor\"/>", "gota": "<path d=\"M128,28 C112,52 60,108 60,152 a68,68 0 0 0 136,0 C196,108 144,52 128,28 Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M128,28 C112,52 60,108 60,152 a68,68 0 0 0 136,0 C196,108 144,52 128,28 Z\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M96,156 a32,32 0 0 0 26,32\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/>", "rayon": "<rect x=\"40\" y=\"40\" width=\"176\" height=\"176\" rx=\"18\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><rect x=\"40\" y=\"40\" width=\"176\" height=\"176\" rx=\"18\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M84,64 L120,118 L96,134 L148,198\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M184,66 L189.4,78.6 L202,84 L189.4,89.4 L184,102 L178.6,89.4 L166,84 L178.6,78.6 Z\" fill=\"currentColor\"/>", "pulido": "<circle cx=\"128\" cy=\"128\" r=\"84\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><circle cx=\"128\" cy=\"128\" r=\"84\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"128\" cy=\"128\" r=\"26\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"128\" cy=\"128\" r=\"7\" fill=\"currentColor\"/><path d=\"M128,76 a52,52 0 0 1 48,32 M176,108 l-4,-22 M176,108 l-22,2\" stroke=\"currentColor\" stroke-width=\"14\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M206,30 L212.0,44.0 L226,50 L212.0,56.0 L206,70 L200.0,56.0 L186,50 L200.0,44.0 Z\" fill=\"currentColor\"/>", "lavado": "<g transform=\"translate(26 66) scale(.85)\"><path d=\"M88,176a24,24,0,1,1-24-24A24,24,0,0,1,88,176Zm104-24a24,24,0,1,0,24,24A24,24,0,0,0,192,152ZM162.34,74.34A8,8,0,0,0,156.69,72H44.28a8,8,0,0,0-6.66,3.56L8,120H208Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M240,112H211.31L168,68.69A15.86,15.86,0,0,0,156.69,64H44.28A16,16,0,0,0,31,71.12L1.34,115.56A8.07,8.07,0,0,0,0,120v48a16,16,0,0,0,16,16H33a32,32,0,0,0,62,0h66a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V128A16,16,0,0,0,240,112ZM44.28,80H156.69l32,32H23ZM64,192a16,16,0,1,1,16-16A16,16,0,0,1,64,192Zm128,0a16,16,0,1,1,16-16A16,16,0,0,1,192,192Zm48-24H223a32,32,0,0,0-62,0H95a32,32,0,0,0-62,0H16V128H240Z\"/></g><g transform=\"translate(34 20) scale(.26)\"><path d=\"M208,144a80,80,0,0,1-160,0c0-72,80-128,80-128S208,72,208,144Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75ZM128,216a72.08,72.08,0,0,1-72-72c0-57.23,55.47-105,72-118,16.53,13,72,60.75,72,118A72.08,72.08,0,0,1,128,216Zm55.89-62.66a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z\"/></g><g transform=\"translate(98 4) scale(.26)\"><path d=\"M208,144a80,80,0,0,1-160,0c0-72,80-128,80-128S208,72,208,144Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75ZM128,216a72.08,72.08,0,0,1-72-72c0-57.23,55.47-105,72-118,16.53,13,72,60.75,72,118A72.08,72.08,0,0,1,128,216Zm55.89-62.66a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z\"/></g><g transform=\"translate(162 20) scale(.26)\"><path d=\"M208,144a80,80,0,0,1-160,0c0-72,80-128,80-128S208,72,208,144Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M174,47.75a254.19,254.19,0,0,0-41.45-38.3,8,8,0,0,0-9.18,0A254.19,254.19,0,0,0,82,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75ZM128,216a72.08,72.08,0,0,1-72-72c0-57.23,55.47-105,72-118,16.53,13,72,60.75,72,118A72.08,72.08,0,0,1,128,216Zm55.89-62.66a57.6,57.6,0,0,1-46.56,46.55A8.75,8.75,0,0,1,136,200a8,8,0,0,1-1.32-15.89c16.57-2.79,30.63-16.85,33.44-33.45a8,8,0,0,1,15.78,2.68Z\"/></g>", "tapiceria": "<path d=\"M200,211.47V224a8,8,0,0,1-8,8H88a8,8,0,0,1-8-8V167.38a32,32,0,0,1,12-25l16-12.78a32,32,0,0,0,12-25V72h40A263.14,263.14,0,0,1,200,211.47Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M200,80a8,8,0,0,0,8-8,56.06,56.06,0,0,0-56-56H80A16,16,0,0,0,64,32V80a24,24,0,0,1-24,24,8,8,0,0,0,0,16A40,40,0,0,0,80,80h32v24.62a23.87,23.87,0,0,1-9,18.74L87,136.15a39.79,39.79,0,0,0-15,31.23V224a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V211.47A270.88,270.88,0,0,0,174,80ZM80,32h72a40.08,40.08,0,0,1,39.2,32H80ZM192,211.47V224H88V167.38a23.87,23.87,0,0,1,9-18.74l16-12.79a39.79,39.79,0,0,0,15-31.23V80h27.52A254.86,254.86,0,0,1,192,211.47Z\"/>", "asiento": "<path d=\"M216,160v32a8,8,0,0,1-8,8H114.11a8,8,0,0,1-7.15-4.42l-58.12-116a8,8,0,0,1,0-7.16L71,28.42a8,8,0,0,1,10.73-3.57l33.89,14.31a8,8,0,0,1,3.57,10.73L104.84,76.42a8,8,0,0,0,0,7.16l31.78,64a8,8,0,0,0,7.16,4.42H208A8,8,0,0,1,216,160Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M224,232a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16H216A8,8,0,0,1,224,232Zm0-72v32a16,16,0,0,1-16,16H114.11a15.93,15.93,0,0,1-14.32-8.85l-58.11-116a16.1,16.1,0,0,1,0-14.32l22.12-44A16,16,0,0,1,85,17.56l33.69,14.22.47.22a16,16,0,0,1,7.15,21.46,1.51,1.51,0,0,1-.11.22L112,80l31.78,64L208,144A16,16,0,0,1,224,160Zm-16,0H143.77a15.91,15.91,0,0,1-14.31-8.85l-31.79-64a16.07,16.07,0,0,1,0-14.29l.12-.22L112,46.32,78.57,32.21c-.16-.06-.31-.14-.46-.21L56,76,114.1,192H208Z\"/>", "vidrio": "<path d=\"M40 192L68 90Q128 70 188 90L216 192Z\" style=\"fill:var(--acc,#2f6df6);fill-opacity:.3;stroke:currentColor;stroke-width:16;stroke-linejoin:round\"/><path d=\"M84 176L104 112M122 176L138 108\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"12\" stroke-linecap=\"round\" opacity=\".55\"/><g transform=\"translate(118 6) scale(.5)\"><path d=\"M194.82,151.43l-55.09,20.3-20.3,55.09a7.92,7.92,0,0,1-14.86,0l-20.3-55.09-55.09-20.3a7.92,7.92,0,0,1,0-14.86l55.09-20.3,20.3-55.09a7.92,7.92,0,0,1,14.86,0l20.3,55.09,55.09,20.3A7.92,7.92,0,0,1,194.82,151.43Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z\"/></g><g transform=\"translate(14 48) scale(.2)\"><path d=\"M194.82,151.43l-55.09,20.3-20.3,55.09a7.92,7.92,0,0,1-14.86,0l-20.3-55.09-55.09-20.3a7.92,7.92,0,0,1,0-14.86l55.09-20.3,20.3-55.09a7.92,7.92,0,0,1,14.86,0l20.3,55.09,55.09,20.3A7.92,7.92,0,0,1,194.82,151.43Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z\"/></g>", "ceramico": "<path d=\"M216,56v56c0,96-88,120-88,120S40,208,40,112V56a8,8,0,0,1,8-8H208A8,8,0,0,1,216,56Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z\"/>", "ppf": "<g transform=\"translate(4 14) scale(.72)\"><path d=\"M88,176a24,24,0,1,1-24-24A24,24,0,0,1,88,176Zm104-24a24,24,0,1,0,24,24A24,24,0,0,0,192,152ZM162.34,74.34A8,8,0,0,0,156.69,72H44.28a8,8,0,0,0-6.66,3.56L8,120H208Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M240,112H211.31L168,68.69A15.86,15.86,0,0,0,156.69,64H44.28A16,16,0,0,0,31,71.12L1.34,115.56A8.07,8.07,0,0,0,0,120v48a16,16,0,0,0,16,16H33a32,32,0,0,0,62,0h66a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V128A16,16,0,0,0,240,112ZM44.28,80H156.69l32,32H23ZM64,192a16,16,0,1,1,16-16A16,16,0,0,1,64,192Zm128,0a16,16,0,1,1,16-16A16,16,0,0,1,192,192Zm48-24H223a32,32,0,0,0-62,0H95a32,32,0,0,0-62,0H16V128H240Z\"/></g><g transform=\"translate(138 120) scale(.5)\"><path d=\"M216,56v56c0,96-88,120-88,120S40,208,40,112V56a8,8,0,0,1,8-8H208A8,8,0,0,1,216,56Z\" style=\"fill:var(--card,#fff);stroke:var(--card,#fff);stroke-width:30;stroke-linejoin:round\"/><path d=\"M216,56v56c0,96-88,120-88,120S40,208,40,112V56a8,8,0,0,1,8-8H208A8,8,0,0,1,216,56Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M208,40H48A16,16,0,0,0,32,56v56c0,52.72,25.52,84.67,46.93,102.19,23.06,18.86,46,25.26,47,25.53a8,8,0,0,0,4.2,0c1-.27,23.91-6.67,47-25.53C198.48,196.67,224,164.72,224,112V56A16,16,0,0,0,208,40Zm0,72c0,37.07-13.66,67.16-40.6,89.42A129.3,129.3,0,0,1,128,223.62a128.25,128.25,0,0,1-38.92-21.81C61.82,179.51,48,149.3,48,112l0-56,160,0ZM82.34,141.66a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32l-56,56a8,8,0,0,1-11.32,0Z\"/></g>", "polarizado": "<path d=\"M32,136h72v28a36,36,0,0,1-72,0Zm120,0v28a36,36,0,0,0,72,0V136Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M200,40a8,8,0,0,0,0,16,16,16,0,0,1,16,16v56H40V72A16,16,0,0,1,56,56a8,8,0,0,0,0-16A32,32,0,0,0,24,72v92a44,44,0,0,0,88,0V144h32v20a44,44,0,0,0,88,0V72A32,32,0,0,0,200,40Zm12.63,137.31L179.31,144H216v20A27.8,27.8,0,0,1,212.63,177.31ZM40,164V147.31l41.31,41.32A28,28,0,0,1,40,164Zm56,0a27.8,27.8,0,0,1-3.37,13.31L59.31,144H96Zm64,0V147.31l41.31,41.32A28,28,0,0,1,160,164Z\"/>", "ruedas": "<path d=\"M164,224H92c-28.72,0-52-43-52-96S63.28,32,92,32h72c-28.72,0-52,43-52,96S135.28,224,164,224Zm4-136c-8.84,0-16,17.91-16,40s7.16,40,16,40,16-17.91,16-40S176.84,88,168,88Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M149.26,159.26C155.09,173.82,163.5,176,168,176s12.91-2.18,18.74-16.74c3.39-8.48,5.26-19.58,5.26-31.26s-1.87-22.78-5.26-31.26C180.91,82.18,172.5,80,168,80s-12.91,2.18-18.74,16.74C145.87,105.22,144,116.32,144,128S145.87,150.78,149.26,159.26ZM168,96.2c2.62,2.06,8,13,8,31.8s-5.38,29.74-8,31.8c-2.62-2.06-8-13-8-31.8S165.38,98.26,168,96.2ZM232,216H196.41C213.12,197.73,224,165.47,224,128c0-58.32-26.35-104-60-104H92C58.35,24,32,69.68,32,128S58.35,232,92,232H232a8,8,0,0,0,0-16ZM193.74,63.93C202.93,80.91,208,103.67,208,128s-5.07,47.09-14.26,64.07C185.38,207.5,174.82,216,164,216s-21.38-8.5-29.74-23.93C125.07,175.09,120,152.33,120,128s5.07-47.09,14.26-64.07C142.62,48.5,153.18,40,164,40S185.38,48.5,193.74,63.93ZM48,128c0-2.5.07-5,.17-7.44L80,97.83l24.43,17.45c-.28,4.16-.43,8.41-.43,12.72a179.89,179.89,0,0,0,3.07,33.5l-22.42-16a8,8,0,0,0-9.3,0l-23.74,17A161,161,0,0,1,48,128ZM62.26,63.93C70.62,48.5,81.18,40,92,40h39.59c-11.9,13-20.84,33.12-25,57.16L84.65,81.49a8,8,0,0,0-9.3,0L50.49,99.25C52.85,86,56.83,74,62.26,63.93Zm0,128.14a100.08,100.08,0,0,1-5.94-13.32L80,161.83l33.94,24.24c4.6,12,10.6,22.22,17.65,29.93H92C81.18,216,70.62,207.5,62.26,192.07Z\"/>", "suv": "<path d=\"M224,96H32L42.65,46.32A8,8,0,0,1,50.47,40H205.53a8,8,0,0,1,7.82,6.32Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M240,88h-9.53l-9.29-43.35A16.08,16.08,0,0,0,205.53,32H50.47A16.08,16.08,0,0,0,34.82,44.65L25.53,88H16a8,8,0,0,0,0,16h8v96a16,16,0,0,0,16,16H64a16,16,0,0,0,16-16V176h96v24a16,16,0,0,0,16,16h24a16,16,0,0,0,16-16V104h8a8,8,0,0,0,0-16ZM50.47,48H205.53l8.57,40H41.9ZM64,200H40V176H64Zm128,0V176h24v24Zm24-40H152V128a8,8,0,0,0-16,0v32H120V128a8,8,0,0,0-16,0v32H40V104H216ZM56,132a12,12,0,1,1,12,12A12,12,0,0,1,56,132Zm120,0a12,12,0,1,1,12,12A12,12,0,0,1,176,132Z\"/>", "brillo": "<path d=\"M194.82,151.43l-55.09,20.3-20.3,55.09a7.92,7.92,0,0,1-14.86,0l-20.3-55.09-55.09-20.3a7.92,7.92,0,0,1,0-14.86l55.09-20.3,20.3-55.09a7.92,7.92,0,0,1,14.86,0l20.3,55.09,55.09,20.3A7.92,7.92,0,0,1,194.82,151.43Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M197.58,129.06,146,110l-19-51.62a15.92,15.92,0,0,0-29.88,0L78,110l-51.62,19a15.92,15.92,0,0,0,0,29.88L78,178l19,51.62a15.92,15.92,0,0,0,29.88,0L146,178l51.62-19a15.92,15.92,0,0,0,0-29.88ZM137,164.22a8,8,0,0,0-4.74,4.74L112,223.85,91.78,169A8,8,0,0,0,87,164.22L32.15,144,87,123.78A8,8,0,0,0,91.78,119L112,64.15,132.22,119a8,8,0,0,0,4.74,4.74L191.85,144ZM144,40a8,8,0,0,1,8-8h16V16a8,8,0,0,1,16,0V32h16a8,8,0,0,1,0,16H184V64a8,8,0,0,1-16,0V48H152A8,8,0,0,1,144,40ZM248,88a8,8,0,0,1-8,8h-8v8a8,8,0,0,1-16,0V96h-8a8,8,0,0,1,0-16h8V72a8,8,0,0,1,16,0v8h8A8,8,0,0,1,248,88Z\"/>", "llave": "<path d=\"M224,96a64,64,0,0,1-94.94,56L73,217A24,24,0,0,1,39,183L104,126.94a64,64,0,0,1,80-90.29L144,80l5.66,26.34L176,112l43.35-40A63.8,63.8,0,0,1,224,96Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M226.76,69a8,8,0,0,0-12.84-2.88l-40.3,37.19-17.23-3.7-3.7-17.23,37.19-40.3A8,8,0,0,0,187,29.24,72,72,0,0,0,88,96,72.34,72.34,0,0,0,94,124.94L33.79,177c-.15.12-.29.26-.43.39a32,32,0,0,0,45.26,45.26c.13-.13.27-.28.39-.42L131.06,162A72,72,0,0,0,232,96,71.56,71.56,0,0,0,226.76,69ZM160,152a56.14,56.14,0,0,1-27.07-7,8,8,0,0,0-9.92,1.77L67.11,211.51a16,16,0,0,1-22.62-22.62L109.18,133a8,8,0,0,0,1.77-9.93,56,56,0,0,1,58.36-82.31l-31.2,33.81a8,8,0,0,0-1.94,7.1L141.83,108a8,8,0,0,0,6.14,6.14l26.35,5.66a8,8,0,0,0,7.1-1.94l33.81-31.2A56.06,56.06,0,0,1,160,152Z\"/>", "volante": "<path d=\"M222.4,145.55A96.6,96.6,0,0,1,218.54,160h-53a8,8,0,0,0-7.5,5.19l-21.9,58.47c-2.69.22-5.41.34-8.15.34s-5.5-.12-8.2-.35L97.94,165.2a8,8,0,0,0-7.49-5.2h-53a96.6,96.6,0,0,1-3.86-14.45,128,128,0,0,1,188.8,0Z\" style=\"fill:var(--acc,#2f6df6);opacity:.3\"/><path d=\"M128,152a12,12,0,1,1,12-12A12,12,0,0,1,128,152Zm104-24A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128ZM40,128v.33a135.93,135.93,0,0,1,176,0V128a88,88,0,0,0-176,0Zm67.5,85.58L90.45,168H49.63A88.35,88.35,0,0,0,107.5,213.58ZM128,216c.83,0,1.66,0,2.49,0l20.07-53.57a16.07,16.07,0,0,1,15-10.39h47.12c.38-1.31.72-2.64,1-4a120,120,0,0,0-171.4,0c.31,1.34.65,2.67,1,4H90.45a16.08,16.08,0,0,1,15,10.4l20,53.56C126.31,216,127.15,216,128,216Zm78.37-48H165.55l-17.09,45.59A88.34,88.34,0,0,0,206.37,168Z\"/>", "foco_polimero": "<path d=\"M22,74 C80,40 150,52 196,100 C216,122 222,150 206,176 C172,206 92,214 40,190 C14,160 10,102 22,74 Z\" style=\"fill:var(--acc,#2f6df6);opacity:.22\"/><path d=\"M22,74 C80,40 150,52 196,100 C216,122 222,150 206,176 C172,206 92,214 40,190 C14,160 10,102 22,74 Z\" stroke=\"currentColor\" stroke-width=\"9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"138\" cy=\"104\" r=\"24\" stroke=\"currentColor\" stroke-width=\"9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"138\" cy=\"104\" r=\"6\" fill=\"currentColor\"/><path d=\"M190,114 L194.2,123.8 L204,128 L194.2,132.2 L190,142 L185.8,132.2 L176,128 L185.8,123.8 Z\" fill=\"currentColor\"/><path d=\"M62,138 C52,128 70,120 60,108 C52,98 68,92 60,82\" stroke=\"currentColor\" stroke-width=\"9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M86,132 C78,124 92,116 84,106\" stroke=\"currentColor\" stroke-width=\"9\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M126,194 C106,194 94,176 80,158 L92,150 C106,164 118,170 130,172 Z\" style=\"fill:var(--card,#fff)\"/><path d=\"M126,194 C106,194 94,176 80,158 L92,150 C106,164 118,170 130,172\" stroke=\"currentColor\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M130,180 h64 a10,10 0 0 1 10,10 v30 a16,16 0 0 1-16,16 h-52 a16,16 0 0 1-16-16 v-30 a10,10 0 0 1 10-10 z\" style=\"fill:var(--card,#fff)\"/><path d=\"M118,206 q10,-8 20,0 t20,0 t20,0 t14,0 v14 a16,16 0 0 1-16,16 h-42 a16,16 0 0 1-16-16 z\" style=\"fill:var(--acc,#2f6df6);opacity:.55\"/><path d=\"M130,180 h64 a10,10 0 0 1 10,10 v30 a16,16 0 0 1-16,16 h-52 a16,16 0 0 1-16-16 v-30 a10,10 0 0 1 10-10 z\" stroke=\"currentColor\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M206,196 h6 a14,14 0 0 1 0,28 h-6\" stroke=\"currentColor\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><path d=\"M146,180 v-8 h30 v8\" stroke=\"currentColor\" stroke-width=\"12\" stroke-linecap=\"round\" stroke-linejoin=\"round\" fill=\"none\"/><circle cx=\"161\" cy=\"162\" r=\"6\" fill=\"currentColor\"/>"},
  iconNames: ["img:tijeras","img:navaja","img:poste","img:secador","img:peine","img:tinte","img:esmalte","img:lampara","img:pie","img:gema","img:piedras","img:facial","img:loto","img:estetoscopio","img:clipboard","img:calendario","img:aceite","img:frenos","img:diagnostico","img:gotaseca","img:crema","img:rayones_real","img:foco_polimero_real","img:parabrisas_real","i:foco_polimero","img:parabrisas_pulido","img:parabrisas_brillo","img:pulidora_azul","img:parabrisas_pulidora","img:foco_pulidora","img:brillo_final","i:parabrisas","i:foco","i:foco_brillo","i:ventana","i:gota","i:rayon","i:pulido","img:lavados","img:tapiceria","img:vidrios","img:ceramico","img:ppf","img:polarizado","img:pulidora","img:accesorios","img:suv4x4","i:lavado","i:tapiceria","i:vidrio","i:ceramico","i:ppf","i:polarizado","i:ruedas","i:suv","i:brillo","i:llave","i:asiento","i:volante"],
  imgIcons: ["tijeras","navaja","poste","secador","peine","tinte","esmalte","lampara","pie","gema","piedras","facial","loto","estetoscopio","clipboard","calendario","aceite","frenos","diagnostico","gotaseca","crema","rayones_real","parabrisas_real","foco_polimero_real","parabrisas_pulido","parabrisas_brillo","pulidora_azul","parabrisas_pulidora","foco_pulidora","brillo_final","lavados","tapiceria","vidrios","ceramico","ppf","polarizado","pulidora","accesorios","suv4x4"],
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
  // Link de video (YouTube, TikTok, Instagram, Facebook) → datos para incrustarlo. Solo se arma con IDs validados; null si no se reconoce.
  vid: function (u) {
    u = String(u || "").trim();
    if (!/^https?:\/\//i.test(u)) u = /^[\w-]+(\.[\w-]+)+\//.test(u) ? "https://" + u : "";
    var x, m, h, p;
    try { x = new URL(u); } catch (e) { return null; }
    h = x.hostname.toLowerCase().replace(/^(www|m|web|mbasic)\./, ""); p = x.pathname;
    var yt = function (id, v) { return { k: "yt", id: id, src: "https://www.youtube-nocookie.com/embed/" + id, r: v ? "9/16" : "16/9", v: !!v }; };
    if (h === "youtu.be") { m = p.match(/^\/([\w-]{11})(\/|$)/); return m ? yt(m[1]) : null; }
    if (h === "youtube.com" || h === "music.youtube.com") {
      if ((m = p.match(/^\/shorts\/([\w-]{11})(\/|$)/))) return yt(m[1], 1);
      if ((m = p.match(/^\/(embed|live)\/([\w-]{11})(\/|$)/))) return yt(m[2]);
      m = x.searchParams.get("v"); return m && /^[\w-]{11}$/.test(m) ? yt(m) : null;
    }
    if (h === "tiktok.com") { m = p.match(/\/video\/(\d{8,25})(\/|$)/) || p.match(/^\/v\/(\d{8,25})\.html$/); return m ? { k: "tt", id: m[1], src: "https://www.tiktok.com/embed/v2/" + m[1], r: "9/16", v: true } : null; }
    if (h === "instagram.com") { m = p.match(/\/(reel|p|tv)\/([\w-]{5,20})(\/|$)/); return m ? { k: "ig", id: m[2], src: "https://www.instagram.com/" + m[1] + "/" + m[2] + "/embed/", r: "9/17", v: true } : null; }
    if (h === "facebook.com" || h === "fb.com") {
      var id = (m = p.match(/\/reel\/(\d{6,25})(\/|$)/)) ? m[1] : (m = p.match(/\/videos\/(\d{6,25})(\/|$)/)) ? m[1] : /^\/watch\/?$/.test(p) && /^\d{6,25}$/.test(x.searchParams.get("v") || "") ? x.searchParams.get("v") : null;
      if (!id) return null;
      var rl = /\/reel\//.test(p);
      return { k: "fb", id: id, src: "https://www.facebook.com/plugins/video.php?href=" + encodeURIComponent("https://www.facebook.com/" + (rl ? "reel/" + id : "watch/?v=" + id)) + "&show_text=false", r: rl ? "9/16" : "16/9", v: rl };
    }
    return null;
  },
  // ¿Es un link corto (el que da el botón Compartir) que no se puede incrustar?
  vidShort: function (u) { return /^(https?:\/\/)?(vm\.tiktok\.com|vt\.tiktok\.com|fb\.watch|on\.fb\.me|l\.facebook\.com|(www\.)?instagram\.com\/share\/|(www\.)?facebook\.com\/share\/|(www\.)?tiktok\.com\/t\/)/i.test(String(u || "").trim()); },
  coverOf: function (type, cover, w) {
    if (cover === "none") return "";
    if (typeof cover === "string" && cover.indexOf("data:image/") === 0) return CITALY.safeImg(cover);
    var all = [].concat.apply([], Object.keys(this.covers).map(function (k) { return this.covers[k]; }, this));
    if (cover && all.indexOf(cover) >= 0) return this.coverUrl(cover, w);
    return this.coverUrl((this.covers[type] || this.covers.otro)[0], w);
  }
};

/* ===== Selector de iconos por grupos (compartido: admin y app) ===== */
(function (C) {
  var CAR = ["lav", "vid", "tal"];
  C.iconGroups = [
    { id: "lav", n: "Lavado y detailing", ic: ["lavados", "tapiceria", "suv4x4", "brillo_final", "ceramico", "ppf", "polarizado", "accesorios", "pulidora", "pulidora_azul", "gotaseca"] },
    { id: "vid", n: "Vidrios y focos", ic: ["foco_polimero_real", "foco_pulidora", "parabrisas_real", "parabrisas_pulido", "parabrisas_brillo", "parabrisas_pulidora", "rayones_real", "gotaseca", "vidrios", "polarizado", "pulidora", "pulidora_azul", "brillo_final"] },
    { id: "tal", n: "Taller", ic: ["diagnostico", "aceite", "frenos", "accesorios"] },
    { id: "bar", n: "Barber\u00eda", ic: ["tijeras", "navaja", "poste", "peine"] },
    { id: "sal", n: "Sal\u00f3n", ic: ["secador", "tinte", "peine", "crema", "tijeras"] },
    { id: "uni", n: "U\u00f1as", ic: ["esmalte", "pie", "gema", "lampara"] },
    { id: "spa", n: "Spa", ic: ["piedras", "facial", "loto", "crema"] },
    { id: "sld", n: "Salud", ic: ["estetoscopio", "clipboard"] },
    { id: "gen", n: "General", ic: ["calendario", "clipboard", "gema"] }
  ];
  C.iconTypeGroups = {
    barberia: ["bar", "gen"], salon: ["sal", "gen"], unas: ["uni", "gen"], spa: ["spa", "gen"], salud: ["sld", "gen"],
    lavacar: ["lav", "vid", "tal", "gen"], detailing: ["lav", "vid", "tal", "gen"], pulido: ["vid", "lav", "tal", "gen"],
    polarizado: ["lav", "vid", "tal", "gen"], autos: ["lav", "vid", "tal", "gen"], taller: ["tal", "lav", "vid", "gen"]
  };
  C.iconKw = {
    tijeras: "tijera corte cabello barberia salon", navaja: "navaja afeitar barba", poste: "barbero poste barberia", peine: "peine cepillo cabello peinado",
    secador: "secador pelo secado cabello", tinte: "tinte color cabello", crema: "crema tratamiento facial hidratante", esmalte: "esmalte u\u00f1as manicure",
    pie: "pie pedicure", gema: "gema diamante acrilicas joya", lampara: "lampara uv semipermanente u\u00f1as", piedras: "piedras masaje spa relajante",
    facial: "facial limpieza mascarilla cara", loto: "loto flor spa relajacion", estetoscopio: "estetoscopio consulta medico doctor salud",
    clipboard: "lista control chequeo revision formulario", calendario: "cita calendario agenda reserva", aceite: "aceite cambio motor lata",
    frenos: "frenos disco revision", diagnostico: "diagnostico scanner motor engranaje revision", gotaseca: "gota seca agua manchas vidrio",
    crema_: "", rayones_real: "rayones rayas vidrio pulido", foco_polimero_real: "foco faro polimero liquido pulido luz",
    foco_pulidora: "foco faro pulidora pulido", parabrisas_real: "parabrisas vidrio pulido", parabrisas_pulido: "parabrisas vidrio pulido",
    parabrisas_brillo: "parabrisas vidrio brillo", parabrisas_pulidora: "parabrisas pulidora vidrio", pulidora_azul: "pulidora maquina pulir",
    pulidora: "pulidora maquina pulir correccion pintura", brillo_final: "brillo final encerado cera", lavados: "lavado lavacar carro agua",
    tapiceria: "tapiceria interior asientos limpieza", vidrios: "vidrios parabrisas ventana", ceramico: "ceramico proteccion nano escudo",
    ppf: "ppf proteccion pintura pelicula", polarizado: "polarizado lamina vidrios", accesorios: "accesorios ruedas aros llantas", suv4x4: "suv 4x4 chasis carro"
  };
  C.pickHtml = function (type, cur) {
    var gs = C.iconTypeGroups[type], byId = {}, rec = [], used = {};
    C.iconGroups.forEach(function (g) { byId[g.id] = g; });
    var ids = gs || ["gen"].concat(C.iconGroups.map(function (g) { return g.id; }).filter(function (i) { return i !== "gen"; }));
    try { rec = JSON.parse(localStorage.getItem("cz_ric") || "[]").filter(function (n) { return /^img:/.test(n); }).slice(0, 8); } catch (e) {}
    var all = [];
    ids.concat(C.iconGroups.map(function (g) { return g.id; })).forEach(function (i) { (byId[i] ? byId[i].ic : []).forEach(function (n) { if (all.indexOf(n) < 0) all.push(n); }); });
    var first = ids[0];
    var tabs = (rec.length ? ['<button type="button" class="ipt" data-ipt="rec">\ud83d\udd58 Recientes</button>'] : [])
      .concat(ids.map(function (i) { return '<button type="button" class="ipt" data-ipt="' + i + '">' + byId[i].n + '</button>'; }))
      .concat(['<button type="button" class="ipt" data-ipt="*">Ver todos</button>']).join("");
    var btns = all.map(function (n) {
      var gl = C.iconGroups.filter(function (g) { return g.ic.indexOf(n) >= 0; }).map(function (g) { return g.id; }).join(" ");
      var cls = (rec.indexOf("img:" + n) >= 0 ? " rec" : "");
      return '<button type="button" class="ipb" data-ic="img:' + n + '" data-g="' + gl + (cls ? " rec" : "") + '" data-kw="' + (n + " " + (C.iconKw[n] || "")).replace(/"/g, "") + '" aria-pressed="' + (cur === "img:" + n) + '">' + C.ico("img:" + n) + '</button>';
    }).join("");
    var curExtra = /^i:/.test(String(cur || "")) ? '<button type="button" class="ipb ipcur" data-ic="' + cur + '" aria-pressed="true" title="Actual">' + C.ico(cur) + '</button>' : "";
    return '<div class="ipk" data-first="' + (rec.length ? "rec" : first) + '"><input type="search" class="ipq" placeholder="\ud83d\udd0d Buscar \u00edcono: foco, tijera, lavado\u2026" autocomplete="off" aria-label="Buscar \u00edcono"><div class="ipts">' + tabs + '</div><div class="ipg">' + curExtra + btns + '</div><p class="ipn mute small" hidden>No encontr\u00e9 ese \u00edcono. Prueba otra palabra o toca \u00abVer todos\u00bb.</p></div>';
  };
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function apply(k) {
    var t = k.querySelector(".ipt.on"), tab = t ? t.dataset.ipt : "*", q = k.querySelector(".ipq").value.trim(), n = 0, g = k.querySelector(".ipg"), bs = [].slice.call(k.querySelectorAll(".ipb")), sc = {};
    bs.forEach(function (b, i) {
      if (b.dataset.o == null) b.dataset.o = i;
      var s = b.classList.contains("ipcur") ? 9 : q ? C.fz(q, b.dataset.kw) : ((tab === "*" || (" " + b.dataset.g + " ").indexOf(" " + tab + " ") >= 0) ? 1 : 0);
      sc[i] = s; b.hidden = !s; if (s) n++;
    });
    bs.map(function (b, i) { return [b, q ? sc[i] : 0, +b.dataset.o]; }).sort(function (x, y) { return y[1] - x[1] || x[2] - y[2]; }).forEach(function (x) { g.appendChild(x[0]); });
    var p = k.querySelector(".ipn"); if (p) p.hidden = n > 0 || !q;
  }
  function init(k) {
    if (k.dataset.ready) return; k.dataset.ready = 1;
    var f = k.querySelector('.ipt[data-ipt="' + k.dataset.first + '"]') || k.querySelector(".ipt");
    if (f) f.classList.add("on"); apply(k);
  }
  if (typeof document !== "undefined") {
    var st = document.createElement("style");
    st.textContent = ".ipk{display:block}.ipq{width:100%;margin:0 0 8px;padding:10px 12px;border-radius:12px}.ipts{display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none}.ipts::-webkit-scrollbar{display:none}.ipt{flex:none;border:1.5px solid rgba(128,128,150,.35);background:transparent;color:inherit;border-radius:99px;padding:7px 12px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}.ipt.on{background:#7c5cff;border-color:#7c5cff;color:#fff}.ipg{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}.ipb{aspect-ratio:1;min-height:48px;border-radius:12px;border:2px solid transparent;background:rgba(128,128,150,.12);display:grid;place-items:center;padding:5px;cursor:pointer;color:inherit}.ipb[hidden]{display:none}.ipb[aria-pressed=true]{border-color:#7c5cff}.ipb .ico-img,.ipb .ics{width:100%;height:100%;object-fit:contain}.ipn{margin:8px 0 0}";
    document.head.appendChild(st);
    var run = function () { document.querySelectorAll(".ipk:not([data-ready])").forEach(init); };
    new MutationObserver(run).observe(document.documentElement, { childList: true, subtree: true });
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(".ipt");
      if (t) { var k = t.closest(".ipk"); k.querySelector(".ipq").value = ""; k.querySelectorAll(".ipt").forEach(function (x) { x.classList.remove("on"); }); t.classList.add("on"); apply(k); return; }
      var b = e.target.closest && e.target.closest(".ipk .ipb");
      if (b) { try { var r = JSON.parse(localStorage.getItem("cz_ric") || "[]").filter(function (x) { return x !== b.dataset.ic; }); r.unshift(b.dataset.ic); localStorage.setItem("cz_ric", JSON.stringify(r.slice(0, 8))); } catch (x) {} }
    }, true);
    document.addEventListener("input", function (e) { var q = e.target.closest && e.target.closest(".ipq"); if (q) apply(q.closest(".ipk")); });
  }
})(CITALY);

/* ===== Buscador inteligente (sinonimos + errores de tipeo) - compartido ===== */
(function (C) {
  var G = [
    "foco focos faro faros farol luz luces luminaria lampara headlight",
    "parabrisas vidrio vidrios cristal cristales ventana ventanas luna windshield medallon",
    "pulir pulido pulidos pulida lustrar lustre abrillantar brillo brillar polish restaurar restauracion",
    "lavar lavado lavados lavacar aseo limpieza limpiar wash",
    "detailing detallado detalle detallar estetica",
    "tapiceria asientos interior cuero tapizado",
    "ceramico ceramica nano proteccion sellador coating",
    "polarizado polarizar tintado tinte laminas lamina film",
    "rayon rayones raya rayas arana aranazo aranazos scratch",
    "gota seca manchas sarro calcareo",
    "cita citas reserva reservas agenda turno turnos appointment evento",
    "cliente clientes contacto contactos persona comprador",
    "precio precios costo costos tarifa tarifas cobro cobrar valor cuanto",
    "horario horarios hora horas abrir cerrar dias atencion",
    "pago pagos sinpe deposito adelanto transferencia cobrado",
    "gasto gastos egreso egresos compra insumo insumos",
    "ganancia ganancias ingreso ingresos dinero plata utilidad ventas venta",
    "foto fotos imagen imagenes galeria fotografia",
    "whatsapp wasap wsp mensaje mensajes chat",
    "resena resenas opinion opiniones estrellas calificacion review",
    "recordatorio recordatorios aviso avisos alerta notificacion notificaciones",
    "barba barberia navaja afeitar",
    "pelo cabello corte cortar peluqueria peinado",
    "unas manicure pedicure esmalte gel acrilicas",
    "masaje masajes spa relajante relajacion",
    "taller mecanica mecanico reparacion motor",
    "aceite lubricante",
    "frenos freno pastillas disco",
    "carro auto vehiculo coche automovil pickup suv sedan",
    "negocio empresa local comercio",
    "correo email mail",
    "configuracion ajustes opciones preferencias settings",
    "modo tema oscuro claro noche apariencia",
    "link enlace url pagina web sitio",
    "telefono tel celular numero movil llamar"
  ];
  var M = {};
  G.forEach(function (g, i) { g.split(" ").forEach(function (w) { (M[w] = M[w] || []).push(i); }); });
  function norm(s) { return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); }
  function toks(s) { return norm(s).split(/[^a-z0-9]+/).filter(Boolean); }
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var p = [], i, j, c, t, min;
    for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) {
      var prev = p[0]; p[0] = i; min = p[0];
      for (j = 1; j <= b.length; j++) {
        t = p[j]; c = a[i - 1] === b[j - 1] ? 0 : 1;
        p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + c); prev = t; if (p[j] < min) min = p[j];
      }
      if (min > max) return max + 1;
    }
    return p[b.length];
  }
  function variants(w) {
    var v = [w], st = w.length > 4 ? w.replace(/(es|s)$/, "") : w;
    [w, st].forEach(function (x) { (M[x] || []).forEach(function (i) { G[i].split(" ").forEach(function (y) { if (v.indexOf(y) < 0) v.push(y); }); }); });
    if (st !== w && v.indexOf(st) < 0) v.push(st);
    return v;
  }
  /* devuelve 0 si no coincide; mayor numero = mejor coincidencia */
  C.fz = function (q, hay) {
    var qt = toks(q); if (!qt.length) return 1;
    var ht = toks(hay), total = 0;
    for (var a = 0; a < qt.length; a++) {
      var best = 0, vs = variants(qt[a]);
      for (var k = 0; k < vs.length; k++) {
        var v = vs[k], f = k === 0 ? 1 : 0.8;
        for (var b = 0; b < ht.length; b++) {
          var t = ht[b], s = 0;
          if (t === v) s = 3;
          else if (v.length >= 2 && t.indexOf(v) === 0) s = 2.5;
          else if (v.length >= 3 && t.indexOf(v) > 0) s = 2;
          else if (t.length >= 4 && v.indexOf(t) === 0) s = 1.5;
          else if (!/\d/.test(v) && v.length >= 4 && lev(v, t, v.length >= 7 ? 2 : 1) <= (v.length >= 7 ? 2 : 1)) s = 1;
          s *= f; if (s > best) best = s;
        }
      }
      if (!best) return 0; total += best;
    }
    return total;
  };
  /* ===== Paletas de marca: colores del logo (y fotos) -> 3 propuestas ===== */
  function hx(r, g, b) { return "#" + [r, g, b].map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return ("0" + v.toString(16)).slice(-2); }).join(""); }
  function rgbOf(h) { var m = /^#([0-9a-f]{6})$/i.exec(String(h || "")); if (!m) return null; var n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function hslOf(r, g, b) { r /= 255; g /= 255; b /= 255; var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0; if (d) { s = d / (1 - Math.abs(2 * l - 1)); if (mx === r) h = ((g - b) / d + 6) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function fromHsl(h, s, l) { h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r = 0, g = 0, b = 0; if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; } else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; } else if (h < 300) { r = x; b = c; } else { r = c; b = x; } return hx((r + m) * 255, (g + m) * 255, (b + m) * 255); }
  function tweak(h, dh, ds, dl) { var c = rgbOf(h); if (!c) return h; var t = hslOf(c[0], c[1], c[2]); return fromHsl(t[0] + dh, t[1] * ds, t[2] + dl); }
  function hueGap(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
  /* px: lista de {d: array RGBA, w: peso, logo: bool}. Devuelve {ok, neutral, props:[{n,a,h,bg,pm}]} */
  C.paletasPx = function (srcs) {
    var B = [], i, k, n = 24, dark = 0, tot = 0;
    for (i = 0; i < n; i++) B.push({ w: 0, r: 0, g: 0, b: 0, ms: 0 });
    (srcs || []).forEach(function (s) {
      var d = s.d, w = s.w || 1;
      for (k = 0; k + 3 < d.length; k += 4) {
        if (d[k + 3] <= 128) continue;
        var t = hslOf(d[k], d[k + 1], d[k + 2]);
        if (s.logo) { tot++; if (t[2] < .5) dark++; }
        if (t[1] < .18 || t[2] < .12 || t[2] > .92) continue;
        var q = Math.floor(t[0] / (360 / n)) % n, wt = t[1] * w;
        if (t[1] > B[q].ms) B[q].ms = t[1]; B[q].w += wt; B[q].r += d[k] * wt; B[q].g += d[k + 1] * wt; B[q].b += d[k + 2] * wt;
      }
    });
    var pm = tot ? (dark / tot > .5 ? "dark" : "light") : "dark";
    var list = B.filter(function (b) { return b.w > 0; }).map(function (b) { var c = hx(b.r / b.w, b.g / b.w, b.b / b.w), r = rgbOf(c), t = hslOf(r[0], r[1], r[2]);
      /* el promedio apaga los colores: si el logo tiene ese color vivo, se devuelve vivo */
      if (b.ms > .55) { t[1] = Math.max(t[1], Math.min(.95, b.ms * .92)); t[2] = Math.max(.42, Math.min(.6, t[2])); c = fromHsl(t[0], t[1], t[2]); }
      return { w: b.w, c: c, h: t[0], s: t[1], l: t[2] }; }).sort(function (x, y) { return y.w - x.w; });
    var sum = list.reduce(function (a, b) { return a + b.w; }, 0), cols = [];
    list.forEach(function (c) { if (cols.length >= 4 || c.w < sum * .03) return; for (var j = 0; j < cols.length; j++) if (hueGap(cols[j].h, c.h) < 40) return; cols.push(c); });
    var out = [], neutral = !cols.length;
    if (neutral) {
      out = [{ n: "Negro y dorado", a: "#d4a84b", h: "#f2dfa6", bg: "#1a1710", pm: "dark" }, { n: "Negro y azul", a: "#3b82f6", h: "#93c5fd", bg: "#0f172a", pm: "dark" }, { n: "Claro y sobrio", a: "#1f2937", h: "#b8892b", bg: "#e5e7eb", pm: "light" }];
    } else {
      var c1 = cols[0].c, c2 = cols[1] ? cols[1].c : tweak(c1, 35, 1, .12);
      var lightest = cols.slice().sort(function (x, y) { return y.l - x.l; })[0];
      var gold = lightest.l > .6 && cols.length > 1 ? lightest.c : "#d9b45a";
      out = [
        { n: "Fiel a tu logo", a: c1, h: c2, bg: tweak(c1, 0, 1, -.22), pm: pm },
        { n: "Contraste", a: c2, h: c1, bg: tweak(c2, 0, 1, -.22), pm: pm },
        { n: "Elegante", a: tweak(c1, 0, .6, -.1), h: gold, bg: tweak(c1, 0, .5, -.25), pm: "dark" }
      ];
    }
    /* limpia: hex valido, bg oscuro, sin propuestas repetidas */
    var seen = {};
    out = out.map(function (o, j) {
      var a = /^#[0-9a-f]{6}$/i.test(o.a) ? o.a.toLowerCase() : "#6c4cf5", h = /^#[0-9a-f]{6}$/i.test(o.h) ? o.h.toLowerCase() : "#d9b45a", bg = /^#[0-9a-f]{6}$/i.test(o.bg) ? o.bg.toLowerCase() : "";
      if (h === a) h = tweak(a, 40, 1, .15);
      var key = a + h + o.pm;
      if (seen[key]) { a = tweak(a, 20 * j, 1, .06 * j); key = a + h + o.pm; }
      seen[key] = 1;
      return { n: o.n, a: a, h: h, bg: bg, pm: o.pm === "light" ? "light" : "dark" };
    });
    return { ok: true, neutral: neutral, props: out };
  };
  /* urls: [logo, foto1, foto2, foto3]; cb({ok, neutral, props, msg}) */
  C.paletas = function (urls, cb) {
    var list = (urls || []).filter(function (u) { return typeof u === "string" && /^(data:image\/|https:\/\/)/.test(u); }).slice(0, 4), res = [], left = list.length, done = false;
    function fin() {
      if (done) return; done = true;
      var got = res.filter(Boolean);
      if (!got.length) return cb({ ok: false, props: [], msg: "No pudimos leer la imagen. Elige los colores a mano." });
      try { var r = C.paletasPx(got); if (r.neutral) r.msg = "Tu logo casi no tiene colores. Te proponemos paletas elegantes."; cb(r); }
      catch (e) { cb({ ok: false, props: [], msg: "No pudimos sacar los colores. Elígelos a mano." }); }
    }
    if (!left) return cb({ ok: false, props: [], msg: "Sube tu logo primero." });
    list.forEach(function (u, i) {
      var im = new Image();
      im.onload = function () {
        try {
          var cv = document.createElement("canvas"); cv.width = 96; cv.height = 96;
          var cx = cv.getContext("2d"), sc = Math.min(96 / im.width, 96 / im.height), w = im.width * sc, h = im.height * sc;
          cx.drawImage(im, (96 - w) / 2, (96 - h) / 2, w, h);
          res[i] = { d: cx.getImageData(0, 0, 96, 96).data, w: i ? .35 : 1, logo: !i };
        } catch (e) { res[i] = null; }
        if (--left === 0) fin();
      };
      im.onerror = function () { res[i] = null; if (--left === 0) fin(); };
      if (/^https:/.test(u)) im.crossOrigin = "anonymous";
      im.src = u;
    });
    setTimeout(fin, 8000);
  };
})(CITALY);

/* ===== Precio final por tipo de vehiculo (por servicio) ===== */
/* s.vp = [{n: nombreVehiculo, p: precioFinal}, ...] (objetos: Firestore no guarda arreglos dentro de arreglos). Si un tipo no tiene precio propio: precio base + extra del tipo. */
(function (C) {
  function e(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function own(s, n) { var r = 0; (s && s.vp || []).forEach(function (x) { if (x && x.n === n && +x.p > 0) r = +x.p; }); return r; }
  C.vprice = function (s, v) {
    var b = +(s && s.p) || 0;
    if (!s || !s.vx || !v) return b;
    return own(s, v.n) || (b + (+v.x || 0));
  };
  C.vrange = function (s, vehs) {
    var b = +(s && s.p) || 0;
    if (!s || !s.vx || !(vehs || []).length) return [b, b];
    var a = vehs.map(function (v) { return C.vprice(s, v); });
    return [Math.min.apply(null, a), Math.max.apply(null, a)];
  };
  C.vpHtml = function (s, i, vehs) {
    if (!s.vx || !(vehs || []).length) return "";
    var b = +s.p || 0;
    return '<div class="vpg"><p class="vph">🚙 Precio final por tamaño <span>(vacío = precio base' + (vehs.some(function (v) { return +v.x > 0; }) ? " + extra" : "") + ')</span></p>' +
      vehs.map(function (v) {
        var o = own(s, v.n);
        return '<label class="vpl"><span>' + e(v.n) + '</span><input type="number" inputmode="numeric" min="0" data-vpi="' + i + '" data-vpn="' + e(v.n) + '" value="' + (o || "") + '" placeholder="₡' + (b + (+v.x || 0)) + '"></label>';
      }).join("") + '</div>';
  };
  C.vpSet = function (s, n, val) {
    var L = (s.vp || []).filter(function (x) { return x && x.n !== n; });
    if (+val > 0) L.push({ n: n, p: Math.round(+val) });
    s.vp = L;
  };
  C.vpClean = function (s, vehs) {
    if (!s.vx) return null;
    var names = (vehs || []).map(function (v) { return String(v.n).trim(); });
    var L = (s.vp || []).filter(function (x) { return x && names.indexOf(String(x.n).trim()) >= 0 && +x.p > 0; }).map(function (x) { return { n: String(x.n).trim().slice(0, 40), p: Math.round(+x.p) }; });
    return L.length ? L : null;
  };
  if (typeof document !== "undefined") {
    var st = document.createElement("style");
    st.textContent = ".vpg{margin:8px 0 2px;padding:10px;border-radius:12px;background:rgba(124,92,255,.08);display:grid;grid-template-columns:1fr 1fr;gap:8px}.vph{grid-column:1/-1;margin:0;font-size:13px;font-weight:700}.vph span{font-weight:500;opacity:.7}.vpl{display:flex;flex-direction:column;gap:3px;margin:0;font-size:12px;font-weight:600}.vpl span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.vpl input{padding:8px 10px}";
    document.head.appendChild(st);
  }
})(CITALY);


/* ===== Cupos: varios clientes a la misma hora ===== */
/* Cada bloque de 30 min es un doc slots/{dia_HHMM} (cupo 1) o slots/{dia_HHMM_k} (cupos 2, 3...). */
(function (C) {
  C.laneBase = function (id) { return String(id).split("_").slice(0, 2).join("_"); };
  C.lanes = function (b) { var n = Math.round(+(b && b.lanes) || 1); return n < 1 ? 1 : n > 10 ? 10 : n; };
  /* docs: [{id, job}] de los slots; job: id de la cita que se guarda (sus propios slots se reutilizan) */
  C.laneAssign = function (bases, docs, job) {
    var taken = {}, mine = {}, out = [];
    (docs || []).forEach(function (d) { if (job != null && String(d.job) === String(job)) mine[d.id] = 1; else taken[d.id] = 1; });
    bases.forEach(function (b) {
      var own = Object.keys(mine).filter(function (id) { return C.laneBase(id) === b && out.indexOf(id) < 0; })[0];
      if (own) { out.push(own); return; }
      for (var k = 0; k < 50; k++) { var id = k ? b + "_" + k : b; if (!taken[id] && !mine[id] && out.indexOf(id) < 0) { out.push(id); return; } }
    });
    return { ids: out, mine: Object.keys(mine) };
  };
})(CITALY);

/* Solo deja pasar imágenes seguras para src="..." (base64 de imagen, https sin comillas, o rutas del sitio) */
CITALY.safeImg = function (u) {
  u = String(u || "");
  return /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+\/=]+$/.test(u) || /^https:\/\/[^\s"'<>()\\]+$/.test(u) || /^(\.\.\/|\/)[\w\/.-]+$/.test(u) ? u : "";
};
