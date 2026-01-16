import Link from "next/link";
import HeatmapView from "../heatmap-view.jsx";
import { loadHeatmapData } from "../../lib/heatmap.js";

export default function HeatmapPage({ searchParams }) {
  const batch = typeof searchParams?.batch === "string" ? searchParams.batch : undefined;
  const data = loadHeatmapData(batch);

  if (!data.columns.length) {
    return (
      <main className="app-shell">
        <section className="hero">
          <div>
            <p className="pill">Roomberg Price Heatmap</p>
            <h1 className="hero-title">No data found</h1>
            <p className="hero-subtitle">
              Add a batch under output_sheets or pass ?batch=YYYY_mon_dd.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <nav className="page-nav" aria-label="Primary">
        <Link href="/" className="btn ghost">
          Back to home
        </Link>
      </nav>
      <section className="hero">
        <div>
          <p className="pill">Roomberg Price Heatmap</p>
          <h1 className="hero-title">Kuoni Price Heatmap</h1>
          <p className="hero-subtitle">
            Updated: {data.batchSlug} - {data.rows.length} hotels - {data.columns.length} stay dates
          </p>
        </div>
        <div>
          <p className="pill pill-stack">
            <span className="pill-label">Search params:</span>
            <span className="pill-value">{data.searchParams}</span>
          </p>
        </div>
      </section>

      <HeatmapView columns={data.columns} rows={data.rows} stats={data.stats} />

      <p className="table-footnote">
        Data source: output_sheets/{data.batchSlug}/pricing_hotels_all.csv
      </p>
    </main>
  );
}
