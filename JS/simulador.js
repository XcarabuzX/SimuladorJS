// Variables base y arrays
const destinos = ["Santiago", "Buenos Aires", "Lima"];
const costoDiarioBase = 25000; // CLP
const alojamientoOpciones = ["Hostel", "Hotel", "Airbnb"];
const costoAlojamiento = [15000, 30000, 20000];

// Función para ingresar destino
function seleccionarDestino() {
  let destino = prompt(`¿A qué destino deseas viajar?\nOpciones: ${destinos.join(", ")}`);
  while (!destinos.includes(destino)) {
    destino = prompt("Destino no válido. Intenta nuevamente:");
  }
  return destino;
}

// Función para calcular el presupuesto
function calcularPresupuesto(destino, dias, alojamiento, incluyeTour) {
  let indiceAlojamiento = alojamientoOpciones.indexOf(alojamiento);
  let costoAloj = costoAlojamiento[indiceAlojamiento] * dias;
  let costoBase = costoDiarioBase * dias;
  let costoTour = incluyeTour ? dias * 5000 : 0;

  let total = costoBase + costoAloj + costoTour;

  console.log("🧾 RESUMEN DE PRESUPUESTO");
  console.log(`Destino: ${destino}`);
  console.log(`Días: ${dias}`);
  console.log(`Alojamiento: ${alojamiento} ($${costoAloj})`);
  console.log(`Tour incluido: ${incluyeTour ? "Sí" : "No"} ($${costoTour})`);
  console.log(`Costo Total: $${total.toLocaleString("es-CL")}`);

  alert(
    `Resumen de tu viaje a ${destino}:\n` +
    `Días: ${dias}\n` +
    `Alojamiento: ${alojamiento}\n` +
    `Incluye tour: ${incluyeTour ? "Sí" : "No"}\n\n` +
    `Costo total estimado: $${total.toLocaleString("es-CL")}`
  );
}

// Función principal
function iniciarSimulador() {
  alert("¡Bienvenido al Simulador de Presupuesto de Viaje!");

  const destino = seleccionarDestino();
  const dias = parseInt(prompt("¿Cuántos días piensas viajar?"), 10);

  let alojamiento = prompt(`¿Qué tipo de alojamiento prefieres?\nOpciones: ${alojamientoOpciones.join(", ")}`);
  while (!alojamientoOpciones.includes(alojamiento)) {
    alojamiento = prompt("Opción no válida. Intenta nuevamente:");
  }

  const deseaTour = confirm("¿Deseas incluir actividades turísticas? (Costo extra diario)");

  calcularPresupuesto(destino, dias, alojamiento, deseaTour);
}

// Llamar al simulador
iniciarSimulador();