import { createFlagsDiscoveryEndpoint, getProviderData } from "flags/next";
import * as flags from "../../../../flags";

// Flags Discovery endpoint — powers the Vercel Flags Explorer / Toolbar.
export const GET = createFlagsDiscoveryEndpoint(async () => {
  return getProviderData(flags);
});
