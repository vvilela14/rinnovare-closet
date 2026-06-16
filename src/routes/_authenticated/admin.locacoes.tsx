import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Check, Clock, Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
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
  profile?: { full_name: string | null; whatsapp: string | null } | null;
  event_date?: string | null;
};

function waLink(raw?: string | null) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}`;
}

function AdminLocacoes() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

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
        const [{ data: profs }, { data: events }] = await Promise.all([
          supabase.from("profiles").select("id, full_name, whatsapp").in("id", ids),
          supabase.from("profile_events").select("user_id, product_id, event_date").in("user_id", ids),
        ]);
        const pMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
        const eMap = new Map<string, string>();
        (events ?? []).forEach((e: any) => {
          if (e.product_id) eMap.set(`${e.user_id}:${e.product_id}`, e.event_date);
        });
        arr.forEach((r) => {
          r.profile = pMap.get(r.user_id) ?? null;
          r.event_date = eMap.get(`${r.user_id}:${r.product_id}`) ?? null;
        });
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => (r.profile?.full_name ?? "").toLowerCase().includes(q));
  }, [rows, search]);

  const total = useMemo(
    () => filtered.reduce((acc, r) => acc + Number(r.total_value || 0), 0),
    [filtered]
  );

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Locações</div>
      <h1 className="mt-2 text-4xl">Solicitações das clientes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Acompanhe e confirme as locações solicitadas. Locações confirmadas aparecem no calendário.
      </p>

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome da cliente…"
          className="pl-9"
        />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vestido</th>
                <th className="px-4 py-3">Tamanho</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Período</th>
                <th className="px-4 py-3">Data do Evento</th>
                <th className="px-4 py-3">Data de Locação</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-center">Contato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">Carregando...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-muted-foreground">Nenhuma locação encontrada.</td></tr>
              )}
              {filtered.map((r) => {
                const isConfirmed = r.status === "confirmed";
                const wa = waLink(r.profile?.whatsapp);
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-3">{r.profile?.full_name ?? "Cliente"}</td>
                    <td className="px-4 py-3">{r.product?.name ?? "—"}</td>
                    <td className="px-4 py-3">{r.size ?? "—"}</td>
                    <td className="px-4 py-3">{r.payment_terms ?? "—"}</td>
                    <td className="px-4 py-3">{r.period_days} dias</td>
                    <td className="px-4 py-3">
                      {r.event_date
                        ? format(new Date(r.event_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })
                        : "—"}
                    </td>
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
                    <td className="px-4 py-3 text-center">
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition"
                          aria-label="Abrir WhatsApp"
                          title="Enviar mensagem via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {filtered.length > 0 && (
              <tfoot className="bg-muted/30 text-sm font-medium">
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-right uppercase tracking-widest text-[11px] text-muted-foreground">
                    Total ({filtered.length} {filtered.length === 1 ? "locação" : "locações"})
                  </td>
                  <td className="px-4 py-3">R$ {total.toFixed(2).replace(".", ",")}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
