import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { can } from "@/lib/permissions";
import { listUsers } from "@/app/actions/roles";
import { UserManagementTable } from "@/components/user-management-table";

export default async function UsersPage() {
  const current = await getSessionUser();
  if (!current) redirect("/sign-in");
  if (!can(current.role, "roles:manage")) redirect("/dashboard");

  const users = await listUsers();

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Assign roles to control who can create, edit, and delete projects and data.
        </p>
      </div>
      <UserManagementTable initialUsers={users} currentUserId={current.id} />
    </div>
  );
}
