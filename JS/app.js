// Variables base y arrays
const destinos = ["Santiago", "Buenos Aires", "Lima"];
const costoDiarioBase = 25000; // CLP
const alojamientoOpciones = ["Hostel", "Hotel", "Airbnb"];
const costoAlojamiento = [15000, 30000, 20000];


// Función para calcular el presupuesto
function calcularPresupuesto(destino, dias, alojamiento, incluyeTour) {
  let indiceAlojamiento = alojamientoOpciones.indexOf(alojamiento);
  let costoAloj = costoAlojamiento[indiceAlojamiento] * dias;
  let costoBase = costoDiarioBase * dias;
  let costoTour = incluyeTour ? dias * 5000 : 0;

  let total = costoBase + costoAloj + costoTour;

  // Crear resumen en el DOM
  let resumenDiv = document.getElementById("resumen-presupuesto");
  if (!resumenDiv) {
    resumenDiv = document.createElement("div");
    resumenDiv.id = "resumen-presupuesto";
    document.body.appendChild(resumenDiv);
  }
  resumenDiv.innerHTML = `
    <h3>🧾 RESUMEN DE PRESUPUESTO</h3>
    <ul>
      <li><strong>Destino:</strong> ${destino}</li>
      <li><strong>Días:</strong> ${dias}</li>
      <li><strong>Alojamiento:</strong> ${alojamiento} ($${costoAloj})</li>
      <li><strong>Tour incluido:</strong> ${incluyeTour ? "Sí" : "No"} ($${costoTour})</li>
      <li><strong>Costo Total:</strong> $${total.toLocaleString("es-CL")}</li>
    </ul>
  `;

  // Guardar simulación en localStorage
  let viajes = [];
  try {
    viajes = JSON.parse(localStorage.getItem("viajes")) || [];
  } catch (e) {
    viajes = [];
  }
  viajes.push({
    destino,
    dias,
    alojamiento,
    incluyeTour,
    costoAloj,
    costoTour,
    costoTotal: total
  });
  localStorage.setItem("viajes", JSON.stringify(viajes));
}

// Crear interfaz en el DOM
function crearInterfazDOM() {
  // Crear contenedor principal
  let contenedor = document.createElement("div");
  contenedor.id = "formulario-viaje";
  contenedor.innerHTML = `
    <h2>Simulador de Presupuesto de Viaje</h2>
    <form id="form-simulador">
      <label>
        Destino:
        <select id="input-destino" required>
          <option value="" disabled selected>Selecciona un destino</option>
          ${destinos.map(dest => `<option value="${dest}">${dest}</option>`).join("")}
        </select>
      </label>
      <br>
      <label>
        Días:
        <input type="number" id="input-dias" min="1" required>
      </label>
      <br>
      <label>
        Alojamiento:
        <select id="input-alojamiento" required>
          <option value="" disabled selected>Selecciona alojamiento</option>
          ${alojamientoOpciones.map(alo => `<option value="${alo}">${alo}</option>`).join("")}
        </select>
      </label>
      <br>
      <label>
        <input type="checkbox" id="input-tour">
        Incluir actividades turísticas (Costo extra diario)
      </label>
      <br>
      <button type="submit" id="btn-calcular">Calcular Presupuesto</button>
    </form>
  `;
  return contenedor;
}

function mostrarFormulario() {
  const contenido = document.getElementById("contenido-dinamico");
  if (!contenido) return;
  contenido.innerHTML = "";
  const formulario = crearInterfazDOM();
  contenido.appendChild(formulario);

  formulario.querySelector("#form-simulador").addEventListener("submit", function(e) {
    e.preventDefault();
    const destino = formulario.querySelector("#input-destino").value;
    const dias = parseInt(formulario.querySelector("#input-dias").value, 10);
    const alojamiento = formulario.querySelector("#input-alojamiento").value;
    const incluyeTour = formulario.querySelector("#input-tour").checked;
    calcularPresupuesto(destino, dias, alojamiento, incluyeTour);
  });
}

function mostrarResumen() {
  const contenido = document.getElementById("contenido-dinamico");
  if (!contenido) return;
  contenido.innerHTML = "";

  let viajes = [];
  try {
    viajes = JSON.parse(localStorage.getItem("viajes")) || [];
  } catch (e) {
    viajes = [];
  }

  if (viajes.length === 0) {
    contenido.innerHTML = "<p>No hay viajes guardados.</p>";
    return;
  }

  const lista = document.createElement("ul");
  viajes.forEach((viaje, index) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>Viaje ${index + 1}:</strong> Destino: ${viaje.destino}, Días: ${viaje.dias}, Alojamiento: ${viaje.alojamiento}, Tour incluido: ${viaje.incluyeTour ? "Sí" : "No"}, Costo Total: $${viaje.costoTotal.toLocaleString("es-CL")}
    `;
    lista.appendChild(item);
  });
  contenido.appendChild(lista);
}

window.addEventListener("DOMContentLoaded", function() {
  const btnFormulario = document.getElementById("btn-formulario");
  if (btnFormulario) {
    btnFormulario.addEventListener("click", function() {
      mostrarFormulario();
    });
  }

  const btnResumen = document.getElementById("btn-resumen");
  if (btnResumen) {
    btnResumen.addEventListener("click", function() {
      mostrarResumen();
    });
  }
});


//EJEMPLOS DE SOLICITUDES API:

//Crea una constante con la url base de la api
const urlBase = "https://api.openai.com/v1";

//Crea una constante con la url de la api de chat
const urlChat = `${urlBase}/chat/completions`;

//Crea una constante con la url de la api de imagenes
const urlImagenes = `${urlBase}/images/generations`;

//Crea una constante con la url de la api de audio