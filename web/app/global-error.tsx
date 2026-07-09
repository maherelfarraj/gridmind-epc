"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.log("[v0] Global error boundary caught:", error.message, error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
            fontFamily:
              "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              width: "100%",
              textAlign: "center",
              border: "1px solid #e2e8f0",
              borderRadius: "0.75rem",
              background: "#ffffff",
              padding: "2rem",
            }}
          >
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600, color: "#0f172a" }}>
              Something went wrong
            </h2>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
              A critical error occurred. Please try again.
            </p>
            {error.digest ? (
              <p style={{ marginTop: "0.75rem", fontSize: "0.6875rem", color: "#94a3b8" }}>
                Ref: {error.digest}
              </p>
            ) : null}
            <button
              onClick={reset}
              style={{
                marginTop: "1.5rem",
                borderRadius: "0.5rem",
                background: "#2563eb",
                color: "#ffffff",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
