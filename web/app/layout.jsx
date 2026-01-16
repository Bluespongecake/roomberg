import "./globals.css";
import { IBM_Plex_Mono } from "next/font/google";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

export const metadata = {
  title: "Roomberg Price Heatmap",
  description: "Roomberg price heatmap view",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plexMono.variable}>
      <body>{children}</body>
    </html>
  );
}
