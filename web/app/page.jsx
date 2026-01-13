import Link from "next/link";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400"],
  display: "swap",
});

export default function Page() {
  const matrixColumns = [
    {
      left: "4%",
      duration: "18s",
      delay: "-6s",
      opacity: 0.8,
      items: [
        { text: "€", type: "currency" },
        { text: "Hotel Aurora", type: "hotel" },
        { text: "€189", type: "price" },
        { text: "$", type: "currency" },
        { text: "Sunline Tower", type: "hotel" },
        { text: "$214", type: "price" },
        { text: "£", type: "currency" },
        { text: "Riverside Loft", type: "hotel" },
        { text: "£172", type: "price" },
      ],
    },
    {
      left: "14%",
      duration: "16s",
      delay: "-3s",
      opacity: 0.9,
      items: [
        { text: "USD", type: "currency" },
        { text: "Grand Meridian", type: "hotel" },
        { text: "$238", type: "price" },
        { text: "€", type: "currency" },
        { text: "Casa Verona", type: "hotel" },
        { text: "€162", type: "price" },
        { text: "GBP", type: "currency" },
        { text: "Harborline", type: "hotel" },
        { text: "£199", type: "price" },
      ],
    },
    {
      left: "26%",
      duration: "20s",
      delay: "-10s",
      opacity: 0.85,
      items: [
        { text: "¥", type: "currency" },
        { text: "Kyoto Gate", type: "hotel" },
        { text: "¥19,800", type: "price" },
        { text: "$", type: "currency" },
        { text: "Midnight Plaza", type: "hotel" },
        { text: "$201", type: "price" },
        { text: "EUR", type: "currency" },
        { text: "Baltic Hall", type: "hotel" },
        { text: "€177", type: "price" },
      ],
    },
    {
      left: "38%",
      duration: "15s",
      delay: "-7s",
      opacity: 0.92,
      items: [
        { text: "£", type: "currency" },
        { text: "Old City Stay", type: "hotel" },
        { text: "£146", type: "price" },
        { text: "$", type: "currency" },
        { text: "Atlas Court", type: "hotel" },
        { text: "$189", type: "price" },
        { text: "€", type: "currency" },
        { text: "Lumen House", type: "hotel" },
        { text: "€204", type: "price" },
      ],
    },
    {
      left: "52%",
      duration: "19s",
      delay: "-12s",
      opacity: 0.78,
      items: [
        { text: "AED", type: "currency" },
        { text: "Dune Palace", type: "hotel" },
        { text: "AED 610", type: "price" },
        { text: "$", type: "currency" },
        { text: "Cove District", type: "hotel" },
        { text: "$176", type: "price" },
        { text: "EUR", type: "currency" },
        { text: "Nordic Line", type: "hotel" },
        { text: "€221", type: "price" },
      ],
    },
    {
      left: "64%",
      duration: "17s",
      delay: "-4s",
      opacity: 0.9,
      items: [
        { text: "$", type: "currency" },
        { text: "Orion Suites", type: "hotel" },
        { text: "$209", type: "price" },
        { text: "€", type: "currency" },
        { text: "Port Light", type: "hotel" },
        { text: "€187", type: "price" },
        { text: "GBP", type: "currency" },
        { text: "Queensway", type: "hotel" },
        { text: "£168", type: "price" },
      ],
    },
    {
      left: "76%",
      duration: "21s",
      delay: "-9s",
      opacity: 0.82,
      items: [
        { text: "€", type: "currency" },
        { text: "Solstice", type: "hotel" },
        { text: "€155", type: "price" },
        { text: "$", type: "currency" },
        { text: "Marina Deck", type: "hotel" },
        { text: "$192", type: "price" },
        { text: "JPY", type: "currency" },
        { text: "Hikari Row", type: "hotel" },
        { text: "¥22,900", type: "price" },
      ],
    },
    {
      left: "90%",
      duration: "14s",
      delay: "-5s",
      opacity: 0.88,
      items: [
        { text: "$", type: "currency" },
        { text: "Vista Line", type: "hotel" },
        { text: "$231", type: "price" },
        { text: "EUR", type: "currency" },
        { text: "Marble Coast", type: "hotel" },
        { text: "€213", type: "price" },
        { text: "£", type: "currency" },
        { text: "Iron Bridge", type: "hotel" },
        { text: "£186", type: "price" },
      ],
    },
  ];

  return (
    <main className={`landing ${roboto.className}`}>
      <div className="lights" aria-hidden>
        <div className="light x1"></div>
        <div className="light x2"></div>
        <div className="light x3"></div>
        <div className="light x4"></div>
        <div className="light x5"></div>
        <div className="light x6"></div>
        <div className="light x7"></div>
        <div className="light x8"></div>
        <div className="light x9"></div>
      </div>

      <div className="matrix" aria-hidden>
        {matrixColumns.map((column, columnIndex) => (
          <div
            className="matrix-column"
            key={`matrix-column-${columnIndex}`}
            style={{
              "--column-left": column.left,
              "--column-duration": column.duration,
              "--column-delay": column.delay,
              "--column-opacity": column.opacity,
            }}
          >
            {column.items.map((item, itemIndex) => (
              <span
                className={`matrix-item ${item.type}`}
                key={`matrix-item-${columnIndex}-${itemIndex}`}
                style={{ "--item-delay": `${itemIndex * 0.35}s` }}
              >
                {item.text}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="landing-content">
        <p id="head5" className="header">
          Welcome to Roomberg
        </p>

        <div className="landing-actions">
          <Link href="/heatmap" className="landing-button">
            Heatmap
          </Link>
          <Link href="/start-job" className="landing-button">
            Jobs
          </Link>
        </div>
      </div>

      <p id="footer">BA designs</p>
    </main>
  );
}
