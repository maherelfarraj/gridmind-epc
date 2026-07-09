"use client";

import { useState } from "react";
import { updateUserRole, type ManagedUser } from "@/app/actions/roles";
import { ALL_ROLES, roleDescription } from "@/lib/permissions";
import { useToast } from "@/components/toast-provider";
import type { UserRole } from "@/lib/types";
import { Shield } from "lucide-react";

const ROLE_STYLES: Record<UserRole, string> = {
  Admin: "bg-blue-50 text-blue-700 border-blue-200",
  Engineer: "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Cost Engineer": "bg-amber-50 text-amber-700 border-amber-200",
  Viewer: "bg-slate-100 text-slate-600 border-slate-200",
};

export function UserManagementTable({
  initialUsers,
  currentUserId,
}: {
  initialUsers: ManagedUser[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleChange = async (userId: string, role: UserRole) => {
    const previous = users;
    setSavingId(userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
    try {
      await updateUserRole(userId, role);
      showToast(`Role updated to ${role}`, "success");
    } catch (err) {
      setUsers(previous);
      showToast(
        err instanceof Error ? err.message : "Failed to update role",
        "warning"
      );
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Current Role</th>
              <th className="px-4 py-3 font-semibold">Assign Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-white">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium text-slate-900">
                      {u.name}
                      {u.id === currentUserId && (
                        <span className="ml-2 text-xs font-normal text-slate-400">
                          (you)
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[u.role]}`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={
                      savingId === u.id ||
                      (u.id === currentUserId && u.role === "Admin")
                    }
                    onChange={(e) =>
                      handleChange(u.id, e.target.value as UserRole)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-900">Role capabilities</h2>
        </div>
        <ul className="space-y-2">
          {ALL_ROLES.map((r) => (
            <li key={r} className="flex gap-3 text-sm">
              <span
                className={`inline-flex h-fit shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${ROLE_STYLES[r]}`}
              >
                {r}
              </span>
              <span className="text-slate-600">{roleDescription(r)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
