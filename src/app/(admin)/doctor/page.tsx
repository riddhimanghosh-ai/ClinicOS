import { listAllPatients, listLiveCheckIns, getPatientPortfolio, purgeSessionConsultations, purgeSessionPrescriptions, ensureDemoCheckIns, listAllDoctors, getCompletedToday, getTodayAppointments } from "@/lib/db";
import { ManagerPageHeader as PageHeader } from "@/components/manager-page-header";
import { DoctorClient } from "./doctor-client";

export const dynamic = "force-dynamic";

export default function DoctorPage({
  searchParams,
}: {
  searchParams: { patient?: string };
}) {
  // Clear session recordings/prescriptions on each page load; seeds are preserved.
  purgeSessionConsultations();
  purgeSessionPrescriptions();
  ensureDemoCheckIns();
  const doctors = listAllDoctors();
  const demoDoctor = doctors[0] ?? { name: "Dr. Kavita Sharma", specialty: "Dermatologist", branch_name: "Kaya Bandra 2" };

  const patients = listAllPatients();
  const checkIns = listLiveCheckIns();
  const completedToday = getCompletedToday();
  const todayAppointments = getTodayAppointments();
  const initialId =
    Number(searchParams.patient) ||
    checkIns[0]?.patient_id ||
    todayAppointments[0]?.patient_id ||
    patients[0]?.id ||
    0;
  const initialPortfolio = initialId ? getPatientPortfolio(initialId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctor Console"
        subtitle="Unified cross-branch patient portfolio. Async post-consult capture compresses your notes into the structured tag schema that drives the cohort engine."
      />
      <DoctorClient
        patients={patients}
        checkIns={checkIns}
        completedToday={completedToday}
        todayAppointments={todayAppointments}
        initialId={initialId}
        initialPortfolio={initialPortfolio}
        doctorName={demoDoctor.name}
        doctorSpecialty={demoDoctor.specialty}
        doctorBranch={demoDoctor.branch_name ?? "Kaya Clinic"}
      />
    </div>
  );
}
