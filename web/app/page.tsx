import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gridmind-mist">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-gridmind-orange">
          GridMind EPC™
        </p>
        <h1 className="max-w-4xl text-5xl font-bold leading-tight text-gridmind-navy">
          AI utility-scale solar design, SCADA monitoring, and automated EPC proposal generation.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-slate-700">
          Built for Vercel, Supabase, Cursor, Lovable, and GitHub. Use this interface to run
          transformer sizing, MV cable calculations, CAPEX estimates, realtime telemetry, and branded proposals.
        </p>
        <div className="mt-10 flex gap-4">
          <Link href="/dashboard" className="rounded-xl bg-gridmind-navy px-6 py-3 font-semibold text-white shadow">
            Open Dashboard
          </Link>
          <a href="/api/calculate" className="rounded-xl border border-gridmind-navy px-6 py-3 font-semibold text-gridmind-navy">
            API Ready
          </a>
        </div>
      </section>
    </main>
  );
}
