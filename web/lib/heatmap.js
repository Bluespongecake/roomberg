import fs from "node:fs";
import path from "node:path";
import { parseCsvRecords } from "./csv.js";

const COMMISSION_PCT = 5;
const CARD_FEE_PCT = 2.5;
const TOMS_TAX = 20.0;
const TOTAL_EXTRAS_PCT = COMMISSION_PCT * (TOMS_TAX / 100) + COMMISSION_PCT + CARD_FEE_PCT;
const SEARCH_PARAM_STRING = "10 Rooms, 3 Nights";

const EUR_RATES = {
  CZK: 24.3863,
  DKK: 7.4651,
  CHF: 0.9301,
  GBP: 0.8819,
  SEK: 11.0045,
  NOK: 11.7364,
};

const MONTH_LOOKUP = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function resolveRepoRoot() {
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, "output_sheets"))) {
    return cwd;
  }
  const parent = path.resolve(cwd, "..");
  if (fs.existsSync(path.join(parent, "output_sheets"))) {
    return parent;
  }
  return cwd;
}

function parseBatchSlug(slug) {
  const match = slug.match(/^(\d{4})_([a-z]{3})_(\d{2})$/i);
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = MONTH_LOOKUP[match[2].toLowerCase()];
  const day = Number(match[3]);
  if (Number.isNaN(year) || month == null || Number.isNaN(day)) {
    return null;
  }
  return new Date(Date.UTC(year, month, day));
}

function findLatestBatch(outputRoot) {
  const outputDir = path.join(outputRoot, "output_sheets");
  if (!fs.existsSync(outputDir)) {
    return null;
  }
  const entries = fs.readdirSync(outputDir, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(outputDir, name, "pricing_hotels_all.csv")));

  let latest = null;
  let latestDate = null;
  candidates.forEach((slug) => {
    const parsed = parseBatchSlug(slug);
    if (!parsed) {
      return;
    }
    if (!latestDate || parsed > latestDate) {
      latestDate = parsed;
      latest = slug;
    }
  });

  return latest || candidates[0] || null;
}

function convertCurrency(amount, fromCcy, toCcy) {
  const from = (fromCcy || "").toUpperCase();
  const to = (toCcy || "").toUpperCase();
  if (amount == null || !from || !to || from === to) {
    return amount;
  }
  if (from !== "EUR" && EUR_RATES[from] == null) {
    return amount;
  }
  if (to !== "EUR" && EUR_RATES[to] == null) {
    return amount;
  }
  const amountInEur = from === "EUR" ? amount : amount / EUR_RATES[from];
  return to === "EUR" ? amountInEur : amountInEur * EUR_RATES[to];
}

function replacePythonLiterals(value) {
  let out = "";
  let inString = false;
  let escaped = false;

  const isBoundary = (char) => !char || !/[A-Za-z0-9_]/.test(char);

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (inString) {
      out += char;
      if (escaped) {
        escaped = false;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        continue;
      }
      if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      out += char;
      continue;
    }

    if (
      value.startsWith("None", i)
      && isBoundary(value[i - 1])
      && isBoundary(value[i + 4])
    ) {
      out += "null";
      i += 3;
      continue;
    }
    if (
      value.startsWith("True", i)
      && isBoundary(value[i - 1])
      && isBoundary(value[i + 4])
    ) {
      out += "true";
      i += 3;
      continue;
    }
    if (
      value.startsWith("False", i)
      && isBoundary(value[i - 1])
      && isBoundary(value[i + 5])
    ) {
      out += "false";
      i += 4;
      continue;
    }

    out += char;
  }

  return out;
}

function parsePythonDict(value) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return null;
  }

  let jsonish = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < trimmed.length; i += 1) {
    const char = trimmed[i];
    if (inString) {
      if (escaped) {
        jsonish += char;
        escaped = false;
        continue;
      }
      if (char === "\\") {
        jsonish += "\\\\";
        escaped = true;
        continue;
      }
      if (char === "'") {
        inString = false;
        jsonish += '"';
        continue;
      }
      if (char === '"') {
        jsonish += '\\"';
        continue;
      }
      jsonish += char;
      continue;
    }

    if (char === "'") {
      inString = true;
      jsonish += '"';
      continue;
    }

    jsonish += char;
  }

  jsonish = replacePythonLiterals(jsonish);

  try {
    return JSON.parse(jsonish);
  } catch (error) {
    return null;
  }
}

function normalizePrice(cell) {
  if (cell == null || cell === "") {
    return null;
  }

  if (typeof cell === "string") {
    const cellLower = cell.trim().toLowerCase();
    if (cellLower === "no rates" || cellLower === "no rates found") {
      return "NA";
    }
    if (cellLower.includes("no market")) {
      return "No market price";
    }
    const parsed = parsePythonDict(cell);
    if (parsed) {
      cell = parsed;
    } else if (cellLower.startsWith("{")) {
      return "PriceValueError";
    }
  }

  if (typeof cell === "object") {
    const toFloat = (value) => {
      if (typeof value === "number") {
        return value;
      }
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) {
          return null;
        }
        const parsed = Number(trimmed);
        return Number.isNaN(parsed) ? null : parsed;
      }
      return null;
    };

    const marketCurrency = String(
      cell.mkt_currency || cell.MarketCurrency || ""
    ).toUpperCase();
    const kuoniCurrency = String(
      cell.kuoni_currency || cell.KuoniCurrency || ""
    ).toUpperCase();

    let market = toFloat(cell.Market);
    let kuoni = toFloat(cell.Kuoni);

    if (
      market != null
      && kuoni != null
      && marketCurrency
      && kuoniCurrency
      && marketCurrency !== kuoniCurrency
    ) {
      kuoni = convertCurrency(kuoni, kuoniCurrency, marketCurrency);
    }

    if (market === 0) {
      return "No market rate (0)";
    }
    if (market != null && kuoni != null) {
      const grossKuoni = kuoni * (1 + TOTAL_EXTRAS_PCT / 100);
      return -(1 - grossKuoni / market);
    }
    return "Error";
  }

  return "Error";
}

