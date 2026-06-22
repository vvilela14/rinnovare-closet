import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/perfil/locacoes")({
  head: () => ({ meta: [{ title: "Minhas locações — Rinnovare" }] }),
  component: MinhasLocacoes,
});

const STATUS_LABELS: Record<string, string> = {
  pending: "Reserva Pendente",
  reserved: "Reserva Efetuada",
  awaiting_payment: "Aguardando Pagamento",
  confirmed: "Locação Confirmada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  reserved: "bg-blue-100 text-blue-800",
  awaiting_payment: "bg-orange-100 text-orange-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-200 text-slate-700",
};

function MinhasLocacoes() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cancelOpen, setCancelOpen] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const { data: rentals = [] } = useQuery({
    queryKey: ["my-rentals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("rental_requests")
        .select("id, status, period_days, start_date, end_date, total_value, deposit_value, balance_value, deposit_paid_at, cancelled_at, cancellation_reason, product:products(name, image_url)")
        .eq("user_id", user!.id)
        .order("start_date", { ascending: false });
      return data ?? [];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, why }: { id: string; why: string }) => {
      const { data, error } = await (supabase as any).rpc("cancel_rental_request", { _rental_id: id, _reason: why });
      if (error) throw error;
      return data;
    },
    onSuccess: (result: any) => {
      setCancelOpen(null);
      setReason("");
      qc.invalidateQueries({ queryKey: ["my-rentals", user?.id] });
      qc.invalidateQueries({ queryKey: ["my-credit-balance", user?.id] });
      const credit = Number(result?.credit_amount ?? 0);
      if (credit > 0) {
        toast.success(`Locação cancelada. Crédito de R$ ${credit.toFixed(2).replace(".", ",")} adicionado.`);
      } else {
        toast.success("Locação cancelada.");
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao cancelar"),
  });

  const activeRental = rentals.find((r: any) => r.id === cancelOpen);

  return (
    <>
      <h1 className="text-4xl">Minhas Locações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Acompanhe o status de cada reserva e cancele se necessário.
      </p>

      <div className="mt-8 space-y-3">
        {rentals.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhuma locação ainda.</p>
        )}
        {rentals.map((r: any) => {
          const img = r.product?.image_url;
          const canCancel = r.status !== "cancelled" && r.status !== "confirmed";
          return (
            <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-white p-4">
              {img && <img src={img} alt="" className="h-20 w-16 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="font-medium">{r.product?.name}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(r.start_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })} —{" "}
                  {format(new Date(r.end_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })} · {r.period_days} dias
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Total: R$ {Number(r.total_value).toFixed(2).replace(".", ",")} · Sinal: R$ {Number(r.deposit_value ?? 0).toFixed(2).replace(".", ",")}
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-widest ${STATUS_COLORS[r.status] ?? "bg-muted"}`}>
                {STATUS_LABELS[r.status] ?? r.status}
              </span>
              {canCancel && (
                <Button variant="outline" size="sm" onClick={() => setCancelOpen(r.id)}>
                  <XCircle className="mr-2 h-4 w-4" /> Cancelar
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={!!cancelOpen} onOpenChange={(open) => { if (!open) { setCancelOpen(null); setReason(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar locação</DialogTitle>
          </DialogHeader>
          {activeRental && (
            <div className="space-y-3 text-sm">
              <p>
                Tem certeza que deseja cancelar a locação de <strong>{activeRental.product?.name}</strong>?
              </p>
              {activeRental.deposit_paid_at && (
                <p className="text-xs text-muted-foreground">
                  {(new Date(activeRental.start_date + "T00:00:00").getTime() - Date.now()) / (1000 * 60 * 60 * 24) > 7
                    ? `Você receberá um crédito de R$ ${Number(activeRental.deposit_value).toFixed(2).replace(".", ",")} para usar em futuras locações (cancelamento com mais de 7 dias de antecedência).`
                    : "Cancelamento com menos de 7 dias: o sinal não será reembolsado."}
                </p>
              )}
              <Textarea
                placeholder="Motivo (opcional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setCancelOpen(null); setReason(""); }}>Voltar</Button>
            <Button
              variant="destructive"
              onClick={() => cancelOpen && cancelMutation.mutate({ id: cancelOpen, why: reason })}
              disabled={cancelMutation.isPending}
            >
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
