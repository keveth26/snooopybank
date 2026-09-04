import React, { useState, useEffect, useMemo } from "react";
import {
  Check, Plus, Trash2, ArrowRight, Home, History, CreditCard,
  PiggyBank, Sparkles, AlertCircle, RefreshCw, X, Calendar,
  AlertTriangle, Clock, ChevronDown, ChevronUp, Layers, Coins,
  User, Users, Menu, Save, CheckCircle2, Lock, Unlock
} from "lucide-react";
import {
  loadKeyWithSync,
  saveKeyWithSync,
  fetchStateFromCloud,
  subscribeSyncStatus,
  saveBatchWithSync,
} from "./api";

const fmt = (n) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(n || 0));

const uid = () => Math.random().toString(36).slice(2, 9);

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const periodLabel = (tipo, mes, anio) =>
  `${tipo === "Q1" ? "Primera" : "Segunda"} quincena de ${MONTHS[mes]} de ${anio}`;

const DEFAULT_DEBTS = [
  { id: "nu", concepto: "Tarjeta Nu", saldo: 2774000, prioridad: 1, fechaLimite: "", cuotasTotales: null, cuotasRestantes: null, cuotaMensual: 0, amortizacionCapital: 0, soloCuotaFija: false },
  { id: "davibank", concepto: "Tarjeta Davibank", saldo: 5000000, prioridad: 2, fechaLimite: "", cuotasTotales: null, cuotasRestantes: null, cuotaMensual: 0, amortizacionCapital: 0, soloCuotaFija: false },
  { id: "alejandro", concepto: "Alejandro", saldo: 800000, prioridad: 3, fechaLimite: "", cuotasTotales: null, cuotasRestantes: null, cuotaMensual: 0, amortizacionCapital: 0, soloCuotaFija: false },
  { id: "lentes", concepto: "Deuda lentes", saldo: 650000, prioridad: 4, fechaLimite: "", cuotasTotales: null, cuotasRestantes: null, cuotaMensual: 0, amortizacionCapital: 0, soloCuotaFija: false },
  { id: "ropa", concepto: "Ropa Éxito", saldo: 500000, prioridad: 5, fechaLimite: "", cuotasTotales: null, cuotasRestantes: null, cuotaMensual: 0, amortizacionCapital: 0, soloCuotaFija: false },
  { id: "mac", concepto: "Mac Eveth", saldo: 350000, prioridad: 6, fechaLimite: "", cuotasTotales: null, cuotasRestantes: null, cuotaMensual: 0, amortizacionCapital: 0, soloCuotaFija: false },
  {
    id: "carro_credito",
    concepto: "Crédito Carro",
    saldo: 26000000,
    prioridad: 99,
    fechaLimite: "",
    cuotasTotales: 48,
    cuotasRestantes: 24,
    cuotaMensual: 1300000,
    amortizacionCapital: 700000,
    soloCuotaFija: true,
  },
];

const TEMPLATE_Q1 = {
  ingresos: { david: 3500000, eveth: 2000000 },
  gastosFijos: [
    { id: "arriendo", concepto: "Arriendo", monto: 1100000, asignado: "eveth", tipoGasto: "fijo" },
    { id: "luz", concepto: "Luz", monto: 350000, asignado: "eveth", tipoGasto: "fijo" },
    { id: "gas", concepto: "Gas", monto: 20000, asignado: "eveth", tipoGasto: "fijo" },
    { id: "agua", concepto: "Agua", monto: 80000, asignado: "eveth", tipoGasto: "fijo" },
    { id: "internet", concepto: "Internet", monto: 70000, asignado: "eveth", tipoGasto: "fijo" },
    { id: "celular_e", concepto: "Celular Eveth", monto: 40000, asignado: "eveth", tipoGasto: "fijo" },
    { id: "servicio_h1", concepto: "Servicio (mitad)", monto: 350000, asignado: "david", tipoGasto: "fijo" },
    { id: "mercado_h1", concepto: "Mercado (mitad)", monto: 250000, asignado: "david", tipoGasto: "fijo" },
    { id: "gasolina_h1", concepto: "Gasolina (mitad)", monto: 200000, asignado: "david", tipoGasto: "fijo" },
  ],
  ahorroProgramado: { monto: 200000, asignado: "david" },
  dineroLibre: { monto: 300000, asignado: "david" },
};

const TEMPLATE_Q2 = {
  ingresos: { david: 3500000, eveth: 2000000 },
  gastosFijos: [
    { id: "carro", concepto: "Carro", monto: 1300000, asignado: "david", tipoGasto: "fijo", amortizaDeudaId: "carro_credito" },
    { id: "api", concepto: "API", monto: 120000, asignado: "david", tipoGasto: "fijo" },
    { id: "celular_d", concepto: "Celular David", monto: 50000, asignado: "david", tipoGasto: "fijo" },
    { id: "servicio_h2", concepto: "Servicio (mitad)", monto: 350000, asignado: "eveth", tipoGasto: "fijo" },
    { id: "mercado_h2", concepto: "Mercado (mitad)", monto: 250000, asignado: "eveth", tipoGasto: "fijo" },
    { id: "gasolina_h2", concepto: "Gasolina (mitad)", monto: 200000, asignado: "david", tipoGasto: "fijo" },
  ],
  ahorroProgramado: { monto: 200000, asignado: "david" },
  dineroLibre: { monto: 300000, asignado: "david" },
};

const DEFAULT_SCHEDULED = [
  {
    id: "seguro_carro_nov",
    concepto: "Seguro Todo Riesgo Carro",
    monto: 1800000,
    mes: 10,
    anio: 2026,
    tipo: "Q1",
    asignado: "familiar",
    recurrenteAnual: true,
  },
  {
    id: "soat_ene",
    concepto: "SOAT Vehicular",
    monto: 750000,
    mes: 0,
    anio: 2027,
    tipo: "Q1",
    asignado: "familiar",
    recurrenteAnual: true,
  },
];

const DEFAULT_SAVINGS = {
  balanceTotal: 0,
  metaAhorro: 10000000,
  registros: [],
};

function buildActiveFromTemplate(tipo, template, mes, anio, scheduled = []) {
  const baseGastos = (template.gastosFijos || []).map((g) => ({
    ...g,
    asignado: g.asignado || "david",
    tipoGasto: g.tipoGasto || "fijo",
    pagado: false,
    pagadoPor: null,
  }));

  const programadosMatching = scheduled.filter((s) => {
    const coincideMes = s.mes === Number(mes);
    const coincideAnio = !s.anio || s.anio === Number(anio) || s.recurrenteAnual;
    const coincideQuincena = s.tipo === "ambas" || s.tipo === tipo;
    return coincideMes && coincideAnio && coincideQuincena;
  });

  const gastosProgramadosAuto = programadosMatching.map((s) => ({
    id: `auto_sched_${s.id}_${mes}_${anio}`,
    scheduledId: s.id,
    concepto: s.concepto,
    monto: s.monto,
    asignado: "david", // Por defecto asignado a quien tenga capacidad en quincena
    tipoGasto: "programado",
    pagado: false,
    pagadoPor: null,
  }));

  const rawAhorro = template.ahorroProgramado;
  const ahorroProgramado =
    typeof rawAhorro === "object" && rawAhorro !== null
      ? { monto: Number(rawAhorro.monto) || 0, asignado: rawAhorro.asignado || "david", pagado: false, pagadoPor: null }
      : { monto: Number(rawAhorro) || 200000, asignado: "david", pagado: false, pagadoPor: null };

  const rawLibre = template.dineroLibre;
  const dineroLibre =
    typeof rawLibre === "object" && rawLibre !== null
      ? { monto: Number(rawLibre.monto) || 300000, asignado: rawLibre.asignado || "david", pagado: false, pagadoPor: null }
      : { monto: Number(rawLibre) || 300000, asignado: "david", pagado: false, pagadoPor: null };

  return {
    id: uid(),
    tipo,
    mes: Number(mes),
    anio: Number(anio),
    ingresos: { ...template.ingresos },
    ingresosExtras: [],
    gastosFijos: [...baseGastos, ...gastosProgramadosAuto],
    ahorroProgramado,
    dineroLibre,
    abonos: {},
  };
}

function sanitizeActive(raw) {
  if (!raw) return null;
  const ingresos = {
    david: raw.ingresos?.david ?? 3500000,
    eveth: raw.ingresos?.eveth ?? 2000000,
  };

  const ingresosExtras = Array.isArray(raw.ingresosExtras)
    ? raw.ingresosExtras.map((e) => ({
        id: e.id || uid(),
        concepto: e.concepto || "Ingreso extra",
        monto: Number(e.monto) || 0,
        persona: e.persona || "david",
        destino: e.destino || "deudas",
      }))
    : [];

  const gastosFijos = (raw.gastosFijos || []).map((g) => ({
    id: g.id || uid(),
    concepto: g.concepto || "Gasto",
    monto: Number(g.monto) || 0,
    asignado: g.asignado || "david",
    tipoGasto: g.tipoGasto || "fijo",
    amortizaDeudaId: g.amortizaDeudaId || (g.concepto?.toLowerCase() === "carro" ? "carro_credito" : null),
    pagado: Boolean(g.pagado),
    pagadoPor: g.pagadoPor || (g.pagado ? g.asignado || "david" : null),
  }));

  const rawAhorro = raw.ahorroProgramado;
  const ahorroProgramado =
    typeof rawAhorro === "object" && rawAhorro !== null
      ? {
          monto: Number(rawAhorro.monto ?? 200000),
          asignado: rawAhorro.asignado || "david",
          pagado: Boolean(rawAhorro.pagado),
          pagadoPor: rawAhorro.pagadoPor || (rawAhorro.pagado ? rawAhorro.asignado || "david" : null),
        }
      : { monto: 200000, asignado: "david", pagado: false, pagadoPor: null };

  const rawLibre = raw.dineroLibre;
  const dineroLibre =
    typeof rawLibre === "object" && rawLibre !== null
      ? {
          monto: Number(rawLibre.monto ?? 300000),
          asignado: rawLibre.asignado || "david",
          pagado: Boolean(rawLibre.pagado),
          pagadoPor: rawLibre.pagadoPor || (rawLibre.pagado ? rawLibre.asignado || "david" : null),
        }
      : { monto: 300000, asignado: "david", pagado: false, pagadoPor: null };

  return {
    ...raw,
    ingresos,
    ingresosExtras,
    gastosFijos,
    ahorroProgramado,
    dineroLibre,
    abonos: raw.abonos || {},
  };
}

function suggestAbonos(disponibleTotal, debts, existingAbonos = {}) {
  // 1. Cuánto dinero ya fue comprometido explícitamente en active.abonos
  const yaComprometido = Object.entries(existingAbonos).reduce((s, [, v]) => s + (v?.monto || 0), 0);
  let disponible = Math.max(0, disponibleTotal - yaComprometido);

  const map = {};

  // 2. Si ya hay abonos registrados en active.abonos, respetamos ese monto
  Object.entries(existingAbonos).forEach(([id, v]) => {
    map[id] = v?.monto || 0;
  });

  // 3. Sugerir dinero restante SOLO a deudas que aún no tienen abono definido y tienen saldo
  const ordered = [...debts]
    .filter((d) => d.saldo > 0 && !d.soloCuotaFija && !existingAbonos[d.id])
    .sort((a, b) => a.prioridad - b.prioridad);

  for (const d of ordered) {
    if (disponible <= 0) {
      map[d.id] = 0;
      continue;
    }
    const asignado = Math.min(disponible, d.saldo);
    map[d.id] = asignado;
    disponible -= asignado;
  }
  return map;
}

// Detectar si una deuda vence en o antes de la quincena activa
function isDebtDueInActiveQuincena(dateStr, tipo, mes, anio) {
  if (!dateStr) return false;
  const parts = dateStr.split("-");
  if (parts.length < 3) return false;
  const dYear = parseInt(parts[0], 10);
  const dMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const dDay = parseInt(parts[2], 10);

  // Exact quincena match
  const dTipo = dDay <= 15 ? "Q1" : "Q2";
  if (dYear === anio && dMonth === mes && dTipo === tipo) {
    return true;
  }

  // Deuda vencida antes de o durante esta quincena
  const qEndDay = tipo === "Q1" ? 15 : 31;
  const qEndDate = new Date(anio, mes, qEndDay, 23, 59, 59);
  const debtDate = new Date(dYear, dMonth, dDay);
  return debtDate <= qEndDate;
}

