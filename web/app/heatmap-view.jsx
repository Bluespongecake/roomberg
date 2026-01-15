"use client";

import { useMemo, useState } from "react";
import HeatmapTable from "./heatmap-table.jsx";

function formatRatio(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${Math.round(value * 100)}%`;
}

export default function HeatmapView({ columns, rows, stats }) {
  const [hideUnavailable, setHideUnavailable] = useState(false);

  const statLookup = useMemo(
    () => Object.fromEntries(stats.map((stat) => [stat.label, stat])),
    [stats]
  );
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
            <p className="stat-meta">Based on NA and error flags</p>
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
            <p className="stat-label">Has rate</p>
            <p className="stat-value">{formatRatio(statLookup["has rate"]?.ratio)}</p>
            <p className="stat-meta">{statLookup["has rate"]?.count ?? 0} cells</p>
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
            <p className="stat-label">No market</p>
            <p className="stat-value">{formatRatio(statLookup["no market"]?.ratio)}</p>
            <p className="stat-meta">{statLookup["no market"]?.count ?? 0} cells</p>
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
            <p className="stat-label">No rate</p>
            <p className="stat-value">{formatRatio(statLookup["no rate"]?.ratio)}</p>
            <p className="stat-meta">{statLookup["no rate"]?.count ?? 0} cells</p>
          </div>
          <div className="stat-control">
            <label className="control-checkbox">
              <input
                type="checkbox"
                checked={hideUnavailable}
                onChange={(event) => setHideUnavailable(event.target.checked)}
              />
              <span>
                hide unavailable hotels
              </span>
            </label>
          </div>
        </div>
        <div className="stat-stack">
          <div className="stat-card">
            <p className="stat-label">Errors</p>
            <p className="stat-value">{formatRatio(statLookup.error?.ratio)}</p>
            <p className="stat-meta">{statLookup.error?.count ?? 0} cells</p>
          </div>
          <div className="stat-control stat-control--spacer" aria-hidden="true">
            <label className="control-checkbox">
              <input type="checkbox" tabIndex={-1} />
              <span>hide unavailable hotels</span>
            </label>
          </div>
        </div>
      </section>

      <HeatmapTable columns={columns} rows={rows} hideUnavailable={hideUnavailable} />
    </>
  );
}
