import Link from "next/link";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["100", "300", "400"],
  display: "swap",
});

export default function Page() {
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
