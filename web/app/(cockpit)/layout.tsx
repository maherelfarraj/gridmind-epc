import { AppShell } from "@/components/app-shell";

export default function CockpitLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
