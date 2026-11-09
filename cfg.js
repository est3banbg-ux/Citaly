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
  price: 30000,          // mensualidad (hosting, soporte y cambios)
  setup: { std: 150000, pro: 250000 },  // instalación: Standard y PRO
  trialDays: 0,          // ya no hay prueba gratis: el admin crea cada negocio
  sinpe: "7089-2537",    // número SINPE Móvil donde los negocios pagan (confirmar)
  sinpeName: "Esteban",  // a nombre de quién sale el SINPE (confirmar)
  wa: "50670892537",     // WhatsApp de soporte y comprobantes
  colors: ["#6c4cf5", "#0d7a85", "#e0457b", "#1f8a4c", "#e07a20", "#2563eb", "#b3392f", "#1f2937"],
  types: {
    barberia: { n: "Barbería", ic: "💈", svc: [["Corte de cabello", 6000, 30, "✂️"], ["Corte + barba", 8000, 45, "🧔"], ["Barba", 4000, 30, "🪒"], ["Corte de niño", 5000, 30, "👦"]] },
    salon:    { n: "Salón de belleza", ic: "💇‍♀️", svc: [["Corte y secado", 10000, 60, "💇‍♀️"], ["Tinte", 25000, 120, "🎨"], ["Peinado", 12000, 60, "✨"], ["Tratamiento capilar", 15000, 60, "🧴"]] },
    unas:     { n: "Uñas", ic: "💅", svc: [["Manicure", 7000, 45, "💅"], ["Pedicure", 9000, 60, "🦶"], ["Acrílicas", 18000, 120, "💎"], ["Semipermanente", 10000, 60, "✨"]] },
    autos:    { n: "Cuidado de autos", ic: "🚗", svc: [["Lavado completo", 8000, 60, "🧽"], ["Pulido de focos", 20000, 90, "💡"], ["Pulido de parabrisas", 20000, 120, "🛡️"], ["Detailing interior", 35000, 180, "✨"]] },
    taller:   { n: "Taller", ic: "🔧", svc: [["Diagnóstico", 15000, 60, "🔍"], ["Cambio de aceite", 25000, 60, "🛢️"], ["Revisión de frenos", 20000, 90, "🛞"]] },
    spa:      { n: "Spa y masajes", ic: "🧖", svc: [["Masaje relajante", 25000, 60, "💆"], ["Limpieza facial", 22000, 60, "🧖"], ["Masaje descontracturante", 30000, 90, "🙌"]] },
    salud:    { n: "Consultorio", ic: "🩺", svc: [["Consulta", 25000, 30, "🩺"], ["Control", 15000, 30, "📋"]] },
    otro:     { n: "Otro", ic: "📅", svc: [["Cita", 10000, 60, "📅"]] }
  }
};
