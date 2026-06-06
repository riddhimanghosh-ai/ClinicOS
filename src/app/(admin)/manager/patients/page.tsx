import { listAllPatients, listClinicStatus, listAllDoctors, getAllCatalog } from "@/lib/db";
import { PageHeader } from "@/components/page-header";
import { PatientsClient } from "./patients-client";

export const dynamic = "force-dynamic";

export default function PatientsPage() {
  const patients = listAllPatients();
  const statuses = listClinicStatus();
  const doctors = listAllDoctors();
  const { products, services } = getAllCatalog();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients, Clinic & Catalog"
        subtitle="Patient records · clinic operational status · product & service catalog — all in one place."
      />
      <PatientsClient
        patients={patients}
        clinicStatuses={statuses}
        doctors={doctors}
        catalogProducts={products}
        catalogServices={services}
      />
    </div>
  );
}
