// Simple fallback heatmap table renderer.
export default function HeatmapTable({ columns = [], rows = [] }) {
  if (!columns.length || !rows.length) {
    return (
      <div className="table-wrap">
        <p className="table-footnote">No table data available.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table className="heatmap-table">
        <thead>
          <tr>
            <th>Hotel</th>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id || row.hotel || row.hmid || Math.random()}>
              <td>{row.hotel || row.hmid || "—"}</td>
              {columns.map((col) => (
                <td key={col}>{row[col] ?? "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

