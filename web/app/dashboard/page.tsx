import { DesignConsole } from "@/components/design-console";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gridmind-mist px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-3xl bg-gridmind-navy p-8 text-white shadow">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gridmind-orange">
            GridMind EPC™ Command Center
          </p>
          <h1 className="mt-3 text-4xl font-bold">Solar Design + SCADA + Proposal Engine</h1>
          <p className="mt-3 max-w-3xl text-white/80">
            Vercel frontend, Supabase database, serverless calculation API, and branded proposal workflow.
          </p>
        </div>
        <DesignConsole />
      </div>
    </main>
  );
}
