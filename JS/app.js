// =======================
// CONFIGURACIÓN Y UTILIDADES
// =======================

/**
 * Lista de países disponibles en AviationStack
 * @type {Array<{iso2: string, name: string}>}
 */
const PAISES_DISPONIBLES = [
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

/**
 * API key para AviationStack
 * @type {string}
 */
const AVIATIONSTACK_KEY = window.AVIATIONSTACK_KEY;

/**
 * URL base de la API de AviationStack
 * @type {string}
 */
const AV_BASE = "https://api.aviationstack.com/v1";

// =======================
// FUNCIONES UTILITARIAS
// =======================

/**
 * Retorna el valor o un fallback si es null/undefined
 * @param {*} valor - Valor a verificar
 * @param {string} fallback - Valor por defecto si el valor es null/undefined
 * @returns {*} El valor original o el fallback
 */
function obtenerValorSeguro(valor, fallback = "—") {
  return valor ?? fallback;
}

/**
 * Muestra mensajes de estado en la interfaz
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de mensaje ('info', 'ok', 'warn', 'err')
 */
function mostrarMensaje(mensaje, tipo = "info") {
  const elementoMensaje = document.getElementById("estado-busqueda");
  if (!elementoMensaje) return;
  
  const paletaColores = {
    info: "text-gray-700 dark:text-gray-300",
    ok: "text-emerald-600",
    warn: "text-amber-600",
    err: "text-rose-600",
  };
  
  elementoMensaje.className = `mt-3 text-sm ${paletaColores[tipo] || paletaColores.info}`;
  elementoMensaje.textContent = mensaje;
}

// =======================
// GESTIÓN DEL MODO OSCURO
// =======================

/**
 * Cambia entre modo claro y oscuro
 */
function alternarModoOscuro() {
  const elementoHTML = document.documentElement;
  const esModoOscuro = elementoHTML.classList.contains("dark");
  
  if (esModoOscuro) {
    elementoHTML.classList.remove("dark");
    localStorage.setItem("tema", "claro");
  } else {
    elementoHTML.classList.add("dark");
    localStorage.setItem("tema", "oscuro");
  }
  
  actualizarTextoBotonTema();
}

/**
 * Actualiza el texto del botón según el tema actual
 */
function actualizarTextoBotonTema() {
  const boton = document.getElementById("toggle-dark");
  if (!boton) return;
  
  const esModoOscuro = document.documentElement.classList.contains("dark");
  boton.textContent = esModoOscuro ? "☀️ Modo claro" : "🌙 Modo oscuro";
}

/**
 * Configura el evento click del botón de cambio de tema
 */
function configurarEventoTema() {
  const boton = document.getElementById("toggle-dark");
  if (boton) {
    boton.addEventListener("click", alternarModoOscuro);
  }
}

/**
 * Inicializa el tema basado en localStorage o preferencia del sistema
 */
function inicializarTema() {
  const elementoHTML = document.documentElement;
  
  // Obtiene el tema guardado en localStorage o usa la preferencia del sistema
  const temaGuardado = localStorage.getItem("tema");
  
  if (temaGuardado) {
    // Usa el tema guardado
    if (temaGuardado === "oscuro") {
      elementoHTML.classList.add("dark");
    } else {
      elementoHTML.classList.remove("dark");
    }
  } else {
    // Usa la preferencia del sistema
    const prefiereOscuro = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefiereOscuro) {
      elementoHTML.classList.add("dark");
    } else {
      elementoHTML.classList.remove("dark");
    }
  }
  
  // Actualiza el botón y configura el evento
  actualizarTextoBotonTema();
  configurarEventoTema();
}



// =======================
// API AVIATIONSTACK
// =======================

/**
 * Función genérica para hacer peticiones a la API
 * @param {string} url - URL de la API
 * @param {Object} parametros - Parámetros de la consulta
 * @returns {Promise<Object>} Respuesta de la API
 * @throws {Error} Si hay un error en la petición
 */
