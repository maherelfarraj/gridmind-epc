# Lovable Prompt — GridMind EPC™ Vercel/Supabase Upgrade

Build a premium enterprise SaaS frontend called **GridMind EPC™** for a utility-scale solar design and SCADA platform.

## Stack
- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- Vercel deployment
- Recharts for charts
- jsPDF for proposal PDF export

## Visual style
- Luxury engineering interface
- Navy #002B49, orange #FF8C00, mist #F4F6F8
- Clean cards, large metrics, professional technical dashboard
- Enterprise EPC / renewable infrastructure feel

## Pages
1. Landing page
   - Hero: "AI utility-scale solar design, SCADA monitoring, and automated EPC proposal generation"
   - CTA: Open Dashboard
2. Dashboard
   - Input card:
     - Project name
     - Target capacity MWp
     - Tracker structures
     - MV cable length meters
     - Ambient temperature °C
   - Output cards:
     - Total EPC CAPEX
     - Recommended transformer MVA
     - MV conductor size mm² Al
     - Estimated cable losses %
   - BOM table:
     - PV modules
     - Trackers
     - MV collection cable
     - Transformer/substation
     - Labor
   - SCADA preview:
     - Transformer oil temperature
     - Dissolved gas PPM
     - Grid throughput MVA
   - Buttons:
     - Calculate + Save to Supabase
     - Download Branded GridMind EPC™ PDF Proposal

## Supabase tables
Use:
- profiles
- projects
- design_runs
- panel_inventory
- scada_telemetry

## Behavior
- Calculations should be run client-side for instant response.
- API route `/api/calculate` should save design runs to Supabase.
- API route `/api/proposal` should generate a branded proposal PDF.
- Keep code clean and ready for Cursor continuation.
