import { redirect } from "next/navigation";

type Params = Promise<{ id: string }>;

/** Compatibilité — canonical : `/admin/users/[userId]`. */
export default async function AdminUserDetailFrRedirect({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  redirect(`/admin/users/${id}`);
}
