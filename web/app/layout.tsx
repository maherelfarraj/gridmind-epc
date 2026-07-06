import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PV_Mind Cockpit | GridMind EPC",
  description: "A GridMind EPC Solar Design & Configuration Cockpit — PV and PV+BESS sizing, yield, CAPEX, BOM, SLD, and reports."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
