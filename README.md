# ✈️ Buscador de Vuelos

Un buscador de vuelos moderno y responsivo que permite consultar vuelos por país utilizando la API de AviationStack. Desarrollado con JavaScript, Tailwind CSS y una interfaz de usuario intuitiva.

## 🌟 Características

- **🔍 Búsqueda por país**: Selecciona entre 10 países disponibles
- **📱 Diseño responsivo**: Funciona en móvil y desktop
- **🌙 Modo oscuro**: Tema claro/oscuro con persistencia
- **🎨 Interfaz moderna**: Diseño limpio con Tailwind CSS
- **⚡ Carga rápida**: Limitado a 10 vuelos para mejor rendimiento
- **🔧 Filtros**: Filtra por estado del vuelo (activos, terminados, todos)
- **📊 Cards informativas**: Dos cards por vuelo (salida y llegada)

## 🛠️ Tecnologías Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+
- **Estilos**: Tailwind CSS
- **API**: AviationStack (datos de vuelos en tiempo real)
- **Almacenamiento**: LocalStorage (preferencias del usuario)

## 🚀 Instalación

### 1. Clona el repositorio
```bash
git clone https://github.com/XcarabuzX/SimuladorJS.git
cd SimuladorJS
```

### 2. Instala las dependencias
```bash
npm install
```

### 3. Obtén tu API Key de AviationStack(La que esta por defecto puede que haya caducado)
1. Ve a [AviationStack](https://aviationstack.com/)
2. Regístrate para obtener una cuenta gratuita
3. Copia tu API Key

### 4. Configura la API Key
Abre el archivo `index.html` y reemplaza la línea:
```html
<script>window.AVIATIONSTACK_KEY = "TU_API_KEY_AQUI";</script>
```

### 5. Compila Tailwind CSS
Para que los estilos funcionen correctamente, necesitas compilar Tailwind CSS:

```bash
# Compilación única
npm run build:css

# O para desarrollo con watch (recompila automáticamente)
npm run build:css
```

**Nota importante**: El script `build:css` está configurado con `--watch`, lo que significa que se ejecutará continuamente y recompilará automáticamente cuando hagas cambios en `./CSS/main.css`.

### 6. Abre el proyecto
- Abre `index.html` en tu navegador

## 📖 Uso

### Búsqueda de Vuelos
1. **Selecciona un país** del menú desplegable
2. **Elige el estado del vuelo** (opcional):
   - Todos los vuelos
   - Solo vuelos activos
   - Solo vuelos terminados
3. **Haz clic en "Buscar vuelos"**
4. **Visualiza los resultados** organizados por vuelo

### Modo Oscuro
- **Cambia entre temas** usando el botón en la esquina superior derecha
- **Preferencia guardada** automáticamente en tu navegador