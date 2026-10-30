import { PageHeader } from "@/components/portal/page-header";
import { NoAccess } from "@/components/portal/panel";
import { LiveChatConsole } from "@/components/portal/sales/live-chat-console";
import { SalesTabs } from "@/components/portal/sales/sales-tabs";
import { getUserWithRole } from "@/lib/auth/dal";

export default async function LiveChatPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const user = await getUserWithRole(["sales", "super_admin"]);
  if (!user) return <NoAccess />;
  const { c } = await searchParams;
  const selected = c && /^[0-9a-f-]{36}$/i.test(c) ? c : null;

  return (
    <>
      <PageHeader
        title="Sales"
        description="Website visitors who asked the chat assistant for a person. Keep this page open during your booking hours to be available."
      />
      <SalesTabs current="/portal/sales/chat" />
      <LiveChatConsole initialSelected={selected} />
    </>
  );
}
