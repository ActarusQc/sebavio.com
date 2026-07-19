import { requirePermission } from "@/features/auth";
import { AdminComingSoon } from "@/features/admin/components/admin-coming-soon";

export default async function AdminAiPage() {
  await requirePermission("ai.read");
  return (
    <AdminComingSoon
      title="Intelligence artificielle"
      phase={5}
      description="Fournisseurs OpenAI / Anthropic, quotas et coûts — Phase 5. Les secrets ne sont jamais exposés au navigateur."
    />
  );
}