async function realizarPeticionAPI(url, parametros = {}) {
  const urlCompleta = new URL(url);
  urlCompleta.searchParams.set("access_key", AVIATIONSTACK_KEY);
  
  // Agrega los parámetros de la consulta
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== "") {
      urlCompleta.searchParams.set(clave, valor);
    }
  });

  const respuesta = await fetch(urlCompleta.toString());
  if (!respuesta.ok) {
    throw new Error(`HTTP ${respuesta.status}`);
  }
  
  const datos = await respuesta.json();

  // Verifica si hay errores en la respuesta de la API
  if (datos.error) {
    const mensajeError = datos.error?.info || JSON.stringify(datos.error);
    throw new Error(mensajeError);
  }
  
  return datos;
}

/**
 * Obtiene aeropuertos de un país específico
 * @param {string} codigoPais - Código ISO2 del país (ej: 'CL', 'AR')
 * @returns {Promise<Array>} Lista de aeropuertos con código IATA
 */
async function obtenerAeropuertosPorPais(codigoPais) {
  const datos = await realizarPeticionAPI(`${AV_BASE}/airports`, {
    country_iso2: codigoPais,
    limit: 10, // Máximo 10 aeropuertos
  });
  
  // Solo retorna aeropuertos que tengan código IATA
  return (datos?.data || []).filter(aeropuerto => aeropuerto?.iata_code);
}

/**
 * Obtiene vuelos de un país (máximo 10 vuelos)
 * @param {string} codigoPais - Código ISO2 del país
 * @param {string} filtroEstado - Filtro de estado del vuelo ('all', 'active', 'landed')
 * @returns {Promise<Array>} Lista de vuelos encontrados
 */
async function obtenerVuelosPorPais(codigoPais, filtroEstado = "all") {
  const aeropuertos = await obtenerAeropuertosPorPais(codigoPais);
  if (!aeropuertos.length) return [];

  const todosLosVuelos = [];
  
  // Itera por aeropuertos hasta obtener 10 vuelos
  for (const aeropuerto of aeropuertos) {
    if (todosLosVuelos.length >= 10) break;

    const vuelos = await realizarPeticionAPI(`${AV_BASE}/flights`, {
      dep_iata: aeropuerto.iata_code,
      limit: 10,
      ...(filtroEstado !== "all" ? { flight_status: filtroEstado } : {}),
    });

    const datosVuelos = vuelos?.data || [];
    // Agrega información del aeropuerto a cada vuelo
    datosVuelos.forEach(vuelo => vuelo.__aeropuerto_origen = aeropuerto);
    todosLosVuelos.push(...datosVuelos);

    if (todosLosVuelos.length >= 10) break;
  }

  return todosLosVuelos.slice(0, 10);
}

// =======================
// INTERFAZ DE USUARIO
// =======================

/**
 * Obtiene el color CSS para el estado del vuelo
 * @param {string} estado - Estado del vuelo
 * @returns {string} Clase CSS del color
 */
function obtenerColorEstadoVuelo(estado) {
  const coloresEstado = {
    active: "bg-emerald-600",
    landed: "bg-sky-600",
    cancelled: "bg-rose-600",
    diverted: "bg-amber-600",
  };
  
  return coloresEstado[estado] || "bg-gray-600";
}

/**
 * Crea el título del vuelo con información principal
 * @param {string} codigoVuelo - Código del vuelo
 * @param {string} aerolinea - Nombre de la aerolínea
 * @param {string} estado - Estado del vuelo
 * @returns {HTMLElement} Elemento del título del vuelo
 */
