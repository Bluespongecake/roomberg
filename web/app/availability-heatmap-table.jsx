"use client";

import { useMemo, useState } from "react";

function formatRatio(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${Math.round(value * 100)}%`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function coverageToColor(value) {
  if (!Number.isFinite(value)) {
    return undefined;
  }
  const clamped = clamp(value, 0, 1);
  const start = { r: 255, g: 0, b: 0 };
  const end = { r: 0, g: 176, b: 80 };
  const r = Math.round(start.r + (end.r - start.r) * clamped);
  const g = Math.round(start.g + (end.g - start.g) * clamped);
  const b = Math.round(start.b + (end.b - start.b) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
}

function roomsToColor(value, maxRooms, roomsRequired) {
  if (!Number.isFinite(value)) {
    return undefined;
  }
  const meets = value >= roomsRequired;
  if (meets) {
    return "rgb(0, 176, 80)";
  }
  if (value <= 0) {
    return "rgb(80, 0, 0)";
  }
  const scaleMax = maxRooms > 0 ? maxRooms : roomsRequired;
  const t = clamp(value / scaleMax, 0, 1);
  const start = { r: 127, g: 0, b: 0 };
  const end = { r: 0, g: 176, b: 80 };
  const r = Math.round(start.r + (end.r - start.r) * t);
  const g = Math.round(start.g + (end.g - start.g) * t);
  const b = Math.round(start.b + (end.b - start.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function getCellState(value, maxRooms, roomsRequired) {
  if (!Number.isFinite(value)) {
    return { text: "-", className: "cell-missing" };
  }
  return {
    text: String(Math.round(value)),
    className: "cell-number",
    style: { backgroundColor: roomsToColor(value, maxRooms, roomsRequired) },
  };
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
    if (sortKey === "hmid") {
      return compareStrings(a.hmid || "", b.hmid || "") * direction;
    }
    return compareStrings(a.hotelId || "", b.hotelId || "") * direction;
  });
  return sorted;
}

function sortIndicator(sortKey, activeKey, sortDir) {
  if (sortKey !== activeKey) {
    return "";
  }
  return sortDir === "asc" ? "▲" : "▼";
}

export default function AvailabilityHeatmapTable({
  columns,
  rows,
  hideUnavailable = false,
  maxRooms = 0,
  roomsRequired = 10,
}) {
  const [sortKey, setSortKey] = useState("hotelId");
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
            <th className="col-kuoni" aria-sort={sortKey === "hotelId" ? sortDir : "none"}>
              <button
                type="button"
                className={`header-button ${sortKey === "hotelId" ? "is-active" : ""}`}
                onClick={() => handleSort("hotelId")}
              >
                Kuoni ID
                <span className="sort-indicator">
                  {sortIndicator(sortKey, "hotelId", sortDir)}
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
            <tr key={row.hotelId}>
              <td className="col-hmid">{row.hmid || "-"}</td>
              <td className="col-kuoni">{row.hotelId}</td>
              <td
                className="col-coverage"
                style={{ backgroundColor: coverageToColor(row.coverage) }}
              >
                {formatRatio(row.coverage)}
              </td>
              <td className="col-city">{row.city || "Unknown"}</td>
              {columns.map((column) => {
                const value = row.values[column.key];
                const cell = getCellState(value, maxRooms, roomsRequired);
                return (
                  <td
                    key={`${row.hotelId}-${column.key}`}
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
