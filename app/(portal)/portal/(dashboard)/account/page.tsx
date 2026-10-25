import { ChangePasswordForm } from "@/components/portal/change-password-form";
import { PageHeader } from "@/components/portal/page-header";
import { Panel } from "@/components/portal/panel";
import { requireUser } from "@/lib/auth/dal";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="Your account" description={user.email} />
      <Panel
        title="Change password"
        description="If an administrator gave you a temporary password, replace it here."
        className="max-w-md"
      >
        <ChangePasswordForm />
      </Panel>
    </>
  );
}
