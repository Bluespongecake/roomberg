"use client";

import { useMemo, useState } from "react";
import AvailabilityHeatmapTable from "./availability-heatmap-table.jsx";

function formatRatio(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${Math.round(value * 100)}%`;
}

function formatRooms(value, digits = 1) {
  if (!Number.isFinite(value)) {
    return "0";
  }
  if (Number.isInteger(value)) {
    return String(value);
  }
  return value.toFixed(digits);
}

export default function AvailabilityHeatmapView({
  columns,
  rows,
  stats,
  maxRooms,
  criteria,
}) {
  const [hideUnavailable, setHideUnavailable] = useState(false);
  const roomsRequired = criteria?.roomsRequired ?? 10;
  const stayLengthNights = criteria?.stayLengthNights ?? 3;

  const avgCoverage = useMemo(() => {
    if (!rows.length) {
      return 0;
    }
    return rows.reduce((sum, row) => sum + row.coverage, 0) / rows.length;
  }, [rows]);

  return (
    <>
      <section className="stats-grid">
        <div className="stat-stack">
          <div className="stat-card">
            <p className="stat-label">Coverage avg</p>
            <p className="stat-value">{formatRatio(avgCoverage)}</p>
            <p className="stat-meta">
              Avg share of weeks meeting {roomsRequired}+ rooms
            </p>
          </div>
          <div className="stat-control stat-control--spacer" aria-hidden="true">
            <label className="control-checkbox">
              <input type="checkbox" tabIndex={-1} />
              <span>hide unavailable hotels</span>
            </label>
          </div>
        </div>
        <div className="stat-stack">
          <div className="stat-card">
            <p className="stat-label">Avg rooms</p>
            <p className="stat-value">{formatRooms(stats.avgRooms)}</p>
            <p className="stat-meta">Min rooms across {stayLengthNights} nights</p>
          </div>
          <div className="stat-control stat-control--spacer" aria-hidden="true">
            <label className="control-checkbox">
              <input type="checkbox" tabIndex={-1} />
              <span>hide unavailable hotels</span>
            </label>
          </div>
        </div>
        <div className="stat-stack">
          <div className="stat-card">
            <p className="stat-label">Max rooms</p>
            <p className="stat-value">{formatRooms(maxRooms, 0)}</p>
            <p className="stat-meta">Best min-room count</p>
          </div>
          <div className="stat-control stat-control--spacer" aria-hidden="true">
            <label className="control-checkbox">
              <input type="checkbox" tabIndex={-1} />
              <span>hide unavailable hotels</span>
            </label>
          </div>
        </div>
        <div className="stat-stack">
          <div className="stat-card">
            <p className="stat-label">Meets {roomsRequired}+ rooms</p>
            <p className="stat-value">{formatRatio(stats.availableRatio)}</p>
            <p className="stat-meta">Weekly stays available</p>
          </div>
          <div className="stat-control stat-control--spacer" aria-hidden="true">
            <label className="control-checkbox">
              <input type="checkbox" tabIndex={-1} />
              <span>hide unavailable hotels</span>
            </label>
          </div>
        </div>
        <div className="stat-stack">
          <div className="stat-card">
            <p className="stat-label">Missing data</p>
            <p className="stat-value">{formatRatio(stats.missingRatio)}</p>
            <p className="stat-meta">Empty cells in the grid</p>
          </div>
          <div className="stat-control">
            <label className="control-checkbox">
              <input
                type="checkbox"
                checked={hideUnavailable}
                onChange={(event) => setHideUnavailable(event.target.checked)}
              />
              <span>hide unavailable hotels</span>
            </label>
          </div>
        </div>
      </section>

      <AvailabilityHeatmapTable
        columns={columns}
        rows={rows}
        hideUnavailable={hideUnavailable}
        maxRooms={maxRooms}
        roomsRequired={roomsRequired}
      />
    </>
  );
}
