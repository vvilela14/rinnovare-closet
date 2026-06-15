import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/site/Header";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";

const RENTAL_PERIODS = [4, 7, 12] as const;

export const Route = createFileRoute("/_authenticated/carrinho")({
  head: () => ({ meta: [{ title: "Meu carrinho — Rinnovare Closet" }] }),
  component: CartPage,
});

type CartRow = { id: string; quantity: number; product: any };

function CartPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [periods, setPeriods] = useState<Record<string, number>>({});



  const { data: items = [], isLoading } = useQuery<CartRow[]>({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        await supabase.from("cart_items").delete().eq("id", id);
      } else {
        await supabase.from("cart_items").update({ quantity }).eq("id", id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart", user?.id] });
      qc.invalidateQueries({ queryKey: ["cart-count"] });
    },
  });

  const total = items.reduce((sum, r) => sum + Number(r.product?.price ?? 0) * r.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-6xl px-6 py-14 lg:px-10">
        <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Seu pedido</span>
        <h1 className="mt-3 text-4xl sm:text-5xl">Carrinho</h1>

        {isLoading ? (
          <p className="mt-16 text-center text-muted-foreground">Carregando...</p>
        ) : items.length === 0 ? (
          <div className="mt-20 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Seu carrinho está vazio.</p>
            <Link to="/" className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground">
              Explorar vitrine
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_360px]">
            <ul className="divide-y divide-border">
              {items.map((row) => (
                <li key={row.id} className="flex gap-5 py-6">
                  <Link to="/produto/$id" params={{ id: row.product.id }} className="block h-32 w-24 shrink-0 overflow-hidden bg-muted">
                    {row.product?.image_url && (
                      <img src={row.product.image_url} alt={row.product.name} className="h-full w-full object-cover" />
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link to="/produto/$id" params={{ id: row.product.id }} className="text-lg leading-tight">{row.product?.name}</Link>
                    <p className="mt-1 text-xs text-muted-foreground">Tam. {row.product?.size} · Entrega em {row.product?.delivery_days} dias</p>
                    <p className="mt-1 text-xs text-muted-foreground">{row.product?.payment_terms}</p>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center gap-3 rounded-full border border-border px-3 py-1">
                        <button onClick={() => updateQty.mutate({ id: row.id, quantity: row.quantity - 1 })}><Minus className="h-3 w-3" /></button>
                        <span className="text-sm">{row.quantity}</span>
                        <button onClick={() => updateQty.mutate({ id: row.id, quantity: row.quantity + 1 })}><Plus className="h-3 w-3" /></button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">R$ {(Number(row.product?.price ?? 0) * row.quantity).toFixed(2).replace(".", ",")}</span>
                        <button onClick={() => updateQty.mutate({ id: row.id, quantity: 0 })} className="text-muted-foreground hover:text-foreground">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <aside className="h-fit border border-border bg-muted/30 p-8">
              <h2 className="text-2xl">Resumo</h2>
              <div className="mt-6 space-y-3 border-b border-border pb-6 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>R$ {total.toFixed(2).replace(".", ",")}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>a calcular</span></div>
              </div>
              <div className="mt-6 flex justify-between text-lg">
                <span>Total</span>
                <span className="font-medium">R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Em até 12x sem juros no cartão</p>
              <button className="mt-6 w-full rounded-full bg-primary py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90">
                Finalizar aluguel
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
