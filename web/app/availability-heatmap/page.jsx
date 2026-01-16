import Link from "next/link";
import AvailabilityHeatmapView from "../availability-heatmap-view.jsx";
import AvailabilityHeatmapParams from "../availability-heatmap-params.jsx";
import AvailabilityHeatmapRunner from "../availability-heatmap-runner.jsx";
import { loadAvailabilityHeatmapData } from "../../lib/availability-heatmap.js";

export default function AvailabilityHeatmapPage({ searchParams }) {
  const batch = typeof searchParams?.batch === "string" ? searchParams.batch : undefined;
  const options = {
    startDate: typeof searchParams?.start === "string" ? searchParams.start : undefined,
    leadJumpDays: typeof searchParams?.jump === "string" ? searchParams.jump : undefined,
    stayLengthNights: typeof searchParams?.nights === "string" ? searchParams.nights : undefined,
    leadEndDays: typeof searchParams?.end === "string" ? searchParams.end : undefined,
    roomsRequired: typeof searchParams?.rooms === "string" ? searchParams.rooms : undefined,
  };
  const data = loadAvailabilityHeatmapData(batch, options);

  if (!data.columns.length) {
    return (
      <main className="app-shell">
        <section className="hero">
          <div>
            <p className="pill">Roomberg Availability</p>
            <h1 className="hero-title">No data found</h1>
            <p className="hero-subtitle">
              Add bookings_search_availability.csv under output_sheets or pass
              {" "}
              ?batch=YYYY_mon_dd.
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
          <p className="pill">Roomberg Availability</p>
          <h1 className="hero-title">Kuoni Availability Pulse</h1>
          <p className="hero-subtitle">
            Updated: {data.sourceLabel} - {data.rows.length} hotels - {data.columns.length} weekly starts
          </p>
        </div>
        <div>
          <p className="pill pill-stack">
            <span className="pill-label">Search params:</span>
            <span className="pill-value">{data.searchParams}</span>
          </p>
        </div>
      </section>

      <AvailabilityHeatmapParams criteria={data.criteria} />

      <AvailabilityHeatmapRunner />

      <AvailabilityHeatmapView
        columns={data.columns}
        rows={data.rows}
        stats={data.stats}
        maxRooms={data.maxRooms}
        criteria={data.criteria}
      />

      <p className="table-footnote">
        Data source: {data.sourcePath || "output_sheets/bookings_search_availability.csv"}
      </p>
    </main>
  );
}