// Donut Chart con 4 segmentos (Gastos, Deudas, Ahorro, Libre)
function EconomyDonutChart({ gastos, deudas, ahorros, libre, totalTitle, size = 180, strokeWidth = 24 }) {
  const total = (gastos || 0) + (deudas || 0) + (ahorros || 0) + (libre || 0);

  const pGastos = total > 0 ? (gastos / total) * 100 : 0;
  const pDeudas = total > 0 ? (deudas / total) * 100 : 0;
  const pAhorros = total > 0 ? (ahorros / total) * 100 : 0;
  const pLibre = total > 0 ? (libre / total) * 100 : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const dashGastos = (pGastos / 100) * circumference;
  const dashDeudas = (pDeudas / 100) * circumference;
  const dashAhorros = (pAhorros / 100) * circumference;
  const dashLibre = (pLibre / 100) * circumference;

  const offsetGastos = 0;
  const offsetDeudas = -dashGastos;
  const offsetAhorros = -(dashGastos + dashDeudas);
  const offsetLibre = -(dashGastos + dashDeudas + dashAhorros);

  return (
    <div className="donut-wrap">
      <div className="donut-svg-container" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth={strokeWidth}
          />
          {pGastos > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashGastos} ${circumference - dashGastos}`}
              strokeDashoffset={offsetGastos}
              strokeLinecap="round"
            />
          )}
          {pDeudas > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashDeudas} ${circumference - dashDeudas}`}
              strokeDashoffset={offsetDeudas}
              strokeLinecap="round"
            />
          )}
          {pAhorros > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#3b82f6"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashAhorros} ${circumference - dashAhorros}`}
              strokeDashoffset={offsetAhorros}
              strokeLinecap="round"
            />
          )}
          {pLibre > 0 && (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#8b5cf6"
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLibre} ${circumference - dashLibre}`}
              strokeDashoffset={offsetLibre}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="donut-center">
          <span className="donut-label">{totalTitle || "Total"}</span>
          <strong className="donut-val">{fmt(total)}</strong>
        </div>
      </div>

      <div className="donut-legend">
        <div className="legend-item">
          <span className="dot dot-gastos" />
          <div className="legend-info">
            <span className="legend-name">Gastos fijos</span>
            <strong>{pGastos.toFixed(1)}% ({fmt(gastos)})</strong>
          </div>
        </div>
        <div className="legend-item">
          <span className="dot dot-deudas" />
          <div className="legend-info">
            <span className="legend-name">Abono extra deudas</span>
            <strong>{pDeudas.toFixed(1)}% ({fmt(deudas)})</strong>
          </div>
        </div>
        <div className="legend-item">
          <span className="dot dot-ahorros" />
          <div className="legend-info">
            <span className="legend-name">Ahorro (Alcancía)</span>
            <strong>{pAhorros.toFixed(1)}% ({fmt(ahorros)})</strong>
          </div>
        </div>
        <div className="legend-item">
          <span className="dot dot-libre" />
          <div className="legend-info">
            <span className="legend-name">Dinero libre / Ocio</span>
            <strong>{pLibre.toFixed(1)}% ({fmt(libre)})</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// Alcancía de cerdito transparente que se llena de dinero (Liquid Piggy Bank)
function LiquidPiggyBank({ balance, goal }) {
  const percent = Math.min(100, Math.max(0, goal > 0 ? (balance / goal) * 100 : 0));
  // Coordenada Y de llenado (vientre entre y=50 e y=150)
  const fillY = 155 - (percent / 100) * 85;

  return (
    <div className="piggy-container">
      <svg width="220" height="190" viewBox="0 0 220 190" className="piggy-svg">
        <defs>
          <linearGradient id="piggyFillGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="40%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
          </linearGradient>
          <clipPath id="piggyBellyClip">
            <ellipse cx="110" cy="110" rx="68" ry="52" />
          </clipPath>
        </defs>

        {/* Patas del cerdito */}
        <rect x="65" y="152" width="18" height="24" rx="8" fill="rgba(255, 255, 255, 0.65)" stroke="rgba(203, 213, 225, 0.8)" strokeWidth="2" />
        <rect x="135" y="152" width="18" height="24" rx="8" fill="rgba(255, 255, 255, 0.65)" stroke="rgba(203, 213, 225, 0.8)" strokeWidth="2" />

        {/* Ranura para monedas superior */}
        <rect x="98" y="52" width="24" height="6" rx="3" fill="#64748b" opacity="0.6" />

        {/* Orejas de cristal */}
        <path d="M 68 68 Q 60 40 82 52 Z" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="2" />
        <path d="M 132 52 Q 154 40 146 68 Z" fill="rgba(255, 255, 255, 0.5)" stroke="rgba(255, 255, 255, 0.85)" strokeWidth="2" />

        {/* Cola rizada */}
        <path d="M 38 105 Q 26 95 30 115 Q 36 122 30 130" fill="none" stroke="rgba(203, 213, 225, 0.9)" strokeWidth="3" strokeLinecap="round" />

        {/* Cuerpo de cristal transparente */}
        <ellipse cx="110" cy="110" rx="68" ry="52" fill="rgba(255, 255, 255, 0.35)" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="3.5" filter="drop-shadow(0 8px 16px rgba(0,0,0,0.04))" />

        {/* Llenado líquido dentro del cuerpo */}
        <g clipPath="url(#piggyBellyClip)">
          {percent > 0 && (
            <>
              <rect x="35" y={fillY} width="150" height="150" fill="url(#piggyFillGrad)" opacity="0.85" className="piggy-liquid-rect" />
              {/* Olas superficiales */}
              <path
                d={`M 35 ${fillY} Q 70 ${fillY - 4} 110 ${fillY} T 185 ${fillY} L 185 180 L 35 180 Z`}
                fill="url(#piggyFillGrad)"
                opacity="0.9"
              />
              {/* Monedas flotantes */}
              {percent > 15 && <circle cx="85" cy={fillY + 20} r="7" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" opacity="0.9" />}
              {percent > 35 && <circle cx="130" cy={fillY + 30} r="8" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" opacity="0.9" />}
              {percent > 65 && <circle cx="105" cy={fillY + 45} r="9" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" opacity="0.9" />}
            </>
          )}
        </g>

        {/* Ojo del cerdito */}
        <circle cx="145" cy="100" r="3.5" fill="#334155" />
        <circle cx="146" cy="99" r="1" fill="white" />

        {/* Trompa / Hocico transparente */}
        <ellipse cx="172" cy="112" rx="14" ry="11" fill="rgba(255, 255, 255, 0.7)" stroke="rgba(255, 255, 255, 0.95)" strokeWidth="2.5" />
        <ellipse cx="169" cy="112" rx="2" ry="3.5" fill="#64748b" opacity="0.6" />
        <ellipse cx="176" cy="112" rx="2" ry="3.5" fill="#64748b" opacity="0.6" />

        {/* Reflejos de cristal */}
        <path d="M 70 85 Q 105 72 135 78" fill="none" stroke="rgba(255, 255, 255, 0.75)" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx="85" cy="98" rx="8" ry="4" fill="rgba(255,255,255,0.4)" transform="rotate(-20 85 98)" />
      </svg>

      <div className="piggy-badge-box">
        <div className="piggy-percent-tag">
          <Coins size={14} className="coin-icon" />
          <span>{percent.toFixed(1)}% completado</span>
        </div>
        <p className="piggy-subtext">
          {percent >= 100 ? "¡Meta completada! 🎊" : `Faltan ${fmt(Math.max(0, goal - balance))} para la meta`}
        </p>
      </div>
    </div>
  );
}

// Badge selector segmented control de 2 opciones (Gastos/Ingresos)
function SegmentedPersonBadge({ value, onChange, labelEveth = "Eveth", labelDavid = "David", title = "" }) {
  return (
    <div className="segmented-badge" title={title}>
      <button
        type="button"
        className={"segmented-opt " + (value === "eveth" ? "active" : "")}
        onClick={() => onChange("eveth")}
      >
        {labelEveth}
      </button>
      <button
        type="button"
        className={"segmented-opt " + (value === "david" ? "active" : "")}
        onClick={() => onChange("david")}
      >
        {labelDavid}
      </button>
    </div>
  );
}

// Badge selector segmented control para Abonos de Deudas con opción de Ambos (Equilibrio)
function SegmentedAbonoBadge({ value = "ambos", onChange, title = "" }) {
  return (
    <div className="segmented-badge segmented-abono-badge" title={title}>
      <button
        type="button"
        className={"segmented-opt " + (value === "david" ? "active" : "")}
        onClick={() => onChange("david")}
      >
        David
      </button>
      <button
        type="button"
        className={"segmented-opt " + (value === "ambos" ? "active active-ambos" : "")}
        onClick={() => onChange("ambos")}
      >
        ⚖️ Ambos
      </button>
      <button
        type="button"
        className={"segmented-opt " + (value === "eveth" ? "active" : "")}
        onClick={() => onChange("eveth")}
      >
        Eveth
      </button>
    </div>
  );
}

function loadLocal(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function SnoopyMoneyLoader({ isFading }) {
  const [amount, setAmount] = useState(0);
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const loadingPhrases = [
    "Contando billetes...",
    "Organizando los pagos de la quincena...",
    "Sincronizando con Cloudflare D1...",
    "¡Todo listo para empezar!",
  ];

  useEffect(() => {
    const target = 2774000;
    const duration = 1500;
    const steps = 30;
    const stepTime = duration / steps;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAmount(target);
        clearInterval(timer);
      } else {
        setAmount(Math.round(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const textInterval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingPhrases.length);
    }, 550);
    return () => clearInterval(textInterval);
  }, [loadingPhrases.length]);

  return (
    <div className={`snoopy-loader-overlay ${isFading ? "loader-fading" : ""}`}>
      <div className="loader-ambient-glow" />

      <div className="snoopy-loader-card">
        {/* Partículas flotantes de billetes animados */}
        <div className="money-particles-container">
          <div className="money-bill-fly bill-fly-1">💵</div>
          <div className="money-bill-fly bill-fly-2">💸</div>
          <div className="money-bill-fly bill-fly-3">💵</div>
          <div className="money-bill-fly bill-fly-4">✨</div>
          <div className="money-bill-fly bill-fly-5">💵</div>
          <div className="money-bill-fly bill-fly-6">💸</div>
        </div>

        {/* Personaje Snoopy con bolsa de dinero y billetes */}
        <div className="snoopy-img-stage">
          <div className="snoopy-halo-ring" />
          <img
            src="/snoopy-banker.png"
            alt="Snoopy banquero contando billetes"
            className="snoopy-money-character"
          />
        </div>

        {/* Encabezado */}
        <div className="snoopy-loader-header">
          <span className="loader-eyebrow">🐾 Snoopy Bank</span>
          <h1 className="loader-app-title">Planificador Financiero</h1>
        </div>

        {/* Contador animado de billetes */}
        <div className="loader-counter-box">
          <span className="counter-label">Contando presupuesto:</span>
          <strong className="counter-amount">{fmt(amount)}</strong>
        </div>

        {/* Barra de progreso interactiva */}
        <div className="loader-progress-track">
          <div className="loader-progress-fill" />
        </div>

        {/* Frase animada rotativa */}
        <p className="loader-caption-text">
          {loadingPhrases[loadingTextIndex]}
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [showInitialLoader, setShowInitialLoader] = useState(true);
  const [loaderFading, setLoaderFading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState("local");
  const [activeTab, setActiveTab] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [debts, setDebts] = useState(() => {
    const d = loadLocal("finanzas:debts", DEFAULT_DEBTS);
    let initialDebts = (d || DEFAULT_DEBTS).map((debt) => {
      const { asignado, ...rest } = debt;
      return rest;
    });
    if (!initialDebts.some((debt) => debt.id === "carro_credito" || debt.concepto?.toLowerCase().includes("carro"))) {
      initialDebts.push(DEFAULT_DEBTS.find((debt) => debt.id === "carro_credito"));
    }
    return initialDebts;
  });
  const [templates, setTemplates] = useState(() => loadLocal("finanzas:templates", { Q1: TEMPLATE_Q1, Q2: TEMPLATE_Q2 }));
  const [scheduledExpenses, setScheduledExpenses] = useState(() => loadLocal("finanzas:scheduled", DEFAULT_SCHEDULED));
  const [active, setActive] = useState(() => {
    const saved = loadLocal("finanzas:active", null);
    if (saved) return sanitizeActive(saved);
    const now = new Date();
    return buildActiveFromTemplate("Q1", TEMPLATE_Q1, now.getMonth(), now.getFullYear(), DEFAULT_SCHEDULED);
  });
  const [history, setHistory] = useState(() => loadLocal("finanzas:history", []));
  const [savings, setSavings] = useState(() => loadLocal("finanzas:savings", DEFAULT_SAVINGS));
  const [periodDrafts, setPeriodDrafts] = useState(() => loadLocal("finanzas:period_drafts", {}));

  // Estados para guardado manual y confirmaciones
  const [saveStatusAnim, setSaveStatusAnim] = useState("idle"); // "idle" | "saving" | "saved"
  const [lastSavedTime, setLastSavedTime] = useState(() => loadLocal("finanzas:last_saved_time", null));
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [filtroEstadoGasto, setFiltroEstadoGasto] = useState("todos"); // "todos" | "pendientes" | "pagados"

  // UI States: Acordeones y desplegables
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [expandedDebtIds, setExpandedDebtIds] = useState({});
  const [expandedHistoryIds, setExpandedHistoryIds] = useState({});
  const [mostrarTodasDeudasHome, setMostrarTodasDeudasHome] = useState(false);
  const [debtAutoSaved, setDebtAutoSaved] = useState(false);

  // Forms
  const [newDebt, setNewDebt] = useState({
    concepto: "", saldo: "", prioridad: "", fechaLimite: "",
    cuotasTotales: "", cuotasRestantes: "", cuotaMensual: "", amortizacionCapital: "", soloCuotaFija: false
  });
  const [newGasto, setNewGasto] = useState({ concepto: "", monto: "", asignado: "eveth", esImprevisto: false, esRecurrente: false });
  const [newExtra, setNewExtra] = useState({ concepto: "", monto: "", persona: "david", destino: "deudas" });
  const [newScheduled, setNewScheduled] = useState({
    concepto: "", monto: "", mes: 10, anio: 2026, tipo: "Q1", asignado: "familiar", recurrenteAnual: true
  });
  const [newManualSavings, setNewManualSavings] = useState({ concepto: "", monto: "", persona: "familiar" });
  const [filtroPersonaHome, setFiltroPersonaHome] = useState("ambos"); // "ambos" | "david" | "eveth"
  const [confirmReset, setConfirmReset] = useState(false);
  const [viewChartScope, setViewChartScope] = useState("quincena");

  const toggleExpandHistory = (id) => setExpandedHistoryIds((prev) => ({ ...prev, [id]: !prev[id] }));

  // Suscribirse a cambios en el estado de sincronización (synced, syncing, local, error)
  useEffect(() => {
    const unsubscribe = subscribeSyncStatus(setSyncStatus);
    return unsubscribe;
  }, []);

  // Cargar estado inicial con respaldo bidireccional en Cloudflare D1
  useEffect(() => {
    let isMounted = true;
    (async () => {
      // 1. Cargar localmente primero (renderizado en 0ms sin latencia)
      const localDebts = loadLocal("finanzas:debts", DEFAULT_DEBTS);
      const localTemplates = loadLocal("finanzas:templates", { Q1: TEMPLATE_Q1, Q2: TEMPLATE_Q2 });
      const localScheduled = loadLocal("finanzas:scheduled", DEFAULT_SCHEDULED);
      const localActive = loadLocal("finanzas:active", null);
      const localHistory = loadLocal("finanzas:history", []);
      const localSavings = loadLocal("finanzas:savings", DEFAULT_SAVINGS);

      // 2. Consultar base de datos Cloudflare D1 en la nube
      let cloudData = null;
      try {
        cloudData = await fetchStateFromCloud();
      } catch (e) {
        console.warn("Modo local activo:", e);
      }

      if (!isMounted) return;

      if (cloudData && Object.keys(cloudData).length > 0) {
        // La nube contiene datos existentes: actualizamos todo el estado
        if (cloudData["finanzas:debts"]) {
          let debtsFromCloud = cloudData["finanzas:debts"].map((debt) => {
            const { asignado, ...rest } = debt;
            return rest;
          });
          if (!debtsFromCloud.some((d) => d.id === "carro_credito" || d.concepto?.toLowerCase().includes("carro"))) {
            debtsFromCloud.push(DEFAULT_DEBTS.find((d) => d.id === "carro_credito"));
          }
          setDebts(debtsFromCloud);
          window.localStorage.setItem("finanzas:debts", JSON.stringify(debtsFromCloud));
        }

        if (cloudData["finanzas:templates"]) {
          setTemplates(cloudData["finanzas:templates"]);
          window.localStorage.setItem("finanzas:templates", JSON.stringify(cloudData["finanzas:templates"]));
        }

        if (cloudData["finanzas:scheduled"]) {
          setScheduledExpenses(cloudData["finanzas:scheduled"]);
          window.localStorage.setItem("finanzas:scheduled", JSON.stringify(cloudData["finanzas:scheduled"]));
        }

        if (cloudData["finanzas:active"]) {
          const sanitized = sanitizeActive(cloudData["finanzas:active"]);
          setActive(sanitized);
          window.localStorage.setItem("finanzas:active", JSON.stringify(sanitized));
        }

        if (cloudData["finanzas:history"]) {
          setHistory(cloudData["finanzas:history"]);
          window.localStorage.setItem("finanzas:history", JSON.stringify(cloudData["finanzas:history"]));
        }

        if (cloudData["finanzas:savings"]) {
          setSavings(cloudData["finanzas:savings"]);
          window.localStorage.setItem("finanzas:savings", JSON.stringify(cloudData["finanzas:savings"]));
        }

        if (cloudData["finanzas:period_drafts"]) {
          setPeriodDrafts(cloudData["finanzas:period_drafts"]);
          window.localStorage.setItem("finanzas:period_drafts", JSON.stringify(cloudData["finanzas:period_drafts"]));
        }

        if (cloudData["finanzas:last_saved_time"]) {
          setLastSavedTime(cloudData["finanzas:last_saved_time"]);
          window.localStorage.setItem("finanzas:last_saved_time", JSON.stringify(cloudData["finanzas:last_saved_time"]));
        }
      } else if (cloudData !== null) {
        // D1 está activo pero vacío (primer despliegue). Subimos los datos base a la nube.
        saveBatchWithSync({
          "finanzas:debts": localDebts,
          "finanzas:templates": localTemplates,
          "finanzas:scheduled": localScheduled,
          "finanzas:active": localActive || active,
          "finanzas:history": localHistory,
          "finanzas:savings": localSavings,
        });
      }

      // Marcamos como cargado para habilitar la persistencia automática de cambios futuros
      setLoaded(true);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Animación de bienvenida y conteo de billetes de Snoopy al abrir
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaderFading(true);
      setTimeout(() => {
        setShowInitialLoader(false);
      }, 500);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  // Sincronización híbrida automática: solo activa tras completar la comprobación inicial
  useEffect(() => { if (loaded) saveKeyWithSync("finanzas:debts", debts); }, [debts, loaded]);
  useEffect(() => { if (loaded) saveKeyWithSync("finanzas:templates", templates); }, [templates, loaded]);
  useEffect(() => { if (loaded) saveKeyWithSync("finanzas:scheduled", scheduledExpenses); }, [scheduledExpenses, loaded]);
  useEffect(() => { if (loaded && active) saveKeyWithSync("finanzas:active", active); }, [active, loaded]);
  useEffect(() => { if (loaded) saveKeyWithSync("finanzas:history", history); }, [history, loaded]);
  useEffect(() => { if (loaded) saveKeyWithSync("finanzas:savings", savings); }, [savings, loaded]);
  useEffect(() => { if (loaded) saveKeyWithSync("finanzas:period_drafts", periodDrafts); }, [periodDrafts, loaded]);

  // Guardado manual explícito con confirmación táctil y sincronización a la nube
  const handleManualSave = async () => {
    if (!active) return;
    setSaveStatusAnim("saving");
    const now = new Date();
    const timeStr = now.toLocaleTimeString("es-CO", { hour: "numeric", minute: "2-digit", hour12: true });

    // Guardar el estado actual en el borrador del período
    const currentKey = `${active.tipo}_${active.mes}_${active.anio}`;
    const updatedDrafts = { ...periodDrafts, [currentKey]: active };
    setPeriodDrafts(updatedDrafts);

    const fullPayload = {
      "finanzas:active": active,
      "finanzas:debts": debts,
      "finanzas:templates": templates,
      "finanzas:scheduled": scheduledExpenses,
      "finanzas:history": history,
      "finanzas:savings": savings,
      "finanzas:period_drafts": updatedDrafts,
      "finanzas:last_saved_time": timeStr,
    };

    setLastSavedTime(timeStr);
    window.localStorage.setItem("finanzas:last_saved_time", JSON.stringify(timeStr));

    try {
      await saveBatchWithSync(fullPayload);
    } catch (e) {
      console.warn("Guardado local completado:", e);
    }

    setSaveStatusAnim("saved");
    setShowSaveToast(true);

    setTimeout(() => {
      setShowSaveToast(false);
    }, 3200);

    setTimeout(() => {
      setSaveStatusAnim("idle");
    }, 2500);
  };

  // Determinar si el período actual ya fue archivado en el Histórico
  const currentHistoryItem = useMemo(() => {
    if (!active) return null;
    return history.find(
      (h) => (h.tipo === active.tipo && h.mes === active.mes && h.anio === active.anio) || h.label === periodLabel(active.tipo, active.mes, active.anio)
    );
  }, [active, history]);

  // Los 3 Estados del Ciclo de Vida: 1. Vacía (default) | 2. En progreso | 3. Archivada (cerrada)
  const quincenaLifecycleState = useMemo(() => {
    if (!active) return "vacia";
    if (currentHistoryItem) return "archivada";

    const tienePagos =
      active.gastosFijos?.some((g) => g.pagado) ||
      (active.ingresosExtras && active.ingresosExtras.length > 0) ||
      Object.values(active.abonos || {}).some((a) => a?.pagado) ||
      active.ahorroProgramado?.pagado ||
      active.dineroLibre?.pagado;

    return tienePagos ? "en_progreso" : "vacia";
  }, [active, currentHistoryItem]);

  // Reabrir una quincena archivada para permitir correcciones
  const handleReabrirQuincena = (historyItem) => {
    if (!historyItem) return;
    const conf = window.confirm(
      `¿Deseas reabrir la "${historyItem.label}"? Esto la devolverá al estado "2. En progreso" para que puedas hacer ajustes, registrar nuevos pagos y volver a guardar.`
    );
    if (!conf) return;

    // 1. Quitarla del historial
    const updatedHistory = history.filter((h) => h.id !== historyItem.id);
    setHistory(updatedHistory);
    saveKeyWithSync("finanzas:history", updatedHistory);

    // 2. Restaurar el estado activo con los datos que tenía al cerrar
    if (historyItem.activeState) {
      setActive(sanitizeActive(historyItem.activeState));
    } else {
      const t = templates[historyItem.tipo || "Q1"] || templates.Q1;
      setActive(buildActiveFromTemplate(historyItem.tipo || "Q1", t, historyItem.mes ?? 0, historyItem.anio ?? 2026, scheduledExpenses));
    }

    setActiveTab("home");
  };

  const calculations = useMemo(() => {
    if (!active) return null;

    const baseIngresosDavid = active.ingresos?.david || 0;
    const baseIngresosEveth = active.ingresos?.eveth || 0;
    const ingresosBaseTotal = baseIngresosDavid + baseIngresosEveth;

    const extrasDavid = (active.ingresosExtras || []).filter((e) => e.persona === "david");
    const extrasEveth = (active.ingresosExtras || []).filter((e) => e.persona === "eveth");
    const totalExtrasDavid = extrasDavid.reduce((s, e) => s + e.monto, 0);
    const totalExtrasEveth = extrasEveth.reduce((s, e) => s + e.monto, 0);

    const extrasParaDeudas = (active.ingresosExtras || []).filter((e) => e.destino === "deudas").reduce((s, e) => s + e.monto, 0);
    const extrasParaAhorro = (active.ingresosExtras || []).filter((e) => e.destino === "ahorro").reduce((s, e) => s + e.monto, 0);
    const totalIngresosConExtras = ingresosBaseTotal + extrasParaDeudas + extrasParaAhorro;

    const gastosTotal = active.gastosFijos.reduce((s, g) => s + (g.monto || 0), 0);
    const gastosPagados = active.gastosFijos.filter((g) => g.pagado).reduce((s, g) => s + (g.monto || 0), 0);

    const gastosImprevistosTotal = active.gastosFijos
      .filter((g) => g.tipoGasto === "imprevisto")
      .reduce((s, g) => s + (g.monto || 0), 0);

    // Separación explícita: Ahorro programado vs Dinero Libre
    const ahorroMonto = active.ahorroProgramado?.monto || 0;
    const libreMonto = active.dineroLibre?.monto || 0;

    const disponibleDeudas = Math.max(0, ingresosBaseTotal + extrasParaDeudas - gastosTotal - ahorroMonto - libreMonto);

    const suggested = suggestAbonos(disponibleDeudas, debts, active.abonos);
    const orderedDebts = [...debts]
      .filter((d) => d.saldo > 0 || (active.abonos && active.abonos[d.id]))
      .sort((a, b) => a.prioridad - b.prioridad);

    const abonosPlaneados = orderedDebts.reduce((s, d) => {
      const ov = active.abonos[d.id];
      return s + (ov ? ov.monto : suggested[d.id] || 0);
    }, 0);

    const abonosPagados = Object.entries(active.abonos)
      .filter(([, v]) => v.pagado)
      .reduce((s, [, v]) => s + (v.monto || 0), 0);

    // Deuda focalizada (la primera prioritaria sin cuota fija)
    const focalDebt = orderedDebts.find((d) => !d.soloCuotaFija) || orderedDebts[0] || null;

    // Deudas que vencen en esta quincena activa
    const debtsDueInActiveQuincena = debts.filter(
      (d) => d.saldo > 0 && isDebtDueInActiveQuincena(d.fechaLimite, active.tipo, active.mes, active.anio)
    );

    // 1. Capacidad disponible individual antes de abonos a deudas para lograr equilibrio exacto
    const gastosDavid = active.gastosFijos.filter((g) => (g.asignado || "david") === "david").reduce((s, g) => s + (g.monto || 0), 0);
    const gastosEveth = active.gastosFijos.filter((g) => (g.asignado || "david") === "eveth").reduce((s, g) => s + (g.monto || 0), 0);

    const ahorroD = (active.ahorroProgramado?.asignado || "david") === "david" ? ahorroMonto : 0;
    const ahorroE = (active.ahorroProgramado?.asignado || "david") === "eveth" ? ahorroMonto : 0;
    const libreD = (active.dineroLibre?.asignado || "david") === "david" ? libreMonto : 0;
    const libreE = (active.dineroLibre?.asignado || "david") === "eveth" ? libreMonto : 0;

    const capDavid = Math.max(0, baseIngresosDavid + totalExtrasDavid - gastosDavid - ahorroD - libreD);
    const capEveth = Math.max(0, baseIngresosEveth + totalExtrasEveth - gastosEveth - ahorroE - libreE);
    const capTotal = capDavid + capEveth;

    // 2. Distribución equilibrada de deudas
    const debtShares = {};
    let remCapDavid = capDavid;
    let remCapEveth = capEveth;

    orderedDebts.forEach((d) => {
      const ov = active.abonos[d.id];
      const monto = ov ? ov.monto : (suggested[d.id] || 0);
      const asignado = ov?.asignado || "ambos";

      let davidShare = 0;
      let evethShare = 0;

      if (asignado === "david") {
        davidShare = monto;
        evethShare = 0;
        remCapDavid = Math.max(0, remCapDavid - davidShare);
      } else if (asignado === "eveth") {
        davidShare = 0;
        evethShare = monto;
        remCapEveth = Math.max(0, remCapEveth - evethShare);
      } else {
        // "ambos" - distribución proporcional según capacidad restante para evitar que se pase del sueldo
        const remCapTotal = remCapDavid + remCapEveth;
        if (remCapTotal > 0) {
          davidShare = Math.min(remCapDavid, Math.round(monto * (remCapDavid / remCapTotal)));
          evethShare = monto - davidShare;
        } else {
          davidShare = Math.round(monto / 2);
          evethShare = monto - davidShare;
        }
        remCapDavid = Math.max(0, remCapDavid - davidShare);
        remCapEveth = Math.max(0, remCapEveth - evethShare);
      }
      debtShares[d.id] = { total: monto, david: davidShare, eveth: evethShare, asignado };
    });

    // Balances individuales
    const computePerson = (personKey) => {
      const base = personKey === "david" ? baseIngresosDavid : baseIngresosEveth;
      const extras = personKey === "david" ? totalExtrasDavid : totalExtrasEveth;
      const ingresoTotalPersona = base + extras;

      const gastosAsignados = active.gastosFijos.filter((g) => (g.asignado || "david") === personKey);
      const totalGastosAsignados = gastosAsignados.reduce((s, g) => s + (g.monto || 0), 0);

      // Ahorro y Libre asignados
      const ahorroAsignado = (active.ahorroProgramado?.asignado || "david") === personKey ? ahorroMonto : 0;
      const libreAsignado = (active.dineroLibre?.asignado || "david") === personKey ? libreMonto : 0;

      // Abonos calculados en base a debtShares equilibrados
      const abonosAsignados = orderedDebts.reduce((s, d) => {
        const share = debtShares[d.id] || { david: 0, eveth: 0 };
        return s + (personKey === "david" ? share.david : share.eveth);
      }, 0);

      const totalComprometido = totalGastosAsignados + ahorroAsignado + libreAsignado + abonosAsignados;
      const restanteSueldo = ingresoTotalPersona - totalComprometido;

      const gastosPagadosPersona = active.gastosFijos
        .filter((g) => g.pagado && (g.pagadoPor || g.asignado) === personKey)
        .reduce((s, g) => s + (g.monto || 0), 0);

      const ahorroPagadoPersona =
        active.ahorroProgramado?.pagado && (active.ahorroProgramado?.pagadoPor || active.ahorroProgramado?.asignado) === personKey
          ? ahorroMonto
          : 0;

      const librePagadoPersona =
        active.dineroLibre?.pagado && (active.dineroLibre?.pagadoPor || active.dineroLibre?.asignado) === personKey
          ? libreMonto
          : 0;

      const abonosPagadosPersona = Object.entries(active.abonos)
        .filter(([, v]) => v.pagado)
        .reduce((s, [id, v]) => {
          const share = debtShares[id] || { david: 0, eveth: 0, total: v.monto };
          const pagador = v.pagadoPor || v.asignado || "ambos";
          if (pagador === personKey) {
            return s + (v.monto || 0);
          } else if (pagador === "ambos") {
            return s + (personKey === "david" ? share.david : share.eveth);
          }
          return s;
        }, 0);

      const totalDesembolsado = gastosPagadosPersona + ahorroPagadoPersona + librePagadoPersona + abonosPagadosPersona;
      const saldoEnCuenta = ingresoTotalPersona - totalDesembolsado;

      return {
        ingresoBase: base,
        extras,
        ingresoTotal: ingresoTotalPersona,
        totalAsignado: totalComprometido,
        restanteSueldo,
        excede: restanteSueldo < 0,
        totalPagado: totalDesembolsado,
        saldoEnCuenta,
        cantGastos: gastosAsignados.length,
      };
    };

    const davidStats = computePerson("david");
    const evethStats = computePerson("eveth");

    // Proyección mensual
    const q1T = templates.Q1;
    const q2T = templates.Q2;
    const mesIngresos = (q1T.ingresos.david || 0) + (q1T.ingresos.eveth || 0) + (q2T.ingresos.david || 0) + (q2T.ingresos.eveth || 0);
    const mesGastos = (q1T.gastosFijos || []).reduce((s, g) => s + g.monto, 0) + (q2T.gastosFijos || []).reduce((s, g) => s + g.monto, 0);
    const mesAhorro =
      (typeof q1T.ahorroProgramado === "object" ? q1T.ahorroProgramado.monto : q1T.ahorroProgramado || 0) +
      (typeof q2T.ahorroProgramado === "object" ? q2T.ahorroProgramado.monto : q2T.ahorroProgramado || 0);
    const mesLibre =
      (typeof q1T.dineroLibre === "object" ? q1T.dineroLibre.monto : q1T.dineroLibre || 0) +
      (typeof q2T.dineroLibre === "object" ? q2T.dineroLibre.monto : q2T.dineroLibre || 0);
    const mesDeudas = Math.max(0, mesIngresos - mesGastos - mesAhorro - mesLibre);

    return {
      ingresosBaseTotal,
      extrasParaDeudas,
      extrasParaAhorro,
      totalExtrasParaAhorro: extrasParaAhorro,
      totalIngresosConExtras,
      gastosTotal,
      gastosPagados,
      gastosImprevistosTotal,
      ahorroMonto,
      libreMonto,
      disponibleDeudas,
      suggested,
      orderedDebts,
      debtShares,
      debtsDueInActiveQuincena,
      focalDebt,
      abonosPlaneados,
      abonosPagados,
      totalPagado:
        gastosPagados +
        abonosPagados +
        (active?.ahorroProgramado?.pagado ? ahorroMonto : 0) +
        (active?.dineroLibre?.pagado ? libreMonto : 0),
      davidStats,
      evethStats,
      totalDeuda: debts.reduce((s, d) => s + d.saldo, 0),
      chartCurrent: {
        gastos: gastosTotal,
        deudas: abonosPlaneados,
        ahorros: ahorroMonto + extrasParaAhorro,
        libre: libreMonto,
        total: gastosTotal + abonosPlaneados + ahorroMonto + extrasParaAhorro + libreMonto,
      },
      chartMonth: {
        gastos: mesGastos,
        deudas: mesDeudas,
        ahorros: mesAhorro,
        libre: mesLibre,
        total: mesIngresos,
      },
    };
  }, [active, debts, templates]);

  const filteredGastos = useMemo(() => {
    if (!active?.gastosFijos) return [];
    if (filtroPersonaHome === "ambos") return active.gastosFijos;
    return active.gastosFijos.filter((g) => g.asignado === filtroPersonaHome);
  }, [active?.gastosFijos, filtroPersonaHome]);

  const gastosStats = useMemo(() => {
    const total = filteredGastos.length;
    const pagados = filteredGastos.filter((g) => g.pagado).length;
    const pendientes = total - pagados;
    const montoTotal = filteredGastos.reduce((s, g) => s + (g.monto || 0), 0);
    const montoPagado = filteredGastos.filter((g) => g.pagado).reduce((s, g) => s + (g.monto || 0), 0);
    const pct = total > 0 ? Math.round((pagados / total) * 100) : 0;
    return { total, pagados, pendientes, montoTotal, montoPagado, pct };
  }, [filteredGastos]);

  const displayGastos = useMemo(() => {
    if (filtroEstadoGasto === "pendientes") return filteredGastos.filter((g) => !g.pagado);
    if (filtroEstadoGasto === "pagados") return filteredGastos.filter((g) => g.pagado);
    return filteredGastos;
  }, [filteredGastos, filtroEstadoGasto]);

  const filteredDebts = useMemo(() => {
    if (!calculations?.orderedDebts) return [];
    if (filtroPersonaHome === "ambos") return calculations.orderedDebts;
    return calculations.orderedDebts.filter((d) => {
      const ov = active?.abonos?.[d.id];
      const asig = ov?.asignado || "ambos";
      const share = calculations?.debtShares?.[d.id] || { david: 0, eveth: 0 };
      if (filtroPersonaHome === "david") {
        return asig === "david" || (asig === "ambos" && (share.david || 0) > 0);
      }
      if (filtroPersonaHome === "eveth") {
        return asig === "eveth" || (asig === "ambos" && (share.eveth || 0) > 0);
      }
      return true;
    });
  }, [calculations?.orderedDebts, active?.abonos, calculations?.debtShares, filtroPersonaHome]);

  const focalDebtView = useMemo(() => {
    if (filtroPersonaHome === "ambos") return calculations?.focalDebt || null;
    return filteredDebts[0] || null;
  }, [filtroPersonaHome, calculations?.focalDebt, filteredDebts]);

  const { debtsConPago, debtsEnCero } = useMemo(() => {
    const all = calculations?.orderedDebts || [];
    const conPago = [];
    const enCero = [];

    all.forEach((d) => {
      const ov = active?.abonos?.[d.id];
      const montoSugerido = calculations?.suggested?.[d.id] || 0;
      const monto = ov ? ov.monto : montoSugerido;
      const asignado = ov?.asignado || "ambos";
      const share = calculations?.debtShares?.[d.id] || { david: 0, eveth: 0 };
      const myShare = filtroPersonaHome === "david"
        ? (asignado === "david" ? monto : (share.david || 0))
        : (asignado === "eveth" ? monto : (share.eveth || 0));

      const hasPayment = filtroPersonaHome === "ambos" ? monto > 0 : myShare > 0;

      if (hasPayment) {
        conPago.push(d);
      } else {
        enCero.push(d);
      }
    });

    // Si ninguna deuda tiene pago asignado todavía, mostramos al menos la deuda foco prioritaria
    if (conPago.length === 0 && all.length > 0) {
      const focal = focalDebtView || all[0];
      return {
        debtsConPago: [focal],
        debtsEnCero: all.filter((d) => d.id !== focal.id),
      };
    }

    return { debtsConPago: conPago, debtsEnCero: enCero };
  }, [calculations?.orderedDebts, calculations?.suggested, calculations?.debtShares, active?.abonos, filtroPersonaHome, focalDebtView]);

  const filteredExtras = useMemo(() => {
    if (!active?.ingresosExtras) return [];
    if (filtroPersonaHome === "ambos") return active.ingresosExtras;
    return active.ingresosExtras.filter((e) => e.persona === filtroPersonaHome);
  }, [active?.ingresosExtras, filtroPersonaHome]);

  // Mutaciones de Gastos con opción de Guardar como Recurrente
  const updateGasto = (id, patch) => {
    setActive({
      ...active,
      gastosFijos: active.gastosFijos.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    });
  };

  const toggleGastoPagado = (g) => {
    if (!g.pagado) {
      updateGasto(g.id, { pagado: true, pagadoPor: g.asignado });
    } else {
      updateGasto(g.id, { pagado: false, pagadoPor: null });
    }
  };

  const addGasto = () => {
    if (!newGasto.concepto.trim() || !newGasto.monto) return;
    const item = {
      id: uid(),
      concepto: newGasto.concepto.trim(),
      monto: Number(newGasto.monto),
      asignado: newGasto.asignado || "eveth",
      tipoGasto: newGasto.esImprevisto ? "imprevisto" : "fijo",
      pagado: false,
      pagadoPor: null,
    };
    setActive({ ...active, gastosFijos: [...active.gastosFijos, item] });

    // Si marcó como recurrente, añadir a la plantilla de esta quincena para el futuro
    if (newGasto.esRecurrente && !newGasto.esImprevisto) {
      const targetTemplate = templates[active.tipo];
      const updatedTemplate = {
        ...targetTemplate,
        gastosFijos: [
          ...(targetTemplate.gastosFijos || []),
          { id: item.id, concepto: item.concepto, monto: item.monto, asignado: item.asignado, tipoGasto: "fijo" },
        ],
      };
      setTemplates({ ...templates, [active.tipo]: updatedTemplate });
    }

    setNewGasto({ concepto: "", monto: "", asignado: newGasto.asignado, esImprevisto: false, esRecurrente: false });
    setShowGastoForm(false);
  };

  const removeGasto = (id) => {
    setActive({ ...active, gastosFijos: active.gastosFijos.filter((g) => g.id !== id) });
  };

  // Ingresos Extras
  const addExtraIncome = () => {
    if (!newExtra.concepto.trim() || !newExtra.monto) return;
    const extra = {
      id: uid(),
      concepto: newExtra.concepto.trim(),
      monto: Number(newExtra.monto),
      persona: newExtra.persona || "david",
      destino: newExtra.destino || "deudas",
    };
    setActive({
      ...active,
      ingresosExtras: [...(active.ingresosExtras || []), extra],
    });
    setNewExtra({ concepto: "", monto: "", persona: newExtra.persona, destino: newExtra.destino });
    setShowExtraForm(false);
  };

  const removeExtraIncome = (id) => {
    setActive({
      ...active,
      ingresosExtras: (active.ingresosExtras || []).filter((e) => e.id !== id),
    });
  };

  // Modificar y autoguardar deudas en tiempo real
  const updateDebt = (id, patch) => {
    setDebts((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, ...patch } : d));
      saveKeyWithSync("finanzas:debts", next);
      return next;
    });
    setDebtAutoSaved(true);
    setTimeout(() => setDebtAutoSaved(false), 2000);
  };

  // Abonos a Deudas
  const toggleAbonoPagado = (debt) => {
    const ov = active.abonos[debt.id];
    const monto = ov ? ov.monto : calculations.suggested[debt.id] || 0;
    const yaPagado = ov ? ov.pagado : false;
    const asignado = ov?.asignado || "ambos";

    if (!yaPagado) {
      setDebts((prev) => {
        const next = prev.map((d) => (d.id === debt.id ? { ...d, saldo: Math.max(0, d.saldo - monto) } : d));
        saveKeyWithSync("finanzas:debts", next);
        return next;
      });
      setActive({
        ...active,
        abonos: { ...active.abonos, [debt.id]: { monto, pagado: true, asignado, pagadoPor: asignado } },
      });
    } else {
      setDebts((prev) => {
        const next = prev.map((d) => (d.id === debt.id ? { ...d, saldo: d.saldo + monto } : d));
        saveKeyWithSync("finanzas:debts", next);
        return next;
      });
      setActive({
        ...active,
        abonos: { ...active.abonos, [debt.id]: { monto, pagado: false, asignado, pagadoPor: null } },
      });
    }
  };

  const updateAbonoField = (debtId, patch) => {
    const prev = active.abonos[debtId] || {
      monto: calculations.suggested[debtId] || 0,
      asignado: "ambos",
      pagado: false,
      pagadoPor: null,
    };
    setActive({
      ...active,
      abonos: { ...active.abonos, [debtId]: { ...prev, ...patch } },
    });
  };

  // Ahorro Programado vs Dinero Libre Toggles
  const toggleAhorroPagado = () => {
    const yaPagado = active.ahorroProgramado?.pagado;
    setActive({
      ...active,
      ahorroProgramado: {
        ...active.ahorroProgramado,
        pagado: !yaPagado,
        pagadoPor: !yaPagado ? active.ahorroProgramado.asignado || "david" : null,
      },
    });
  };

  const toggleDineroLibrePagado = () => {
    const yaPagado = active.dineroLibre?.pagado;
    setActive({
      ...active,
      dineroLibre: {
        ...active.dineroLibre,
        pagado: !yaPagado,
        pagadoPor: !yaPagado ? active.dineroLibre.asignado || "david" : null,
      },
    });
  };

  // Cierre de quincena
  const cerrarQuincena = () => {
    let updatedDebts = [...debts];

    const gastoCarroPagado = active.gastosFijos.find(
      (g) => g.pagado && (g.amortizaDeudaId === "carro_credito" || g.concepto?.toLowerCase() === "carro")
    );

    if (gastoCarroPagado) {
      const deudaCarro = updatedDebts.find((d) => d.id === "carro_credito");
      if (deudaCarro && deudaCarro.saldo > 0) {
        const amortizacion = deudaCarro.amortizacionCapital || 700000;
        const nuevoSaldo = Math.max(0, deudaCarro.saldo - amortizacion);
        const nuevasCuotas = deudaCarro.cuotasRestantes ? Math.max(0, deudaCarro.cuotasRestantes - 1) : null;
        updatedDebts = updatedDebts.map((d) =>
          d.id === "carro_credito"
            ? { ...d, saldo: nuevoSaldo, cuotasRestantes: nuevasCuotas }
            : d
        );
      }
    }
    setDebts(updatedDebts);

    const deudaPendienteDespues = updatedDebts.reduce((s, d) => s + d.saldo, 0);
    const label = periodLabel(active.tipo, active.mes, active.anio);

    // Separación real: solo entra a ahorros el ahorro programado pagado + extras para ahorro
    const extrasAhorro = (active.ingresosExtras || []).filter((e) => e.destino === "ahorro");
    const totalExtrasAhorro = extrasAhorro.reduce((s, e) => s + e.monto, 0);
    const ahorroBasePagado = active.ahorroProgramado?.pagado ? active.ahorroProgramado.monto : 0;
    const totalAhorroQuincena = ahorroBasePagado + totalExtrasAhorro;

    if (totalAhorroQuincena > 0) {
      const nuevosRegistros = [];
      if (ahorroBasePagado > 0) {
        nuevosRegistros.push({
          id: uid(),
          fecha: new Date().toLocaleDateString("es-CO"),
          concepto: `Ahorro quincenal (${label})`,
          monto: ahorroBasePagado,
          persona: active.ahorroProgramado?.pagadoPor || active.ahorroProgramado?.asignado || "david",
        });
      }
      extrasAhorro.forEach((e) => {
        nuevosRegistros.push({
          id: uid(),
          fecha: new Date().toLocaleDateString("es-CO"),
          concepto: `${e.concepto} (${label})`,
          monto: e.monto,
          persona: e.persona,
        });
      });

      setSavings({
        ...savings,
        balanceTotal: savings.balanceTotal + totalAhorroQuincena,
        registros: [...nuevosRegistros, ...savings.registros],
      });
    }

    // Actualizar o remover gastos programados que fueron pagados en esta quincena cerrada
    const programadosPagados = active.gastosFijos.filter(
      (g) => g.pagado && (g.tipoGasto === "programado" || g.scheduledId)
    );

    let updatedScheduled = [...scheduledExpenses];
    if (programadosPagados.length > 0) {
      programadosPagados.forEach((gp) => {
        const schedIndex = updatedScheduled.findIndex(
          (s) => (gp.scheduledId && s.id === gp.scheduledId) || s.concepto?.toLowerCase().trim() === gp.concepto?.toLowerCase().trim()
        );
        if (schedIndex !== -1) {
          const matched = updatedScheduled[schedIndex];
          if (matched.recurrenteAnual) {
            // Si se repite cada año, avanzar el año para el próximo ciclo
            updatedScheduled[schedIndex] = { ...matched, anio: (matched.anio || active.anio) + 1 };
          } else {
            // Si no es recurrente anual, quitarlo de la ventana de gastos planeados
            updatedScheduled.splice(schedIndex, 1);
          }
        }
      });
      setScheduledExpenses(updatedScheduled);
      saveKeyWithSync("finanzas:scheduled", updatedScheduled);
    }

    const snapshot = {
      id: uid(),
      label,
      tipo: active.tipo,
      mes: active.mes,
      anio: active.anio,
      activeState: JSON.parse(JSON.stringify(active)),
      cerradaEl: new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" }),
      chartData: {
        gastos: calculations.gastosPagados,
        deudas: calculations.abonosPagados,
        ahorros: totalAhorroQuincena,
        libre: active.dineroLibre?.pagado ? active.dineroLibre.monto : 0,
      },
      gastosPagados: calculations.gastosPagados,
      gastosTotal: calculations.gastosTotal,
      abonosPagados: calculations.abonosPagados,
      ahorroGenerado: totalAhorroQuincena,
      deudaPendienteDespues,
      amortizoCarroCapital: Boolean(gastoCarroPagado),
      balances: {
        eveth: { ...calculations.evethStats },
        david: { ...calculations.davidStats },
      },
      detallesPagos: {
        gastos: active.gastosFijos.filter((g) => g.pagado).map((g) => ({
          concepto: g.concepto,
          monto: g.monto,
          pagadoPor: g.pagadoPor || g.asignado || "familiar",
          tipoGasto: g.tipoGasto,
        })),
        deudas: Object.entries(active.abonos)
          .filter(([, v]) => v.pagado)
          .map(([id, v]) => {
            const debtObj = debts.find((d) => d.id === id);
            return {
              concepto: debtObj ? debtObj.concepto : "Deuda",
              monto: v.monto,
              pagadoPor: v.pagadoPor || v.asignado || "ambos",
            };
          }),
        ahorro: totalAhorroQuincena,
        dineroLibre: active.dineroLibre?.pagado ? active.dineroLibre.monto : 0,
        extras: (active.ingresosExtras || []).map((e) => ({
          concepto: e.concepto,
          monto: e.monto,
          persona: e.persona,
          destino: e.destino,
        })),
      },
    };

    const nextHistory = [snapshot, ...history];
    setHistory(nextHistory);
    saveKeyWithSync("finanzas:history", nextHistory);

    const newTemplates = {
      ...templates,
      [active.tipo]: {
        ingresos: { ...active.ingresos },
        gastosFijos: active.gastosFijos
          .filter((g) => g.tipoGasto === "fijo")
          .map((g) => ({
            id: g.id,
            concepto: g.concepto,
            monto: g.monto,
            asignado: g.asignado,
            tipoGasto: "fijo",
            amortizaDeudaId: g.amortizaDeudaId,
          })),
        ahorroProgramado: { monto: active.ahorroProgramado.monto, asignado: active.ahorroProgramado.asignado },
        dineroLibre: { monto: active.dineroLibre.monto, asignado: active.dineroLibre.asignado },
      },
    };
    setTemplates(newTemplates);
    saveKeyWithSync("finanzas:templates", newTemplates);

    let nextTipo = active.tipo === "Q1" ? "Q2" : "Q1";
    let nextMes = active.tipo === "Q1" ? active.mes : active.mes === 11 ? 0 : active.mes + 1;
    let nextAnio = active.tipo === "Q2" && active.mes === 11 ? active.anio + 1 : active.anio;

    // Limpiar el borrador de la quincena cerrada para que el ciclo avance fresco
    const currentKey = `${active.tipo}_${active.mes}_${active.anio}`;
    const nextKey = `${nextTipo}_${nextMes}_${nextAnio}`;
    const updatedDrafts = { ...periodDrafts };
    delete updatedDrafts[currentKey];
    setPeriodDrafts(updatedDrafts);
    saveKeyWithSync("finanzas:period_drafts", updatedDrafts);

    setActive(buildActiveFromTemplate(nextTipo, newTemplates[nextTipo], nextMes, nextAnio, updatedScheduled));
    setActiveTab("historico");
  };

  // Cambio de período preservando los pagos y borradores existentes
  const handleCambioPeriodo = (tipo, mes, anio) => {
    if (!active) return;
    const currentKey = `${active.tipo}_${active.mes}_${active.anio}`;
    const nextKey = `${tipo}_${mes}_${anio}`;
    if (currentKey === nextKey) return;

    // 1. Guardar el estado del período actual para que nada se borre
    const updatedDrafts = { ...periodDrafts, [currentKey]: active };
    setPeriodDrafts(updatedDrafts);
    saveKeyWithSync("finanzas:period_drafts", updatedDrafts);

    // 2. Si ya teníamos pagos o borrador guardado en el período destino, restaurarlo
    if (updatedDrafts[nextKey]) {
      setActive(sanitizeActive(updatedDrafts[nextKey]));
    } else {
      const t = templates[tipo] || templates.Q1;
      setActive(buildActiveFromTemplate(tipo, t, mes, anio, scheduledExpenses));
    }
  };

  const toggleExpandDebt = (id) => {
    setExpandedDebtIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addDebt = () => {
    if (!newDebt.concepto.trim() || !newDebt.saldo) return;
    const item = {
      id: uid(),
      concepto: newDebt.concepto.trim(),
      saldo: Number(newDebt.saldo),
      prioridad: newDebt.prioridad ? Number(newDebt.prioridad) : debts.length + 1,
      fechaLimite: newDebt.fechaLimite || "",
      cuotasTotales: newDebt.cuotasTotales ? Number(newDebt.cuotasTotales) : null,
      cuotasRestantes: newDebt.cuotasRestantes ? Number(newDebt.cuotasRestantes) : null,
      cuotaMensual: newDebt.cuotaMensual ? Number(newDebt.cuotaMensual) : 0,
      amortizacionCapital: newDebt.amortizacionCapital ? Number(newDebt.amortizacionCapital) : 0,
      soloCuotaFija: Boolean(newDebt.soloCuotaFija),
    };
    const nextDebts = [...debts, item];
    setDebts(nextDebts);
    saveKeyWithSync("finanzas:debts", nextDebts);
    setNewDebt({
      concepto: "", saldo: "", prioridad: "", fechaLimite: "",
      cuotasTotales: "", cuotasRestantes: "", cuotaMensual: "", amortizacionCapital: "", soloCuotaFija: false
    });
  };

  const removeDebt = (id) => {
    const next = debts.filter((d) => d.id !== id);
    setDebts(next);
    saveKeyWithSync("finanzas:debts", next);
  };

  const addScheduledExpense = () => {
    if (!newScheduled.concepto.trim() || !newScheduled.monto) return;
    const item = {
      id: uid(),
      concepto: newScheduled.concepto.trim(),
      monto: Number(newScheduled.monto),
      mes: Number(newScheduled.mes),
      anio: Number(newScheduled.anio),
      tipo: newScheduled.tipo,
      asignado: "familiar",
      recurrenteAnual: Boolean(newScheduled.recurrenteAnual),
    };
    const next = [...scheduledExpenses, item];
    setScheduledExpenses(next);
    saveKeyWithSync("finanzas:scheduled", next);
    setNewScheduled({
      concepto: "", monto: "", mes: 10, anio: 2026, tipo: "Q1", asignado: "familiar", recurrenteAnual: true
    });
  };

  const removeScheduledExpense = (id) => {
    const next = scheduledExpenses.filter((s) => s.id !== id);
    setScheduledExpenses(next);
    saveKeyWithSync("finanzas:scheduled", next);
  };

  const addManualSaving = () => {
    if (!newManualSavings.concepto.trim() || !newManualSavings.monto) return;
    const reg = {
      id: uid(),
      fecha: new Date().toLocaleDateString("es-CO"),
      concepto: newManualSavings.concepto.trim(),
      monto: Number(newManualSavings.monto),
      persona: "familiar",
    };
    const nextSavings = {
      ...savings,
      balanceTotal: savings.balanceTotal + reg.monto,
      registros: [reg, ...savings.registros],
    };
    setSavings(nextSavings);
    saveKeyWithSync("finanzas:savings", nextSavings);
    setNewManualSavings({ concepto: "", monto: "", persona: "familiar" });
  };

  const resetAll = () => {
    const now = new Date();
    setDebts(DEFAULT_DEBTS);
    setTemplates({ Q1: TEMPLATE_Q1, Q2: TEMPLATE_Q2 });
    setScheduledExpenses(DEFAULT_SCHEDULED);
    setActive(buildActiveFromTemplate("Q1", TEMPLATE_Q1, now.getMonth(), now.getFullYear(), DEFAULT_SCHEDULED));
    setHistory([]);
    setSavings(DEFAULT_SAVINGS);
    setConfirmReset(false);
  };

  const renderDebtCard = (d) => {
    const ov = active.abonos?.[d.id];
    const montoSugerido = calculations.suggested?.[d.id] || 0;
    const monto = ov ? ov.monto : montoSugerido;
    const pagado = ov ? ov.pagado : false;
    const asignado = ov?.asignado || "ambos";
    const pagadoPor = ov?.pagadoPor || (pagado ? asignado : null);
    const currentPerson = !pagado ? asignado : pagadoPor;
    const share = calculations.debtShares?.[d.id] || { david: 0, eveth: 0 };
    const isDue = isDebtDueInActiveQuincena(d.fechaLimite, active.tipo, active.mes, active.anio);
    const myShare = filtroPersonaHome === "david"
      ? (asignado === "david" ? monto : (share.david || 0))
      : (asignado === "eveth" ? monto : (share.eveth || 0));

    // CUANDO SE SELECCIONA UNA SOLA PERSONA (EVETH O DAVID):
    if (filtroPersonaHome !== "ambos") {
      const isMyShare = myShare > 0;
      return (
        <div
          className={"debt-abono-card single-person-debt-card " + (pagado ? "is-paid" : "")}
          key={d.id}
        >
          <div className="single-person-debt-flex">
            <button
              className={"glass-check " + (pagado ? "checked" : "")}
              onClick={() => toggleAbonoPagado(d)}
              title={pagado ? "Marcar como pendiente" : "Marcar como pagado"}
            >
              {pagado && <Check size={14} strokeWidth={3} />}
            </button>

            <div className="single-debt-info">
              <span className={"concept-title " + (pagado ? "is-done" : "")}>
                <span className="concept-text">{d.concepto}</span>
                {d.soloCuotaFija && <span className="tag-cuota-fija">Cuota Q2</span>}
                {isDue && <span className="badge-tag-due animate-pulse">⏰ Vence esta quincena</span>}
              </span>
            </div>

            <div className={"single-debt-amount-pill " + (!isMyShare ? "pending-balance-pill" : "")}>
              <span className="single-debt-label">
                {isMyShare ? "Debes abonar:" : "Saldo pendiente:"}
              </span>
              <strong className="single-debt-value">
                {fmt(isMyShare ? myShare : d.saldo)}
              </strong>
            </div>
          </div>
        </div>
      );
    }

    // CUANDO ESTÁ EN "AMBOS":
    return (
      <div className={"debt-abono-card " + (pagado ? "is-paid " : "") + (d.soloCuotaFija ? "item-cuota-fija" : "")} key={d.id}>
        <div className="dac-top-line">
          <button
            className={"glass-check " + (pagado ? "checked" : "")}
            onClick={() => toggleAbonoPagado(d)}
          >
            {pagado && <Check size={14} strokeWidth={3} />}
          </button>
          <div className="dac-info-col">
            <div className="dac-title-wrap">
              <span className={"concept-title " + (pagado ? "is-done" : "")}>
                <span className="concept-text">{d.concepto}</span>
                {d.soloCuotaFija && <span className="tag-cuota-fija">Cuota Q2</span>}
                {isDue && <span className="badge-tag-due animate-pulse">⏰ Vence esta quincena</span>}
              </span>
            </div>
            <div className="dac-sub-wrap">
              <span className="debt-saldo-sub">Saldo: <strong>{fmt(d.saldo)}</strong></span>
              {asignado === "ambos" && monto > 0 && (
                <span className="abono-shares-sub">
                  (David: <strong>{fmt(share.david)}</strong> · Eveth: <strong>{fmt(share.eveth)}</strong>)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="dac-actions-line">
          <SegmentedAbonoBadge
            value={currentPerson}
            onChange={(p) =>
              !pagado
                ? updateAbonoField(d.id, { asignado: p })
                : updateAbonoField(d.id, { pagadoPor: p })
            }
            title="A quién se asigna el pago de este abono"
          />

          <div className="dac-amount-box">
            <span className="dac-input-label">Abonar:</span>
            <input
              type="number"
              className="glass-input-sm text-right font-bold-input dac-monto-input"
              value={monto}
              disabled={pagado}
              onChange={(e) => updateAbonoField(d.id, { monto: Number(e.target.value) })}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="glass-root">
      <style>{glassStyles}</style>

      {/* Pantalla de carga animada con Snoopy contando billetes */}
      {showInitialLoader && <SnoopyMoneyLoader isFading={loaderFading} />}

      {/* Orbes ambientales */}
      <div className="ambient-blob blob-emerald" />
      <div className="ambient-blob blob-blue" />
      <div className="ambient-blob blob-amber" />

      {/* Drawer lateral móvil que sale de la izquierda en celulares */}
      {menuOpen && (
        <div
          className="mobile-drawer-backdrop animate-fade-in"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <aside className={"mobile-sidebar-drawer " + (menuOpen ? "open" : "")}>
        <div className="drawer-header">
          <div className="drawer-brand">
            <img src="/snoopy-banker.png" alt="Snoopy Bank" className="drawer-logo" />
            <div className="drawer-brand-text">
              <span className="drawer-badge">Planificador Familiar</span>
              <h3 className="drawer-title">Snoopy Bank</h3>
            </div>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="drawer-nav-list">
          <button
            type="button"
            className={"drawer-nav-link " + (activeTab === "home" ? "active" : "")}
            onClick={() => {
              setActiveTab("home");
              setMenuOpen(false);
            }}
          >
            <div className="drawer-icon-box icon-home"><Home size={18} /></div>
            <div className="drawer-link-texts">
              <strong className="drawer-link-title">Quincena Activa</strong>
              <span className="drawer-link-desc">Planificador en curso</span>
            </div>
            {activeTab === "home" && <span className="drawer-active-pill">Actual</span>}
          </button>

          <button
            type="button"
            className={"drawer-nav-link " + (activeTab === "programados" ? "active" : "")}
            onClick={() => {
              setActiveTab("programados");
              setMenuOpen(false);
            }}
          >
            <div className="drawer-icon-box icon-calendar"><Calendar size={18} /></div>
            <div className="drawer-link-texts">
              <strong className="drawer-link-title">Gastos Futuros</strong>
              <span className="drawer-link-desc">Compromisos con fecha</span>
            </div>
            {scheduledExpenses.length > 0 && (
              <span className="drawer-count">{scheduledExpenses.length}</span>
            )}
          </button>

          <button
            type="button"
            className={"drawer-nav-link " + (activeTab === "deudas" ? "active" : "")}
            onClick={() => {
              setActiveTab("deudas");
              setMenuOpen(false);
            }}
          >
            <div className="drawer-icon-box icon-debt"><CreditCard size={18} /></div>
            <div className="drawer-link-texts">
              <strong className="drawer-link-title">Deudas</strong>
              <span className="drawer-link-desc">Amortizaciones y cuotas</span>
            </div>
            <span className="drawer-badge-pill debt-pill">{fmt(calculations.totalDeuda)}</span>
          </button>

          <button
            type="button"
            className={"drawer-nav-link " + (activeTab === "ahorros" ? "active" : "")}
            onClick={() => {
              setActiveTab("ahorros");
              setMenuOpen(false);
            }}
          >
            <div className="drawer-icon-box icon-save"><PiggyBank size={18} /></div>
            <div className="drawer-link-texts">
              <strong className="drawer-link-title">Ahorros</strong>
              <span className="drawer-link-desc">Alcancía y metas</span>
            </div>
            <span className="drawer-badge-pill save-pill">{fmt(savings.balanceTotal)}</span>
          </button>

          <button
            type="button"
            className={"drawer-nav-link " + (activeTab === "historico" ? "active" : "")}
            onClick={() => {
              setActiveTab("historico");
              setMenuOpen(false);
            }}
          >
            <div className="drawer-icon-box icon-history"><History size={18} /></div>
            <div className="drawer-link-texts">
              <strong className="drawer-link-title">Histórico</strong>
              <span className="drawer-link-desc">Quincenas archivadas</span>
            </div>
            {history.length > 0 && (
              <span className="drawer-count">{history.length}</span>
            )}
          </button>
        </nav>

        <div className="drawer-footer">
          <p>Snoopy Bank • Finanzas Familiares</p>
        </div>
      </aside>

      <div className="glass-container">
        {/* Encabezado: Barra compacta en móvil y navbar completo en computador */}
        <header className="glass-header">
          <div className="header-bar">
            {/* Botón hamburguesa: visible SOLO en celular (<768px) para abrir menú de la izquierda */}
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú de navegación"
            >
              <Menu size={20} />
              <span className="mobile-menu-label">Menú</span>
            </button>

            <div
              className="header-brand"
              onClick={() => setActiveTab("home")}
              title="Ir a Quincena Activa"
            >
              <div className="header-logo-container">
                <img
                  src="/snoopy-banker.png"
                  alt="Snoopy Bank Logo"
                  className="header-snoopy-logo"
                />
              </div>
              <div className="header-headings">
                <h1 className="hero-title">Snoopy Bank</h1>
                <p className="hero-subtitle">Gestor familiar y pagos</p>
              </div>
            </div>

            {/* Indicador de estado de sincronización con Cloudflare D1 */}
            <div className="header-sync-status">
              {syncStatus === "synced" && (
                <span className="sync-badge synced" title="Conectado y sincronizado con Cloudflare D1">
                  <span className="sync-dot synced"></span>
                  <span className="sync-text">D1 Nube</span>
                </span>
              )}
              {syncStatus === "syncing" && (
                <span className="sync-badge syncing" title="Guardando cambios en Cloudflare D1...">
                  <RefreshCw size={11} className="sync-spinner" />
                  <span className="sync-text">Guardando...</span>
                </span>
              )}
              {syncStatus === "local" && (
                <span className="sync-badge local" title="Modo local (D1 pendiente o sin conexión)">
                  <span className="sync-dot local"></span>
                  <span className="sync-text">Local</span>
                </span>
              )}
              {syncStatus === "error" && (
                <span className="sync-badge error" title="Fallo de red al sincronizar con D1">
                  <span className="sync-dot error"></span>
                  <span className="sync-text">Reintentando</span>
                </span>
              )}
            </div>
          </div>

          {/* Menú de computador: SIEMPRE visible en computador (>768px) */}
          <nav className="desktop-navbar">
            <button
              type="button"
              className={"desktop-nav-item " + (activeTab === "home" ? "active" : "")}
              onClick={() => setActiveTab("home")}
            >
              <Home size={16} />
              <span>Quincena Activa</span>
            </button>

            <button
              type="button"
              className={"desktop-nav-item " + (activeTab === "programados" ? "active" : "")}
              onClick={() => setActiveTab("programados")}
            >
              <Calendar size={16} />
              <span>Gastos Futuros</span>
              {scheduledExpenses.length > 0 && (
                <span className="nav-count">{scheduledExpenses.length}</span>
              )}
            </button>

            <button
              type="button"
              className={"desktop-nav-item " + (activeTab === "deudas" ? "active" : "")}
              onClick={() => setActiveTab("deudas")}
            >
              <CreditCard size={16} />
              <span>Deudas</span>
              <span className="nav-badge-pill">{fmt(calculations.totalDeuda)}</span>
            </button>

            <button
              type="button"
              className={"desktop-nav-item " + (activeTab === "ahorros" ? "active" : "")}
              onClick={() => setActiveTab("ahorros")}
            >
              <PiggyBank size={16} />
              <span>Ahorros</span>
              <span className="nav-badge-pill savings-pill">{fmt(savings.balanceTotal)}</span>
            </button>

            <button
              type="button"
              className={"desktop-nav-item " + (activeTab === "historico" ? "active" : "")}
              onClick={() => setActiveTab("historico")}
            >
              <History size={16} />
              <span>Histórico</span>
              {history.length > 0 && (
                <span className="nav-count">{history.length}</span>
              )}
            </button>
          </nav>
        </header>

        {/* ========================================================
            TAB 1: HOME (QUINCENA ACTIVA)
            ======================================================== */}
        {activeTab === "home" && (
          <div className="tab-content animate-fade-in">
            <div className="glass-card main-q-card">
              <div className="card-topbar">
                <div className="q-period-selector">
                  <div className="q-period-header-line">
                    <span className="eyebrow-tag">Período en curso</span>

                    {/* Distintivo de los 3 estados del ciclo de vida */}
                    {quincenaLifecycleState === "archivada" && (
                      <span className="quincena-status-badge status-archivada" title="Esta quincena está cerrada y archivada en el Histórico">
                        <Lock size={12} />
                        <span>3. Archivada</span>
                      </span>
                    )}
                    {quincenaLifecycleState === "en_progreso" && (
                      <span className="quincena-status-badge status-en-progreso" title="Se están registrando pagos en esta quincena">
                        <span className="status-pulse-dot" />
                        <span>2. En progreso ({gastosStats.pct}% pagado)</span>
                      </span>
                    )}
                    {quincenaLifecycleState === "vacia" && (
                      <span className="quincena-status-badge status-vacia" title="Valores base por default listos para iniciar">
                        <span className="status-gray-dot" />
                        <span>1. Vacía (Por default)</span>
                      </span>
                    )}
                  </div>
                  <h2>{periodLabel(active.tipo, active.mes, active.anio)}</h2>
                  <div className="pill-controls">
                    <button
                      className={"glass-pill " + (active.tipo === "Q1" ? "active" : "")}
                      onClick={() => handleCambioPeriodo("Q1", active.mes, active.anio)}
                    >
                      1ra Quincena
                    </button>
                    <button
                      className={"glass-pill " + (active.tipo === "Q2" ? "active" : "")}
                      onClick={() => handleCambioPeriodo("Q2", active.mes, active.anio)}
                    >
                      2da Quincena
                    </button>
                    <select
                      className="glass-select"
                      value={active.mes}
                      onChange={(e) => handleCambioPeriodo(active.tipo, Number(e.target.value), active.anio)}
                    >
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      className="glass-input-sm anio-input"
                      value={active.anio}
                      onChange={(e) => handleCambioPeriodo(active.tipo, active.mes, Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="card-topbar-actions">
                  <button
                    type="button"
                    className={"manual-save-btn " + (saveStatusAnim === "saved" ? "btn-saved" : saveStatusAnim === "saving" ? "btn-saving" : "")}
                    onClick={handleManualSave}
                    title="Guardar todos los pagos y cambios ahora en el dispositivo y la nube"
                  >
                    {saveStatusAnim === "saving" ? (
                      <>
                        <RefreshCw size={15} className="sync-spinner" />
                        <span>Guardando...</span>
                      </>
                    ) : saveStatusAnim === "saved" ? (
                      <>
                        <Check size={16} strokeWidth={3} />
                        <span>¡Guardado con éxito!</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Guardar cambios</span>
                      </>
                    )}
                  </button>
                  {lastSavedTime && (
                    <span className="last-saved-hint">Último guardado: {lastSavedTime}</span>
                  )}
                </div>
              </div>

              {/* Banner Informativo del Estado de la Quincena */}
              {quincenaLifecycleState === "archivada" && (
                <div className="archived-period-banner animate-fade-in">
                  <div className="apb-content">
                    <div className="apb-icon-wrap">
                      <Lock size={20} />
                    </div>
                    <div>
                      <strong>Quincena archivada en el Histórico ({currentHistoryItem?.cerradaEl})</strong>
                      <p>Esta quincena ya fue finalizada formalmente. Los saldos y pagos corresponden al extracto de cierre.</p>
                    </div>
                  </div>
                  <div className="apb-actions">
                    <button
                      type="button"
                      className="glass-btn-secondary apb-btn"
                      onClick={() => setActiveTab("historico")}
                    >
                      <History size={14} />
                      <span>Ver en Histórico</span>
                    </button>
                    <button
                      type="button"
                      className="glass-btn-reopen"
                      onClick={() => handleReabrirQuincena(currentHistoryItem)}
                      title="Reabrir esta quincena para corregir pagos y volver a guardar"
                    >
                      <Unlock size={14} />
                      <span>Reabrir quincena</span>
                    </button>
                  </div>
                </div>
              )}

              {quincenaLifecycleState === "vacia" && (
                <div className="vacia-period-banner animate-fade-in">
                  <Sparkles size={16} className="text-emerald" />
                  <span>
                    <strong>1. Quincena vacía (Valores por default):</strong> Cuentas con los sueldos e importes programados de la plantilla. A medida que marques qué se va pagando y pulses <strong>Guardar cambios</strong>, pasará a estar <strong>2. En progreso</strong>.
                  </span>
                </div>
              )}

              {quincenaLifecycleState === "en_progreso" && (
                <div className="progreso-period-banner animate-fade-in">
                  <span className="ppb-indicator-dot" />
                  <span>
                    <strong>2. Quincena en progreso:</strong> Llevas {gastosStats.pagados} de {gastosStats.total} pagos realizados ({gastosStats.pct}%). Recuerda pulsar <strong>Guardar cambios</strong> para conservar tu avance día a día.
                  </span>
                </div>
              )}

              {/* ========================================================
                  GRÁFICA DONUT DE DISTRIBUCIÓN (PRIMERO PARA REVISIÓN RÁPIDA)
                  ======================================================== */}
              <div className="chart-section glass-inner-panel chart-section-hero">
                <div className="chart-header">
                  <div>
                    <div className="flex-align-center gap-6">
                      <span className="badge-pulse-dot" />
                      <h3>Distribución Económica Global</h3>
                    </div>
                    <p className="sub-hint">Fijos, abono a deudas, ahorro para la alcancía y dinero libre para ocio.</p>
                  </div>
                  <div className="scope-switcher">
                    <button
                      className={"glass-pill-sm " + (viewChartScope === "quincena" ? "active" : "")}
                      onClick={() => setViewChartScope("quincena")}
                    >
                      Esta Quincena
                    </button>
                    <button
                      className={"glass-pill-sm " + (viewChartScope === "mes" ? "active" : "")}
                      onClick={() => setViewChartScope("mes")}
                    >
                      Proyección Mes
                    </button>
                  </div>
                </div>

                <EconomyDonutChart
                  gastos={viewChartScope === "quincena" ? calculations.chartCurrent.gastos : calculations.chartMonth.gastos}
                  deudas={viewChartScope === "quincena" ? calculations.chartCurrent.deudas : calculations.chartMonth.deudas}
                  ahorros={viewChartScope === "quincena" ? calculations.chartCurrent.ahorros : calculations.chartMonth.ahorros}
                  libre={viewChartScope === "quincena" ? calculations.chartCurrent.libre : calculations.chartMonth.libre}
                  totalTitle={viewChartScope === "quincena" ? "Total quincena" : "Total mensual"}
                />
              </div>

              {/* Selector de Modo de Vista Personal / Familiar en Home */}
              <div className="home-persona-filter-card glass-inner-panel">
                <div className="hpf-header">
                  <div className="hpf-title-group">
                    <span className="hpf-label">Filtrar vista en Quincena:</span>
                    <strong className="hpf-selected-tag">
                      {filtroPersonaHome === "ambos"
                        ? "Economía familiar (Ambos)"
                        : filtroPersonaHome === "david"
                        ? "Solo pagos de David"
                        : "Solo pagos de Eveth"}
                    </strong>
                  </div>
                  <div className="hpf-segmented">
                    <button
                      type="button"
                      className={"hpf-btn " + (filtroPersonaHome === "ambos" ? "active" : "")}
                      onClick={() => setFiltroPersonaHome("ambos")}
                    >
                      <Users size={16} />
                      <span>Ambos (Todo)</span>
                    </button>
                    <button
                      type="button"
                      className={"hpf-btn " + (filtroPersonaHome === "david" ? "active" : "")}
                      onClick={() => setFiltroPersonaHome("david")}
                    >
                      <User size={16} />
                      <span>David</span>
                      <span className="hpf-badge">{fmt(calculations.davidStats.totalAsignado)}</span>
                    </button>
                    <button
                      type="button"
                      className={"hpf-btn " + (filtroPersonaHome === "eveth" ? "active" : "")}
                      onClick={() => setFiltroPersonaHome("eveth")}
                    >
                      <User size={16} />
                      <span>Eveth</span>
                      <span className="hpf-badge">{fmt(calculations.evethStats.totalAsignado)}</span>
                    </button>
                  </div>
                </div>

                {filtroPersonaHome !== "ambos" && (
                  <div className="hpf-status-banner animate-fade-in">
                    <span className="hpf-banner-text">
                      👤 Mostrando únicamente los gastos y abonos que debe pagar{" "}
                      <strong>{filtroPersonaHome === "david" ? "David" : "Eveth"}</strong> en esta quincena (Total:{" "}
                      {fmt(
                        filtroPersonaHome === "david"
                          ? calculations.davidStats.totalAsignado
                          : calculations.evethStats.totalAsignado
                      )}
                      ).
                    </span>
                    <button
                      type="button"
                      className="hpf-reset-btn"
                      onClick={() => setFiltroPersonaHome("ambos")}
                    >
                      Ver ambos
                    </button>
                  </div>
                )}
              </div>

              {calculations.gastosImprevistosTotal > 0 && (
                <div className="imprevisto-banner">
                  <AlertTriangle size={18} className="warn-icon" />
                  <div>
                    <strong>Atención: {fmt(calculations.gastosImprevistosTotal)} en gastos imprevistos este período.</strong>
                    <p>Se recalcularon automáticamente los saldos en cuenta y el disponible de amortización.</p>
                  </div>
                </div>
              )}

              {/* Alerta de Deuda con Vencimiento en esta Quincena */}
              {calculations.debtsDueInActiveQuincena.length > 0 && (
                <div className="debt-due-alert-banner animate-fade-in">
                  <AlertTriangle size={20} className="warn-icon" />
                  <div className="due-banner-text">
                    <strong>⏰ Deuda con fecha límite en esta quincena ({periodLabel(active.tipo, active.mes, active.anio)}):</strong>
                    <div className="due-debts-list">
                      {calculations.debtsDueInActiveQuincena.map((d) => (
                        <span key={d.id} className="due-debt-tag">
                          <strong>{d.concepto}</strong> — Vence el {d.fechaLimite} (Saldo: {fmt(d.saldo)})
                        </span>
                      ))}
                    </div>
                    <small>Se debe pagar o abonar prioritariamente en esta quincena para evitar intereses o mora.</small>
                  </div>
                </div>
              )}

              {/* Balances en Cuenta */}
              <div className="balances-row">
                <div className={"balance-box " + (filtroPersonaHome === "eveth" ? "focused-balance-box" : filtroPersonaHome === "david" ? "muted-balance-box" : "")}>
                  <div className="b-header">
                    <strong>Eveth</strong>
                    <span className="b-sueldo">
                      Sueldo base: {fmt(calculations.evethStats.ingresoBase)}
                      {calculations.evethStats.extras > 0 && (
                        <span className="extra-note"> (+{fmt(calculations.evethStats.extras)} extra)</span>
                      )}
                    </span>
                  </div>
                  <div className="b-main">
                    <span className="b-label">Debería tener en cuenta:</span>
                    <strong className="b-amount">{fmt(calculations.evethStats.saldoEnCuenta)}</strong>
                  </div>
                  <div className="b-footer">
                    <span>Comprometido: {fmt(calculations.evethStats.totalAsignado)}</span>
                    <span>Pagó: {fmt(calculations.evethStats.totalPagado)}</span>
                    {calculations.evethStats.restanteSueldo === 0 ? (
                      <span className="safe-badge balanced-badge">⚖️ Equilibrio exacto ($0)</span>
                    ) : calculations.evethStats.excede ? (
                      <span className="warn-badge">Supera sueldo por {fmt(Math.abs(calculations.evethStats.restanteSueldo))}</span>
                    ) : (
                      <span className="safe-badge">Libre: +{fmt(calculations.evethStats.restanteSueldo)}</span>
                    )}
                  </div>
                </div>

                <div className={"balance-box " + (filtroPersonaHome === "david" ? "focused-balance-box" : filtroPersonaHome === "eveth" ? "muted-balance-box" : "")}>
                  <div className="b-header">
                    <strong>David</strong>
                    <span className="b-sueldo">
                      Sueldo base: {fmt(calculations.davidStats.ingresoBase)}
                      {calculations.davidStats.extras > 0 && (
                        <span className="extra-note"> (+{fmt(calculations.davidStats.extras)} extra)</span>
                      )}
                    </span>
                  </div>
                  <div className="b-main">
                    <span className="b-label">Debería tener en cuenta:</span>
                    <strong className="b-amount">{fmt(calculations.davidStats.saldoEnCuenta)}</strong>
                  </div>
                  <div className="b-footer">
                    <span>Comprometido: {fmt(calculations.davidStats.totalAsignado)}</span>
                    <span>Pagó: {fmt(calculations.davidStats.totalPagado)}</span>
                    {calculations.davidStats.restanteSueldo === 0 ? (
                      <span className="safe-badge balanced-badge">⚖️ Equilibrio exacto ($0)</span>
                    ) : calculations.davidStats.excede ? (
                      <span className="warn-badge">Supera sueldo por {fmt(Math.abs(calculations.davidStats.restanteSueldo))}</span>
                    ) : (
                      <span className="safe-badge">Libre: +{fmt(calculations.davidStats.restanteSueldo)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ingresos Extras Desplegable */}
              <div className="extra-incomes-section glass-inner-panel">
                <div className="section-title-flex">
                  <div>
                    <div className="flex-align-center gap-6">
                      <h3>Ingresos extras</h3>
                      {(active.ingresosExtras || []).length > 0 && (
                        <span className="count-pill-emerald">{(active.ingresosExtras || []).length}</span>
                      )}
                    </div>
                    <p className="sub-hint">Primas, bonos o freelance con destino a pagar deudas o apartar para la alcancía.</p>
                  </div>
                  {!showExtraForm && (
                    <button
                      type="button"
                      className="modern-btn-pill-accent"
                      onClick={() => setShowExtraForm(true)}
                    >
                      <Plus size={14} />
                      <span>Agregar ingreso extra</span>
                    </button>
                  )}
                </div>

                <div className="extra-incomes-list">
                  {filteredExtras.length === 0 && !showExtraForm && (
                    <div className="empty-extras-placeholder">
                      <Sparkles size={16} className="empty-extras-icon" />
                      <p className="empty-hint">
                        No hay ingresos extras registrados {filtroPersonaHome !== "ambos" ? `para ${filtroPersonaHome === "david" ? "David" : "Eveth"}` : "en esta quincena"}.
                      </p>
                    </div>
                  )}

                  {filteredExtras.map((e) => (
                    <div className={"extra-item-card animate-fade-in " + (e.persona === "eveth" ? "extra-card-eveth" : "extra-card-david")} key={e.id}>
                      <div className="extra-left-content">
                        <div className={"extra-avatar-icon " + (e.persona === "eveth" ? "avatar-eveth" : "avatar-david")}>
                          {e.persona === "eveth" ? "E" : "D"}
                        </div>
                        <div className="extra-info-col">
                          <span className="extra-concept-title">{e.concepto}</span>
                          <div className="extra-badges-row">
                            <span className={"extra-person-pill " + (e.persona === "eveth" ? "pill-eveth" : "pill-david")}>
                              {e.persona === "eveth" ? "Eveth" : "David"}
                            </span>
                            <span className={"extra-dest-badge " + (e.destino === "deudas" ? "dest-debt" : "dest-save")}>
                              {e.destino === "deudas" ? (
                                <>
                                  <CreditCard size={11} />
                                  <span>Pagar deudas</span>
                                </>
                              ) : (
                                <>
                                  <PiggyBank size={11} />
                                  <span>Ahorro</span>
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="extra-right-content">
                        <div className="extra-amount-wrap">
                          <span className="extra-amount-label">Ingreso extra</span>
                          <strong className="extra-amount-value">+{fmt(e.monto)}</strong>
                        </div>
                        <button
                          type="button"
                          className="extra-delete-btn"
                          onClick={() => removeExtraIncome(e.id)}
                          title="Eliminar ingreso extra"
                          aria-label="Eliminar ingreso"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Formulario Desplegable de Ingreso Extra */}
                  {showExtraForm && (
                    <div className="add-extra-form-collapsible animate-fade-in">
                      <div className="aef-header">
                        <span className="aef-title">Registrar nuevo ingreso extraordinario</span>
                        <button
                          type="button"
                          className="aef-close-btn"
                          onClick={() => setShowExtraForm(false)}
                          title="Cerrar formulario"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="aef-inputs-grid">
                        <div className="aef-input-group">
                          <label>Concepto:</label>
                          <input
                            type="text"
                            className="glass-input"
                            placeholder="Ej. Bono de desempeño, Freelance, Prima"
                            value={newExtra.concepto}
                            onChange={(ev) => setNewExtra({ ...newExtra, concepto: ev.target.value })}
                          />
                        </div>

                        <div className="aef-input-group">
                          <label>Quién lo recibe:</label>
                          <SegmentedPersonBadge
                            value={newExtra.persona}
                            onChange={(p) => setNewExtra({ ...newExtra, persona: p })}
                          />
                        </div>

                        <div className="aef-input-group">
                          <label>Destino del dinero:</label>
                          <div className="dest-switcher">
                            <button
                              type="button"
                              className={"dest-opt " + (newExtra.destino === "deudas" ? "active-debt" : "")}
                              onClick={() => setNewExtra({ ...newExtra, destino: "deudas" })}
                            >
                              Pagar deudas
                            </button>
                            <button
                              type="button"
                              className={"dest-opt " + (newExtra.destino === "ahorro" ? "active-save" : "")}
                              onClick={() => setNewExtra({ ...newExtra, destino: "ahorro" })}
                            >
                              Ahorro
                            </button>
                          </div>
                        </div>

                        <div className="aef-input-group">
                          <label>Monto ($):</label>
                          <input
                            type="number"
                            className="glass-input-sm text-right font-bold-input"
                            placeholder="$ 0"
                            value={newExtra.monto}
                            onChange={(ev) => setNewExtra({ ...newExtra, monto: ev.target.value })}
                          />
                        </div>
                      </div>

                      <div className="aef-actions-row">
                        <button
                          type="button"
                          className="modern-btn-cancel"
                          onClick={() => setShowExtraForm(false)}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className="modern-btn-primary"
                          onClick={() => {
                            addExtraIncome();
                            setShowExtraForm(false);
                          }}
                        >
                          <Plus size={14} />
                          <span>Guardar ingreso extra</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2 Columnas */}
              <div className="two-columns-layout">
                {/* Columna Izquierda */}
                <div className="col-stack">
                  <div className="glass-inner-panel">
                    <h3>Ingresos fijos quincenales</h3>
                    <div className="glass-item-row">
                      <span>Sueldo David</span>
                      <input
                        type="number"
                        className="glass-input-sm text-right"
                        value={active.ingresos.david}
                        onChange={(e) =>
                          setActive({
                            ...active,
                            ingresos: { ...active.ingresos, david: Number(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="glass-item-row">
                      <span>Sueldo Eveth</span>
                      <input
                        type="number"
                        className="glass-input-sm text-right"
                        value={active.ingresos.eveth}
                        onChange={(e) =>
                          setActive({
                            ...active,
                            ingresos: { ...active.ingresos, eveth: Number(e.target.value) },
                          })
                        }
                      />
                    </div>
                    <div className="glass-item-row row-total">
                      <span>Total base pareja</span>
                      <strong>{fmt(calculations.ingresosBaseTotal)}</strong>
                    </div>
                  </div>

                  {/* Gastos Fijos e Imprevistos */}
                  <div className="glass-inner-panel">
                    <div className="section-title-flex">
                      <div>
                        <h3>Gastos a pagar ({filteredGastos.length})</h3>
                        <p className="sub-hint">
                          {filtroPersonaHome === "ambos"
                            ? "Fijos, programados e imprevistos de la familia"
                            : `Mostrando gastos que le corresponde pagar a ${filtroPersonaHome === "david" ? "David" : "Eveth"}`}
                        </p>
                      </div>
                      {filtroPersonaHome !== "ambos" && (
                        <div className="active-filter-indicator">
                          <span>Filtrado: {filtroPersonaHome === "david" ? "David" : "Eveth"}</span>
                          <button
                            type="button"
                            className="clear-filter-btn"
                            onClick={() => setFiltroPersonaHome("ambos")}
                            title="Quitar filtro y ver ambos"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Control y métricas de pagos: progreso y filtros */}
                    <div className="gastos-progress-card">
                      <div className="gp-metrics">
                        <div className="gp-stat">
                          <span className="gp-label">Control de pagos del período:</span>
                          <strong className="gp-value">
                            {gastosStats.pagados} de {gastosStats.total} pagados ({gastosStats.pct}%)
                          </strong>
                        </div>
                        <div className="gp-amounts">
                          <span className="gp-paid-amt">{fmt(gastosStats.montoPagado)}</span>
                          <span className="gp-sep">/</span>
                          <span className="gp-total-amt">{fmt(gastosStats.montoTotal)}</span>
                        </div>
                      </div>
                      <div className="gp-progress-track">
                        <div className="gp-progress-bar" style={{ width: `${gastosStats.pct}%` }} />
                      </div>

                      <div className="gp-filter-tabs">
                        <button
                          type="button"
                          className={"gp-tab gp-tab-todos " + (filtroEstadoGasto === "todos" ? "active" : "")}
                          onClick={() => setFiltroEstadoGasto("todos")}
                        >
                          <Layers size={13} />
                          <span>Todos</span>
                          <span className="gp-tab-badge">{gastosStats.total}</span>
                        </button>
                        <button
                          type="button"
                          className={"gp-tab gp-tab-pendientes " + (filtroEstadoGasto === "pendientes" ? "active" : "")}
                          onClick={() => setFiltroEstadoGasto("pendientes")}
                        >
                          <Clock size={13} />
                          <span>Por pagar</span>
                          <span className="gp-tab-badge badge-pending">{gastosStats.pendientes}</span>
                        </button>
                        <button
                          type="button"
                          className={"gp-tab gp-tab-pagados " + (filtroEstadoGasto === "pagados" ? "active" : "")}
                          onClick={() => setFiltroEstadoGasto("pagados")}
                        >
                          <CheckCircle2 size={13} />
                          <span>Ya pagados</span>
                          <span className="gp-tab-badge badge-paid">{gastosStats.pagados}</span>
                        </button>
                      </div>
                    </div>

                    <div className="items-list">
                      {displayGastos.length === 0 && (
                        <div className="empty-gastos-state">
                          <p>
                            {filtroEstadoGasto === "pendientes"
                              ? "🎉 ¡Excelente! No tienes gastos pendientes por pagar en esta lista."
                              : filtroEstadoGasto === "pagados"
                              ? "Aún no has marcado ningún gasto como pagado."
                              : "No hay gastos en esta lista."}
                          </p>
                        </div>
                      )}

                      {displayGastos.map((g) => {
                        const currentPerson = !g.pagado ? g.asignado : g.pagadoPor || g.asignado;
                        const crossPaid = g.pagado && g.pagadoPor && g.pagadoPor !== g.asignado;

                        return (
                          <div
                            className={
                              "glass-item-row check-item " +
                              (g.pagado ? "row-pagado " : "") +
                              (g.tipoGasto === "imprevisto" ? "row-imprevisto " : "")
                            }
                            key={g.id}
                          >
                            <button
                              className={"glass-check " + (g.pagado ? "checked" : "")}
                              onClick={() => toggleGastoPagado(g)}
                              title={g.pagado ? "Marcar como pendiente" : "Marcar como pagado"}
                            >
                              {g.pagado && <Check size={13} strokeWidth={3} />}
                            </button>
                            <span className={"concept-title " + (g.pagado ? "is-done" : "")}>
                              <span className="concept-text">{g.concepto}</span>
                              {g.pagado && (
                                <span className="badge-tag-pagado">✓ Pagado</span>
                              )}
                              {g.tipoGasto === "imprevisto" && (
                                <span className="badge-tag-imprevisto">⚠️ Imprevisto</span>
                              )}
                              {g.tipoGasto === "programado" && (
                                <span className="badge-tag-programado">📅 Programado</span>
                              )}
                              {g.amortizaDeudaId === "carro_credito" && (
                                <span className="badge-tag-amortiza">🚗 Amortiza $700k</span>
                              )}
                              {crossPaid && (
                                <em className="cross-paid-tag">
                                  (pagó {g.pagadoPor}, le tocaba a {g.asignado})
                                </em>
                              )}
                            </span>

                            <SegmentedPersonBadge
                              value={currentPerson}
                              onChange={(p) =>
                                !g.pagado ? updateGasto(g.id, { asignado: p }) : updateGasto(g.id, { pagadoPor: p })
                              }
                              title={!g.pagado ? "A quién le toca pagar" : "Quién lo desembolsó"}
                            />

                            <input
                              type="number"
                              className="glass-input-sm text-right"
                              value={g.monto}
                              onChange={(e) => updateGasto(g.id, { monto: Number(e.target.value) })}
                            />
                            <button
                              className="icon-btn-del"
                              onClick={() => removeGasto(g.id)}
                              title="Eliminar gasto"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        );
                      })}

                      {/* Botón trigger para desplegar formulario de gasto */}
                      {!showGastoForm ? (
                        <div className="add-gasto-trigger-bar">
                          <button
                            type="button"
                            className="modern-btn-pill-accent"
                            onClick={() => setShowGastoForm(true)}
                          >
                            <Plus size={14} />
                            <span>Agregar gasto</span>
                          </button>
                        </div>
                      ) : (
                        /* Formulario desplegable con opción de Gasto Recurrente */
                        <div className="add-item-row-advanced animate-fade-in">
                          <div className="aef-header" style={{ marginBottom: "6px" }}>
                            <span className="aef-title">Nuevo gasto para esta quincena</span>
                            <button
                              type="button"
                              className="aef-close-btn"
                              onClick={() => setShowGastoForm(false)}
                              title="Cerrar"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="add-inputs-line">
                            <input
                              type="text"
                              className="glass-input"
                              placeholder="Concepto (ej. Mercado, Luz)"
                              value={newGasto.concepto}
                              onChange={(e) => setNewGasto({ ...newGasto, concepto: e.target.value })}
                            />
                            <SegmentedPersonBadge
                              value={newGasto.asignado}
                              onChange={(p) => setNewGasto({ ...newGasto, asignado: p })}
                            />
                            <input
                              type="number"
                              className="glass-input-sm text-right"
                              placeholder="Monto ($)"
                              value={newGasto.monto}
                              onChange={(e) => setNewGasto({ ...newGasto, monto: e.target.value })}
                            />
                          </div>

                          <div className="add-options-checkboxes">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={newGasto.esRecurrente}
                                disabled={newGasto.esImprevisto}
                                onChange={(e) => setNewGasto({ ...newGasto, esRecurrente: e.target.checked })}
                              />
                              <span>Guardar como recurrente (fijo para futuras quincenas)</span>
                            </label>

                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={newGasto.esImprevisto}
                                onChange={(e) =>
                                  setNewGasto({
                                    ...newGasto,
                                    esImprevisto: e.target.checked,
                                    esRecurrente: e.target.checked ? false : newGasto.esRecurrente,
                                  })
                                }
                              />
                              <span>Marcar como ⚠️ Gasto Imprevisto</span>
                            </label>
                          </div>

                          <div className="add-actions-line">
                            <button className="modern-btn-primary" onClick={addGasto}>
                              <Plus size={14} />
                              <span>Guardar gasto</span>
                            </button>
                            <button
                              type="button"
                              className="modern-btn-cancel"
                              onClick={() => setShowGastoForm(false)}
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="glass-item-row row-total">
                        <span>Total gastos pagados</span>
                        <strong>
                          {fmt(calculations.gastosPagados)} / {fmt(calculations.gastosTotal)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Apartados: Ahorro Programado vs Dinero Libre SEPARADOS */}
                  <div className="glass-inner-panel">
                    <h3>
                      Ahorro y Dinero Libre
                      {filtroPersonaHome !== "ambos" ? ` (${filtroPersonaHome === "david" ? "David" : "Eveth"})` : " (Separados)"}
                    </h3>

                    {(() => {
                      const ahorroAsignado = !active.ahorroProgramado?.pagado
                        ? (active.ahorroProgramado?.asignado || "david")
                        : (active.ahorroProgramado?.pagadoPor || active.ahorroProgramado?.asignado || "david");

                      const libreAsignado = !active.dineroLibre?.pagado
                        ? (active.dineroLibre?.asignado || "david")
                        : (active.dineroLibre?.pagadoPor || active.dineroLibre?.asignado || "david");

                      const showAhorro = filtroPersonaHome === "ambos" || ahorroAsignado === filtroPersonaHome;
                      const showLibre = filtroPersonaHome === "ambos" || libreAsignado === filtroPersonaHome;

                      if (!showAhorro && !showLibre) {
                        return (
                          <p className="sub-hint" style={{ padding: "8px 0" }}>
                            No tienes ahorro ni dinero libre asignados a tu cargo en esta quincena.
                          </p>
                        );
                      }

                      return (
                        <>
                          {/* Ahorro Programado (Entra a la alcancía) */}
                          {showAhorro && (
                            filtroPersonaHome !== "ambos" ? (
                              <div className={"glass-item-row check-item row-ahorro-prog " + (active.ahorroProgramado?.pagado ? "is-paid" : "")}>
                                <button
                                  className={"glass-check " + (active.ahorroProgramado?.pagado ? "checked" : "")}
                                  onClick={toggleAhorroPagado}
                                  title={active.ahorroProgramado?.pagado ? "Marcar como pendiente" : "Marcar como apartado"}
                                >
                                  {active.ahorroProgramado?.pagado && <Check size={13} strokeWidth={3} />}
                                </button>
                                <div className="concept-title">
                                  <span className="concept-text">Ahorro para la alcancía</span>
                                  <span className="badge-tag-ahorro">🏦 Se guarda al cerrar</span>
                                </div>
                                <div className="single-debt-amount-pill save-pill-border">
                                  <span className="single-debt-label">Debes apartar:</span>
                                  <strong className="single-debt-value">{fmt(active.ahorroProgramado?.monto || 0)}</strong>
                                </div>
                              </div>
                            ) : (
                              <div className="glass-item-row check-item row-ahorro-prog">
                                <button
                                  className={"glass-check " + (active.ahorroProgramado?.pagado ? "checked" : "")}
                                  onClick={toggleAhorroPagado}
                                >
                                  {active.ahorroProgramado?.pagado && <Check size={13} strokeWidth={3} />}
                                </button>
                                <div className="concept-title">
                                  <span className="concept-text">Ahorro para la alcancía</span>
                                  <span className="badge-tag-ahorro">🏦 Se guarda al cerrar</span>
                                </div>
                                <SegmentedPersonBadge
                                  value={
                                    !active.ahorroProgramado?.pagado
                                      ? active.ahorroProgramado?.asignado
                                      : active.ahorroProgramado?.pagadoPor || active.ahorroProgramado?.asignado
                                  }
                                  onChange={(p) =>
                                    !active.ahorroProgramado?.pagado
                                      ? setActive({ ...active, ahorroProgramado: { ...active.ahorroProgramado, asignado: p } })
                                      : setActive({ ...active, ahorroProgramado: { ...active.ahorroProgramado, pagadoPor: p } })
                                  }
                                  title="Quién lo aparta"
                                />
                                <input
                                  type="number"
                                  className="glass-input-sm text-right"
                                  value={active.ahorroProgramado?.monto || 0}
                                  onChange={(e) =>
                                    setActive({
                                      ...active,
                                      ahorroProgramado: { ...active.ahorroProgramado, monto: Number(e.target.value) },
                                    })
                                  }
                                />
                              </div>
                            )
                          )}

                          {/* Dinero Libre (Ocio / Salidas personales) */}
                          {showLibre && (
                            filtroPersonaHome !== "ambos" ? (
                              <div className={"glass-item-row check-item row-dinero-libre " + (active.dineroLibre?.pagado ? "is-paid" : "")}>
                                <button
                                  className={"glass-check " + (active.dineroLibre?.pagado ? "checked" : "")}
                                  onClick={toggleDineroLibrePagado}
                                  title={active.dineroLibre?.pagado ? "Marcar como pendiente" : "Marcar como apartado"}
                                >
                                  {active.dineroLibre?.pagado && <Check size={13} strokeWidth={3} />}
                                </button>
                                <div className="concept-title">
                                  <span className="concept-text">Dinero libre / bolsillo</span>
                                  <span className="badge-tag-libre">☕ Gustos sin culpa</span>
                                </div>
                                <div className="single-debt-amount-pill libre-pill-border">
                                  <span className="single-debt-label">Tu dinero libre:</span>
                                  <strong className="single-debt-value">{fmt(active.dineroLibre?.monto || 0)}</strong>
                                </div>
                              </div>
                            ) : (
                              <div className="glass-item-row check-item row-dinero-libre">
                                <button
                                  className={"glass-check " + (active.dineroLibre?.pagado ? "checked" : "")}
                                  onClick={toggleDineroLibrePagado}
                                >
                                  {active.dineroLibre?.pagado && <Check size={13} strokeWidth={3} />}
                                </button>
                                <div className="concept-title">
                                  <span className="concept-text">Dinero libre / bolsillo</span>
                                  <span className="badge-tag-libre">☕ Gustos sin culpa</span>
                                </div>
                                <SegmentedPersonBadge
                                  value={
                                    !active.dineroLibre?.pagado
                                      ? active.dineroLibre?.asignado
                                      : active.dineroLibre?.pagadoPor || active.dineroLibre?.asignado
                                  }
                                  onChange={(p) =>
                                    !active.dineroLibre?.pagado
                                      ? setActive({ ...active, dineroLibre: { ...active.dineroLibre, asignado: p } })
                                      : setActive({ ...active, dineroLibre: { ...active.dineroLibre, pagadoPor: p } })
                                  }
                                  title="Quién lo asume"
                                />
                                <input
                                  type="number"
                                  className="glass-input-sm text-right"
                                  value={active.dineroLibre?.monto || 0}
                                  onChange={(e) =>
                                    setActive({
                                      ...active,
                                      dineroLibre: { ...active.dineroLibre, monto: Number(e.target.value) },
                                    })
                                  }
                                />
                              </div>
                            )
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Columna Derecha: Abonos a Deudas Focalizado */}
                <div className="col-stack">
                  <div className="glass-inner-panel highlight-panel">
                    <div className="disp-highlight-bar">
                      <div>
                        <span className="disp-tag">Disponible para amortizar</span>
                        <p className="disp-calc-hint">
                          (Sueldos + extras) − gastos − ahorro − libre
                        </p>
                      </div>
                      <strong className="disp-val">{fmt(calculations.disponibleDeudas)}</strong>
                    </div>

                    <div className="section-title-flex">
                      <div>
                        <h3>Abono a Deudas</h3>
                        <span className="prio-tag">Estrategia Bola de Nieve</span>
                      </div>
                    </div>

                    {/* Vista de Abonos a Deudas según filtroPersonaHome */}
                    {debtsConPago.length === 0 && debtsEnCero.length === 0 ? (
                      <div className="empty-filter-debts-box">
                        <p>No hay abonos a deudas asignados a <strong>{filtroPersonaHome === "david" ? "David" : "Eveth"}</strong> en esta quincena.</p>
                        <button type="button" className="modern-btn-pill-accent" onClick={() => setFiltroPersonaHome("ambos")}>
                          Ver todas las deudas (Ambos)
                        </button>
                      </div>
                    ) : (
                      <div className="items-list">
                        {/* 1. Deudas con pago asignado para esta quincena (siempre visibles) */}
                        {debtsConPago.map((d) => renderDebtCard(d))}

                        {/* 2. Deudas que están en cero (escondidas en el desplegable) */}
                        {debtsEnCero.length > 0 && mostrarTodasDeudasHome && (
                          <div className="zero-debts-accordion-list animate-fade-in">
                            {debtsEnCero.map((d) => renderDebtCard(d))}
                          </div>
                        )}

                        {/* Botón para desplegar / contraer las deudas en cero */}
                        {debtsEnCero.length > 0 && (
                          <button
                            type="button"
                            className="toggle-debts-btn"
                            onClick={() => setMostrarTodasDeudasHome(!mostrarTodasDeudasHome)}
                          >
                            {!mostrarTodasDeudasHome ? (
                              <>
                                <ChevronDown size={14} />
                                <span>Ver y abonar a otras deudas ({debtsEnCero.length} más)</span>
                              </>
                            ) : (
                              <>
                                <ChevronUp size={14} />
                                <span>Ocultar deudas sin abono asignado</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    <div className="glass-item-row row-total">
                      <span>
                        {filtroPersonaHome !== "ambos"
                          ? `Total abonos de ${filtroPersonaHome === "david" ? "David" : "Eveth"}`
                          : "Total abonos planeados"}
                      </span>
                      <strong className={calculations.abonosPlaneados > calculations.disponibleDeudas + 1 ? "text-warn" : ""}>
                        {fmt(
                          filtroPersonaHome === "ambos"
                            ? calculations.abonosPlaneados
                            : filteredDebts.reduce((sum, d) => {
                                const ov = active.abonos[d.id];
                                const monto = ov ? ov.monto : (calculations.suggested[d.id] || 0);
                                const asig = ov?.asignado || "ambos";
                                const share = calculations.debtShares[d.id] || { david: 0, eveth: 0 };
                                return (
                                  sum +
                                  (filtroPersonaHome === "david"
                                    ? asig === "david"
                                      ? monto
                                      : share.david
                                    : asig === "eveth"
                                    ? monto
                                    : share.eveth)
                                );
                              }, 0)
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botón y Barra para Cerrar Quincena al Final del Home */}
              <div className="home-bottom-close-bar animate-fade-in">
                <div className="hb-info">
                  <span className="hb-tag">Fin de la quincena</span>
                  <strong className="hb-title">Cierre de período y actualización de saldos</strong>
                  <p className="hb-desc">
                    Cuando finalices los pagos de la quincena, este botón archiva todo en el Histórico, descuenta los abonos a las deudas y pasa a la siguiente quincena.
                  </p>
                </div>
                <div className="hb-actions-wrap">
                  <button
                    type="button"
                    className={"hb-save-btn " + (saveStatusAnim === "saved" ? "btn-saved" : saveStatusAnim === "saving" ? "btn-saving" : "")}
                    onClick={handleManualSave}
                    title="Guardar todos los pagos y cambios ahora en el dispositivo y la nube"
                  >
                    {saveStatusAnim === "saving" ? (
                      <>
                        <RefreshCw size={17} className="sync-spinner" />
                        <span>Guardando...</span>
                      </>
                    ) : saveStatusAnim === "saved" ? (
                      <>
                        <Check size={17} strokeWidth={3} />
                        <span>¡Guardado con éxito!</span>
                      </>
                    ) : (
                      <>
                        <Save size={17} />
                        <span>Guardar cambios</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="close-q-btn-bottom"
                    onClick={() => setShowCloseModal(true)}
                  >
                    <Check size={17} />
                    <span>Cerrar quincena ({periodLabel(active.tipo, active.mes, active.anio)})</span>
                    <ArrowRight size={17} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: GASTOS PROGRAMADOS / FUTUROS (CALENDARIO)
            ======================================================== */}
        {activeTab === "programados" && (
          <div className="tab-content animate-fade-in">
            <div className="glass-card">
              <div className="tab-header">
                <div>
                  <h2>Gastos Programados y Futuros</h2>
                  <p className="sub-hint">
                    Planifica pagos puntuales (seguro del carro en noviembre, SOAT, matrículas). Al llegar esa fecha, se incorporarán automáticamente a la quincena correspondiente.
                  </p>
                </div>
              </div>

              <div className="scheduled-grid">
                {scheduledExpenses.length === 0 ? (
                  <p className="empty-hint">No tienes gastos programados actualmente.</p>
                ) : (
                  scheduledExpenses
                    .sort((a, b) => (a.anio || 0) - (b.anio || 0) || a.mes - b.mes)
                    .map((s) => (
                      <div className="scheduled-card glass-inner-panel" key={s.id}>
                        <div className="sc-header">
                          <span className="sc-date-tag">
                            <Clock size={12} />
                            {MONTHS[s.mes]} {s.anio || ""} · {s.tipo === "ambas" ? "Ambas quincenas" : s.tipo}
                          </span>
                          <button
                            className="icon-btn-del"
                            onClick={() => removeScheduledExpense(s.id)}
                            title="Eliminar gasto programado"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <h3 className="sc-title">{s.concepto}</h3>
                        <div className="sc-footer">
                          <strong className="sc-amount">{fmt(s.monto)}</strong>
                          <span className="sc-asignado">Presupuesto familiar</span>
                          {s.recurrenteAnual && <span className="sc-recurrent">Recurrente anual</span>}
                        </div>
                      </div>
                    ))
                )}
              </div>

              <div className="glass-inner-panel add-scheduled-panel">
                <h3>Programar nuevo gasto futuro</h3>
                <div className="scheduled-form-grid">
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Concepto (ej. Seguro Todo Riesgo Carro)"
                    value={newScheduled.concepto}
                    onChange={(e) => setNewScheduled({ ...newScheduled, concepto: e.target.value })}
                  />

                  <div className="form-inline-fields">
                    <select
                      className="glass-select"
                      value={newScheduled.mes}
                      onChange={(e) => setNewScheduled({ ...newScheduled, mes: Number(e.target.value) })}
                    >
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i}>
                          Mes: {m}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      className="glass-input-sm anio-input"
                      placeholder="Año"
                      value={newScheduled.anio}
                      onChange={(e) => setNewScheduled({ ...newScheduled, anio: Number(e.target.value) })}
                    />

                    <select
                      className="glass-select"
                      value={newScheduled.tipo}
                      onChange={(e) => setNewScheduled({ ...newScheduled, tipo: e.target.value })}
                    >
                      <option value="Q1">1ra Quincena (Q1)</option>
                      <option value="Q2">2da Quincena (Q2)</option>
                      <option value="ambas">Ambas quincenas</option>
                    </select>

                    <input
                      type="number"
                      className="glass-input-sm text-right"
                      placeholder="Monto ($)"
                      value={newScheduled.monto}
                      onChange={(e) => setNewScheduled({ ...newScheduled, monto: e.target.value })}
                    />

                    <button className="modern-btn-primary btn-purple" onClick={addScheduledExpense}>
                      <Plus size={14} />
                      <span>Programar gasto</span>
                    </button>
                  </div>

                  <label className="checkbox-label" style={{ marginTop: "8px" }}>
                    <input
                      type="checkbox"
                      checked={newScheduled.recurrenteAnual}
                      onChange={(e) => setNewScheduled({ ...newScheduled, recurrenteAnual: e.target.checked })}
                    />
                    <span>Repetir todos los años en este mismo mes (ej. Seguro, SOAT)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: DEUDAS TOTALES (CON DETALLES DESPLEGABLES)
            ======================================================== */}
        {activeTab === "deudas" && (
          <div className="tab-content animate-fade-in">
            <div className="glass-card">
              <div className="tab-header">
                <div>
                  <div className="flex-align-center gap-6">
                    <h2>Deudas Totales</h2>
                    {debtAutoSaved && (
                      <span className="auto-save-pill animate-fade-in">✓ Guardado automático</span>
                    )}
                  </div>
                  <p className="sub-hint">
                    Vista simplificada: solo nombre y saldo visible. Pulsa "Detalles" para desplegar cuotas y fechas. Cambios autoguardados en tiempo real.
                  </p>
                </div>
                <div className="debt-summary-pill">
                  <span>Deuda global total:</span>
                  <strong>{fmt(calculations.totalDeuda)}</strong>
                </div>
              </div>

              {/* Barra de progreso */}
              <div className="debt-progress-card glass-inner-panel">
                <div className="dp-header">
                  <span>Meta hacia Deuda Cero</span>
                  <strong>{calculations.totalDeuda === 0 ? "¡LIBRES DE DEUDA! 🎉" : `${fmt(calculations.totalDeuda)} por amortizar`}</strong>
                </div>
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill debt-fill"
                    style={{
                      width: `${Math.max(5, Math.min(100, 100 - (calculations.totalDeuda / 40000000) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Lista de Deudas con Acordeón Desplegable */}
              <div className="debts-cards-list">
                {[...debts]
                  .sort((a, b) => a.prioridad - b.prioridad)
                  .map((d) => {
                    const isExpanded = Boolean(expandedDebtIds[d.id]);
                    const isDue = isDebtDueInActiveQuincena(d.fechaLimite, active?.tipo, active?.mes, active?.anio);

                    return (
                      <div className="debt-compact-card glass-inner-panel" key={d.id}>
                        {/* Fila principal simplificada (Nombre y Cantidad) */}
                        <div className="dac-row-simple">
                          <span className="dac-prio-tag">#{d.prioridad}</span>
                          <span className="dac-simple-title">
                            {d.concepto}
                            {isDue && (
                              <span className="badge-tag-due animate-pulse">⏰ Vence esta quincena</span>
                            )}
                          </span>
                          <strong className="dac-simple-amount">{fmt(d.saldo)}</strong>

                          <button
                            type="button"
                            className="dac-expand-btn"
                            onClick={() => toggleExpandDebt(d.id)}
                            title="Desplegar u ocultar detalles"
                          >
                            <span>{isExpanded ? "Ocultar" : "Detalles"}</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </button>

                          <button
                            className="icon-btn-del"
                            onClick={() => removeDebt(d.id)}
                            title="Eliminar deuda"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        {/* Detalles desplegables con autoguardado */}
                        {isExpanded && (
                          <div className="dac-accordion-content animate-fade-in">
                            <div className="dac-meta-row">
                              <div className="dac-meta-field">
                                <label>Concepto:</label>
                                <input
                                  type="text"
                                  className="glass-input-sm"
                                  value={d.concepto}
                                  onChange={(e) => updateDebt(d.id, { concepto: e.target.value })}
                                />
                              </div>

                              <div className="dac-meta-field">
                                <label>Saldo pendiente ($):</label>
                                <input
                                  type="number"
                                  className="glass-input-sm text-right font-bold-input"
                                  value={d.saldo}
                                  onChange={(e) => updateDebt(d.id, { saldo: Number(e.target.value) })}
                                />
                              </div>

                              <div className="dac-meta-field">
                                <label>Prioridad:</label>
                                <input
                                  type="number"
                                  className="glass-input-sm"
                                  style={{ width: "60px" }}
                                  value={d.prioridad}
                                  onChange={(e) => updateDebt(d.id, { prioridad: Number(e.target.value) })}
                                />
                              </div>
                            </div>

                            <div className="dac-metadata-grid">
                              <div className="dac-meta-field">
                                <label>Fecha límite de pago:</label>
                                <input
                                  type="date"
                                  className="glass-input-sm"
                                  value={d.fechaLimite || ""}
                                  onChange={(e) => updateDebt(d.id, { fechaLimite: e.target.value })}
                                />
                                {isDue && (
                                  <small className="due-warning-hint">
                                    ⚠️ Esta fecha coincide o vence en la quincena en curso.
                                  </small>
                                )}
                              </div>

                              <div className="dac-meta-field">
                                <label>Cuota mensual acordada:</label>
                                <input
                                  type="number"
                                  className="glass-input-sm text-right"
                                  placeholder="0"
                                  value={d.cuotaMensual || ""}
                                  onChange={(e) => updateDebt(d.id, { cuotaMensual: Number(e.target.value) })}
                                />
                              </div>

                              <div className="dac-meta-field">
                                <label>Cuotas pactadas (totales / rest):</label>
                                <div className="cuotas-split-input">
                                  <input
                                    type="number"
                                    className="glass-input-sm"
                                    placeholder="Total"
                                    value={d.cuotasTotales || ""}
                                    onChange={(e) => updateDebt(d.id, { cuotasTotales: Number(e.target.value) })}
                                  />
                                  <span>/</span>
                                  <input
                                    type="number"
                                    className="glass-input-sm"
                                    placeholder="Faltan"
                                    value={d.cuotasRestantes || ""}
                                    onChange={(e) => updateDebt(d.id, { cuotasRestantes: Number(e.target.value) })}
                                  />
                                </div>
                              </div>

                              <div className="dac-meta-field">
                                <label>Abono a capital por cuota:</label>
                                <input
                                  type="number"
                                  className="glass-input-sm text-right"
                                  placeholder="Ej. 700000"
                                  value={d.amortizacionCapital || ""}
                                  onChange={(e) => updateDebt(d.id, { amortizacionCapital: Number(e.target.value) })}
                                />
                                {d.cuotaMensual > 0 && d.amortizacionCapital > 0 && (
                                  <small className="interest-calc">
                                    Intereses: {fmt(d.cuotaMensual - d.amortizacionCapital)}
                                  </small>
                                )}
                              </div>

                              <div className="dac-meta-field dac-checkbox-field">
                                <label className="checkbox-label">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(d.soloCuotaFija)}
                                    onChange={(e) => updateDebt(d.id, { soloCuotaFija: e.target.checked })}
                                  />
                                  <span>Solo cuota fija (ignorar en abonos extraordinarios)</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Formulario para agregar deuda */}
              <div className="glass-inner-panel add-debt-panel">
                <h3>Agregar nueva deuda</h3>
                <div className="add-debt-form-grid">
                  <input
                    type="number"
                    className="glass-input-sm prio-input"
                    placeholder="Prio"
                    value={newDebt.prioridad}
                    onChange={(e) => setNewDebt({ ...newDebt, prioridad: e.target.value })}
                  />
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Concepto (ej. Tarjeta de Crédito)"
                    value={newDebt.concepto}
                    onChange={(e) => setNewDebt({ ...newDebt, concepto: e.target.value })}
                  />
                  <input
                    type="number"
                    className="glass-input-sm text-right"
                    placeholder="Saldo total ($)"
                    value={newDebt.saldo}
                    onChange={(e) => setNewDebt({ ...newDebt, saldo: e.target.value })}
                  />
                  <input
                    type="date"
                    className="glass-input-sm"
                    title="Fecha límite de pago (opcional)"
                    value={newDebt.fechaLimite}
                    onChange={(e) => setNewDebt({ ...newDebt, fechaLimite: e.target.value })}
                  />
                  <button className="modern-btn-primary btn-amber" onClick={addDebt}>
                    <Plus size={14} />
                    <span>Guardar deuda</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: AHORROS GUARDADOS (ALCANCÍA LÍQUIDA INTERACTIVA)
            ======================================================== */}
        {activeTab === "ahorros" && (
          <div className="tab-content animate-fade-in">
            <div className="glass-card">
              <div className="tab-header">
                <div>
                  <h2>Ahorros Guardados</h2>
                  <p className="sub-hint">
                    Alcancía de cerdito interactiva que se llena de dinero a medida que cumples tu meta de ahorro.
                  </p>
                </div>
              </div>

              {/* Alcancía Gráfica de Cerdito Líquida */}
              <div className="savings-hero-flex glass-inner-panel">
                <LiquidPiggyBank balance={savings.balanceTotal} goal={savings.metaAhorro} />

                <div className="savings-details-col">
                  <span className="sh-eyebrow">Fondo total en la alcancía</span>
                  <h1 className="sh-amount">{fmt(savings.balanceTotal)}</h1>

                  <div className="meta-edit-inline">
                    <span>Meta de ahorro:</span>
                    <input
                      type="number"
                      className="glass-input-sm text-right"
                      value={savings.metaAhorro}
                      onChange={(e) => setSavings({ ...savings, metaAhorro: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Aporte manual */}
              <div className="glass-inner-panel">
                <h3>Registrar aporte voluntario a la alcancía</h3>
                <div className="add-savings-form">
                  <input
                    type="text"
                    className="glass-input"
                    placeholder="Concepto (ej. Cajita Nu, Venta, Rendimientos)"
                    value={newManualSavings.concepto}
                    onChange={(e) => setNewManualSavings({ ...newManualSavings, concepto: e.target.value })}
                  />
                  <input
                    type="number"
                    className="glass-input-sm text-right"
                    placeholder="Monto ($)"
                    value={newManualSavings.monto}
                    onChange={(e) => setNewManualSavings({ ...newManualSavings, monto: e.target.value })}
                  />
                  <button className="modern-btn-primary btn-blue" onClick={addManualSaving}>
                    <Plus size={14} />
                    <span>Guardar en alcancía</span>
                  </button>
                </div>
              </div>

              {/* Historial de aportes */}
              <div className="glass-inner-panel">
                <h3>Historial de aportes al ahorro</h3>
                {(savings.registros || []).length === 0 ? (
                  <p className="empty-hint">Aún no hay aportes registrados en la alcancía.</p>
                ) : (
                  <div className="savings-history-list">
                    {savings.registros.map((r) => (
                      <div className="savings-row-item" key={r.id}>
                        <div className="sr-info">
                          <span className="sr-tag">Fondo Familiar</span>
                          <span className="sr-concept">{r.concepto}</span>
                          <span className="sr-date">{r.fecha}</span>
                        </div>
                        <strong className="sr-amount">+{fmt(r.monto)}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: HISTÓRICO DE QUINCENAS CERRADAS
            ======================================================== */}
        {activeTab === "historico" && (
          <div className="tab-content animate-fade-in">
            <div className="glass-card">
              <div className="tab-header">
                <h2>Histórico de Quincenas</h2>
                <p className="sub-hint">Rendimiento y distribución de cada quincena cerrada.</p>
              </div>

              {history.length === 0 ? (
                <div className="empty-state-panel">
                  <History size={40} className="empty-icon" />
                  <h3>Aún no has cerrado quincenas</h3>
                  <p>Al pulsar "Cerrar quincena" en la pantalla de inicio, aquí se archivará con su gráfica de 4 áreas.</p>
                </div>
              ) : (
                <div className="history-cards-grid">
                  {history.map((h) => (
                    <div className="history-card glass-inner-panel" key={h.id}>
                      <div className="h-card-top">
                        <div>
                          <strong className="h-label">{h.label}</strong>
                          <span className="h-date">Cerrada el {h.cerradaEl}</span>
                        </div>
                        <div className="h-top-actions">
                          <button
                            type="button"
                            className="h-reopen-btn"
                            onClick={() => handleReabrirQuincena(h)}
                            title="Reabrir quincena para modificarla o corregir"
                          >
                            <Unlock size={12} />
                            <span>Reabrir</span>
                          </button>
                          <span className="h-debt-badge">
                            Deuda restante: {fmt(h.deudaPendienteDespues)}
                          </span>
                        </div>
                      </div>

                      {h.amortizoCarroCapital && (
                        <div className="h-carro-amortizo-tag">
                          🚗 Se amortizaron $700.000 a capital del crédito del Carro
                        </div>
                      )}

                      {h.chartData && (
                        <div className="h-chart-wrap">
                          <EconomyDonutChart
                            gastos={h.chartData.gastos}
                            deudas={h.chartData.deudas}
                            ahorros={h.chartData.ahorros}
                            libre={h.chartData.libre || 0}
                            totalTitle="Distribución"
                            size={140}
                            strokeWidth={18}
                          />
                        </div>
                      )}

                      <div className="h-metrics-grid">
                        <div className="h-metric-item">
                          <span>Eveth pagó</span>
                          <strong>{fmt(h.balances?.eveth?.totalPagado || 0)}</strong>
                          <small>Terminó con: {fmt(h.balances?.eveth?.saldoEnCuenta || 0)}</small>
                        </div>
                        <div className="h-metric-item">
                          <span>David pagó</span>
                          <strong>{fmt(h.balances?.david?.totalPagado || 0)}</strong>
                          <small>Terminó con: {fmt(h.balances?.david?.saldoEnCuenta || 0)}</small>
                        </div>
                        <div className="h-metric-item">
                          <span>Abonos deuda</span>
                          <strong>{fmt(h.abonosPagados || 0)}</strong>
                        </div>
                        <div className="h-metric-item">
                          <span>Ahorro alcancía</span>
                          <strong className="text-savings">+{fmt(h.ahorroGenerado || 0)}</strong>
                        </div>
                      </div>

                      {/* Botón desplegable para ver y ocultar detalles de lo pagado */}
                      <button
                        type="button"
                        className="toggle-history-btn"
                        onClick={() => toggleExpandHistory(h.id)}
                      >
                        <span>
                          {expandedHistoryIds[h.id]
                            ? "▲ Ocultar desglose detallado"
                            : "▼ Ver qué y cuánto se pagó en esta quincena"}
                        </span>
                      </button>

                      {expandedHistoryIds[h.id] && (
                        <div className="h-details-accordion animate-fade-in">
                          {/* Gastos Pagados */}
                          <div className="h-details-block">
                            <span className="h-details-title">Gastos pagados:</span>
                            <div className="h-details-items">
                              {(h.detallesPagos?.gastos || []).map((g, idx) => (
                                <div key={idx} className="h-detail-row">
                                  <span className="h-detail-name">
                                    {g.concepto} {g.tipoGasto === "imprevisto" ? "⚠️" : ""}
                                  </span>
                                  <span className="h-detail-who">
                                    {g.pagadoPor === "david" ? "David" : g.pagadoPor === "eveth" ? "Eveth" : "Familiar"}
                                  </span>
                                  <strong className="h-detail-amount">{fmt(g.monto)}</strong>
                                </div>
                              ))}
                              {(!h.detallesPagos?.gastos || h.detallesPagos.gastos.length === 0) && (
                                <div className="h-detail-row">
                                  <span>Gastos totales pagados</span>
                                  <strong>{fmt(h.gastosPagados)}</strong>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Abonos Pagados */}
                          <div className="h-details-block">
                            <span className="h-details-title">Abonos a deudas realizados:</span>
                            <div className="h-details-items">
                              {(h.detallesPagos?.deudas || []).map((d, idx) => (
                                <div key={idx} className="h-detail-row">
                                  <span className="h-detail-name">{d.concepto}</span>
                                  <span className="h-detail-who">
                                    {d.pagadoPor === "ambos" ? "Ambos" : d.pagadoPor === "david" ? "David" : "Eveth"}
                                  </span>
                                  <strong className="h-detail-amount">{fmt(d.monto)}</strong>
                                </div>
                              ))}
                              {(!h.detallesPagos?.deudas || h.detallesPagos.deudas.length === 0) && (
                                <div className="h-detail-row">
                                  <span>{h.abonosPagados > 0 ? "Total abonos pagados" : "Sin abonos extraordinarios"}</span>
                                  <strong>{fmt(h.abonosPagados || 0)}</strong>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Resumen Ahorro y Libre */}
                          <div className="h-details-block h-details-summary-row">
                            <div className="h-detail-summary-item">
                              <span>Ahorro para la alcancía:</span>
                              <strong className="text-savings">+{fmt(h.ahorroGenerado || h.detallesPagos?.ahorro || 0)}</strong>
                            </div>
                            <div className="h-detail-summary-item">
                              <span>Dinero libre / bolsillo:</span>
                              <strong>{fmt(h.chartData?.libre || h.detallesPagos?.dineroLibre || 0)}</strong>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="glass-footer">
          <p className="footer-brand-hint">🐾 Snoopy Bank — Gestor Financiero Familiar</p>
        </footer>
      </div>

      {/* Toast de Guardado Exitoso */}
      {showSaveToast && (
        <div className="save-toast-banner animate-slide-down">
          <div className="save-toast-content">
            <CheckCircle2 size={19} className="toast-icon-success" />
            <div className="toast-text-wrap">
              <strong>¡Cambios guardados con éxito!</strong>
              <p>El registro de pagos se respaldó en tu navegador y en Cloudflare D1 ({lastSavedTime}).</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Cerrar Quincena */}
      {showCloseModal && (
        <div className="modal-backdrop animate-fade-in" onClick={() => setShowCloseModal(false)}>
          <div className="modal-dialog glass-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-wrap">
                <div className="modal-icon-badge">
                  <CheckCircle2 size={22} className="modal-header-icon" />
                </div>
                <div>
                  <h3>Cerrar {periodLabel(active.tipo, active.mes, active.anio)}</h3>
                  <p className="modal-subtitle">Resumen final antes de archivar</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCloseModal(false)}
                title="Cerrar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-intro">
                Esta acción concluye la quincena actual. Revisa el resumen de los pagos que se registrarán:
              </p>

              <div className="modal-summary-card">
                <div className="m-summary-row">
                  <span className="m-label">Gastos efectivamente pagados:</span>
                  <strong className="m-value">
                    {fmt(calculations.gastosPagados)} ({active.gastosFijos.filter((g) => g.pagado).length} de {active.gastosFijos.length})
                  </strong>
                </div>
                {calculations.abonosPagados > 0 && (
                  <div className="m-summary-row">
                    <span className="m-label">Abonos pagados a deudas:</span>
                    <strong className="m-value text-emerald">{fmt(calculations.abonosPagados)}</strong>
                  </div>
                )}
                {calculations.totalExtrasParaAhorro + (active.ahorroProgramado?.pagado ? active.ahorroProgramado.monto : 0) > 0 && (
                  <div className="m-summary-row">
                    <span className="m-label">Aporte para la alcancía:</span>
                    <strong className="m-value text-blue">
                      +{fmt(calculations.totalExtrasParaAhorro + (active.ahorroProgramado?.pagado ? active.ahorroProgramado.monto : 0))}
                    </strong>
                  </div>
                )}
                <div className="m-summary-row m-summary-total">
                  <span className="m-label">Total desembolsos quincena:</span>
                  <strong className="m-value">{fmt(calculations.totalPagado)}</strong>
                </div>
              </div>

              <div className="modal-notice-box">
                <AlertCircle size={16} />
                <span>Al confirmar, este desglose se guardará en <strong>Histórico</strong> y se abrirá automáticamente el siguiente período con las deudas actualizadas.</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="glass-btn-cancel"
                onClick={() => setShowCloseModal(false)}
              >
                Cancelar / Seguir editando
              </button>
              <button
                type="button"
                className="glass-btn-primary confirm-close-btn"
                onClick={() => {
                  setShowCloseModal(false);
                  cerrarQuincena();
                }}
              >
                <Check size={16} />
                <span>Sí, cerrar y archivar quincena</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const glassStyles = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

:root {
  --bg-color: #f4f6fb;
  --text-dark: #0f172a;
  --text-muted: #64748b;
  --emerald: #10b981;
  --emerald-dark: #047857;
  --amber: #f59e0b;
  --amber-dark: #b45309;
  --blue: #3b82f6;
  --blue-dark: #1d4ed8;
  --purple: #8b5cf6;
  --purple-dark: #6d28d9;
  --glass-bg: rgba(255, 255, 255, 0.74);
  --glass-border: rgba(255, 255, 255, 0.85);
  --glass-inner: rgba(255, 255, 255, 0.58);
  --glass-shadow: 0 16px 40px -8px rgba(15, 23, 42, 0.06), 0 4px 12px -2px rgba(15, 23, 42, 0.03);
}

* { box-sizing: border-box; }

body, html {
  margin: 0;
  padding: 0;
  background: var(--bg-color);
  color: var(--text-dark);
  font-family: 'Inter', sans-serif;
  font-size: 15.5px;
  -webkit-font-smoothing: antialiased;
}

.glass-root {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
  padding: 32px 16px 80px;
}

.ambient-blob {
  position: fixed;
  border-radius: 50%;
  filter: blur(90px);
  pointer-events: none;
  z-index: 0;
  opacity: 0.45;
}
.blob-emerald {
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0) 70%);
  top: -120px;
  left: -100px;
}
.blob-blue {
  width: 520px;
  height: 520px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, rgba(59, 130, 246, 0) 70%);
  top: 30%;
  right: -150px;
}
.blob-amber {
  width: 440px;
  height: 440px;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, rgba(245, 158, 11, 0) 70%);
  bottom: -80px;
  left: 20%;
}

.glass-container {
  position: relative;
  z-index: 1;
  max-width: 1100px;
  margin: 0 auto;
}

.glass-header {
  margin-bottom: 20px;
}
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  padding: 10px 16px;
  border-radius: 24px;
  box-shadow: 0 8px 32px -6px rgba(15, 23, 42, 0.07);
}
.header-sync-status {
  margin-left: auto;
  display: flex;
  align-items: center;
}
.sync-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: all 0.2s ease;
  user-select: none;
}
.sync-badge.synced {
  background: rgba(34, 197, 94, 0.12);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.25);
}
.sync-badge.syncing {
  background: rgba(234, 179, 8, 0.14);
  color: #b45309;
  border: 1px solid rgba(234, 179, 8, 0.3);
}
.sync-badge.local {
  background: rgba(100, 116, 139, 0.1);
  color: #475569;
  border: 1px solid rgba(100, 116, 139, 0.2);
}
.sync-badge.error {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
  border: 1px solid rgba(239, 68, 68, 0.25);
}
.sync-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.sync-dot.synced {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}
.sync-dot.local {
  background: #94a3b8;
}
.sync-dot.error {
  background: #ef4444;
}
.sync-spinner {
  animation: spin 1.2s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.header-brand {
  display: flex;
  align-items: center;
  gap: 14px;
  transition: opacity 0.2s ease;
  user-select: none;
}
.header-brand:hover {
  opacity: 0.9;
}
.header-logo-container {
  flex-shrink: 0;
}
.header-snoopy-logo {
  width: 52px;
  height: 52px;
  border-radius: 16px;
  object-fit: contain;
  background: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.1);
  padding: 2px;
  display: block;
  transition: transform 0.25s ease;
}
.header-snoopy-logo:hover {
  transform: scale(1.05) rotate(-2deg);
}
.header-headings {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.brand-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(16, 185, 129, 0.12);
  border: 1px solid rgba(16, 185, 129, 0.25);
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  color: var(--emerald-dark);
  margin-bottom: 2px;
}
.sparkle-icon { color: var(--emerald); }
.hero-title {
  font-family: 'Fraunces', 'Outfit', serif;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.hero-subtitle {
  font-size: 12px;
  color: var(--text-muted);
  margin: 1px 0 0;
  line-height: 1.2;
  font-weight: 500;
}

/* Drawer lateral móvil que sale de la izquierda (Off-Canvas) */
.mobile-drawer-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  z-index: 9998;
}
.mobile-sidebar-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 300px;
  max-width: 86vw;
  height: 100vh;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  z-index: 9999;
  box-shadow: 8px 0 36px rgba(15, 23, 42, 0.22);
  display: flex;
  flex-direction: column;
  transform: translateX(-100%);
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
  overflow-y: auto;
}
.mobile-sidebar-drawer.open {
  transform: translateX(0);
}
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 18px 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.85);
}
.drawer-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.drawer-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  object-fit: contain;
  background: #ffffff;
  padding: 2px;
  border: 2px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
}
.drawer-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  color: var(--emerald-dark);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.drawer-title {
  font-family: 'Fraunces', 'Outfit', serif;
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: var(--text-dark);
}
.drawer-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(241, 245, 249, 0.9);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}
.drawer-close-btn:hover {
  background: #e2e8f0;
  color: var(--text-dark);
}
.drawer-nav-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 14px;
  flex: 1;
}
.drawer-nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;
  font-family: 'Inter', sans-serif;
}
.drawer-nav-link:hover {
  background: rgba(241, 245, 249, 0.85);
}
.drawer-nav-link.active {
  background: #0f172a;
  color: white;
  box-shadow: 0 6px 16px -2px rgba(15, 23, 42, 0.25);
}
.drawer-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon-home { background: rgba(16, 185, 129, 0.15); color: var(--emerald-dark); }
.icon-calendar { background: rgba(99, 102, 241, 0.15); color: #4f46e5; }
.icon-debt { background: rgba(245, 158, 11, 0.15); color: var(--amber-dark); }
.icon-save { background: rgba(59, 130, 246, 0.15); color: var(--blue-dark); }
.icon-history { background: rgba(100, 116, 139, 0.15); color: #334155; }
.drawer-nav-link.active .drawer-icon-box {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
.drawer-link-texts {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.drawer-link-title {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-dark);
}
.drawer-nav-link.active .drawer-link-title {
  color: white;
}
.drawer-link-desc {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.drawer-nav-link.active .drawer-link-desc {
  color: rgba(255, 255, 255, 0.7);
}
.drawer-active-pill {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  background: var(--emerald);
  color: white;
  padding: 2px 7px;
  border-radius: 999px;
}
.drawer-count {
  background: rgba(241, 245, 249, 0.9);
  color: var(--text-dark);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
}
.drawer-nav-link.active .drawer-count {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}
.drawer-badge-pill {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 999px;
}
.drawer-badge-pill.debt-pill {
  background: rgba(245, 158, 11, 0.15);
  color: var(--amber-dark);
}
.drawer-badge-pill.save-pill {
  background: rgba(59, 130, 246, 0.15);
  color: var(--blue-dark);
}
.drawer-nav-link.active .drawer-badge-pill {
  background: rgba(255, 255, 255, 0.25);
  color: white;
}
.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(226, 232, 240, 0.85);
  font-size: 11.5px;
  color: var(--text-muted);
  text-align: center;
}

/* Desktop Navbar: siempre visible en computador */
.desktop-navbar {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 14px;
  flex-wrap: wrap;
}
.desktop-nav-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  padding: 10px 18px;
  border-radius: 999px;
  color: var(--text-muted);
  font-size: 14.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  font-family: 'Inter', sans-serif;
}
.desktop-nav-item:hover {
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-dark);
  transform: translateY(-1px);
}
.desktop-nav-item.active {
  background: #0f172a;
  color: white;
  border-color: #0f172a;
  font-weight: 600;
  box-shadow: 0 8px 18px -4px rgba(15, 23, 42, 0.25);
}
.desktop-nav-item .nav-count {
  background: rgba(255, 255, 255, 0.25);
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
}
.desktop-nav-item .nav-badge-pill {
  background: rgba(245, 158, 11, 0.15);
  color: var(--amber-dark);
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.desktop-nav-item.active .nav-badge-pill {
  background: rgba(255, 255, 255, 0.2);
  color: #fde68a;
}
.desktop-nav-item.active .nav-badge-pill.savings-pill {
  background: rgba(255, 255, 255, 0.2);
  color: #bfdbfe;
}

/* Botón hamburguesa móvil */
.mobile-hamburger-btn {
  display: none;
  align-items: center;
  gap: 6px;
  background: #0f172a;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
  transition: all 0.2s ease;
}
.mobile-hamburger-btn:hover {
  background: #1e293b;
}
.mobile-active-tag {
  display: none;
  font-size: 12px;
  font-weight: 700;
  color: var(--emerald-dark);
  background: rgba(16, 185, 129, 0.12);
  padding: 4px 10px;
  border-radius: 999px;
}

/* Reglas Responsive: Ocultar desktop navbar en móvil y mostrar hamburguesa */
@media (max-width: 768px) {
  .desktop-navbar {
    display: none !important;
  }
  .mobile-hamburger-btn {
    display: inline-flex !important;
  }
  .mobile-active-tag {
    display: inline-flex !important;
  }
  .header-bar {
    padding: 8px 12px;
    border-radius: 18px;
    gap: 8px;
  }
  .header-snoopy-logo {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
  .hero-title {
    font-size: 18px;
  }
  .hero-subtitle {
    display: none;
  }
}
@media (min-width: 769px) {
  .mobile-sidebar-drawer, .mobile-drawer-backdrop {
    display: none !important;
  }
  .mobile-hamburger-btn {
    display: none !important;
  }
  .mobile-active-tag {
    display: none !important;
  }
}

/* Glass Card */
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
}
.glass-inner-panel {
  background: var(--glass-inner);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 16px;
}

.card-topbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
  gap: 16px;
  flex-wrap: wrap;
}
.card-topbar-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}
.manual-save-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 14px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}
.manual-save-btn:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.38);
}
.manual-save-btn.btn-saving {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
}
.manual-save-btn.btn-saved {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.4);
  transform: scale(1.02);
}
.last-saved-hint {
  font-size: 11.5px;
  color: var(--text-muted);
  font-weight: 500;
}
.q-period-header-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.quincena-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 999px;
  letter-spacing: 0.02em;
  user-select: none;
}
.quincena-status-badge.status-vacia {
  background: rgba(100, 116, 139, 0.12);
  color: #475569;
  border: 1px solid rgba(148, 163, 184, 0.28);
}
.quincena-status-badge.status-en-progreso {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.35);
}
.quincena-status-badge.status-archivada {
  background: rgba(99, 102, 241, 0.12);
  color: #4f46e5;
  border: 1px solid rgba(99, 102, 241, 0.28);
}
.status-pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.7);
  animation: pulse-amber 1.8s infinite;
}
@keyframes pulse-amber {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 5px rgba(245, 158, 11, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}
.status-gray-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
}

/* Banners explicativos por estado */
.vacia-period-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(226, 232, 240, 0.9);
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 12.5px;
  color: var(--text-muted);
  margin-bottom: 18px;
}
.progreso-period-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(254, 243, 199, 0.35);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 12.5px;
  color: #92400e;
  margin-bottom: 18px;
}
.ppb-indicator-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #d97706;
  flex-shrink: 0;
}
.archived-period-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  background: rgba(238, 242, 255, 0.85);
  border: 1px solid rgba(199, 210, 254, 0.9);
  padding: 14px 18px;
  border-radius: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.apb-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.apb-icon-wrap {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.15);
  color: #4f46e5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.apb-content strong {
  display: block;
  font-size: 14px;
  color: #312e81;
}
.apb-content p {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: #4b5563;
}
.apb-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.apb-btn {
  padding: 8px 14px;
  font-size: 13px;
}
.glass-btn-reopen {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #4f46e5;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.glass-btn-reopen:hover {
  background: #4f46e5;
  color: white;
  transform: translateY(-1px);
}
.h-top-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.h-reopen-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(203, 213, 225, 0.85);
  color: var(--text-muted);
  padding: 4px 9px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}
