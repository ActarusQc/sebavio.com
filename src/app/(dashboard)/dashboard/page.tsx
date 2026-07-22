import { requireActiveUser } from "@/features/auth";
import { DashboardView, getDashboardData } from "@/features/dashboard";

export default async function DashboardPage() {
  const user = await requireActiveUser();
  const data = await getDashboardData(user.id);

  return <DashboardView data={data} />;
}
