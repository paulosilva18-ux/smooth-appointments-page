import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/pages/AdminDashboard";

export const Route = createFileRoute("/painel/$barbeiro")({
  head: () => ({
    meta: [
      { title: "Painel do Barbeiro — Barbearia" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelBarbeiro,
});

function PainelBarbeiro() {
  return <AdminDashboard onBackToSite={() => { window.location.href = "/"; }} />;
}
