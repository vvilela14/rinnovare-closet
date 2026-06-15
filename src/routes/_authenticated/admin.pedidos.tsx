import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — Admin Rinnovare" }] }),
  component: AdminPedidos,
});

function AdminPedidos() {
  const { data = [] } = useQuery({
    queryKey: ["admin-cart-items"],
    queryFn: async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("id, quantity, created_at, user_id, products(name, price, size)")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Pedidos</div>
      <h1 className="mt-2 text-4xl">Carrinhos ativos</h1>
      <p className="mt-1 text-sm text-muted-foreground">Vestidos que as clientes adicionaram e ainda não finalizaram.</p>

      <div className="mt-8 rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Vestido</th>
                <th className="px-5 py-3">Tamanho</th>
                <th className="px-5 py-3">Qtd.</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Adicionado em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-muted-foreground">
                  <ShoppingBag className="mx-auto mb-3 h-6 w-6 opacity-40" />
                  Nenhum item em carrinhos no momento.
                </td></tr>
              )}
              {data.map((row: any) => (
                <tr key={row.id}>
                  <td className="px-5 py-3">{row.products?.name ?? "—"}</td>
                  <td className="px-5 py-3">{row.products?.size ?? "—"}</td>
                  <td className="px-5 py-3">{row.quantity}</td>
                  <td className="px-5 py-3">R$ {Number(row.products?.price ?? 0).toFixed(2).replace(".", ",")}</td>
                  <td className="px-5 py-3 font-mono text-xs">{String(row.user_id).slice(0, 8)}…</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(row.created_at).toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
