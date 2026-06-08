import { getTreatmentOps } from "@/lib/db";
import { ManagerPageHeader as PageHeader } from "@/components/manager-page-header";
import { OpsClient } from "./ops-client";

export const dynamic = "force-dynamic";

export default function OpsPage() {
  const rows = getTreatmentOps(1);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Treatment & FnO Operations"
        subtitle="Today's sessions — pending treatment entry and inventory records"
      />
      <OpsClient rows={rows} />
    </div>
  );
}