function crearTituloVuelo(codigoVuelo, aerolinea, estado) {
  const titulo = document.createElement("div");
  titulo.className = "flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800";
  
  titulo.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${codigoVuelo}</span>
      <span class="text-sm text-gray-600 dark:text-gray-400">${aerolinea}</span>
    </div>
    <span class="text-xs px-3 py-1 rounded-full text-white ${obtenerColorEstadoVuelo(estado)} font-medium">${obtenerValorSeguro(estado).toUpperCase()}</span>
  `;
  
  return titulo;
}

/**
 * Crea una card de información de vuelo (salida o llegada)
 * @param {Object} datosVuelo - Datos del vuelo
 * @param {Object} aeropuertoOrigen - Información del aeropuerto de origen
 * @param {string} tipo - Tipo de card ('salida' o 'llegada')
 * @returns {HTMLElement} Elemento de la card
 */
function crearCardVuelo(datosVuelo, aeropuertoOrigen, tipo) {
  const estado = datosVuelo.flight_status;
  const aerolinea = obtenerValorSeguro(datosVuelo?.airline?.name);
  const codigoVuelo = obtenerValorSeguro(datosVuelo?.flight?.iata || datosVuelo?.flight?.icao);
  
  const card = document.createElement("article");
  card.className = "rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 flex flex-col gap-3";
  
  if (tipo === "salida") {
    const datosSalida = datosVuelo?.departure || {};
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600 dark:text-gray-400">${aerolinea}</div>
        <span class="text-xs px-2 py-1 rounded text-white ${obtenerColorEstadoVuelo(estado)}">${obtenerValorSeguro(estado).toUpperCase()}</span>
      </div>
      <div class="text-xl font-bold text-indigo-600 dark:text-indigo-400">${codigoVuelo}</div>
      <div class="text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">Salida</div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div class="text-gray-500 dark:text-gray-400">Aeropuerto</div>
          <div class="font-medium">${obtenerValorSeguro(aeropuertoOrigen?.airport_name || datosSalida?.airport)} (${obtenerValorSeguro(datosSalida?.iata || aeropuertoOrigen?.iata_code)})</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">${obtenerValorSeguro(datosSalida?.city || aeropuertoOrigen?.city)}</div>
        </div>
        <div>
          <div class="text-gray-500 dark:text-gray-400">Horario</div>
          <div class="font-medium">${obtenerValorSeguro(datosSalida?.scheduled)}</div>
          ${datosSalida?.estimated ? `<div class="text-xs text-gray-500 dark:text-gray-400">Est.: ${datosSalida.estimated}</div>` : ""}
          ${datosSalida?.delay ? `<div class="text-xs text-amber-600">Retraso: +${datosSalida.delay}m</div>` : ""}
        </div>
      </div>
    `;
  } else {
    const datosLlegada = datosVuelo?.arrival || {};
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600 dark:text-gray-400">${aerolinea}</div>
        <span class="text-xs px-2 py-1 rounded text-white ${obtenerColorEstadoVuelo(estado)}">${obtenerValorSeguro(estado).toUpperCase()}</span>
      </div>
      <div class="text-xl font-bold text-indigo-600 dark:text-indigo-400">${codigoVuelo}</div>
      <div class="text-xs uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">Llegada</div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div class="text-gray-500 dark:text-gray-400">Aeropuerto</div>
          <div class="font-medium">${obtenerValorSeguro(datosLlegada?.airport)} ${datosLlegada?.iata ? `(${datosLlegada.iata})` : ""}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">${obtenerValorSeguro(datosLlegada?.city)}</div>
        </div>
        <div>
          <div class="text-gray-500 dark:text-gray-400">Horario</div>
          <div class="font-medium">${obtenerValorSeguro(datosLlegada?.scheduled)}</div>
          ${datosLlegada?.estimated ? `<div class="text-xs text-gray-500 dark:text-gray-400">Est.: ${datosLlegada.estimated}</div>` : ""}
          ${datosLlegada?.delay ? `<div class="text-xs text-amber-600">Retraso: +${datosLlegada.delay}m</div>` : ""}
        </div>
      </div>
    `;
  }
  
  return card;
}

/**
 * Renderiza las cards de vuelos agrupadas por vuelo
 * @param {Array} vuelos - Lista de vuelos a mostrar
 */
function mostrarVuelosAgrupados(vuelos) {
  const contenedorGrid = document.getElementById("grid-vuelos");
  if (!contenedorGrid) return;
  
  contenedorGrid.innerHTML = "";

  if (!vuelos.length) {
    contenedorGrid.innerHTML = `<div class="col-span-full text-gray-600 dark:text-gray-400">Sin resultados.</div>`;
    return;
  }

  for (const vuelo of vuelos) {
    const estado = vuelo.flight_status;
    const aerolinea = obtenerValorSeguro(vuelo?.airline?.name);
    const codigoVuelo = obtenerValorSeguro(vuelo?.flight?.iata || vuelo?.flight?.icao);
    const aeropuertoOrigen = vuelo.__aeropuerto_origen;

    // --- Contenedor principal del vuelo ---
    const contenedorVuelo = document.createElement("div");
    contenedorVuelo.className = "col-span-full space-y-3";
    
    // --- Título del vuelo ---
    const tituloVuelo = crearTituloVuelo(codigoVuelo, aerolinea, estado);
    contenedorVuelo.appendChild(tituloVuelo);

    // --- Contenedor de las dos cards ---
    const contenedorCards = document.createElement("div");
    contenedorCards.className = "grid grid-cols-1 lg:grid-cols-2 gap-4";

    // --- Card de SALIDA ---
    const cardSalida = crearCardVuelo(vuelo, aeropuertoOrigen, "salida");
    contenedorCards.appendChild(cardSalida);

    // --- Card de LLEGADA ---
    const cardLlegada = crearCardVuelo(vuelo, aeropuertoOrigen, "llegada");
    contenedorCards.appendChild(cardLlegada);

    // Agrega el contenedor completo al grid
    contenedorVuelo.appendChild(contenedorCards);
    contenedorGrid.appendChild(contenedorVuelo);
  }
}

// =======================
// GESTIÓN DEL FORMULARIO
// =======================

/**
 * Rellena el select de países dinámicamente
 */
function poblarSelectPaises() {
  const selectPaises = document.getElementById("select-pais");
  if (!selectPaises) return;
  
  // Limpia opciones existentes
  selectPaises.innerHTML = "";
  
  // Agrega placeholder
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.disabled = true;
  placeholder.selected = true;
  placeholder.textContent = "Selecciona un país";
  selectPaises.appendChild(placeholder);

  // Agrega países
  for (const pais of PAISES_DISPONIBLES) {
    const opcion = document.createElement("option");
    opcion.value = pais.iso2;
    opcion.textContent = pais.name;
    selectPaises.appendChild(opcion);
  }
}

/**
 * Muestra un indicador de carga en la grilla de resultados
 */
function mostrarIndicadorCarga() {
  const contenedorGrid = document.getElementById("grid-vuelos");
  if (contenedorGrid) {
    contenedorGrid.innerHTML = `
      <div class="col-span-full space-y-3">
        <div class="animate-pulse h-24 rounded bg-gray-200 dark:bg-gray-800"></div>
        <div class="animate-pulse h-24 rounded bg-gray-200 dark:bg-gray-800"></div>
        <div class="animate-pulse h-24 rounded bg-gray-200 dark:bg-gray-800"></div>
      </div>
    `;
  }
}

/**
 * Configura el formulario de búsqueda de vuelos
 */
function configurarFormularioVuelos() {
  const formulario = document.getElementById("form-vuelos");
  if (!formulario) return;

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    if (!AVIATIONSTACK_KEY) {
      mostrarMensaje("Falta configurar tu API key.", "err");
      return;
    }

    const codigoPais = document.getElementById("select-pais")?.value;
    if (!codigoPais) {
      mostrarMensaje("Selecciona un país.", "warn");
      return;
    }

    const filtroEstado = document.getElementById("select-estado")?.value || "all";

    // Muestra indicador de carga
    mostrarIndicadorCarga();
    mostrarMensaje("Consultando vuelos…");

    try {
      const vuelos = await obtenerVuelosPorPais(codigoPais, filtroEstado);
      mostrarMensaje(`Mostrando ${vuelos.length} vuelo(s).`, "ok");
      mostrarVuelosAgrupados(vuelos);
    } catch (error) {
      console.error(error);
      mostrarMensaje(`Error al obtener datos: ${error.message}`, "err");
      const contenedorGrid = document.getElementById("grid-vuelos");
      if (contenedorGrid) contenedorGrid.innerHTML = "";
    }
  });
}

// =======================
// INICIALIZACIÓN
// =======================

/**
 * Función principal de inicialización
 */
function inicializarAplicacion() {
  // Inicializa el tema
  inicializarTema();
  
  // Pobla el select de países
  poblarSelectPaises();
  
  // Configura el formulario de vuelos
  configurarFormularioVuelos();
}

// Evento de inicialización cuando el DOM esté listo
window.addEventListener("DOMContentLoaded", inicializarAplicacion);