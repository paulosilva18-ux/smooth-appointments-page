import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/pages/AdminDashboard";

export const Route = createFileRoute("/victor-admin")({
  head: () => ({
    meta: [
      { title: "Painel Victor Paz" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  return <AdminDashboard onBackToSite={() => { window.location.href = "/"; }} />;
}
