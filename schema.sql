-- Snoopy Bank - Esquema de Base de Datos Cloudflare D1
-- Para inicializar: npx wrangler d1 execute snoopy-db --file=./schema.sql (o en local: --local)

-- Tabla de almacenamiento de estado sincronizado
CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de deudas estructuradas
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  concepto TEXT NOT NULL,
  saldo REAL NOT NULL,
  prioridad INTEGER NOT NULL,
  fecha_limite TEXT,
  cuotas_totales INTEGER,
  cuotas_restantes INTEGER,
  cuota_mensual REAL,
  amortizacion_capital REAL,
  solo_cuota_fija INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historial de quincenas archivadas
CREATE TABLE IF NOT EXISTS quincenas_history (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  cerrada_el TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historial de aportes a la alcancía de ahorros
CREATE TABLE IF NOT EXISTS savings_records (
  id TEXT PRIMARY KEY,
  fecha TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto REAL NOT NULL,
  persona TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gastos programados futuros (seguro carro, soat, etc.)
CREATE TABLE IF NOT EXISTS scheduled_expenses (
  id TEXT PRIMARY KEY,
  concepto TEXT NOT NULL,
  monto REAL NOT NULL,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  asignado TEXT NOT NULL,
  recurrente_anual INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
