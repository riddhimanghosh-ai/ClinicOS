import { PageHeader } from "@/components/page-header";
import { PatientSearch } from "@/components/patient-search";

type PageHeaderProps = React.ComponentProps<typeof PageHeader>;

export function ManagerPageHeader(props: PageHeaderProps) {
  return (
    <div>
      <PageHeader {...props} />
      <div className="mt-3 flex items-center justify-end pb-2">
        <PatientSearch />
      </div>
    </div>
  );
}
