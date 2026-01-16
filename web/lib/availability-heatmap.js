import fs from "node:fs";
import path from "node:path";
import { parseCsv, parseCsvRecords } from "./csv.js";

const OUTPUT_FILENAME = "bookings_search_availability.csv";
const LEAD_JUMP_DAYS = 7;
const STAY_LENGTH_NIGHTS = 3;
const LEAD_END_DAYS = 365;
const ROOMS_REQUIRED = 10;

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

function findLatestAvailabilityBatch(outputRoot) {
  const outputDir = path.join(outputRoot, "output_sheets");
  if (!fs.existsSync(outputDir)) {
    return null;
  }
  const entries = fs.readdirSync(outputDir, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(outputDir, name, OUTPUT_FILENAME)));

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

function resolveAvailabilitySource(outputRoot, batchSlug) {
  const outputDir = path.join(outputRoot, "output_sheets");
  if (batchSlug) {
    const candidate = path.join(outputDir, batchSlug, OUTPUT_FILENAME);
    if (fs.existsSync(candidate)) {
      return { dataPath: candidate, label: batchSlug };
    }
  }

  const rootCandidate = path.join(outputDir, OUTPUT_FILENAME);
  if (fs.existsSync(rootCandidate)) {
    return { dataPath: rootCandidate, label: path.basename(rootCandidate, ".csv") };
  }

  const latestBatch = findLatestAvailabilityBatch(outputRoot);
  if (latestBatch) {
    const candidate = path.join(outputDir, latestBatch, OUTPUT_FILENAME);
    if (fs.existsSync(candidate)) {
      return { dataPath: candidate, label: latestBatch };
    }
  }

  return { dataPath: null, label: batchSlug || "" };
}

function loadAvailabilitySummary(outputRoot) {
  const candidatePaths = [
    path.join(outputRoot, "kuoni_hotel_summary_with_kuoni.csv"),
    path.join(outputRoot, "reference_sheets", "kuoni_hotel_summary_with_kuoni.csv"),
    path.join(outputRoot, "web", "reference_sheets", "kuoni_hotel_summary_with_kuoni.csv"),
    path.join(outputRoot, "reference_sheets", "kuoni_hotel_summary.csv"),
    path.join(outputRoot, "web", "reference_sheets", "kuoni_hotel_summary.csv"),
  ];
  const summaryPath = candidatePaths.find((candidate) => fs.existsSync(candidate));
  if (!summaryPath) {
    return new Map();
  }
  const summaryText = fs.readFileSync(summaryPath, "utf-8");
  const records = parseCsvRecords(summaryText);
  const map = new Map();
  records.forEach((record) => {
    const key = String(
      record.kuoni_id || record.hotel_id || record.hmid || ""
    ).trim();
    if (!key) {
      return;
    }
    map.set(key, {
      city: record.city || "",
      hmid: record.hmid ? String(record.hmid).trim() : "",
    });
  });
  return map;
}

function parseAvailabilityCsv(text) {
  const rows = parseCsv(text);
  if (!rows.length) {
    return { headers: [], records: [] };
  }
  const headers = rows[0].map((header) => header.trim());
  const records = rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = row[index] ?? "";
    });
    return record;
  });
  return { headers, records };
}