.h-reopen-btn:hover {
  background: #ffffff;
  color: #4f46e5;
  border-color: #c7d2fe;
}
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  color: var(--emerald-dark);
}
.q-period-selector h2 {
  font-family: 'Outfit', sans-serif;
  font-size: 25px;
  margin: 4px 0 12px;
  color: var(--text-dark);
}
.pill-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.glass-pill {
  border: 1px solid rgba(203, 213, 225, 0.8);
  background: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13.5px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
  font-weight: 500;
}
.glass-pill.active { background: #0f172a; color: white; border-color: #0f172a; font-weight: 600; }
.glass-select, .glass-input-sm, .glass-input {
  border: 1px solid rgba(203, 213, 225, 0.85);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 14.5px;
  color: var(--text-dark);
  font-family: 'Inter', sans-serif;
}
.anio-input { width: 80px; text-align: center; }

.glass-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 12px 22px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
  transition: all 0.2s ease;
  font-family: 'Inter', sans-serif;
}
.glass-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.4);
}

/* ========================================================
   SELECTOR DE PERSONA EN HOME (DAVID / EVETH / AMBOS)
   ======================================================== */
.home-persona-filter-card {
  padding: 16px 20px;
  margin-bottom: 22px;
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
}
.hpf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.hpf-title-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.hpf-label {
  font-size: 12.5px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
  color: var(--text-muted);
}
.hpf-selected-tag {
  font-family: 'Outfit', sans-serif;
  font-size: 17px;
  color: var(--text-dark);
}
.hpf-segmented {
  display: flex;
  background: rgba(241, 245, 249, 0.9);
  padding: 5px;
  border-radius: 999px;
  border: 1px solid rgba(203, 213, 225, 0.8);
  gap: 6px;
}
.hpf-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 9px 18px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Inter', sans-serif;
}
.hpf-btn:hover {
  color: var(--text-dark);
  background: rgba(255, 255, 255, 0.7);
}
.hpf-btn.active {
  background: #0f172a;
  color: white;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.25);
}
.hpf-badge {
  background: rgba(255, 255, 255, 0.22);
  color: inherit;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 999px;
  font-family: 'Outfit', sans-serif;
}
.hpf-btn:not(.active) .hpf-badge {
  background: rgba(0, 0, 0, 0.08);
  color: var(--text-dark);
}
.hpf-status-banner {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(203, 213, 225, 0.8);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.hpf-banner-text {
  font-size: 14px;
  color: var(--text-dark);
}
.hpf-reset-btn {
  background: rgba(241, 245, 249, 0.9);
  border: 1px solid rgba(203, 213, 225, 0.8);
  color: var(--emerald-dark);
  font-size: 13px;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.hpf-reset-btn:hover {
  background: white;
  border-color: var(--emerald);
}

/* Enfoque en balances */
.focused-balance-box {
  border: 2px solid var(--emerald) !important;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(236, 253, 245, 0.95) 100%) !important;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.18) !important;
  transform: translateY(-2px);
}
.muted-balance-box {
  opacity: 0.6;
  transition: opacity 0.2s ease;
}
.muted-balance-box:hover {
  opacity: 0.9;
}

