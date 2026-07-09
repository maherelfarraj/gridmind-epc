import Link from "next/link";
import { ArrowLeft, GitBranch, Gauge, Rocket, ShieldCheck, Terminal } from "lucide-react";

export const metadata = {
  title: "Progressive Rollouts Guide | PV_Mind Cockpit",
  description: "How progressive deployment rollouts work on Vercel and how GridMind's feature flags connect to them."
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{n}</div>
      <div className="pb-6">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <div className="mt-1 text-sm leading-relaxed text-slate-600">{children}</div>
      </div>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
      <code>{children}</code>
    </pre>
  );
}

export default function RolloutGuidePage() {
  return (
    <div className="max-w-3xl">
      <Link href="/rollouts" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" /> Back to Rollouts
      </Link>

      <h1 className="text-2xl font-bold text-slate-900">Progressive Deployment Rollouts</h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Progressive rollouts let you ship a change to a small fraction of traffic first, watch the metrics for that cohort
        against everyone else, and only promote to 100% once it looks healthy — or roll back instantly if it does not. This
        cockpit ships with a working, self-contained rollout control plane (localStorage) plus the{" "}
        <span className="font-medium text-slate-800">Flags SDK</span> wired up so you can move to Vercel-managed flags in production.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { Icon: Rocket, title: "Canary first", body: "Route a small % of visitors to the new code path." },
          { Icon: Gauge, title: "Compare metrics", body: "Watch error rate, latency, and success per cohort." },
          { Icon: ShieldCheck, title: "Promote or roll back", body: "Guardrails recommend the safe next action." }
        ].map(({ Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
            <Icon className="h-5 w-5 text-blue-600" />
            <p className="mt-2 font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </div>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <GitBranch className="h-5 w-5 text-slate-500" /> Two layers of progressive delivery
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          On Vercel you can roll out progressively at two levels, and they complement each other:
        </p>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <span className="font-semibold text-slate-900">1. Deployment-level rollouts.</span> When you promote a new
            production deployment, Vercel can shift traffic to it in stages (for example 10% → 50% → 100%) instead of all at
            once. You watch observability and monitoring during each stage and advance or halt the rollout. This is
            infrastructure-level and needs no code changes.
          </li>
          <li className="rounded-lg border border-slate-200 bg-white p-4">
            <span className="font-semibold text-slate-900">2. Feature-flag rollouts.</span> Ship the code to everyone but
            gate the new behavior behind a flag, then ramp the flag&apos;s audience percentage. This decouples deploy from
            release, lets you target specific cohorts, and enables instant rollback by flipping the flag — no redeploy. This
            is what the <Link href="/rollouts" className="font-medium text-blue-600 underline">Rollout Dashboard</Link> models.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Terminal className="h-5 w-5 text-slate-500" /> Connecting these flags to Vercel
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          The flags in <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">flags.ts</code> use the Flags SDK. Locally
          they resolve with a self-contained <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">decide</code> that
          buckets a visitor by the <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">pv_mind_visitor</code> cookie.
          To manage the rollout percentage from Vercel instead, follow these steps:
        </p>

        <div className="mt-5">
          <Step n={1} title="Install and link">
            The Flags SDK is already installed. Link the project to Vercel so the CLI can manage flags:
            <Code>{`vercel link\nvercel env pull`}</Code>
          </Step>
          <Step n={2} title="Register each flag with Vercel">
            <Code>{`vercel flags add yield-engine-v2 --kind boolean \\\n  --description "New yield model"`}</Code>
            This provisions the <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">FLAGS</code> and{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">FLAGS_SECRET</code> environment variables automatically.
          </Step>
          <Step n={3} title="Swap decide for the Vercel adapter">
            In <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">flags.ts</code>, replace the local{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">decide</code> with the adapter so the audience % is
            controlled from the Vercel dashboard:
            <Code>{`import { flag } from "flags/next";\nimport { vercelAdapter } from "@flags-sdk/vercel";\n\nexport const yieldEngineV2 = flag({\n  key: "yield-engine-v2",\n  adapter: vercelAdapter,\n  identify,\n});`}</Code>
          </Step>
          <Step n={4} title="Ramp from the Flags Explorer">
            This app already exposes the discovery endpoint at{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">/.well-known/vercel/flags</code>. Open the Vercel
            Toolbar&apos;s Flags Explorer on any deployment to change the audience percentage and watch metrics move — the
            same promote / roll back loop you see in the dashboard, now backed by Vercel.
          </Step>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-emerald-900">
          <ShieldCheck className="h-5 w-5" /> Guardrails in this cockpit
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">
          The dashboard recommends an action per rollout using guardrails: it flags a{" "}
          <span className="font-semibold">rollback</span> when the canary error rate is 1.5x the control or +1pp higher,
          holds when p95 latency is 30%+ worse or the canary sample is too small, and clears a{" "}
          <span className="font-semibold">promote</span> only when error rate and latency stay within budget. Wire these same
          thresholds to your real observability provider to automate promotion decisions.
        </p>
      </section>
    </div>
  );
}
