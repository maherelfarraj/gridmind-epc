import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GridMind EPC™",
  description: "AI Utility-Scale Solar Design and SCADA Platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
