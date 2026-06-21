import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, ShoppingBag, Heart, Users, ArrowUpRight, DollarSign, Shirt, PackageCheck, Info, XCircle,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from "recharts";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — Admin Rinnovare" }] }),
  component: AdminDashboard,
});

const KPI_INFO: Record<string, string> = {
  faturamento_realizado: "Soma do valor total das locações com status confirmado.",
  locacoes_realizadas_valor: "Valor das locações já concluídas (data final no passado).",
  reservas_realizadas_valor: "Valor das reservas com data de início ainda no futuro.",
  qtd_realizada_total: "Quantidade total de locações confirmadas.",
  qtd_locacoes_realizadas: "Locações já concluídas.",
  qtd_reservas_realizadas: "Reservas futuras (sinal ou confirmação).",
  total_cancelado: "Valor total de locações canceladas.",
  qtd_cancelado: "Quantidade de locações canceladas.",
};

function brl(v: number) {
  return `R$ ${Number(v ?? 0).toFixed(2).replace(".", ",")}`;
}

function InfoIcon({ tip }: { tip: string }) {
  return (
    <TooltipProvider delayDuration={150}>
      <UITooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-muted-foreground hover:text-foreground" aria-label="Informação">
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{tip}</TooltipContent>
      </UITooltip>
    </TooltipProvider>
  );
}

function AdminDashboard() {
  const { data: kpis } = useQuery({
    queryKey: ["admin-kpis"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_admin_kpis");
      if (error) throw error;
      return data as Record<string, number>;
    },
  });

  const { data: monthly = [] } = useQuery({
    queryKey: ["admin-monthly-stats"],
    queryFn: async () => {
      const { data } = await (supabase as any).from("admin_monthly_stats").select("*");
      return data ?? [];
    },
  });

  const { data: catalog } = useQuery({
    queryKey: ["admin-catalog-counts"],
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

  const valueKpis = [
    { key: "faturamento_realizado", label: "Faturamento Total Realizado", value: brl(kpis?.faturamento_realizado ?? 0), icon: DollarSign },
    { key: "locacoes_realizadas_valor", label: "Locações Realizadas (valor)", value: brl(kpis?.locacoes_realizadas_valor ?? 0), icon: PackageCheck },
    { key: "reservas_realizadas_valor", label: "Reservas Realizadas (valor)", value: brl(kpis?.reservas_realizadas_valor ?? 0), icon: Shirt },
    { key: "total_cancelado", label: "Total Cancelado", value: brl(kpis?.total_cancelado ?? 0), icon: XCircle },
  ];
  const qtyKpis = [
    { key: "qtd_realizada_total", label: "Total Realizado", value: kpis?.qtd_realizada_total ?? 0 },
    { key: "qtd_locacoes_realizadas", label: "Locações Realizadas", value: kpis?.qtd_locacoes_realizadas ?? 0 },
    { key: "qtd_reservas_realizadas", label: "Reservas Realizadas", value: kpis?.qtd_reservas_realizadas ?? 0 },
    { key: "qtd_cancelado", label: "Cancelados", value: kpis?.qtd_cancelado ?? 0 },
  ];

  const catalogCards = [
    { label: "Vestidos no catálogo", value: catalog?.products ?? "—", sub: `${catalog?.activeProducts ?? 0} ativos`, icon: Package, to: "/admin/catalogo" as const },
    { label: "Itens no carrinho", value: catalog?.cart ?? "—", sub: "todos os clientes", icon: ShoppingBag, to: "/admin/pedidos" as const },
    { label: "Favoritos salvos", value: catalog?.favorites ?? "—", sub: "clientes apaixonados", icon: Heart, to: "/admin/favoritos" as const },
    { label: "Clientes cadastradas", value: catalog?.clients ?? "—", sub: "contas ativas", icon: Users, to: "/admin/clientes" as const },
  ];

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Painel administrativo</div>
          <h1 className="mt-2 text-4xl">Bem-vinda, equipe Rinnovare</h1>
          <p className="mt-1 text-sm text-muted-foreground">KPIs em tempo real do desempenho de locações.</p>
        </div>
        <Link to="/admin/locacoes" className="inline-flex items-center gap-2 rounded-full bg-[#260d58] px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-white hover:opacity-90">
          Ver locações <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* KPI cards — values */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {valueKpis.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.key} className="rounded-2xl border border-border bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                  {c.label}
                  <InfoIcon tip={KPI_INFO[c.key]} />
                </span>
                <span className="rounded-full bg-[#260d58]/10 p-2">
                  <Icon className="h-4 w-4 text-[#260d58]" />
                </span>
              </div>
              <div className="mt-4 text-2xl font-medium">{c.value}</div>
            </div>
          );
        })}
      </div>

      {/* KPI cards — quantities */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {qtyKpis.map((c) => (
          <div key={c.key} className="rounded-2xl border border-border bg-[#faf8ff] p-5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-muted-foreground">
                {c.label}
                <InfoIcon tip={KPI_INFO[c.key]} />
              </span>
            </div>
            <div className="mt-4 text-2xl font-medium">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Faturamento por mês</h2>
            <InfoIcon tip="Valor de locações por mês, agrupado por status." />
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip formatter={(v: any) => brl(Number(v))} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="faturamento_realizado" name="Faturamento Total Realizado" fill="#260d58" />
                <Bar dataKey="locacoes_realizadas_valor" name="Locações Realizadas (valor)" fill="#7c5fc8" />
                <Bar dataKey="reservas_realizadas_valor" name="Reservas Realizadas (valor)" fill="#be9ffc" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-medium">Quantidade por mês</h2>
            <InfoIcon tip="Número de locações por mês, agrupado por status." />
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="qtd_realizada_total" name="Total Realizado" fill="#260d58" />
                <Bar dataKey="qtd_locacoes_realizadas" name="Locações Realizadas" fill="#7c5fc8" />
                <Bar dataKey="qtd_reservas_realizadas" name="Reservas Realizadas" fill="#be9ffc" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Catalog counts */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {catalogCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.label} to={c.to} className="group rounded-2xl border border-border bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-[#260d58]/40 hover:shadow-[0_12px_30px_-18px_rgba(38,13,88,0.5)]">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</span>
                <span className="rounded-full bg-[#260d58]/10 p-2">
                  <Icon className="h-4 w-4 text-[#260d58]" />
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
    </div>
  );
}
