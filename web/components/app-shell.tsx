import { Sidebar } from "./sidebar";
import { AppProvider } from "@/context/app-context";
import { ToastProvider } from "./toast-provider";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { name: string; email: string };
}) {
  return (
    <AppProvider>
      <ToastProvider>
        <div className="min-h-screen bg-slate-50">
          <Sidebar user={user} />
          <main className="ml-64 min-h-screen p-6">{children}</main>
        </div>
      </ToastProvider>
    </AppProvider>
  );
}
