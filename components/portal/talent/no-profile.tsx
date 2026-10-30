import { PageHeader } from "@/components/portal/page-header";
import { Panel } from "@/components/portal/panel";

export function NoTalentProfile() {
  return (
    <>
      <PageHeader title="Your profile" />
      <Panel>
        <p className="text-muted-foreground text-sm">
          Your account isn&rsquo;t linked to an application yet. Contact the NillTech
          recruitment team.
        </p>
      </Panel>
    </>
  );
}