function toUtcDate(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function formatIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(value) {
  if (typeof value !== "string") {
    return null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return value;
}

function normalizeInt(value, fallback, min = 1) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const intValue = Math.floor(parsed);
  if (intValue < min) {
    return fallback;
  }
  return intValue;
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

export function loadAvailabilityHeatmapData(batchSlug, options = {}) {
  const outputRoot = resolveRepoRoot();
  const { dataPath, label } = resolveAvailabilitySource(outputRoot, batchSlug);

  const today = toUtcDate(new Date());
  const startDate = parseIsoDate(options.startDate) || formatIsoDate(today);
  const leadJumpDays = normalizeInt(options.leadJumpDays, LEAD_JUMP_DAYS, 1);
  const stayLengthNights = normalizeInt(options.stayLengthNights, STAY_LENGTH_NIGHTS, 1);
  const leadEndDays = normalizeInt(options.leadEndDays, LEAD_END_DAYS, 1);
  const roomsRequired = normalizeInt(options.roomsRequired, ROOMS_REQUIRED, 1);
  const criteria = {
    startDate,
    leadJumpDays,
    stayLengthNights,
    leadEndDays,
    roomsRequired,
  };
  const searchParams = [
    `Start: ${criteria.startDate}`,
    `Jump: ${criteria.leadJumpDays}d`,
    `Stay: ${criteria.stayLengthNights}n`,
    `End: ${criteria.leadEndDays}d`,
    `Rooms: ${criteria.roomsRequired}+`,
  ].join(" | ");

  if (!dataPath) {
    return {
      sourceLabel: label,
      sourcePath: "",
      searchParams,
      criteria,
      columns: [],
      rows: [],
      stats: {
        avgRooms: 0,
        maxRooms: 0,
        availableRatio: 0,
        missingRatio: 0,
      },
      maxRooms: 0,
    };
  }

  const dataText = fs.readFileSync(dataPath, "utf-8");
  const { headers, records } = parseAvailabilityCsv(dataText);

  const dateColumns = headers.filter((header) => {
    const normalized = header.trim().toLowerCase();
    return normalized && normalized !== "hotel_id" && normalized !== "coverage";
  });

  if (!dateColumns.length) {
    return {
      sourceLabel: label,
      sourcePath: path.relative(outputRoot, dataPath) || dataPath,
      searchParams,
      criteria,
      columns: [],
      rows: [],
      stats: {
        avgRooms: 0,
        maxRooms: 0,
        availableRatio: 0,
        missingRatio: 0,
      },
      maxRooms: 0,
    };
  }

  const summaryMap = loadAvailabilitySummary(outputRoot);

  let maxRooms = 0;
  let totalRooms = 0;
  let valueCount = 0;
  let missingCount = 0;
  let availableCount = 0;

  const weeklyStartDates = [];
  const startBase = new Date(`${criteria.startDate}T00:00:00Z`);
  for (let offset = 0; offset <= criteria.leadEndDays; offset += criteria.leadJumpDays) {
    weeklyStartDates.push(formatIsoDate(addUtcDays(startBase, offset)));
  }

  const rows = records.map((record) => {
    const hotelId = String(record.hotel_id || "").trim();
    if (!hotelId) {
      return null;
    }
    const nightlyCounts = {};
    dateColumns.forEach((date) => {
      const raw = record[date];
      const parsed = raw === "" ? null : Number(raw);
      nightlyCounts[date] = Number.isFinite(parsed) ? parsed : null;
    });

    const values = {};
    let availableWeeks = 0;

    weeklyStartDates.forEach((start) => {
      let minRooms = null;
      const base = new Date(`${start}T00:00:00Z`);
      for (let i = 0; i < criteria.stayLengthNights; i += 1) {
        const dateKey = formatIsoDate(addUtcDays(base, i));
        const count = nightlyCounts[dateKey];
        if (!Number.isFinite(count)) {
          minRooms = null;
          break;
        }
        minRooms = minRooms == null ? count : Math.min(minRooms, count);
      }

      values[start] = minRooms;
      if (minRooms == null) {
        missingCount += 1;
        return;
      }
      if (minRooms >= criteria.roomsRequired) {
        availableCount += 1;
        availableWeeks += 1;
      }
      totalRooms += minRooms;
      valueCount += 1;
      if (minRooms > maxRooms) {
        maxRooms = minRooms;
      }
    });

    const coverage = weeklyStartDates.length
      ? availableWeeks / weeklyStartDates.length
      : 0;

    const summary = summaryMap.get(hotelId);
    return {
      hotelId,
      coverage,
      city: summary?.city || "",
      hmid: summary?.hmid || "",
      values,
    };
  }).filter(Boolean);

  const totalCells = rows.length * weeklyStartDates.length;
  const avgRooms = valueCount ? totalRooms / valueCount : 0;
  const availableRatio = totalCells ? availableCount / totalCells : 0;
  const missingRatio = totalCells ? missingCount / totalCells : 0;

  const columns = weeklyStartDates.map((date) => ({
    key: date,
    label: columnToWeek(date),
    date,
  }));

  return {
    sourceLabel: label || path.basename(dataPath, ".csv"),
    sourcePath: path.relative(outputRoot, dataPath) || dataPath,
    searchParams,
    criteria,
    columns,
    rows,
    stats: {
      avgRooms,
      maxRooms,
      availableRatio,
      missingRatio,
    },
    maxRooms,
  };
}
