import { ManagerNav } from "@/components/manager-nav";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <ManagerNav />
      {children}
    </div>
  );
}
