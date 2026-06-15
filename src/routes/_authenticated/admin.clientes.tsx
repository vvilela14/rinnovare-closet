import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Admin Rinnovare" }] }),
  component: AdminClientes,
});

function waLink(raw?: string | null) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const full = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${full}`;
}

function AdminClientes() {
  const [search, setSearch] = useState("");

  const { data = [] } = useQuery({
    queryKey: ["admin-clientes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, whatsapp, address, favorite_colors, size, created_at")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter((p: any) =>
      [p.full_name, p.whatsapp, p.address, p.size, (p.favorite_colors ?? []).join(" ")]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(q))
    );
  }, [data, search]);

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Clientes</div>
      <h1 className="mt-2 text-4xl">Cadastros Rinnovare</h1>
      <p className="mt-1 text-sm text-muted-foreground">Clientes que criaram conta na plataforma.</p>

      <div className="mt-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, whatsapp, endereço…"
          className="pl-9"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">WhatsApp</th>
                <th className="px-5 py-3">Endereço</th>
                <th className="px-5 py-3">Tamanho</th>
                <th className="px-5 py-3">Cores favoritas</th>
                <th className="px-5 py-3">Desde</th>
                <th className="px-5 py-3 text-center">Contato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-16 text-center text-muted-foreground">
                  <Users className="mx-auto mb-3 h-6 w-6 opacity-40" />
                  Nenhuma cliente encontrada.
                </td></tr>
              )}
              {filtered.map((p: any) => {
                const wa = waLink(p.whatsapp);
                return (
                  <tr key={p.id}>
                    <td className="px-5 py-3 font-medium">{p.full_name || <span className="text-muted-foreground">(sem nome)</span>}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.whatsapp || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground max-w-xs truncate">{p.address || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{p.size || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {(p.favorite_colors ?? []).length > 0
                        ? (p.favorite_colors as string[]).join(", ")
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="px-5 py-3 text-center">
                      {wa ? (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition"
                          aria-label={`Conversar com ${p.full_name ?? "cliente"} no WhatsApp`}
                          title="Abrir WhatsApp"
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
          </table>
        </div>
      </div>
    </div>
  );
}
