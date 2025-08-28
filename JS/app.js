// =======================
// CONFIGURACIÓN Y UTILIDADES
// =======================

// Lista de países disponibles en AviationStack
const COUNTRIES = [
  { iso2: "CL", name: "Chile" },
  { iso2: "AR", name: "Argentina" },
  { iso2: "PE", name: "Perú" },
  { iso2: "CO", name: "Colombia" },
  { iso2: "BR", name: "Brasil" },
  { iso2: "MX", name: "México" },
  { iso2: "US", name: "Estados Unidos" },
  { iso2: "ES", name: "España" },
  { iso2: "FR", name: "Francia" },
  { iso2: "GB", name: "Reino Unido" },
];

// Rellena el select de países dinámicamente
function populateCountries() {
  const sel = document.getElementById("select-pais");
  if (!sel) return;
  
  // Limpia opciones existentes
  sel.innerHTML = "";
  
  // Agrega placeholder
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = "Selecciona un país";
  sel.appendChild(placeholder);

  // Agrega países
  for (const c of COUNTRIES) {
    const opt = document.createElement("option");
    opt.value = c.iso2;
    opt.textContent = c.name;
    sel.appendChild(opt);
  }
}

// API key para AviationStack
const AVIATIONSTACK_KEY = window.AVIATIONSTACK_KEY;
const AV_BASE = "https://api.aviationstack.com/v1";

// Muestra mensajes de estado en la interfaz //Cambiar nombre de funcion a setMensaje
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