/* Indicador de filtro activo en secciones */
.active-filter-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
}
.clear-filter-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-muted);
  line-height: 1;
  padding: 0 3px;
}
.clear-filter-btn:hover {
  color: #ef4444;
}

.my-share-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(16, 185, 129, 0.15);
  color: var(--emerald-dark);
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 600;
}

.empty-filter-debts-box {
  padding: 24px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.empty-filter-debts-box p {
  margin: 0;
  font-size: 14.5px;
  color: var(--text-muted);
}

.imprevisto-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.85) 0%, rgba(254, 226, 226, 0.85) 100%);
  border: 1px solid rgba(245, 158, 11, 0.4);
  padding: 14px 18px;
  border-radius: 14px;
  margin-bottom: 20px;
  font-size: 14px;
}
.imprevisto-banner strong { color: #9a3412; font-size: 14.5px; display: block; }
.imprevisto-banner p { margin: 3px 0 0; color: #7c2d12; font-size: 13px; }
.warn-icon { color: #ea580c; flex-shrink: 0; }

/* Balances */
.balances-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  margin-bottom: 24px;
}
@media (max-width: 700px) { .balances-row { grid-template-columns: 1fr; } }
.balance-box {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02);
}
.b-header { display: flex; justify-content: space-between; align-items: baseline; }
.b-header strong { font-family: 'Outfit', sans-serif; font-size: 20px; color: var(--text-dark); }
.b-sueldo { font-size: 13px; color: var(--text-muted); }
.b-main { display: flex; flex-direction: column; margin: 4px 0; }
.b-label { font-size: 13px; color: var(--text-muted); }
.b-amount { font-family: 'Outfit', sans-serif; font-size: 28px; font-weight: 700; color: var(--emerald-dark); }
.b-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text-muted);
  flex-wrap: wrap;
  padding-top: 8px;
  border-top: 1px dashed rgba(226, 232, 240, 0.8);
}
.warn-badge { background: rgba(245, 158, 11, 0.15); color: var(--amber-dark); padding: 3px 9px; border-radius: 999px; font-weight: 600; font-size: 12.5px; }
.safe-badge { background: rgba(16, 185, 129, 0.15); color: var(--emerald-dark); padding: 3px 9px; border-radius: 999px; font-weight: 600; font-size: 12.5px; }

