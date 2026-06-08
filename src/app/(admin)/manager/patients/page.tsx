import { listAllPatients } from "@/lib/db";
import { ManagerPageHeader as PageHeader } from "@/components/manager-page-header";
import { PatientsClient } from "./patients-client";

export const dynamic = "force-dynamic";

export default function PatientsPage() {
  const patients = listAllPatients();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        subtitle="Search patients, view records, and manage prescriptions."
      />
      <PatientsClient patients={patients} />
    </div>
  );
}
