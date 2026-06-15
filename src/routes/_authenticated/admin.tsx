import { createFileRoute, Link, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, Package, Users, ShoppingBag, Heart, LogOut, ArrowLeft } from "lucide-react";
import logoAsset from "@/assets/rinnovare-logo-admin.png.asset.json";

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
  { to: "/admin/pedidos", label: "Carrinhos", icon: ShoppingBag },
  { to: "/admin/favoritos", label: "Favoritos", icon: Heart },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
];

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const qc = useQueryClient();

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-[#0f0a1f] text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[#0a0716] p-6 md:flex">
          <Link to="/" className="mb-10 flex items-center gap-2">
            <img src={logoAsset.url} alt="Rinnovare Closet" className="h-12 w-auto" />
          </Link>
          <div className="mb-3 text-[10px] uppercase tracking-[0.25em] text-white/40">Administração</div>
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
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                    active
                      ? "bg-[#260d58] text-white"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" style={{ color: active ? "#be9ffc" : undefined }} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-2 pt-8">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs uppercase tracking-widest text-white/60 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar à vitrine
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs uppercase tracking-widest text-white/60 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" /> Sair
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-x-auto bg-[#f6f4fb] text-foreground">
          {/* mobile top bar */}
          <div className="flex items-center justify-between border-b border-border bg-[#0a0716] px-5 py-3 text-white md:hidden">
            <img src={logoAsset.url} alt="Rinnovare Closet" className="h-9 w-auto" />
            <div className="flex gap-2 text-[10px] uppercase tracking-widest">
              {NAV.map((n) => (
                <Link key={n.to} to={n.to} className="rounded-full border border-white/15 px-2.5 py-1">
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
