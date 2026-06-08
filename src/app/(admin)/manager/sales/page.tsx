import { getSalesRecords } from "@/lib/db";
import { ManagerPageHeader as PageHeader } from "@/components/manager-page-header";
import { SalesClient } from "./sales-client";

export const dynamic = "force-dynamic";

export default function SalesPage() {
  const records = getSalesRecords();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Records"
        subtitle="All session packages and product sales — Guest Code, Order Number, Item Code."
      />
      <SalesClient records={records} />
    </div>
  );
}
