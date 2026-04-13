# Flujo · FleetCost — Panel de Gestión

Aplicación web unificada que combina **FinanzasApp (Flujo)** y **FleetCost** en un solo panel de gestión financiero y de flota de transporte.

## Estructura del proyecto

```
├── index.html          # HTML principal — estructura y páginas de la app
├── CLAUDE.md           # Este archivo
├── css/
│   ├── main.css        # Estilos base de FinanzasApp (variables, layout, componentes)
│   └── flota.css       # Estilos de FleetCost, aislados bajo #page-flota
└── js/
    ├── app.js          # Lógica de FinanzasApp (datos, navegación, cobros, pagos, flujo, IA)
    └── flota.js        # Lógica de FleetCost (cálculo de costos, simulador de viajes, historial)
```

## Módulos

### FinanzasApp (Flujo)
Planificador de flujo de caja personal/empresarial.

- **Dashboard** — métricas clave, alertas, gráficos de flujo y composición de pagos
- **Cobros** — ingresos esperados con fechas y estados
- **Pagos** — obligaciones y vencimientos categorizados
- **Flujo** — proyección completa de caja en línea de tiempo
- **Asistente IA** — análisis financiero usando Claude API (claude-sonnet-4-20250514)

**Almacenamiento:** `localStorage` bajo la clave `flujo_v1`

### FleetCost (Flota)
Calculadora de costos de transporte de carga.

- **Calculadora** — costos fijos mensuales (seguro, patente, mantenimiento, aceite, cubiertas) + costos directos por km (chofer, combustible) → costo total por km
- **Simulador de viajes** — ganancia neta por flete, desglose de costos, control de consumo de combustible
- **Historial** — registro de viajes guardados en sesión con resumen estadístico

**Almacenamiento:** variable en memoria (`fcViajesGuardados[]`), sin persistencia entre sesiones

### Integración entre módulos
Al guardar un viaje en FleetCost, aparece el botón **"Registrar como cobro en Flujo →"** que agrega el monto facturado como cobro pendiente en FinanzasApp, incluyendo descripción, km recorridos y margen de ganancia en las notas.

## Variables CSS

### main.css (FinanzasApp)
```css
--accent: #1a6b3a      /* verde principal */
--red: #c0392b
--blue: #1a5fa8
--amber: #b7600a
--font-display: 'DM Serif Display'
--font-body: 'DM Sans'
--font-mono: 'DM Mono'
```

### flota.css (FleetCost — scoped bajo #page-flota)
```css
--accent: #2BB89A      /* teal — sobreescribe el verde de FinanzasApp dentro de la sección */
--green: #2BB89A
--amber: #D4820A
--blue: #3B7DD8
--r: 12px / --r-sm: 8px / --r-lg: 16px
```

## Convenciones de código

### JS — Prefijos de funciones
Todas las funciones de FleetCost usan el prefijo `fc` para evitar conflictos con FinanzasApp:

| FleetCost | FinanzasApp |
|-----------|-------------|
| `fcCalcular()` | `renderDashboard()` |
| `fcCalcularViaje()` | `renderCobros()` |
| `fcSwitchTab()` | `navigate()` |
| `fcGuardarViaje()` | `addCobro()` |
| `fcRenderHistorial()` | `renderPagos()` |
| `fcFmtM()` | `fmt()` |

### CSS — Aislamiento de estilos
Los estilos de FleetCost que usan clases genéricas (`.card`, `.btn`, `.badge`, `.field`, `.input-wrap`) están scoped bajo `#page-flota` para no pisar los estilos de FinanzasApp.

## Dependencias externas
- **Chart.js 4.4.1** — gráficos del dashboard (CDN: cdnjs.cloudflare.com)
- **Google Fonts** — DM Serif Display, DM Sans, DM Mono, Syne, JetBrains Mono
- **Claude API** — `claude-sonnet-4-20250514` para el Asistente IA (requiere CORS desde el browser o proxy)

## Desarrollo local

```bash
# Cualquier servidor estático sirve — ejemplos:
python3 -m http.server 8080
npx serve .
```

Abrir `http://localhost:8080`

## Notas para Claude

- Al modificar estilos compartidos, revisar `css/main.css` primero y verificar que no rompa la sección Flota
- Al agregar una función en `js/flota.js`, usar siempre el prefijo `fc`
- Los datos de FinanzasApp persisten en `localStorage`; FleetCost no persiste entre sesiones (por diseño)
- La fecha hardcodeada `TODAY = '2026-04-13'` en `app.js` debe actualizarse o hacerse dinámica según necesidad
- Para agregar nuevas páginas al sidebar: agregar nav-item en `index.html`, agregar `page-*` div, y manejar en `navigate()` en `app.js`
