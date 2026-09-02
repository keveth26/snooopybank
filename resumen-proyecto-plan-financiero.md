# Resumen del proyecto: Plan financiero David & Eveth

## Contexto
Pareja que organiza sus finanzas: gastos fijos mensuales, deudas compartidas e individuales, y un plan de pagos por quincena. En lugar de dividir totales 50/50 arbitrariamente, cada gasto fijo y deuda se asigna a uno de los dos según su capacidad, permitiendo controlar en tiempo real cuánto ha pagado cada persona, cuánto dinero debería tener en su cuenta bancaria en todo momento y si el sueldo le alcanza para más gastos o ya llegó al límite.

## Datos base

**Ingresos**
- David: $7.000.000/mes ($3.500.000 por quincena)
- Eveth: $4.000.000/mes ($2.000.000 por quincena)
- Pago quincenal (Q1 = primera quincena, Q2 = segunda quincena)
- Reparto editable por quincena en la herramienta.

**Gastos fijos y asignación habitual**
| Concepto | Monto | Quincena | Asignado habitual |
|---|---|---|---|
| Arriendo | $1.100.000 | Q1 | Eveth |
| Luz | $350.000 | Q1 | Eveth |
| Gas | $20.000 | Q1 | Eveth |
| Agua | $80.000 | Q1 | Eveth |
| Internet | $70.000 | Q1 | Eveth |
| Celular Eveth | $40.000 | Q1 | Eveth |
| Servicio (mitad) | $350.000 | Q1 | David |
| Mercado (mitad) | $250.000 | Q1 | David |
| Gasolina (mitad) | $200.000 | Q1 | David |
| Carro | $1.300.000 | Q2 | David |
| API | $120.000 | Q2 | David |
| Celular David | $50.000 | Q2 | David |
| Gasolina (mitad) | $200.000 | Q2 | David |
| Servicio (mitad) | $350.000 | Q2 | Eveth |
| Mercado (mitad) | $250.000 | Q2 | Eveth |

- Total gastos fijos Q1: **$2.460.000** (Eveth: $1.660.000, David: $800.000)
- Total gastos fijos Q2: **$2.270.000** (David: $1.670.000, Eveth: $600.000)

**Deudas** (montos totales, no cuotas; prioridad definida: tarjetas primero)
| Prioridad | Concepto | Saldo | Asignado |
|---|---|---|---|
| 1 | Tarjeta Nu | $2.774.000 | David |
| 2 | Tarjeta Davibank | $5.000.000 | David |
| 3 | Alejandro | $800.000 | David |
| 4 | Deuda lentes | $650.000 | Eveth |
| 5 | Ropa Éxito | $500.000 | Eveth |
| 6 | Mac Eveth | $350.000 | Eveth |

Total deuda: **$10.074.000**

**Dinero libre (salidas/gustos):** $300.000 por quincena (asumido por David o Eveth según disponibilidad).

## Qué se construyó
Un artefacto interactivo en **React** (archivo `plan-financiero.jsx`), con las siguientes características:

1. **Tarjetas de balance individual (Eveth & David):**
   - **Debería tener en cuenta ahora:** Calcula el saldo real estimado en la cuenta bancaria de cada uno (`Sueldo quincenal − Pagos efectivamente desembolsados`).
   - **Métricas:** Total asignado a pagar, ya pagado, falta por pagar, y margen/capacidad restante de sueldo.
   - **Alerta de sobregiro/límite de sueldo:** Si los gastos asignados a una persona superan su sueldo quincenal, salta una alerta clara advirtiendo que ya no puede pagar más y sugiriendo transferir algún gasto a la otra persona.
   - **Avisos de pagos cruzados:** Si uno pagó una factura que le correspondía al otro, se calcula y destaca cuánto cubrió por la otra persona.
2. **Asignación personalizada y flexible:**
   - Cada gasto tiene un selector rápido `[Eveth | David]` para alternar al responsable con un solo clic.
   - Filtros de visualización: `Todos`, `Solo Eveth` o `Solo David` para que cada uno pueda revisar únicamente su lista de pagos pendientes.
3. **Registro detallado de pago ("Quién lo pagó"):**
   - Al marcar un gasto como pagado con el check, por defecto se registra que lo pagó el responsable asignado.
   - Si la otra persona hizo el desembolso físico, se puede cambiar el pagador con un clic (`✓ Pagado por: [Eveth | David]`).
4. **Agregar o eliminar gastos fijos:**
   - Formulario ágil en la quincena activa para incorporar nuevos conceptos o borrar gastos existentes.
5. **Dinero libre y Abonos a deuda con asignación:**
   - Permite saber quién aporta el dinero libre y quién hace cada abono.
   - Sugerencia automática de abonos en cascada por orden de prioridad (tarjetas primero).
6. **Cierre de quincena e Histórico:**
   - Guarda el desglose detallado de lo que pagó Eveth y David, sus saldos finales en cuenta y la deuda restante.
   - Al cerrar la quincena, las asignaciones y montos editados se guardan automáticamente como plantilla para la próxima quincena de ese mismo tipo.
7. **Persistencia dual:**
   - Soporta `window.storage` (Claude Artifacts) con fallback automático a `localStorage` para cualquier navegador web estándar o entorno de pruebas.

## Estilo y diseño
Diseño editorial con tipografía Fraunces e Inter, paleta verde bosque, ocre y distintivos sobrios para Eveth (malva/vino elegante) y David (verde bosque/teal). Sin dependencias externas más allá de React y `lucide-react`.

## Arquitectura y Despliegue (React + Vite + PWA)

### Ejecución en local:
```bash
npm install
npm run dev
```
La aplicación correrá en `http://localhost:5173`.

### Construcción para producción:
```bash
npm run build
```
Genera la carpeta `dist/` con todos los activos optimizados, el Service Worker para funcionamiento offline y el `manifest.webmanifest`.

### Despliegue en Cloudflare Pages:
1. Conectar el repositorio de GitHub en **Cloudflare Dashboard** → **Workers & Pages** → **Pages** → **Connect to Git**.
2. Parámetros de construcción:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. ¡Despliegue automático en cada `git push` con HTTPS y compatibilidad PWA!
