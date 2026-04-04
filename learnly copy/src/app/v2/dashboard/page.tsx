import { V2DashboardShell } from "@/components/v2/v2-dashboard-shell";
import { getDashboardSnapshot } from "@/lib/demo/store";
import { DEMO_USER_ID } from "@/lib/demo/user";

export const dynamic = "force-dynamic";

export default function V2DashboardPage() {
  const dashboard = getDashboardSnapshot(DEMO_USER_ID);

  return (
    <main className="v2-shell v2-page">
      <V2DashboardShell dashboard={dashboard} />
    </main>
  );
}
