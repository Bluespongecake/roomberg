// Minimal fallback data loader for the heatmap page.
// Returns empty structures so the UI can render a "No data found" state.
export function loadHeatmapData(batch) {
  return {
    batchSlug: batch || "default",
    columns: [],
    rows: [],
    stats: [],
    searchParams: "n/a",
  };
}

