import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Admin Rinnovare" }] }),
  component: AdminClientes,
});

function AdminClientes() {
  const { data = [] } = useQuery({
    queryKey: ["admin-clientes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Clientes</div>
      <h1 className="mt-2 text-4xl">Cadastros Rinnovare</h1>
      <p className="mt-1 text-sm text-muted-foreground">Clientes que criaram conta na plataforma.</p>

      <div className="mt-8 rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Desde</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 && (
                <tr><td colSpan={3} className="px-5 py-16 text-center text-muted-foreground">
                  <Users className="mx-auto mb-3 h-6 w-6 opacity-40" />
                  Nenhuma cliente cadastrada ainda.
                </td></tr>
              )}
              {data.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-5 py-3">{p.full_name || <span className="text-muted-foreground">(sem nome)</span>}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{String(p.id).slice(0, 12)}…</td>
                  <td className="px-5 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
