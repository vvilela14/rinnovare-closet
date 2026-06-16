import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, ShoppingBag, Heart, Users, ArrowUpRight, DollarSign, Shirt, PackageCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Admin Rinnovare" }] }),
  component: AdminDashboard,
});

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function monthStartISO() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function AdminDashboard() {
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, activeProducts, cart, favorites, profiles] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("cart_items").select("*", { count: "exact", head: true }),
        supabase.from("favorites").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
      ]);
      return {
        products: products.count ?? 0,
        activeProducts: activeProducts.count ?? 0,
        cart: cart.count ?? 0,
        favorites: favorites.count ?? 0,
        clients: profiles.count ?? 0,
      };
    },
  });

  const { data: rentals = [] } = useQuery({
    queryKey: ["admin-rentals-range", from, to],
    queryFn: async () => {
      const { data } = await supabase
        .from("rental_requests")
        .select("id,status,total_value,start_date,end_date")
        .gte("start_date", from)
        .lte("start_date", to);
      return data ?? [];
    },
  });

  const rentalStats = useMemo(() => {
    const today = todayISO();
    const active = rentals.filter((r: any) => r.status !== "pending");
    const totalValue = active.reduce((s: number, r: any) => s + Number(r.total_value ?? 0), 0);
    const totalCount = active.length;
    const withClients = active.filter(
      (r: any) => r.status !== "returned" && r.start_date <= today && r.end_date >= today,
    ).length;
    return { totalValue, totalCount, withClients };
  }, [rentals]);

  const { data: recent = [] } = useQuery({
    queryKey: ["admin-recent-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,price,size,is_active,created_at,image_url")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const rentalCards = [
    {
      label: "Valor total de locação",
      value: `R$ ${rentalStats.totalValue.toFixed(2).replace(".", ",")}`,
      sub: "no período selecionado",
      icon: DollarSign,
      color: "#260d58",
    },
    {
      label: "Vestidos locados",
      value: rentalStats.totalCount,
      sub: "locações no período",
      icon: Shirt,
      color: "#be9ffc",
    },
    {
      label: "Vestidos com clientes",
      value: rentalStats.withClients,
      sub: "em uso hoje",
      icon: PackageCheck,
      color: "#260d58",
    },
  ];

  const cards = [
    { label: "Vestidos no catálogo", value: stats?.products ?? "—", sub: `${stats?.activeProducts ?? 0} ativos`, icon: Package, color: "#260d58", to: "/admin/catalogo" as const },
    { label: "Itens no carrinho", value: stats?.cart ?? "—", sub: "todos os clientes", icon: ShoppingBag, color: "#be9ffc", to: "/admin/pedidos" as const },
    { label: "Favoritos salvos", value: stats?.favorites ?? "—", sub: "clientes apaixonados", icon: Heart, color: "#be9ffc", to: "/admin/favoritos" as const },
    { label: "Clientes cadastradas", value: stats?.clients ?? "—", sub: "contas ativas", icon: Users, color: "#260d58", to: "/admin/clientes" as const },
  ];

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Painel administrativo</div>
          <h1 className="mt-2 text-4xl">Bem-vinda, equipe Rinnovare</h1>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe o desempenho da vitrine e gerencie o catálogo de vestidos.</p>
        </div>
        <Link
          to="/admin/catalogo"
          className="inline-flex items-center gap-2 rounded-full bg-[#260d58] px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-white hover:opacity-90"
        >
          Gerenciar catálogo <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Rental indicators with date filter */}
      <div className="mt-8 rounded-2xl border border-border bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Indicadores de locação</div>
            <h2 className="mt-1 text-lg">Resumo do período</h2>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col text-[11px] uppercase tracking-widest text-muted-foreground">
              De
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 rounded-md border border-border bg-white px-3 py-1.5 text-sm text-foreground"
              />
            </label>
            <label className="flex flex-col text-[11px] uppercase tracking-widest text-muted-foreground">
              Até
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 rounded-md border border-border bg-white px-3 py-1.5 text-sm text-foreground"
              />
            </label>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rentalCards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className="rounded-2xl border border-border bg-[#faf8ff] p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</span>
                  <span className="rounded-full p-2" style={{ background: `${c.color}15` }}>
                    <Icon className="h-4 w-4" style={{ color: c.color }} />
                  </span>
                </div>
                <div className="mt-4 text-3xl font-medium">{c.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.sub}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              to={c.to}
              className="group rounded-2xl border border-border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#260d58]/40 hover:shadow-[0_12px_30px_-18px_rgba(38,13,88,0.5)]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</span>
                <span className="rounded-full p-2" style={{ background: `${c.color}15` }}>
                  <Icon className="h-4 w-4" style={{ color: c.color }} />
                </span>
              </div>
              <div className="mt-4 text-3xl font-medium">{c.value}</div>
              <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>{c.sub}</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg">Últimos vestidos adicionados</h2>
          <Link to="/admin/catalogo" className="text-xs uppercase tracking-widest text-[#260d58] hover:underline">
            Ver tudo
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Vestido</th>
                <th className="px-5 py-3">Tamanho</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">Nenhum vestido cadastrado ainda.</td></tr>
              )}
              {recent.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url && <img src={p.image_url} alt="" className="h-10 w-8 rounded object-cover" />}
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">{p.size}</td>
                  <td className="px-5 py-3">R$ {Number(p.price).toFixed(2).replace(".", ",")}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-widest ${p.is_active ? "bg-[#be9ffc]/30 text-[#260d58]" : "bg-muted text-muted-foreground"}`}>
                      {p.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