/* Donut */
.chart-section { padding: 20px; }
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;
}
.chart-header h3 { margin: 0; font-family: 'Outfit', sans-serif; font-size: 17px; }
.sub-hint { margin: 2px 0 0; font-size: 12.5px; color: var(--text-muted); }
.scope-switcher { display: flex; gap: 4px; }
.glass-pill-sm {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(203, 213, 225, 0.7);
  font-size: 11.5px;
  padding: 3px 10px;
  border-radius: 999px;
  color: var(--text-muted);
  cursor: pointer;
}
.glass-pill-sm.active { background: #0f172a; color: white; border-color: #0f172a; font-weight: 600; }
.donut-wrap { display: flex; align-items: center; justify-content: space-around; gap: 24px; flex-wrap: wrap; }
.donut-svg-container { position: relative; display: flex; align-items: center; justify-content: center; }
.donut-svg { transform: rotate(-90deg); border-radius: 50%; }
.donut-center { position: absolute; display: flex; flex-direction: column; align-items: center; text-align: center; pointer-events: none; }
.donut-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--text-muted); }
.donut-val { font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; color: var(--text-dark); }
.donut-legend { display: flex; flex-direction: column; gap: 8px; }
.legend-item { display: flex; align-items: center; gap: 10px; }
.dot { width: 11px; height: 11px; border-radius: 50%; flex-shrink: 0; }
.dot-gastos { background: #10b981; }
.dot-deudas { background: #f59e0b; }
.dot-ahorros { background: #3b82f6; }
.dot-libre { background: #8b5cf6; }
.legend-info { display: flex; flex-direction: column; }
.legend-name { font-size: 11.5px; color: var(--text-muted); }
.legend-info strong { font-size: 13px; color: var(--text-dark); }

/* Alcancía */
.piggy-container { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.piggy-svg { filter: drop-shadow(0 10px 20px rgba(59, 130, 246, 0.12)); }
.piggy-badge-box { text-align: center; display: flex; flex-direction: column; align-items: center; }
.piggy-percent-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(16, 185, 129, 0.15);
  color: var(--emerald-dark);
  font-weight: 700;
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 999px;
}
.coin-icon { color: #eab308; }
.piggy-subtext { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
.savings-hero-flex {
  display: flex;
  align-items: center;
  justify-content: space-around;
  gap: 24px;
  flex-wrap: wrap;
  padding: 24px;
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.6) 0%, rgba(255, 255, 255, 0.8) 100%);
  border: 1px solid rgba(59, 130, 246, 0.25);
  margin-bottom: 20px;
}
.savings-details-col { display: flex; flex-direction: column; gap: 8px; }
.sh-eyebrow { font-size: 12px; font-weight: 600; color: var(--blue-dark); text-transform: uppercase; }
.sh-amount { font-family: 'Outfit', sans-serif; font-size: 38px; font-weight: 700; margin: 0; color: var(--blue-dark); }
.meta-edit-inline { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); margin-top: 6px; }

/* Apartados separados en quincena */
.row-ahorro-prog { background: rgba(59, 130, 246, 0.08); border-left: 3px solid #3b82f6; padding-left: 8px; border-radius: 4px; }
.row-dinero-libre { background: rgba(139, 92, 246, 0.08); border-left: 3px solid #8b5cf6; padding-left: 8px; border-radius: 4px; }
.badge-tag-ahorro { font-size: 10px; background: rgba(59, 130, 246, 0.15); color: #1d4ed8; padding: 1px 6px; border-radius: 999px; font-weight: 600; }
.badge-tag-libre { font-size: 10px; background: rgba(139, 92, 246, 0.15); color: #6d28d9; padding: 1px 6px; border-radius: 999px; font-weight: 600; }

/* Focal Debt */
.focal-debt-box { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.focal-debt-badge {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--amber-dark);
  background: rgba(245, 158, 11, 0.15);
  padding: 3px 8px;
  border-radius: 6px;
  align-self: flex-start;
}
.focal-row { background: rgba(255, 255, 255, 0.85); border: 1.5px solid rgba(245, 158, 11, 0.4); border-radius: 10px; padding: 10px 12px; }
.toggle-debts-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  border: 1px dashed rgba(203, 213, 225, 0.9);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  margin-top: 4px;
}
.toggle-debts-btn:hover { background: rgba(255, 255, 255, 0.8); color: var(--text-dark); border-color: #94a3b8; }

/* Acordeón en Deudas */
.debt-compact-card { margin-bottom: 10px; padding: 12px 14px; }
.dac-row-simple { display: flex; align-items: center; gap: 10px; font-size: 13.5px; }
.dac-prio-tag { font-size: 11px; font-weight: 700; background: #0f172a; color: white; padding: 3px 7px; border-radius: 6px; }
.dac-simple-title { flex: 1; font-weight: 600; }
.dac-simple-amount { font-family: 'Outfit', sans-serif; font-size: 16px; color: var(--amber-dark); font-weight: 700; }
.dac-expand-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(203, 213, 225, 0.8);
  font-size: 11.5px;
  color: var(--text-muted);
  padding: 4px 9px;
  border-radius: 6px;
  cursor: pointer;
}
.dac-expand-btn:hover { background: white; color: var(--text-dark); }
.dac-accordion-content { margin-top: 12px; padding-top: 12px; border-top: 1px dashed rgba(203, 213, 225, 0.8); }
.dac-meta-row { display: flex; gap: 10px; align-items: flex-end; margin-bottom: 10px; flex-wrap: wrap; }

/* Gasto Recurrente Checkboxes */
.add-options-checkboxes { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 4px; }

/* Segmented badge */
.segmented-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(203, 213, 225, 0.8);
  border-radius: 999px;
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
}
.segmented-opt {
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  padding: 6px 13px;
  border-radius: 999px;
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  transition: all 0.12s ease;
  line-height: 1.15;
}
.segmented-opt.active {
  background: #0f172a;
  color: white;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* ========================================================
   ESTILOS DE BOTONES MODERNOS & FINTECH
   ======================================================== */
.modern-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 11px 22px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14.5px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.35);
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Inter', sans-serif;
}
.modern-btn-primary:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.45);
}
.modern-btn-primary:active {
  transform: translateY(0);
}
.modern-btn-primary.btn-purple {
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.modern-btn-primary.btn-purple:hover {
  box-shadow: 0 6px 18px rgba(139, 92, 246, 0.38);
}
.modern-btn-primary.btn-amber {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.modern-btn-primary.btn-amber:hover {
  box-shadow: 0 6px 18px rgba(245, 158, 11, 0.38);
}
.modern-btn-primary.btn-blue {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.modern-btn-primary.btn-blue:hover {
  box-shadow: 0 6px 18px rgba(59, 130, 246, 0.38);
}

.modern-btn-pill-accent {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: rgba(16, 185, 129, 0.14);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: var(--emerald-dark);
  font-size: 13.5px;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Inter', sans-serif;
}
.modern-btn-pill-accent:hover {
  background: #10b981;
  color: white;
  border-color: #10b981;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
  transform: translateY(-1px);
}

/* Switcher de Destino de Ingresos Extras (Pagar Deudas / Ahorro) */
.dest-switcher {
  display: inline-flex;
  background: rgba(241, 245, 249, 0.85);
  border: 1px solid rgba(203, 213, 225, 0.85);
  border-radius: 999px;
  padding: 3px;
  gap: 3px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}
.dest-opt {
  border: none;
  background: transparent;
  font-size: 11.5px;
  font-weight: 500;
  padding: 4px 11px;
  border-radius: 999px;
  cursor: pointer;
  color: var(--text-muted);
  font-family: 'Inter', sans-serif;
  transition: all 0.18s ease;
}
.dest-opt:hover {
  color: var(--text-dark);
}
.dest-opt.active-debt {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.35);
}
.dest-opt.active-save {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.35);
}

/* ========================================================
   ESTILOS DE ELEMENTO INGRESO EXTRA (LISTA Y TARJETAS)
   ======================================================== */
.extra-incomes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}
.empty-extras-placeholder {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.45);
  border: 1px dashed rgba(203, 213, 225, 0.7);
  border-radius: 14px;
}
.empty-extras-icon {
  color: #94a3b8;
  flex-shrink: 0;
}
.empty-extras-placeholder .empty-hint {
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
}
.extra-item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 11px 16px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  box-shadow: 0 4px 14px -3px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.extra-item-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 4px 0 0 4px;
}
.extra-card-eveth::before {
  background: linear-gradient(180deg, #ec4899 0%, #be185d 100%);
}
.extra-card-david::before {
  background: linear-gradient(180deg, #10b981 0%, #059669 100%);
}
.extra-item-card:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 8px 22px -4px rgba(15, 23, 42, 0.09);
  background: rgba(255, 255, 255, 0.96);
}
.extra-left-content {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.extra-avatar-icon {
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  font-size: 13px;
  flex-shrink: 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}
.avatar-eveth {
  background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
  color: #be185d;
  border: 1px solid rgba(244, 114, 182, 0.4);
}
.avatar-david {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  color: #047857;
  border: 1px solid rgba(52, 211, 153, 0.4);
}
.extra-info-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.extra-concept-title {
  font-family: 'Outfit', sans-serif;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-dark);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.extra-badges-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.extra-person-pill {
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}
.pill-eveth {
  background: rgba(244, 114, 182, 0.15);
  color: #9d174d;
}
.pill-david {
  background: rgba(16, 185, 129, 0.15);
  color: #065f46;
}
.extra-dest-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  letter-spacing: 0.01em;
}
.extra-dest-badge.dest-debt {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
  border: 1px solid rgba(245, 158, 11, 0.25);
}
.extra-dest-badge.dest-save {
  background: rgba(59, 130, 246, 0.12);
  color: #1d4ed8;
  border: 1px solid rgba(59, 130, 246, 0.25);
}
.extra-right-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}
.extra-amount-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}
.extra-amount-label {
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}
.extra-amount-value {
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: #059669;
  letter-spacing: -0.02em;
}
.extra-delete-btn {
  background: transparent;
  border: 1px solid transparent;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}
