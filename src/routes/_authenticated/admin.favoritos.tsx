import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/favoritos")({
  head: () => ({ meta: [{ title: "Favoritos — Admin Rinnovare" }] }),
  component: AdminFavoritos,
});

function AdminFavoritos() {
  const { data = [] } = useQuery({
    queryKey: ["admin-favorites"],
    queryFn: async () => {
      const { data: favs } = await supabase
        .from("favorites")
        .select("id, user_id, product_id, created_at, products(name, size, price, image_url, color)")
        .order("created_at", { ascending: false });
      const rows = favs ?? [];

      const userIds = Array.from(new Set(rows.map((r: any) => r.user_id)));
      let profiles: Record<string, string | null> = {};
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        profiles = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p.full_name]));
      }
      return rows.map((r: any) => ({ ...r, full_name: profiles[r.user_id] ?? null }));
    },
  });

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Favoritos</div>
      <h1 className="mt-2 text-4xl">Vestidos salvos pelas clientes</h1>
      <p className="mt-1 text-sm text-muted-foreground">Peças que as clientes adicionaram aos favoritos.</p>

      <div className="mt-8 rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Vestido</th>
                <th className="px-5 py-3">Tamanho</th>
                <th className="px-5 py-3">Valor</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Salvo em</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-16 text-center text-muted-foreground">
                  <Heart className="mx-auto mb-3 h-6 w-6 opacity-40" />
                  Nenhum favorito salvo ainda.
                </td></tr>
              )}
              {data.map((row: any) => (
                <tr key={row.id}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {row.products?.image_url && <img src={row.products.image_url} alt="" className="h-10 w-8 rounded object-cover" />}
                      <div>
                        <div>{row.products?.name ?? "—"}</div>
                        {row.products?.color && <div className="text-xs text-muted-foreground">{row.products.color}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">{row.products?.size ?? "—"}</td>
                  <td className="px-5 py-3">R$ {Number(row.products?.price ?? 0).toFixed(2).replace(".", ",")}</td>
                  <td className="px-5 py-3">{row.full_name || <span className="font-mono text-xs text-muted-foreground">{String(row.user_id).slice(0, 8)}…</span>}</td>
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