// Función para cambiar el tema
function toggleDarkMode() {
  const html = document.documentElement;
  const isDark = html.classList.contains("dark");
  
  if (isDark) {
    html.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    html.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
  
  // Actualiza el texto del botón
  updateDarkModeButton();
}

// Función para actualizar el texto del botón
function updateDarkModeButton() {
  const btn = document.getElementById("toggle-dark");
  if (!btn) return;
  
  const isDark = document.documentElement.classList.contains("dark");
  btn.textContent = isDark ? "☀️ Modo claro" : "🌙 Modo oscuro";
}

// Función para inicializar el tema
function initDarkMode() {
  const html = document.documentElement;
  
  // Obtiene el tema guardado en localStorage o usa la preferencia del sistema
  const savedTheme = localStorage.getItem("theme");
  
  if (savedTheme) {
    // Usa el tema guardado
    if (savedTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  } else {
    // Usa la preferencia del sistema
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }
  
  // Actualiza el botón
  updateDarkModeButton();
  
  // Configura el evento del botón
  const btn = document.getElementById("toggle-dark");
  if (btn) {
    btn.addEventListener("click", toggleDarkMode);
  }
}

// =======================
// API AVIATIONSTACK
// =======================

// Función genérica para hacer peticiones a la API
async function fetchJSON(url, params = {}) {
  const u = new URL(url);
  u.searchParams.set("access_key", AVIATIONSTACK_KEY);
  
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") u.searchParams.set(k, v);
  });

  const res = await fetch(u.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  if (data.error) {
    const msg = data.error?.info || JSON.stringify(data.error);
    throw new Error(msg);
  }
  return data;
}

// Obtiene aeropuertos de un país específico
async function getAirportsByCountry(countryIso2) {
  const data = await fetchJSON(`${AV_BASE}/airports`, {
    country_iso2: countryIso2,
    limit: 10, // Máximo 10 aeropuertos
  });
  // Solo retorna aeropuertos que tengan código IATA
  return (data?.data || []).filter(a => a?.iata_code);
}

// Obtiene vuelos de un país (máximo 10 vuelos)
async function getFlightsByCountry(countryIso2, statusFilter = "all") {
  const airports = await getAirportsByCountry(countryIso2);
  if (!airports.length) return [];

  const allFlights = [];
  
  // Itera por aeropuertos hasta obtener 10 vuelos
  for (const ap of airports) {
    if (allFlights.length >= 10) break;

    const vuelos = await fetchJSON(`${AV_BASE}/flights`, {
      dep_iata: ap.iata_code,
      limit: 10,
      ...(statusFilter !== "all" ? { flight_status: statusFilter } : {}),
    });

    const data = vuelos?.data || [];
    // Agrega información del aeropuerto a cada vuelo
    data.forEach(v => v.__from_airport = ap);
    allFlights.push(...data);

    if (allFlights.length >= 10) break;
  }

  return allFlights.slice(0, 10);
}

// =======================
// INTERFAZ DE USUARIO
// =======================

// Renderiza dos cards por cada vuelo: salida y llegada
function renderVuelosDualCards(vuelos) {
  const grid = document.getElementById("grid-vuelos");
  if (!grid) return;
  
  grid.innerHTML = "";

  if (!vuelos.length) {
    grid.innerHTML = `<div class="col-span-full text-gray-600 dark:text-gray-400">Sin resultados.</div>`;
    return;
  }

  // Función para obtener el color del estado del vuelo
  const getStatusColor = (st) => {
    switch(st) {
      case "active": return "bg-emerald-600";
      case "landed": return "bg-sky-600";
      case "cancelled": return "bg-rose-600";
      case "diverted": return "bg-amber-600";
      default: return "bg-gray-600";
    }
  };

  for (const vuelo of vuelos) {
    const st = vuelo.flight_status;
    const airline = safe(vuelo?.airline?.name);
    const flightCode = safe(vuelo?.flight?.iata || vuelo?.flight?.icao);
    const dep = vuelo?.departure || {};
    const arr = vuelo?.arrival || {};
    const fromAp = vuelo.__from_airport;

    // --- Contenedor principal del vuelo ---
    const vueloContainer = document.createElement("div");
    vueloContainer.className = "col-span-full space-y-3";
    
    // --- Título del vuelo ---
    const vueloTitulo = document.createElement("div");
    vueloTitulo.className = "flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800";
    vueloTitulo.innerHTML = `
      <div class="flex items-center gap-3">
        <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${flightCode}</span>
        <span class="text-sm text-gray-600 dark:text-gray-400">${airline}</span>
      </div>
      <span class="text-xs px-3 py-1 rounded-full text-white ${getStatusColor(st)} font-medium">${safe(st).toUpperCase()}</span>
    `;
    vueloContainer.appendChild(vueloTitulo);

    // --- Contenedor de las dos cards ---
    const cardsContainer = document.createElement("div");
    cardsContainer.className = "grid grid-cols-1 lg:grid-cols-2 gap-4";

    // --- Card de SALIDA ---
    const depCard = document.createElement("article");
    depCard.className = "rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3";
    depCard.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600 dark:text-gray-400">${airline}</div>
        <span class="text-xs px-2 py-1 rounded text-white ${getStatusColor(st)}">${safe(st).toUpperCase()}</span>
      </div>
      <div class="text-xl font-bold text-indigo-600 dark:text-indigo-400">${flightCode}</div>
      <div class="text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">Salida</div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div class="text-gray-500 dark:text-gray-400">Aeropuerto</div>
          <div class="font-medium">${safe(fromAp?.airport_name || dep?.airport)} (${safe(dep?.iata || fromAp?.iata_code)})</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">${safe(dep?.city || fromAp?.city)}</div>
        </div>
        <div>
          <div class="text-gray-500 dark:text-gray-400">Horario</div>
          <div class="font-medium">${safe(dep?.scheduled)}</div>
          ${dep?.estimated ? `<div class="text-xs text-gray-500 dark:text-gray-400">Est.: ${dep.estimated}</div>` : ""}
          ${dep?.delay ? `<div class="text-xs text-amber-600">Retraso: +${dep.delay}m</div>` : ""}
        </div>
      </div>
    `;
    cardsContainer.appendChild(depCard);

    // --- Card de LLEGADA ---
    const arrCard = document.createElement("article");
    arrCard.className = "rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3";
    arrCard.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600 dark:text-gray-400">${airline}</div>
        <span class="text-xs px-2 py-1 rounded text-white ${getStatusColor(st)}">${safe(st).toUpperCase()}</span>
      </div>
      <div class="text-xl font-bold text-indigo-600 dark:text-indigo-400">${flightCode}</div>
      <div class="text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">Llegada</div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div class="text-gray-500 dark:text-gray-400">Aeropuerto</div>
          <div class="font-medium">${safe(arr?.airport)} ${arr?.iata ? `(${arr.iata})` : ""}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">${safe(arr?.city)}</div>
        </div>
        <div>
          <div class="text-gray-500 dark:text-gray-400">Horario</div>
          <div class="font-medium">${safe(arr?.scheduled)}</div>
          ${arr?.estimated ? `<div class="text-xs text-gray-500 dark:text-gray-400">Est.: ${arr.estimated}</div>` : ""}
          ${arr?.delay ? `<div class="text-xs text-amber-600">Retraso: +${arr.delay}m</div>` : ""}
        </div>
      </div>
    `;
    cardsContainer.appendChild(arrCard);

    // Agrega el contenedor completo al grid
    vueloContainer.appendChild(cardsContainer);
    grid.appendChild(vueloContainer);
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
      setEstado("Falta configurar tu API key.", "err");
      return;
    }

    const pais = document.getElementById("select-pais")?.value;
    if (!pais) {
      setEstado("Selecciona un país.", "warn");
      return;
    }

    const estadoSel = document.getElementById("select-estado")?.value || "all";

    // Muestra indicador de carga
    const grid = document.getElementById("grid-vuelos");
    if (grid) {
      grid.innerHTML = `
        <div class="col-span-full space-y-3">
          <div class="animate-pulse h-24 rounded bg-gray-200 dark:bg-gray-800"></div>
          <div class="animate-pulse h-24 rounded bg-gray-200 dark:bg-gray-800"></div>
          <div class="animate-pulse h-24 rounded bg-gray-200 dark:bg-gray-800"></div>
        </div>
      `;
    }
    
    setEstado("Consultando vuelos…");

    try {
      const vuelos = await getFlightsByCountry(pais, estadoSel);
      setEstado(`Mostrando ${vuelos.length} vuelo(s).`, "ok");
      renderVuelosDualCards(vuelos);
    } catch (err) {
      console.error(err);
      setEstado(`Error al obtener datos: ${err.message}`, "err");
      if (grid) grid.innerHTML = "";
    }
  });
}

// =======================
// INICIALIZACIÓN
// =======================
window.addEventListener("DOMContentLoaded", function() {
  // Inicializa el modo oscuro
  initDarkMode();
  
  // Rellena el select de países
  populateCountries();
  
  // Configura el formulario de vuelos
  bindFormularioVuelos();
});