import { listAllPatients, listLiveCheckIns, getPatientPortfolio, purgeSessionConsultations, purgeSessionPrescriptions, ensureDemoCheckIns, listAllDoctors, getCompletedToday, getTodayAppointments, resetDemoSchedule } from "@/lib/db";
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
  resetDemoSchedule();
  ensureDemoCheckIns();
  const doctors = listAllDoctors();
  const demoDoctor = doctors[0] ?? { name: "Dr. Kavita Sharma", specialty: "Dermatologist", branch_name: "Kaya Bandra 2" };

  const patients = listAllPatients();
  const checkIns = listLiveCheckIns();
  const checkInPatientIds = new Set(checkIns.map(c => c.patient_id));
  // Exclude anyone currently in the live check-in queue — they can't be both live and completed
  const completedToday = getCompletedToday().filter(c => !checkInPatientIds.has(c.id));
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
