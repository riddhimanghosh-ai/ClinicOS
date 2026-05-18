import { listAllPatients, getPatientPortfolio, packageBalance, searchCatalog } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { PatientClient } from "./patient-client";

export const dynamic = "force-dynamic";

export default function PatientPage({
  searchParams,
}: {
  searchParams: { patient?: string };
}) {
  const patients = listAllPatients();
  const initialId = Number(searchParams.patient) || patients[0]?.id || 0;
  const portfolio = initialId ? getPatientPortfolio(initialId) : null;
  const balances = initialId ? packageBalance(initialId) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Copilot"
        subtitle="Your packages, your progress, your prices — in one place."
      />
      <PatientClient
        patients={patients}
        initialId={initialId}
        initialPortfolio={portfolio}
        initialBalances={balances}
      />
    </div>
  );
}