.extra-delete-btn:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  transform: scale(1.05);
}
@media (max-width: 600px) {
  .extra-item-card {
    padding: 10px 12px;
    gap: 10px;
  }
  .extra-concept-title {
    font-size: 13.5px;
  }
  .extra-amount-value {
    font-size: 14.5px;
  }
  .extra-avatar-icon {
    width: 28px;
    height: 28px;
    font-size: 11px;
    border-radius: 8px;
  }
}

/* Formulario Desplegable de Ingresos Extras */
.add-extra-form-collapsible {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  padding: 14px 16px;
  margin-top: 10px;
  box-shadow: 0 8px 24px -4px rgba(15, 23, 42, 0.06);
}
.aef-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}
.aef-title {
  font-family: 'Outfit', sans-serif;
  font-size: 13.5px;
  font-weight: 600;
  color: var(--text-dark);
}
.aef-close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.aef-close-btn:hover { background: rgba(0, 0, 0, 0.05); color: #ef4444; }
.aef-inputs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
  align-items: flex-end;
}
.aef-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.aef-input-group label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
}
.font-bold-input { font-weight: 700; font-size: 14px; }
.aef-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
  padding-top: 10px;
  border-top: 1px dashed rgba(226, 232, 240, 0.8);
}
.modern-btn-cancel {
  background: transparent;
  border: 1px solid rgba(203, 213, 225, 0.8);
  color: var(--text-muted);
  font-size: 12.5px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.modern-btn-cancel:hover {
  background: rgba(0, 0, 0, 0.03);
  color: var(--text-dark);
}
.empty-extra-hint {
  background: rgba(255, 255, 255, 0.5);
  border: 1px dashed rgba(203, 213, 225, 0.8);
  border-radius: 10px;
  padding: 12px 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.15s;
}
.empty-extra-hint:hover {
  background: rgba(255, 255, 255, 0.85);
  border-color: var(--emerald);
}
.empty-extra-hint p { margin: 0; font-size: 12px; color: var(--text-muted); }
.empty-extra-hint strong { color: var(--emerald-dark); }
.count-pill-emerald {
  background: rgba(16, 185, 129, 0.15);
  color: var(--emerald-dark);
  font-size: 11px;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
}
.flex-align-center { display: flex; align-items: center; }
.gap-6 { gap: 6px; }

/* ========================================================
   ALERTAS DE VENCIMIENTOS Y EQUILIBRIO EN CUENTAS
   ======================================================== */
.debt-due-alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.95) 0%, rgba(254, 243, 199, 0.95) 100%);
  border: 1.5px solid rgba(239, 68, 68, 0.35);
  border-radius: 14px;
  padding: 12px 16px;
  margin-bottom: 20px;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.08);
}
.due-banner-text { display: flex; flex-direction: column; gap: 4px; }
.due-banner-text strong { color: #991b1b; font-size: 13.5px; }
.due-debts-list { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0; }
.due-debt-tag {
  background: rgba(239, 68, 68, 0.12);
  color: #991b1b;
  border: 1px solid rgba(239, 68, 68, 0.25);
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.due-banner-text small { color: #7f1d1d; font-size: 11.5px; }

.badge-tag-due {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.3);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
}
.due-warning-hint { font-size: 11px; color: #dc2626; font-weight: 500; margin-top: 3px; }

.auto-save-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(16, 185, 129, 0.15);
  color: var(--emerald-dark);
  border: 1px solid rgba(16, 185, 129, 0.3);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 999px;
}

.balanced-badge {
  background: rgba(16, 185, 129, 0.2) !important;
  color: #047857 !important;
  border: 1px solid rgba(16, 185, 129, 0.4);
  font-weight: 700;
}

.abono-shares-sub {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}
.abono-shares-sub strong {
  color: var(--text-dark);
}

.segmented-abono-badge {
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(203, 213, 225, 0.9);
}
.segmented-opt.active-ambos {
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
  color: #38bdf8;
  font-weight: 600;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

.animate-pulse {
  animation: subtlePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes subtlePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ========================================================
   TARJETAS DE ABONO A DEUDAS (SIN DESBORDAMIENTO)
   ======================================================== */
.debt-abono-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.52);
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.18s ease;
}
.debt-abono-card:hover {
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(203, 213, 225, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}
.debt-abono-card.is-paid {
  background: rgba(241, 245, 249, 0.65);
  opacity: 0.85;
}
.debt-abono-card.focal-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(240, 253, 244, 0.85) 100%);
  border: 1.5px solid rgba(16, 185, 129, 0.35);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.08);
}
.dac-top-line {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.dac-info-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.dac-title-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.dac-sub-wrap {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-muted);
}
.dac-actions-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px dashed rgba(226, 232, 240, 0.8);
}
.dac-amount-box {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}
.dac-input-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted);
}
.dac-monto-input {
  width: 120px !important;
  font-size: 14px;
}

