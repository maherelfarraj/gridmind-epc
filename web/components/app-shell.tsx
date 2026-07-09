import { Sidebar } from "./sidebar";
import { AppProvider, type CurrentUser } from "@/context/app-context";
import { ToastProvider } from "./toast-provider";

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: CurrentUser;
}) {
  return (
    <AppProvider currentUser={user}>
      <ToastProvider>
        <div className="min-h-screen bg-slate-50">
          <Sidebar user={user} />
          <main className="ml-64 min-h-screen p-6">{children}</main>
        </div>
      </ToastProvider>
    </AppProvider>
  );
}
