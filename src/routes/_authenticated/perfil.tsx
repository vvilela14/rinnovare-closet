import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Home, User, CalendarHeart, ClipboardList, ChevronLeft, ChevronRight, Wallet } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Minha conta — Rinnovare" }] }),
  component: PerfilLayout,
});

const NAV = [
  { to: "/", label: "Home", icon: Home, exact: true },
  { to: "/perfil", label: "Dados Cadastrais", icon: User, exact: true },
  { to: "/perfil/eventos", label: "Meus Eventos", icon: CalendarHeart, exact: false },
  { to: "/perfil/locacoes", label: "Minhas Locações", icon: ClipboardList, exact: false },
];

function PerfilLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const { data: credit } = useQuery({
    queryKey: ["my-credit-balance", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_credit_balance")
        .select("available_balance, total_balance")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data ?? { available_balance: 0, total_balance: 0 };
    },
  });

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-10">
        <div className={cn("grid gap-6", collapsed ? "md:grid-cols-[60px_1fr]" : "md:grid-cols-[200px_1fr]")}>
          <aside className="md:sticky md:top-20 md:self-start md:border-r md:border-border md:pr-4">
            <div className="flex items-center justify-between">
              {!collapsed && <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Minha conta</div>}
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="ml-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground hidden md:inline-flex"
                aria-label={collapsed ? "Expandir" : "Recolher"}
              >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </button>
            </div>

            <nav className="mt-4 flex flex-col gap-1">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && item.label}
                  </Link>
                );
              })}
            </nav>

            <div className={cn("mt-6 rounded-xl border border-border bg-primary/5 p-3", collapsed && "p-2")}>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary shrink-0" />
                {!collapsed && (
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Saldo de crédito</div>
                )}
              </div>
              {!collapsed && (
                <div className="mt-1.5 text-lg font-semibold text-primary">
                  R$ {Number(credit?.available_balance ?? 0).toFixed(2).replace(".", ",")}
                </div>
              )}
              {collapsed && (
                <div className="mt-1 text-[10px] font-semibold text-primary text-center">
                  {Number(credit?.available_balance ?? 0).toFixed(0)}
                </div>
              )}
            </div>
          </aside>
          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}
