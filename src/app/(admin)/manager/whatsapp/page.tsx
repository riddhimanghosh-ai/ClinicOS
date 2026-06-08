import { recentMessages, queueSummary } from "@/lib/messaging";
import { ManagerPageHeader as PageHeader } from "@/components/manager-page-header";
import { WhatsAppClient } from "./whatsapp-client";

export const dynamic = "force-dynamic";

export default function WhatsAppPage() {
  const messages = recentMessages(200);
  const summary = queueSummary();
  return (
    <div className="space-y-6">
      <PageHeader
        title="WhatsApp Campaign Queue"
        subtitle="Edit, schedule and dispatch messages to patient cohorts."
      />
      <WhatsAppClient initialMessages={messages} initialSummary={summary} />
    </div>
  );
}
