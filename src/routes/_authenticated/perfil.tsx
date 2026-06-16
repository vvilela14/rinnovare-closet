import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { User, CalendarHeart } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Minha conta — Rinnovare" }] }),
  component: PerfilLayout,
});

const NAV = [
  { to: "/perfil", label: "Dados Cadastrais", icon: User, exact: true },
  { to: "/perfil/eventos", label: "Meus Eventos", icon: CalendarHeart, exact: false },
];

function PerfilLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-10">
      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Minha conta</div>
      <nav className="mt-4 flex flex-row flex-wrap gap-2 border-b border-border pb-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm whitespace-nowrap transition",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

