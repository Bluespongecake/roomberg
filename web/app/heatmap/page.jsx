import Link from "next/link";
import HeatmapTable from "../heatmap-table.jsx";
import { loadHeatmapData } from "../../lib/heatmap.js";

function formatRatio(value) {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${Math.round(value * 100)}%`;
}

export default function HeatmapPage({ searchParams }) {
  const batch = typeof searchParams?.batch === "string" ? searchParams.batch : undefined;
  const data = loadHeatmapData(batch);

  if (!data.columns.length) {
    return (
      <main className="app-shell">
        <section className="hero">
          <div>
            <p className="pill">Roomberg Heatmap</p>
            <h1 className="hero-title">No data found</h1>
            <p className="hero-subtitle">
              Add a batch under output_sheets or pass ?batch=YYYY_mon_dd.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const statLookup = Object.fromEntries(
    data.stats.map((stat) => [stat.label, stat])
  );
  const avgCoverage = data.rows.length
    ? data.rows.reduce((sum, row) => sum + row.coverage, 0) / data.rows.length
    : 0;

  return (
    <main className="app-shell">
      <nav className="page-nav" aria-label="Primary">
        <Link href="/" className="btn ghost">
          Back to home
        </Link>
      </nav>
      <section className="hero">
        <div>
          <p className="pill">Roomberg Heatmap</p>
          <h1 className="hero-title">Kuoni Pricing Pulse</h1>
          <p className="hero-subtitle">
            Batch {data.batchSlug} - {data.rows.length} hotels - {data.columns.length} stay dates
          </p>
        </div>
        <div>
          <p className="hero-subtitle">Search params</p>
          <p className="pill">{data.searchParams}</p>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Coverage avg</p>
          <p className="stat-value">{formatRatio(avgCoverage)}</p>
          <p className="stat-meta">Based on NA and error flags</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Has rate</p>
          <p className="stat-value">{formatRatio(statLookup["has rate"]?.ratio)}</p>
          <p className="stat-meta">{statLookup["has rate"]?.count ?? 0} cells</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">No market</p>
          <p className="stat-value">{formatRatio(statLookup["no market"]?.ratio)}</p>
          <p className="stat-meta">{statLookup["no market"]?.count ?? 0} cells</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">No rate</p>
          <p className="stat-value">{formatRatio(statLookup["no rate"]?.ratio)}</p>
          <p className="stat-meta">{statLookup["no rate"]?.count ?? 0} cells</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Errors</p>
          <p className="stat-value">{formatRatio(statLookup.error?.ratio)}</p>
          <p className="stat-meta">{statLookup.error?.count ?? 0} cells</p>
        </div>
      </section>

      <HeatmapTable columns={data.columns} rows={data.rows} />

      <p className="table-footnote">
        Data source: output_sheets/{data.batchSlug}/pricing_hotels_all.csv
      </p>
    </main>
  );
}
