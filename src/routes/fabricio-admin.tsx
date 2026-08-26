import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/pages/AdminDashboard";

export const Route = createFileRoute("/fabricio-admin")({
  head: () => ({
    meta: [
      { title: "Painel Fabrício Barbeiro" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  return <AdminDashboard onBackToSite={() => { window.location.href = "/"; }} />;
}