/* Card de deuda para vista individual (Eveth o David) */
.single-person-debt-card {
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(226, 232, 240, 0.85);
  border-radius: 14px;
  margin-bottom: 8px;
  transition: all 0.2s ease;
}
.single-person-debt-card.is-paid {
  background: rgba(240, 253, 244, 0.7);
  border-color: rgba(16, 185, 129, 0.35);
}
.single-person-debt-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.single-debt-info {
  flex: 1;
  min-width: 0;
}
.single-debt-amount-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.28);
  padding: 6px 12px;
  border-radius: 10px;
  margin-left: auto;
}
.single-debt-label {
  font-size: 11.5px;
  color: var(--amber-dark);
  font-weight: 600;
}
.single-debt-value {
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--amber-dark);
}
.save-pill-border {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.28);
}
.save-pill-border .single-debt-label,
.save-pill-border .single-debt-value {
  color: var(--blue-dark);
}
.libre-pill-border {
  background: rgba(139, 92, 246, 0.12);
  border-color: rgba(139, 92, 246, 0.28);
}
.libre-pill-border .single-debt-label,
.libre-pill-border .single-debt-value {
  color: #6d28d9;
}
.pending-balance-pill {
  background: rgba(100, 116, 139, 0.1);
  border-color: rgba(100, 116, 139, 0.25);
}
.pending-balance-pill .single-debt-label {
  color: var(--text-muted);
}
.pending-balance-pill .single-debt-value {
  color: var(--text-main);
  font-size: 14.5px;
}
@media (max-width: 640px) {
  .single-person-debt-card {
    padding: 10px 10px;
  }
  .single-person-debt-flex {
    gap: 8px;
  }
  .single-debt-amount-pill {
    padding: 5px 10px;
  }
  .single-debt-value {
    font-size: 15px;
  }
}

/* 2 Columnas */
.two-columns-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 820px) { .two-columns-layout { grid-template-columns: 1fr; } }
.col-stack { display: flex; flex-direction: column; gap: 16px; }

