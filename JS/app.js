// =======================
// CONFIGURACIÓN Y UTILIDADES
// =======================

// API key para AviationStack
const AVIATIONSTACK_KEY = window.AVIATIONSTACK_KEY;
const AV_BASE = "https://api.aviationstack.com/v1";

// Muestra mensajes de estado en la interfaz
function setEstado(mensaje, tipo = "info") {
  const box = document.getElementById("estado-busqueda");
  if (!box) return;
  const palette = {
    info: "text-gray-700 dark:text-gray-300",
    ok: "text-emerald-600",
    warn: "text-amber-600",
    err: "text-rose-600",
  };
  box.className = `mt-3 text-sm ${palette[tipo] || palette.info}`;
  box.textContent = mensaje;
}

// Retorna el valor o un fallback si es null/undefined
function safe(v, fallback = "—") {
  return v ?? fallback;
}

// =======================
// MODO OSCURO
// =======================
(function bindDarkMode() {
  const btn = document.getElementById("toggle-dark");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const html = document.documentElement;
    html.classList.toggle("dark");
  });
})();

// =======================
// API AVIATIONSTACK
// =======================

// Función genérica para hacer peticiones a la API
async function fetchJSON(url, params = {}) {
  const u = new URL(url);
  // Agrega la API key
  u.searchParams.set("access_key", AVIATIONSTACK_KEY);
  // Agrega los parámetros de la consulta
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, v);
  });

  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  // Verifica si hay errores en la respuesta de la API
  if (data.error) {
    const msg = data.error?.info || JSON.stringify(data.error);
    throw new Error(msg);
  }
  return data;
}

// Obtiene aeropuertos de un país específico
async function getAirportsByCountry(countryIso2, limit = 2) {
  const data = await fetchJSON(`${AV_BASE}/airports`, {
    country_iso2: countryIso2,
    limit: Math.min(Math.max(limit, 1), 5), // Limita entre 1 y 5
  });
  // Solo retorna aeropuertos que tengan código IATA
  const airports = (data?.data || []).filter(a => a?.iata_code);
  return airports;
}

// Obtiene vuelos que parten desde un aeropuerto específico
async function getFlightsByDepartureIATA(depIata, limit = 6) {
  const data = await fetchJSON(`${AV_BASE}/flights`, {
    dep_iata: depIata,
    limit: Math.min(Math.max(limit, 1), 20),
  });
  return data?.data || [];
}

// Función principal: busca vuelos por país
async function buscarVuelosPorPais(countryIso2, airportsCount, flightsPerAirport) {
  setEstado("Buscando aeropuertos del país seleccionado…");
  const airports = await getAirportsByCountry(countryIso2, airportsCount);

  if (!airports.length) {
    setEstado("No se encontraron aeropuertos con IATA en este país.", "warn");
    return [];
  }

  setEstado(`Se encontraron ${airports.length} aeropuerto(s). Buscando vuelos…`);

  const allFlights = [];
  for (const ap of airports) {
    const vuelos = await getFlightsByDepartureIATA(ap.iata_code, flightsPerAirport);
    // Agrega información del aeropuerto a cada vuelo
    vuelos.forEach(v => v.__from_airport = ap);
    allFlights.push(...vuelos);
  }

  setEstado(`Listo. Mostrando ${allFlights.length} vuelo(s).`, "ok");
  return allFlights;
}

// =======================
// INTERFAZ DE USUARIO
// =======================

// Crea y muestra las tarjetas de vuelos en la grilla
function renderVuelosCards(vuelos) {
  const grid = document.getElementById("grid-vuelos");
  if (!grid) return;

  grid.innerHTML = "";

  if (!vuelos.length) {
    grid.innerHTML = `<div class="col-span-full text-gray-600 dark:text-gray-400">Sin resultados.</div>`;
    return;
  }

  for (const f of vuelos) {
    // Extrae la información del vuelo
    const st = f.flight_status; // scheduled, active, landed, cancelled…
    const airline = safe(f?.airline?.name);
    const flightCode = safe(f?.flight?.iata || f?.flight?.icao);
    const dep = f?.departure || {};
    const arr = f?.arrival || {};

    const fromAp = f.__from_airport;
    const depCity = safe(dep?.city || fromAp?.city || fromAp?.airport_name);
    const depIata = safe(dep?.iata || fromAp?.iata_code);
    const depTime = safe(dep?.scheduled || dep?.estimated);

    const arrCity = safe(arr?.city);
    const arrIata = safe(arr?.iata);
    const arrTime = safe(arr?.scheduled || arr?.estimated);

    // Color del estado del vuelo
    const statusColor =
      st === "active" ? "bg-emerald-600" :
      st === "landed" ? "bg-sky-600" :
      st === "cancelled" ? "bg-rose-600" :
      st === "diverted" ? "bg-amber-600" :
      "bg-gray-600";

    const card = document.createElement("article");
    card.className =
      "rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3";

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600 dark:text-gray-400">${airline}</div>
        <span class="text-xs px-2 py-1 rounded text-white ${statusColor}">${safe(st).toUpperCase()}</span>
      </div>

      <div class="text-2xl font-bold">${flightCode}</div>

      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div class="text-gray-500 dark:text-gray-400">Salida</div>
          <div class="font-medium">${depCity} (${depIata})</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">${depTime}</div>
        </div>
        <div>
          <div class="text-gray-500 dark:text-gray-400">Llegada</div>
          <div class="font-medium">${arrCity} ${arrIata ? `(${arrIata})` : ""}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">${arrTime}</div>
        </div>
      </div>

      ${
        fromAp
          ? `<div class="text-xs text-gray-500 dark:text-gray-400">Aeropuerto origen: ${safe(fromAp?.airport_name)} (${safe(fromAp?.iata_code)})</div>`
          : ""
      }
    `;
    grid.appendChild(card);
  }
}

// =======================
// FORMULARIO DE BÚSQUEDA
// =======================

// Configura el formulario de búsqueda de vuelos
function bindFormularioVuelos() {
  const form = document.getElementById("form-vuelos");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!AVIATIONSTACK_KEY) {
      setEstado("Falta configurar tu API key (VITE_AVIATIONSTACK_KEY o window.AVIATIONSTACK_KEY).", "err");
      return;
    }

    const pais = document.getElementById("select-pais").value;
    const aeropuertos = parseInt(document.getElementById("input-aeropuertos").value, 10) || 2;
    const limite = parseInt(document.getElementById("input-limit").value, 10) || 6;

    // Muestra un indicador de carga
    const grid = document.getElementById("grid-vuelos");
    grid.innerHTML = `
      <div class="col-span-full">
        <div class="animate-pulse h-24 rounded bg-gray-200 dark:bg-gray-800"></div>
      </div>
    `;

    try {
      const vuelos = await buscarVuelosPorPais(pais, aeropuertos, limite);
      renderVuelosCards(vuelos);
    } catch (err) {
      console.error(err);
      setEstado(`Error al obtener datos: ${err.message}`, "err");
      grid.innerHTML = "";
    }
  });
}

// =======================
// INICIALIZACIÓN
// =======================
window.addEventListener("DOMContentLoaded", function() {
  // Configura el formulario de vuelos
  bindFormularioVuelos();
});