function columnToWeek(isoDate) {
  const parsed = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  const date = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `W ${String(weekNumber).padStart(2, "0")}`;
}

function isNaValue(value) {
  return typeof value === "string" && value.trim().toUpperCase() === "NA";
}

function isErrorValue(value) {
  if (typeof value !== "string") {
    return false;
  }
  const lower = value.toLowerCase();
  return lower.includes("error") || lower.includes("undefined");
}

function buildStatsTable(rows, dateColumns) {
  const allValues = [];
  rows.forEach((row) => {
    dateColumns.forEach((date) => {
      allValues.push(row.values[date]);
    });
  });

  const total = allValues.length;
  const numericCount = allValues.filter((value) => Number.isFinite(value)).length;
  const errorCount = allValues.filter((value) => {
    if (typeof value !== "string") {
      return false;
    }
    const lower = value.toLowerCase();
    return lower.includes("undefined array") || lower.includes("error");
  }).length;
  const noMarket = allValues.filter((value) => {
    return typeof value === "string" && value.toLowerCase().includes("no market");
  }).length;
  const noRate = allValues.filter((value) => {
    if (typeof value !== "string") {
      return false;
    }
    const lower = value.toLowerCase();
    return lower === "na" || lower.includes("no rate");
  }).length;

  return [
    { label: "error", count: errorCount, ratio: total ? errorCount / total : 0 },
    { label: "no market", count: noMarket, ratio: total ? noMarket / total : 0 },
    { label: "no rate", count: noRate, ratio: total ? noRate / total : 0 },
    { label: "has rate", count: numericCount + noMarket, ratio: total ? (numericCount + noMarket) / total : 0 },
  ];
}

function loadSummary(outputRoot) {
  const candidatePaths = [
    path.join(outputRoot, "reference_sheets", "kuoni_hotel_summary.csv"),
    path.join(outputRoot, "app", "sheets", "kuoni_hotel_summary.csv"),
  ];
  const summaryPath = candidatePaths.find((candidate) => fs.existsSync(candidate));
  if (!summaryPath) {
    return new Map();
  }
  const summaryText = fs.readFileSync(summaryPath, "utf-8");
  const records = parseCsvRecords(summaryText);
  const map = new Map();
  records.forEach((record) => {
    if (!record.hmid) {
      return;
    }
    map.set(String(record.hmid).trim(), record.city || "");
  });
  return map;
}

export function loadHeatmapData(batchSlug) {
  const outputRoot = resolveRepoRoot();
  const outputDir = path.join(outputRoot, "output_sheets");
  const resolvedBatch = batchSlug || findLatestBatch(outputRoot);
  if (!resolvedBatch) {
    return {
      batchSlug: "",
      searchParams: SEARCH_PARAM_STRING,
      columns: [],
      rows: [],
      stats: [],
    };
  }
  const dataPath = path.join(outputDir, resolvedBatch, "pricing_hotels_all.csv");
  if (!fs.existsSync(dataPath)) {
    return {
      batchSlug: resolvedBatch,
      searchParams: SEARCH_PARAM_STRING,
      columns: [],
      rows: [],
      stats: [],
    };
  }

  const dataText = fs.readFileSync(dataPath, "utf-8");
  const records = parseCsvRecords(dataText);
  const summaryMap = loadSummary(outputRoot);

  const dateSet = new Set();
  const rowMap = new Map();

  records.forEach((record) => {
    const hmid = String(record.hmid || "").trim();
    const date = String(record.check_in || "").trim();
    if (!hmid || !date) {
      return;
    }
    dateSet.add(date);
    if (!rowMap.has(hmid)) {
      rowMap.set(hmid, {});
    }
    const row = rowMap.get(hmid);
    row[date] = normalizePrice(record.price);
  });

  const dateColumns = Array.from(dateSet).sort();
  const rows = Array.from(rowMap.entries()).map(([hmid, values]) => {
    let naCount = 0;
    let errorCount = 0;
    dateColumns.forEach((date) => {
      if (values[date] == null) {
        values[date] = "NA";
      }
      if (isNaValue(values[date])) {
        naCount += 1;
      }
      if (isErrorValue(values[date])) {
        errorCount += 1;
      }
    });
    const coverage = dateColumns.length
      ? 1 - (naCount + errorCount) / dateColumns.length
      : 0;

    return {
      hmid,
      coverage,
      city: summaryMap.get(hmid) || "",
      values,
    };
  });

  const columns = dateColumns.map((date) => ({
    key: date,
    label: columnToWeek(date),
    date,
  }));

  const stats = buildStatsTable(rows, dateColumns);

  return {
    batchSlug: resolvedBatch,
    searchParams: SEARCH_PARAM_STRING,
    columns,
    rows,
    stats,
  };
}