.glass-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  gap: 12px;
  font-size: 14.5px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.6);
}
.glass-item-row.row-imprevisto {
  background: rgba(254, 243, 199, 0.25);
  border-left: 3px solid #f59e0b;
  padding-left: 8px;
  border-radius: 4px;
}
.glass-check {
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 1.5px solid rgba(203, 213, 225, 0.9);
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  flex-shrink: 0;
  padding: 0;
  transition: all 0.15s ease;
}
.glass-check:hover {
  border-color: var(--emerald);
  transform: scale(1.05);
}
.glass-check.checked { background: var(--emerald); border-color: var(--emerald); }
.concept-title { flex: 1; font-weight: 500; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 15px; }
.concept-title.is-done .concept-text { text-decoration: line-through; color: var(--text-muted); }
.badge-tag-imprevisto { font-size: 11.5px; background: rgba(239, 68, 68, 0.15); color: #b91c1c; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
.badge-tag-programado { font-size: 11.5px; background: rgba(59, 130, 246, 0.15); color: #1d4ed8; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
.badge-tag-amortiza { font-size: 11.5px; background: rgba(16, 185, 129, 0.15); color: #047857; padding: 2px 8px; border-radius: 999px; font-weight: 600; }
.cross-paid-tag { font-style: normal; display: block; font-size: 12px; color: var(--amber-dark); }
.text-right { text-align: right; }
.row-total { border-bottom: none; border-top: 1.5px solid rgba(203, 213, 225, 0.9); font-weight: 600; padding-top: 10px; }
.filter-chips { display: flex; gap: 4px; }
.chip { background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(203, 213, 225, 0.7); font-size: 11px; padding: 2px 8px; border-radius: 999px; color: var(--text-muted); cursor: pointer; }
.chip.active { background: #0f172a; color: white; border-color: #0f172a; }

.add-item-row-advanced { padding: 10px 0; border-top: 1px dashed rgba(203, 213, 225, 0.8); display: flex; flex-direction: column; gap: 8px; }
.add-inputs-line { display: flex; gap: 8px; align-items: center; }
.add-actions-line { display: flex; justify-content: flex-end; align-items: center; margin-top: 4px; }
.checkbox-label { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); cursor: pointer; }

.icon-btn-del { background: transparent; border: none; color: var(--text-muted); cursor: pointer; opacity: 0.4; padding: 3px; transition: opacity 0.15s; }
.icon-btn-del:hover { opacity: 1; color: #ef4444; }

.highlight-panel {
  background: linear-gradient(135deg, rgba(254, 243, 199, 0.5) 0%, rgba(255, 255, 255, 0.7) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.disp-highlight-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 14px;
  border: 1px solid rgba(245, 158, 11, 0.25);
}
.disp-tag { font-size: 12px; font-weight: 600; color: var(--amber-dark); }
.disp-calc-hint { margin: 2px 0 0; font-size: 11px; color: var(--text-muted); }
.disp-val { font-family: 'Outfit', sans-serif; font-size: 22px; color: var(--amber-dark); }
.debt-concept-col { display: flex; flex-direction: column; flex: 1; }
.debt-saldo-sub { font-size: 11px; color: var(--text-muted); }
.tag-cuota-fija { font-size: 10px; background: rgba(100, 116, 139, 0.15); color: #475569; padding: 1px 6px; border-radius: 999px; margin-left: 4px; }
.item-cuota-fija { opacity: 0.85; }
.text-warn { color: #ef4444; }

/* Tab Deudas & Metadatos */
.debt-summary-pill {
  background: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 8px 14px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.debt-summary-pill span { font-size: 11.5px; color: var(--amber-dark); }
.debt-summary-pill strong { font-family: 'Outfit', sans-serif; font-size: 18px; color: var(--amber-dark); }

.debt-progress-card { margin-bottom: 20px; }
.dp-header { display: flex; justify-content: space-between; font-size: 13.5px; margin-bottom: 8px; }
.progress-bar-bg { width: 100%; height: 8px; background: rgba(203, 213, 225, 0.5); border-radius: 999px; overflow: hidden; }
.progress-bar-fill { height: 100%; border-radius: 999px; transition: width 0.4s ease; }
.debt-fill { background: linear-gradient(90deg, #f59e0b, #10b981); }

.dac-metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(203, 213, 225, 0.8);
  font-size: 12px;
}
.dac-meta-field { display: flex; flex-direction: column; gap: 3px; }
.dac-meta-field label { font-size: 11px; color: var(--text-muted); }
.cuotas-split-input { display: flex; align-items: center; gap: 4px; }
.cuotas-split-input input { width: 70px; }
.interest-calc { font-size: 10.5px; color: #b45309; }
.dac-checkbox-field { justify-content: flex-end; grid-column: span 2; }
@media (max-width: 600px) { .dac-checkbox-field { grid-column: span 1; } }

.add-debt-panel h3 { margin-top: 0; }
.add-debt-form-grid { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }

/* Gastos Programados */
.scheduled-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; margin-bottom: 20px; }
.scheduled-card { margin-bottom: 0; }
.sc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.sc-date-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--blue-dark);
  background: rgba(59, 130, 246, 0.15);
  padding: 2px 8px;
  border-radius: 999px;
}
.sc-title { font-family: 'Outfit', sans-serif; font-size: 16px; margin: 4px 0 8px; }
.sc-footer { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 6px; }
.sc-amount { font-family: 'Outfit', sans-serif; font-size: 18px; color: var(--emerald-dark); }
.sc-asignado { font-size: 11.5px; color: var(--text-muted); }
.sc-recurrent { font-size: 10.5px; color: #64748b; font-style: italic; }
.add-scheduled-panel h3 { margin-top: 0; }
.scheduled-form-grid { display: flex; flex-direction: column; gap: 10px; }
.form-inline-fields { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

/* Ahorros Lista */
.add-savings-form { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.savings-history-list { display: flex; flex-direction: column; gap: 6px; }
.savings-row-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.8);
}
.sr-info { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.sr-tag { font-size: 10.5px; font-weight: 600; background: var(--blue-dark); color: white; padding: 2px 6px; border-radius: 4px; }
.sr-concept { font-weight: 500; }
.sr-date { font-size: 11.5px; color: var(--text-muted); }
.sr-amount { font-family: 'Outfit', sans-serif; font-size: 15px; color: var(--blue-dark); }

/* Histórico */
.empty-state-panel { text-align: center; padding: 48px 20px; color: var(--text-muted); }
.empty-icon { color: var(--text-muted); opacity: 0.5; margin-bottom: 12px; }
.history-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 780px) { .history-cards-grid { grid-template-columns: 1fr; } }
.history-card { margin-bottom: 0; }
.h-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
.h-label { font-family: 'Outfit', sans-serif; font-size: 16px; display: block; }
.h-date { font-size: 11.5px; color: var(--text-muted); }
.h-debt-badge { font-size: 11.5px; font-weight: 600; background: rgba(245, 158, 11, 0.15); color: var(--amber-dark); padding: 3px 8px; border-radius: 999px; }
.h-carro-amortizo-tag {
  background: rgba(16, 185, 129, 0.15);
  color: #047857;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  margin-bottom: 10px;
}
.h-chart-wrap { display: flex; justify-content: center; padding: 10px 0; }
.h-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 10px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  padding-top: 10px;
}
.h-metric-item { display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.6); padding: 8px 10px; border-radius: 8px; }
.h-metric-item span { font-size: 11.5px; color: var(--text-muted); }
.h-metric-item strong { font-size: 14px; font-family: 'Outfit', sans-serif; }
.h-metric-item small { font-size: 10.5px; color: var(--text-muted); }
.text-savings { color: var(--blue-dark); }

/* Desplegable de Historial */
.toggle-history-btn {
  width: 100%;
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px dashed rgba(203, 213, 225, 0.9);
  color: var(--text-dark);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.toggle-history-btn:hover {
  background: white;
  border-color: var(--emerald);
  color: var(--emerald-dark);
}
.h-details-accordion {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(203, 213, 225, 0.8);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.h-details-block {
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 8px;
  padding: 8px 10px;
}
.h-details-title {
  display: block;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 6px;
}
.h-details-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.h-detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12.5px;
  padding: 3px 0;
  border-bottom: 1px solid rgba(226, 232, 240, 0.4);
}
.h-detail-row:last-child {
  border-bottom: none;
}
.h-detail-name { flex: 1; min-width: 0; }
.h-detail-who {
  font-size: 10.5px;
  background: rgba(203, 213, 225, 0.5);
  padding: 1px 6px;
  border-radius: 4px;
  margin: 0 8px;
  color: var(--text-dark);
}
.h-detail-amount { font-family: 'Outfit', sans-serif; }
.h-details-summary-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}
.h-detail-summary-item {
  display: flex;
  flex-direction: column;
  font-size: 12px;
}
.h-detail-summary-item span { color: var(--text-muted); font-size: 11px; }

/* Barra trigger para nuevo gasto */
.add-gasto-trigger-bar {
  padding: 10px 0 6px;
  display: flex;
  justify-content: flex-start;
}

/* Footer */
.glass-footer { margin-top: 36px; display: flex; justify-content: center; }
.reset-ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: 1px dashed rgba(203, 213, 225, 0.9);
  color: var(--text-muted);
  font-size: 12px;
  padding: 7px 14px;
  border-radius: 999px;
  cursor: pointer;
}
.reset-ghost-btn:hover { color: #ef4444; border-color: #ef4444; }
/* Gráfica Hero y Pulso */
.chart-section-hero {
  border: 1.5px solid rgba(16, 185, 129, 0.35);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94) 0%, rgba(240, 253, 244, 0.65) 100%);
  box-shadow: 0 10px 30px -8px rgba(16, 185, 129, 0.1);
  margin-bottom: 20px;
}
.badge-pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--emerald);
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
  display: inline-block;
}

/* Desactivar spinners en inputs numéricos para mayor espacio visual */
input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type=number] {
  -moz-appearance: textfield;
}

/* Mejoras Responsive Globales para Celulares */
@media (max-width: 768px) {
  html, body {
    overflow-x: hidden;
  }
  .glass-root {
    padding: 8px 6px 70px;
    overflow-x: hidden;
  }
  .glass-container {
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }
  .glass-card {
    padding: 14px 10px;
    border-radius: 16px;
    margin-bottom: 14px;
    overflow-x: hidden;
  }
  .glass-inner-panel {
    padding: 12px 10px;
    border-radius: 14px;
  }

  /* Filas de Gastos Fijos, Programados e Imprevistos con Checkbox */
  .glass-item-row.check-item {
  transition: background 0.18s ease, border-color 0.18s ease;
}
.glass-item-row.check-item.row-pagado {
  background: rgba(240, 253, 244, 0.7);
  border-radius: 10px;
  padding-left: 8px;
  padding-right: 8px;
  border-bottom: 1px solid rgba(187, 247, 208, 0.7);
}
.badge-tag-pagado {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 6px;
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
  border: 1px solid rgba(34, 197, 94, 0.25);
  margin-left: 6px;
}
.glass-check.checked {
  background: #10b981;
  border-color: #10b981;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.35);
}

/* Tarjeta de Control y Progreso de Gastos */
.gastos-progress-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.04);
}
.gp-metrics {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 6px;
}
.gp-stat {
  display: flex;
  align-items: center;
  gap: 6px;
}
.gp-label {
  font-size: 12px;
  color: var(--text-muted);
}
.gp-value {
  font-size: 13px;
  font-weight: 700;
  color: #047857;
}
.gp-amounts {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 600;
}
.gp-paid-amt {
  color: #047857;
}
.gp-sep {
  color: #94a3b8;
}
.gp-total-amt {
  color: var(--text-dark);
}
.gp-progress-track {
  width: 100%;
  height: 6px;
  background: rgba(226, 232, 240, 0.9);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 10px;
}
.gp-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  border-radius: 999px;
  transition: width 0.35s ease;
}
/* Botones de Control de Gastos - Con la estética de píldora del proyecto */
.gp-filter-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.gp-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(203, 213, 225, 0.85);
  background: rgba(255, 255, 255, 0.85);
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13.5px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.18s ease;
  font-weight: 500;
  font-family: 'Inter', sans-serif;
  user-select: none;
}
.gp-tab:hover {
  background: #ffffff;
  color: var(--text-dark);
  border-color: #94a3b8;
  transform: translateY(-1px);
}
.gp-tab.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.2);
}
.gp-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 19px;
  padding: 0 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(15, 23, 42, 0.08);
  color: var(--text-dark);
  transition: all 0.18s ease;
}
.gp-tab.active .gp-tab-badge {
  background: rgba(255, 255, 255, 0.25);
  color: #ffffff;
}
.empty-gastos-state {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  margin-bottom: 8px;
}

/* Barra inferior de acciones del Home - Botones Proporcionales de Misma Altura */
.hb-actions-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.hb-actions-wrap .hb-save-btn,
.hb-actions-wrap .close-q-btn-bottom {
  height: 48px;
  min-height: 48px;
  max-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  box-sizing: border-box;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  padding: 0 24px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  border: none;
}
.hb-actions-wrap .hb-save-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.hb-actions-wrap .hb-save-btn:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 6px 18px rgba(16, 185, 129, 0.38);
}
.hb-actions-wrap .hb-save-btn.btn-saving {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
}
.hb-actions-wrap .hb-save-btn.btn-saved {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  box-shadow: 0 4px 16px rgba(22, 163, 74, 0.4);
}
.hb-actions-wrap .close-q-btn-bottom {
  background: linear-gradient(135deg, #047857 0%, #065f46 100%);
  color: white;
  box-shadow: 0 4px 14px rgba(4, 120, 87, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
}
.hb-actions-wrap .close-q-btn-bottom:hover {
  transform: translateY(-1.5px);
  box-shadow: 0 6px 20px rgba(4, 120, 87, 0.45);
}
@media (max-width: 640px) {
  .hb-actions-wrap {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
  }
  .hb-actions-wrap .hb-save-btn,
  .hb-actions-wrap .close-q-btn-bottom {
    width: 100%;
    height: 48px;
    justify-content: center;
  }
}
.glass-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(203, 213, 225, 0.85);
  color: var(--text-dark);
  padding: 10px 18px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}
.glass-btn-secondary:hover {
  background: #ffffff;
  border-color: #94a3b8;
  transform: translateY(-1px);
}

/* Toast flotante de guardado */
.save-toast-banner {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  pointer-events: none;
}
.save-toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0f172a;
  color: white;
  padding: 12px 20px;
  border-radius: 16px;
  box-shadow: 0 10px 30px -4px rgba(15, 23, 42, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.15);
}
.toast-icon-success {
  color: #10b981;
  flex-shrink: 0;
}
.toast-text-wrap strong {
  display: block;
  font-size: 13.5px;
  font-weight: 600;
}
.toast-text-wrap p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #94a3b8;
}

/* Modal de Confirmación de Cierre */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal-dialog {
  max-width: 520px;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.25);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.9);
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}
.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}
.modal-icon-badge {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.12);
  color: #059669;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.modal-title-wrap h3 {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 18px;
  color: var(--text-dark);
}
.modal-subtitle {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: var(--text-muted);
}
.modal-close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-dark);
}
.modal-body {
  padding: 20px 24px;
}
.modal-intro {
  margin: 0 0 16px;
  font-size: 14px;
  color: var(--text-muted);
  line-height: 1.5;
}
.modal-summary-card {
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 16px;
  padding: 14px 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.m-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13.5px;
}
.m-summary-row .m-label {
  color: var(--text-muted);
}
.m-summary-row .m-value {
  color: var(--text-dark);
}
.m-summary-total {
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px dashed rgba(203, 213, 225, 0.8);
  font-weight: 700;
}
.m-summary-total .m-value {
  font-size: 15.5px;
  color: var(--text-dark);
}
.modal-notice-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(254, 243, 199, 0.4);
  border: 1px solid rgba(245, 158, 11, 0.3);
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 12.5px;
  color: #92400e;
  line-height: 1.4;
}
.modal-notice-box svg {
  flex-shrink: 0;
  margin-top: 1px;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
}
.confirm-close-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 11px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.confirm-close-btn:hover {
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 10px 8px;
    gap: 8px 6px;
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(226, 232, 240, 0.75);
    border-radius: 12px;
    margin-bottom: 8px;
  }
  .glass-item-row.check-item .glass-check {
    order: 1;
    flex-shrink: 0;
  }
  .glass-item-row.check-item .concept-title {
    order: 2;
    flex: 1 1 calc(100% - 36px);
    font-size: 14px;
    font-weight: 600;
    min-width: 0;
    line-height: 1.35;
    word-break: break-word;
  }
  .glass-item-row.check-item .segmented-badge {
    order: 3;
    margin-left: 32px;
    flex-shrink: 0;
  }
  .glass-item-row.check-item .glass-input-sm {
    order: 4;
    flex: 1 1 110px;
    min-width: 100px;
    max-width: 140px;
    font-size: 15px;
    font-weight: 700;
    padding: 7px 10px;
    text-align: right;
    margin-left: auto;
  }
  .glass-item-row.check-item .icon-btn-del {
    order: 5;
    flex-shrink: 0;
    padding: 6px;
  }

  /* Filas estándar (Sueldos David / Eveth, Totales) */
  .glass-item-row:not(.check-item) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 2px;
  }
  .glass-item-row:not(.check-item) .glass-input-sm {
    min-width: 110px;
    max-width: 140px;
    font-size: 15px;
    font-weight: 700;
    padding: 7px 10px;
  }

  /* Segmented Badge en móvil */
  .segmented-opt {
    padding: 5px 9px;
    font-size: 12px;
  }

  /* Card de Abono a Deudas */
  .debt-abono-card {
    padding: 12px 10px;
  }
  .dac-actions-line {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .dac-amount-box {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
  }
  .dac-monto-input {
    min-width: 110px !important;
    max-width: 140px !important;
    font-size: 15px !important;
    font-weight: 700 !important;
  }
  .segmented-abono-badge .segmented-opt {
    padding: 5px 8px;
    font-size: 11.5px;
  }

  /* Balances de cuentas de David y Eveth */
  .accounts-split-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .balance-card {
    padding: 14px 12px;
  }
  .balance-header strong {
    font-size: 17px;
  }
  .balance-input {
    font-size: 22px !important;
    min-width: 0;
    width: 100%;
  }

  /* Gastos programados en grid */
  .scheduled-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  /* Formulario de agregar gasto */
  .add-item-row-advanced {
    padding: 12px 8px;
  }
  .add-inputs-line {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .add-inputs-line .glass-input,
  .add-inputs-line .glass-input-sm {
    width: 100%;
  }
  .add-inputs-line .segmented-badge {
    align-self: flex-start;
  }
  .add-actions-line {
    flex-direction: column;
    gap: 6px;
  }
  .add-actions-line button {
    width: 100%;
    justify-content: center;
  }

  /* Formulario de ingreso extra */
  .aef-inputs-grid {
    grid-template-columns: 1fr !important;
    gap: 10px;
  }
  .aef-actions-row {
    flex-direction: column;
  }
  .aef-actions-row button {
    width: 100%;
    justify-content: center;
  }

  /* Topbar de Quincena Activa */
  .card-topbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .q-period-selector h2 {
    font-size: 18px;
    line-height: 1.3;
  }
  .pill-controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }
  .pill-controls .glass-pill {
    width: 100%;
    text-align: center;
    padding: 8px 6px;
    font-size: 12.5px;
  }
  .pill-controls .glass-select,
  .pill-controls .anio-input {
    width: 100%;
    box-sizing: border-box;
  }
  .close-q-btn {
    width: 100%;
    justify-content: center;
    font-size: 14px;
    padding: 12px 14px;
    white-space: normal;
    text-align: center;
  }

  /* Gráfica Donut */
  .chart-section {
    padding: 14px 10px;
  }
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .scope-switcher {
    width: 100%;
  }
  .scope-switcher button {
    flex: 1;
    text-align: center;
    padding: 7px 10px;
  }
  .donut-wrap {
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }
  .donut-legend {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  /* Segmented selector de David/Eveth/Ambos */
  .hpf-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .hpf-segmented {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }
  .hpf-btn {
    padding: 8px 4px;
    font-size: 12px;
    justify-content: center;
  }
  .hpf-badge {
    display: none;
  }

  .two-columns-layout {
    grid-template-columns: 1fr;
  }
}

/* Barra inferior de cerrar quincena */
.home-bottom-close-bar {
  margin-top: 24px;
  border-top: 1px dashed rgba(203, 213, 225, 0.9);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  background: linear-gradient(135deg, rgba(240, 253, 244, 0.7) 0%, rgba(255, 255, 255, 0.9) 100%);
  border: 1px solid rgba(16, 185, 129, 0.25);
  border-radius: 18px;
  padding: 18px 20px;
  box-shadow: 0 8px 24px -6px rgba(16, 185, 129, 0.08);
}
.hb-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  max-width: 580px;
}
.hb-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--emerald-dark);
}
.hb-title {
  font-family: 'Outfit', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-dark);
}
.hb-desc {
  font-size: 12.5px;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.35;
}


.animate-fade-in { animation: fadeIn 0.25s ease-out forwards; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.glass-loading { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg-color); }
.loading-card { padding: 32px 48px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; border-radius: 20px; }
.spin-icon { animation: spin 3s linear infinite; color: var(--emerald); }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* ========================================================
   SNOOPY MONEY LOADER (PANTALLA DE CARGA CON ANIMACIÓN)
   ======================================================== */
.snoopy-loader-overlay {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background: radial-gradient(circle at 50% 35%, #ffffff 0%, #f0fdf4 60%, #e6f4ea 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  opacity: 1;
  visibility: visible;
  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.5s ease, transform 0.5s ease;
}

.snoopy-loader-overlay.loader-fading {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: scale(1.02);
}

.loader-ambient-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, rgba(5, 150, 105, 0.05) 60%, transparent 70%);
  filter: blur(50px);
  animation: pulseAmbient 3s infinite ease-in-out;
  pointer-events: none;
}

@keyframes pulseAmbient {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
}

.snoopy-loader-card {
  position: relative;
  max-width: 420px;
  width: 100%;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1.5px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 20px 50px -10px rgba(15, 23, 42, 0.12), 0 10px 20px -5px rgba(16, 185, 129, 0.1);
  border-radius: 28px;
  padding: 32px 28px 28px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  z-index: 2;
  overflow: hidden;
}

/* Partículas flotantes de billetes animados */
.money-particles-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.money-bill-fly {
  position: absolute;
  font-size: 24px;
  opacity: 0;
  user-select: none;
  animation: floatMoneyBill 2.4s infinite ease-in-out;
}

.bill-fly-1 { left: 12%; top: 40%; animation-delay: 0s; font-size: 26px; }
.bill-fly-2 { right: 14%; top: 35%; animation-delay: 0.4s; font-size: 22px; }
.bill-fly-3 { left: 20%; top: 20%; animation-delay: 0.8s; font-size: 20px; }
.bill-fly-4 { right: 22%; top: 18%; animation-delay: 1.2s; font-size: 18px; }
.bill-fly-5 { left: 8%; top: 55%; animation-delay: 1.5s; font-size: 24px; }
.bill-fly-6 { right: 10%; top: 58%; animation-delay: 1.9s; font-size: 25px; }

@keyframes floatMoneyBill {
  0% {
    transform: translateY(20px) rotate(-15deg) scale(0.6);
    opacity: 0;
  }
  30% {
    opacity: 0.85;
  }
  70% {
    opacity: 0.9;
  }
  100% {
    transform: translateY(-60px) rotate(15deg) scale(1.1);
    opacity: 0;
  }
}

/* Escenario central de Snoopy */
.snoopy-img-stage {
  position: relative;
  width: 190px;
  height: 190px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.snoopy-halo-ring {
  position: absolute;
  width: 170px;
  height: 170px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.16) 0%, rgba(255, 255, 255, 0) 70%);
  border: 2px dashed rgba(16, 185, 129, 0.35);
  animation: rotateHalo 12s infinite linear;
}

@keyframes rotateHalo {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.snoopy-money-character {
  position: relative;
  width: 175px;
  height: 175px;
  object-fit: contain;
  filter: drop-shadow(0 10px 20px rgba(16, 185, 129, 0.22));
  animation: snoopyCountingBob 1.4s infinite ease-in-out;
  user-select: none;
  -webkit-user-drag: none;
}

@keyframes snoopyCountingBob {
  0%, 100% {
    transform: translateY(0) rotate(-2deg) scale(1);
  }
  50% {
    transform: translateY(-8px) rotate(2deg) scale(1.03);
  }
}

.snoopy-loader-header {
  margin-bottom: 14px;
}

.loader-eyebrow {
  display: inline-block;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--emerald-dark);
  margin-bottom: 2px;
}

.loader-app-title {
  font-family: 'Outfit', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0;
}

/* Caja de conteo interactivo */
.loader-counter-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: rgba(240, 253, 244, 0.9);
  border: 1px solid rgba(16, 185, 129, 0.3);
  padding: 8px 20px;
  border-radius: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
}

.counter-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: #047857;
}

.counter-amount {
  font-family: 'Outfit', sans-serif;
  font-size: 20px;
  font-weight: 700;
  color: #065f46;
  letter-spacing: -0.01em;
}

/* Barra de progreso de carga */
.loader-progress-track {
  width: 100%;
  height: 6px;
  background: rgba(226, 232, 240, 0.8);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 12px;
}

.loader-progress-fill {
  height: 100%;
  width: 100%;
  background: linear-gradient(90deg, #10b981 0%, #34d399 50%, #059669 100%);
  border-radius: 999px;
  animation: progressFillShimmer 1.8s infinite ease-in-out;
}

@keyframes progressFillShimmer {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(0%); }
  100% { transform: translateX(100%); }
}

.loader-caption-text {
  font-size: 12.5px;
  color: var(--text-muted);
  margin: 0;
  min-height: 18px;
  transition: all 0.3s ease;
}

.footer-brand-hint {
  font-size: 12.5px;
  color: var(--text-muted);
  margin: 0;
  text-align: center;
  font-weight: 500;
  opacity: 0.75;
}
`;
