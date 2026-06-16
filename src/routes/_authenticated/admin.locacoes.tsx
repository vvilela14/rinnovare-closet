import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/locacoes")({
  head: () => ({ meta: [{ title: "Locações — Admin Rinnovare" }] }),
  component: AdminLocacoes,
});

type Row = {
  id: string;
  user_id: string;
  product_id: string;
  size: string | null;
  payment_terms: string | null;
  period_days: number;
  start_date: string;
  end_date: string;
  total_value: number;
  status: string;
  product?: { name: string } | null;
  profile?: { full_name: string | null } | null;
};

function AdminLocacoes() {
  const qc = useQueryClient();

  const { data: rows = [], isLoading } = useQuery<Row[]>({
    queryKey: ["admin-rentals"],
    queryFn: async () => {
      const { data: list } = await supabase
        .from("rental_requests")
        .select("id, user_id, product_id, size, payment_terms, period_days, start_date, end_date, total_value, status, created_at, product:products(name)")
        .order("created_at", { ascending: false });
      const arr = (list ?? []) as any[];
      const ids = Array.from(new Set(arr.map((r) => r.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        arr.forEach((r) => { r.profile = map.get(r.user_id) ?? null; });
      }
      return arr as Row[];
    },
  });

  const confirmRental = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rental_requests").update({ status: "confirmed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Locação confirmada!");
      qc.invalidateQueries({ queryKey: ["admin-rentals"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-rentals"] });
      qc.invalidateQueries({ queryKey: ["admin-pending-rentals-fallback"] });
      qc.invalidateQueries({ queryKey: ["admin-calendar-events"] });
      qc.invalidateQueries({ queryKey: ["admin-calendar-rentals"] });
      qc.invalidateQueries({ queryKey: ["confirmed-rentals"] });
    },
    onError: () => toast.error("Não foi possível confirmar a locação."),
  });

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Locações</div>
      <h1 className="mt-2 text-4xl">Solicitações das clientes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Acompanhe e confirme as locações solicitadas. Locações confirmadas aparecem no calendário.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vestido</th>
                <th className="px-4 py-3">Tamanho</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Data de locação</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Carregando...</td></tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">Nenhuma locação solicitada.</td></tr>
              )}
              {rows.map((r) => {
                const isConfirmed = r.status === "confirmed";
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.profile?.full_name ?? "Cliente"}</td>
                    <td className="px-4 py-3">{r.product?.name ?? "—"}</td>
                    <td className="px-4 py-3">{r.size ?? "—"}</td>
                    <td className="px-4 py-3">{r.payment_terms ?? "—"}</td>
                    <td className="px-4 py-3">{r.period_days} dias</td>
                    <td className="px-4 py-3">
                      {format(new Date(r.start_date + "T00:00:00"), "dd/MM", { locale: ptBR })} -{" "}
                      {format(new Date(r.end_date + "T00:00:00"), "dd/MM", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">R$ {Number(r.total_value).toFixed(2).replace(".", ",")}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => !isConfirmed && confirmRental.mutate(r.id)}
                        disabled={isConfirmed || confirmRental.isPending}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] uppercase tracking-widest text-white transition ${
                          isConfirmed
                            ? "bg-[#260d58] cursor-default"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {isConfirmed ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                        {isConfirmed ? "Locação confirmada" : "Aguardando Confirmação"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
