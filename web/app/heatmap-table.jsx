"use client";

import { useMemo, useState } from "react";

function formatSignedPercent(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  const pct = Math.round(value * 100);
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}%`;
}

function formatRatio(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${Math.round(value * 100)}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function valueToColor(value) {
  const clamped = clamp(value, -1, 1);
  const t = (clamped + 1) / 2;
  const start = { r: 0, g: 176, b: 80 };
  const end = { r: 255, g: 0, b: 0 };
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function coverageToColor(value) {
  if (!Number.isFinite(value)) {
    return undefined;
  }
  const clamped = clamp(value, 0, 1);
  const t = clamped;
  const start = { r: 255, g: 0, b: 0 };
  const end = { r: 0, g: 176, b: 80 };
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function getCellState(value) {
  if (typeof value === "string" && value.toLowerCase().includes("no market")) {
    return { text: "No market", className: "cell-no-market" };
  }
  if (Number.isFinite(value)) {
    return {
      text: formatSignedPercent(value),
      className: "cell-number",
      style: { backgroundColor: valueToColor(value) },
    };
  }
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "na") {
      return { text: "NA", className: "cell-na" };
    }
    if (lower.includes("error") || lower.includes("undefined")) {
      return { text: "Error", className: "cell-error" };
    }
    return { text: value, className: "cell-status" };
  }
  return { text: "", className: "cell-status" };
}

function compareStrings(a, b) {
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function sortRows(rows, sortKey, sortDir) {
  if (!sortKey) {
    return rows;
  }
  const direction = sortDir === "asc" ? 1 : -1;
  const sorted = [...rows];
  sorted.sort((a, b) => {
    if (sortKey === "coverage") {
      const left = Number.isFinite(a.coverage) ? a.coverage : -Infinity;
      const right = Number.isFinite(b.coverage) ? b.coverage : -Infinity;
      return (left - right) * direction;
    }
    if (sortKey === "city") {
      return compareStrings(a.city || "", b.city || "") * direction;
    }
    if (sortKey === "kuoniId") {
      return compareStrings(a.kuoniId || "", b.kuoniId || "") * direction;
    }
    return compareStrings(a.hmid || "", b.hmid || "") * direction;
  });
  return sorted;
}

function sortIndicator(sortKey, activeKey, sortDir) {
  if (sortKey !== activeKey) {
    return "";
  }
  return sortDir === "asc" ? "▲" : "▼";
}

export default function HeatmapTable({ columns, rows, hideUnavailable = false }) {
  const [sortKey, setSortKey] = useState("hmid");
  const [sortDir, setSortDir] = useState("asc");

  const visibleRows = useMemo(() => {
    if (!hideUnavailable) {
      return rows;
    }
    return rows.filter((row) => Number.isFinite(row.coverage) && row.coverage > 0);
  }, [rows, hideUnavailable]);

  const sortedRows = useMemo(
    () => sortRows(visibleRows, sortKey, sortDir),
    [visibleRows, sortKey, sortDir]
  );

  const handleSort = (nextKey) => {
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDir("asc");
  };

  return (
    <section className="table-wrap">
      <table className="heatmap-table">
        <thead>
          <tr>
            <th className="col-hmid" aria-sort={sortKey === "hmid" ? sortDir : "none"}>
              <button
                type="button"
                className={`header-button ${sortKey === "hmid" ? "is-active" : ""}`}
                onClick={() => handleSort("hmid")}
              >
                HMID
                <span className="sort-indicator">
                  {sortIndicator(sortKey, "hmid", sortDir)}
                </span>
              </button>
            </th>
            <th className="col-kuoni" aria-sort={sortKey === "kuoniId" ? sortDir : "none"}>
              <button
                type="button"
                className={`header-button ${sortKey === "kuoniId" ? "is-active" : ""}`}
                onClick={() => handleSort("kuoniId")}
              >
                Kuoni ID
                <span className="sort-indicator">
                  {sortIndicator(sortKey, "kuoniId", sortDir)}
                </span>
              </button>
            </th>
            <th
              className="col-coverage"
              aria-sort={sortKey === "coverage" ? sortDir : "none"}
            >
              <button
                type="button"
                className={`header-button ${sortKey === "coverage" ? "is-active" : ""}`}
                onClick={() => handleSort("coverage")}
              >
                Coverage
                <span className="sort-indicator">
                  {sortIndicator(sortKey, "coverage", sortDir)}
                </span>
              </button>
            </th>
            <th className="col-city" aria-sort={sortKey === "city" ? sortDir : "none"}>
              <button
                type="button"
                className={`header-button ${sortKey === "city" ? "is-active" : ""}`}
                onClick={() => handleSort("city")}
              >
                City
                <span className="sort-indicator">
                  {sortIndicator(sortKey, "city", sortDir)}
                </span>
              </button>
            </th>
            {columns.map((column) => (
              <th key={column.key} title={column.date}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.map((row) => (
            <tr key={row.hmid}>
              <td className="col-hmid">{row.hmid}</td>
              <td className="col-kuoni">{row.kuoniId || "-"}</td>
              <td
                className="col-coverage"
                style={{ backgroundColor: coverageToColor(row.coverage) }}
              >
                {formatRatio(row.coverage)}
              </td>
              <td className="col-city">{row.city || "Unknown"}</td>
              {columns.map((column) => {
                const value = row.values[column.key];
                const cell = getCellState(value);
                return (
                  <td
                    key={`${row.hmid}-${column.key}`}
                    className={cell.className}
                    style={cell.style}
                  >
                    {cell.text}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
