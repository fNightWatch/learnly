import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SiteHeader } from "@/components/site/site-header";
import { getDashboardSnapshot } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const dashboard = getDashboardSnapshot(DEMO_USER_ID);

  return (
    <div className="dashboard-theme">
      <SiteHeader />
      <main className="shell page-shell">
        <DashboardShell dashboard={dashboard} />
      </main>
    </div>
  );
}
