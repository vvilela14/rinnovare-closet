import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Minha conta — Rinnovare" }] }),
  component: PerfilLayout,
});

function PerfilLayout() {
  return (
    <>
      <Header />
      <div className="mx-auto max-w-5xl px-4 py-10 lg:px-10">
        <Outlet />
      </div>
    </>
  );
}
