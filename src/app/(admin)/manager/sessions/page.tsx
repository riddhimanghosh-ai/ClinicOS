import { getSalesRecords } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { SessionsClient } from "./sessions-client";

export const dynamic = "force-dynamic";

export default function SessionsPage() {
  const records = getSalesRecords("session_package");
  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        subtitle="Filter all session packages by usage — used, unused, or expiring."
      />
      <SessionsClient records={records} />
    </div>
  );
}
