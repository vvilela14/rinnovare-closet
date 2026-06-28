import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LayoutDashboard, Package, Users, ShoppingBag, Heart, CalendarDays, LogOut, ArrowLeft, Bell, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoUrl from "@/assets/rinnovare-logo-admin.png";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Painel Administrativo — Rinnovare" }] }),
  beforeLoad: async ({ context }: any) => {
    const userId = context.user?.id;
    if (!userId) throw redirect({ to: "/auth" });
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) throw redirect({ to: "/" });
  },
  component: AdminLayout,
});

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/catalogo", label: "Catálogo", icon: Package },
  { to: "/admin/locacoes", label: "Locações", icon: ClipboardList },
  { to: "/admin/pedidos", label: "Carrinhos", icon: ShoppingBag },
  { to: "/admin/favoritos", label: "Favoritos", icon: Heart },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/calendario", label: "Calendário", icon: CalendarDays },
];

function NotificationsBell() {
  const { data: pending = [] } = useQuery({
    queryKey: ["admin-pending-rentals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rental_requests")
        .select("id, period_days, start_date, end_date, total_value, created_at, product:products(name), profile:profiles!rental_requests_user_id_fkey(full_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 30_000,
  });

  // Fallback: profiles relation may not be auto-detected; fetch separately
  const { data: pendingFallback = [] } = useQuery({
    queryKey: ["admin-pending-rentals-fallback"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("rental_requests")
        .select("id, user_id, period_days, start_date, end_date, total_value, created_at, product:products(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      const list = rows ?? [];
      const ids = Array.from(new Set(list.map((r: any) => r.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        list.forEach((r: any) => { r.profile = map.get(r.user_id) ?? null; });
      }
      return list;
    },
    refetchInterval: 30_000,
  });

  const items: any[] = pending.length ? pending : pendingFallback;
  const count = items.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative rounded-full p-2.5 text-white/80 hover:bg-white/10 hover:text-white" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#be9ffc] px-1 text-[10px] font-medium text-[#0a0716]">
              {count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="border-b border-border px-4 py-3">
          <div className="text-sm font-medium">Solicitações de locação</div>
          <div className="text-xs text-muted-foreground">{count} aguardando confirmação</div>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Sem novas solicitações.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((it: any) => (
                <li key={it.id} className="px-4 py-3">
                  <div className="text-sm font-medium">{it.profile?.full_name ?? "Cliente"}</div>
                  <div className="text-xs text-muted-foreground">{it.product?.name}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{it.period_days} dias</span>
                    <span>
                      {format(new Date(it.start_date + "T00:00:00"), "dd/MM", { locale: ptBR })} –{" "}
                      {format(new Date(it.end_date + "T00:00:00"), "dd/MM", { locale: ptBR })}
                    </span>
                    <span>R$ {Number(it.total_value).toFixed(2).replace(".", ",")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-border px-4 py-2 text-center">
          <Link to="/admin/locacoes" className="text-xs uppercase tracking-widest text-[#260d58] hover:underline">
            Ver todas
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-[#0f0a1f] text-white">
      <div className="flex min-h-screen">
        <aside className={`hidden shrink-0 flex-col border-r border-white/10 bg-[#0a0716] px-3 py-5 md:flex transition-all ${collapsed ? "w-16" : "w-52"}`}>
          <div className="mb-6 flex items-center justify-between gap-2">
            <Link to="/" className="flex items-center gap-2 overflow-hidden">
              <img src={logoUrl} alt="Rinnovare Closet" className={`h-10 w-auto ${collapsed ? "hidden" : ""}`} />
            </Link>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="rounded-md p-1 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label={collapsed ? "Expandir" : "Recolher"}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          </div>
          {!collapsed && <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">Administração</div>}
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = item.exact
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.label}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-[#260d58] text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color: active ? "#be9ffc" : undefined }} />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2 pt-8">
            <Link
              to="/"
              title="Voltar à vitrine"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs uppercase tracking-widest text-white/60 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> {!collapsed && "Voltar à vitrine"}
            </Link>
            <button
              onClick={handleSignOut}
              title="Sair"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs uppercase tracking-widest text-white/60 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" /> {!collapsed && "Sair"}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-x-auto bg-[#f6f4fb] text-foreground">
          {/* top bar */}
          <div className="flex items-center justify-between border-b border-border bg-[#0a0716] px-5 py-3 text-white">
            <div className="md:hidden">
              <img src={logoUrl} alt="Rinnovare Closet" className="h-9 w-auto" />
            </div>
            <div className="hidden md:block text-xs uppercase tracking-[0.3em] text-white/40">
              Painel administrativo
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 text-[10px] uppercase tracking-widest md:hidden">
                {NAV.slice(0, 4).map((n) => (
                  <Link key={n.to} to={n.to} className="rounded-full border border-white/15 px-2.5 py-1">
                    {n.label}
                  </Link>
                ))}
              </div>
              <NotificationsBell />
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
