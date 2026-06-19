import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/site/Header";
import { Trash2, Minus, Plus, ShoppingBag, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { addDays, fmtISODate, parseISODate } from "@/lib/catalog-constants";

export const Route = createFileRoute("/_authenticated/carrinho")({
  head: () => ({ meta: [{ title: "Meu carrinho — Rinnovare Closet" }] }),
  component: CartPage,
});

type CartRow = { id: string; quantity: number; start_date: string | null; period_days: number | null; product: any };


function CartPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: items = [], isLoading } = useQuery<CartRow[]>({
    queryKey: ["cart", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, start_date, period_days, product:products(*)")
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

  const submitRental = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const today = new Date();
      const rows = items.map((r) => {
        const periodDays = r.period_days ?? 4;
        const start = r.start_date ? parseISODate(r.start_date) : addDays(today, 3);
        const end = addDays(start, periodDays - 1);
        return {
          user_id: user.id,
          product_id: r.product.id,
          size: r.product.size,
          payment_terms: r.product.payment_terms,
          period_days: periodDays,
          start_date: fmtISODate(start),
          end_date: fmtISODate(end),
          total_value: Number(r.product.price) * r.quantity,
          status: "pending",
        };
      });
      const { error } = await supabase.from("rental_requests").insert(rows);
      if (error) throw error;
      await supabase.from("cart_items").delete().eq("user_id", user.id);
    },
    onSuccess: () => {
      toast.success("Solicitação enviada! Aguarde a confirmação.");
      qc.invalidateQueries({ queryKey: ["cart", user?.id] });
      qc.invalidateQueries({ queryKey: ["cart-count"] });
      qc.invalidateQueries({ queryKey: ["confirmed-rentals"] });
      navigate({ to: "/perfil" });
    },
    onError: () => toast.error("Não foi possível enviar a solicitação."),
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
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <label className="text-xs text-muted-foreground">Período:</label>
                      <select
                        value={periods[row.id] ?? 4}
                        onChange={(e) => setPeriods((p) => ({ ...p, [row.id]: Number(e.target.value) }))}
                        className="rounded-full border border-border bg-transparent px-3 py-1 text-xs"
                      >
                        {RENTAL_PERIODS.map((d) => (
                          <option key={d} value={d}>{d} dias</option>
                        ))}
                      </select>
                      <label className="text-xs text-muted-foreground">Início:</label>
                      <input
                        type="date"
                        value={startDates[row.id] ?? ""}
                        min={fmtISODate(new Date())}
                        onChange={(e) => setStartDates((p) => ({ ...p, [row.id]: e.target.value }))}
                        className="rounded-full border border-border bg-transparent px-3 py-1 text-xs"
                      />
                    </div>
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
                <div className="flex justify-between"><span className="text-muted-foreground">Frete</span><span>R$ 36,90</span></div>
              </div>
              <div className="mt-6 flex justify-between text-lg">
                <span>Total</span>
                <span className="font-medium">R$ {(total + 36.9).toFixed(2).replace(".", ",")}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Em até 12x sem juros no cartão</p>
              <button
                onClick={() => submitRental.mutate()}
                disabled={submitRental.isPending}
                className="mt-6 w-full rounded-full bg-primary py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {submitRental.isPending ? "Enviando..." : "Solicitar Aluguel"}
              </button>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
