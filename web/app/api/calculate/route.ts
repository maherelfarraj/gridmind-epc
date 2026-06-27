import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { runDesignCalculation, type DesignInput } from "@/lib/engineering";

export async function GET() {
  return NextResponse.json({ status: "ready", endpoint: "/api/calculate" });
}

export async function POST(request: Request) {
  const input = (await request.json()) as DesignInput;
  const output = runDesignCalculation(input);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ input, output, warning: "Supabase env not configured; calculation returned without database save." });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase
    .from("design_runs")
    .insert({
      project_name: input.projectName,
      capacity_mwp: input.capacityMwp,
      trackers_count: input.trackersCount,
      cable_length_meters: input.cableLengthMeters,
      ambient_temp_c: input.ambientTempC,
      transformer_mva: output.transformerMva,
      conductor_size_mm2: output.conductorSizeMm2,
      line_current_a: output.lineCurrentA,
      loss_pct: output.lossPct,
      total_cost_usd: output.totalCostUsd,
      bom_json: output.bom
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ input, output, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ input, output, designId: data.id });
}
