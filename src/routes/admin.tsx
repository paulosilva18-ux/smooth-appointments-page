import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/pages/AdminDashboard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo — Barbearia" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminRouteComponent,
});

function AdminRouteComponent() {
  return <AdminDashboard onBackToSite={() => { window.location.href = "/"; }} />;
}
