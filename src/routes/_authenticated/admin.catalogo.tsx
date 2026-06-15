import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo — Admin Rinnovare" }] }),
  component: AdminCatalogo,
});

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  size: string;
  delivery_days: number;
  price: number;
  payment_terms: string;
  image_url: string | null;
  category: string | null;
  is_active: boolean;
  images: string[] | null;
  color: string | null;
  parent_product_id: string | null;
};

function AdminCatalogo() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [open, setOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery<ProductRow[]>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Vestido removido");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function startCreate() {
    setEditing(null);
    setOpen(true);
  }
  function startEdit(p: ProductRow) {
    setEditing(p);
    setOpen(true);
  }

  return (
    <div className="px-6 py-10 lg:px-12">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5" /> Administrador
            </div>
            <h1 className="mt-3 text-4xl sm:text-5xl">Catálogo</h1>
            <p className="mt-2 text-sm text-muted-foreground">Gerencie todos os vestidos da vitrine Rinnovare.</p>
          </div>
          <button onClick={startCreate} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs uppercase tracking-[0.2em] text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Novo vestido
          </button>
        </div>

        <div className="mt-10 overflow-x-auto border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Vestido</th>
                <th className="px-4 py-3">Tamanho</th>
                <th className="px-4 py-3">Entrega</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (<tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Carregando...</td></tr>)}
              {!isLoading && products.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nenhum vestido cadastrado.</td></tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url && <img src={p.image_url} alt="" className="h-12 w-10 object-cover" />}
                      <div>
                        <div>{p.name}</div>
                        {p.category && <div className="text-xs text-muted-foreground">{p.category}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{p.size}</td>
                  <td className="px-4 py-3">{p.delivery_days} dias</td>
                  <td className="px-4 py-3">R$ {Number(p.price).toFixed(2).replace(".", ",")}</td>
                  <td className="px-4 py-3">{p.payment_terms}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-widest ${p.is_active ? "bg-accent/30 text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {p.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => startEdit(p)} className="p-2 hover:text-primary"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => { if (confirm("Excluir este vestido?")) remove.mutate(p.id); }} className="p-2 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {open && <ProductFormModal initial={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ProductFormModal({ initial, onClose }: { initial: ProductRow | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    size: initial?.size ?? "M",
    delivery_days: initial?.delivery_days ?? 7,
    price: initial?.price ?? 0,
    payment_terms: initial?.payment_terms ?? "12x sem juros",
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    image_url: initial?.image_url ?? "",
    images: (initial?.images ?? []).join("\n"),
    color: initial?.color ?? "",
    parent_product_id: initial?.parent_product_id ?? "",
    is_active: initial?.is_active ?? true,
  });

  const { data: catalog = [] } = useQuery<ProductRow[]>({
    queryKey: ["admin-products-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,size,color,price,payment_terms,delivery_days,description,category,image_url,images,parent_product_id,is_active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  // Only top-level dresses (not themselves variants) can be the parent
  const parentOptions = catalog.filter((p) => !p.parent_product_id && (!initial || p.id !== initial.id));

  function linkToParent(parentId: string) {
    setForm((f) => ({ ...f, parent_product_id: parentId }));
    if (!parentId) return;
    const parent = catalog.find((p) => p.id === parentId);
    if (!parent) return;
    setForm((f) => ({
      ...f,
      parent_product_id: parentId,
      name: parent.name,
      description: parent.description ?? "",
      category: parent.category ?? "",
      price: parent.price,
      payment_terms: parent.payment_terms,
      delivery_days: parent.delivery_days,
      image_url: parent.image_url ?? "",
      images: (parent.images ?? []).join("\n"),
      // keep current color/size so admin can override
    }));
  }

  const save = useMutation({
    mutationFn: async () => {
      const imagesArr = form.images
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        name: form.name,
        size: form.size,
        delivery_days: Number(form.delivery_days),
        price: Number(form.price),
        payment_terms: form.payment_terms,
        description: form.description || null,
        category: form.category || null,
        image_url: form.image_url || null,
        images: imagesArr,
        color: form.color || null,
        parent_product_id: form.parent_product_id || null,
        is_active: form.is_active,
      };
      if (initial) {
        const { error } = await supabase.from("products").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["admin-products-options"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(initial ? "Vestido atualizado" : "Vestido adicionado");
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background p-8 shadow-[var(--shadow-elevated)]">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl">{initial ? "Editar vestido" : "Novo vestido"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Preencha os dados que serão exibidos na vitrine.</p>
          </div>
          <button onClick={onClose} className="p-2"><X className="h-4 w-4" /></button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
          className="mt-6 grid gap-4 sm:grid-cols-2"
        >
          <AdminField label="Vincular como variação de outro vestido (opcional)" className="sm:col-span-2">
            <select
              value={form.parent_product_id}
              onChange={(e) => linkToParent(e.target.value)}
              className="admin-input"
            >
              <option value="">— Não vincular (vestido independente) —</option>
              {parentOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.name} {p.color ? `· ${p.color}` : ""} · Tam. {p.size}</option>
              ))}
            </select>
            {form.parent_product_id && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Os campos foram pré-preenchidos a partir do vestido principal. Ajuste apenas a cor e/ou o tamanho desta variação.
              </p>
            )}
          </AdminField>

          <AdminField label="Nome" className="sm:col-span-2">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" />
          </AdminField>
          <AdminField label="Cor">
            <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="admin-input" placeholder="Lilás, Preto, Vinho..." />
          </AdminField>
          <AdminField label="Tamanho">
            <input required value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} className="admin-input" placeholder="PP, P, M, G, GG..." />
          </AdminField>
          <AdminField label="Previsão de entrega (dias)">
            <input type="number" min={1} required value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: Number(e.target.value) })} className="admin-input" />
          </AdminField>
          <AdminField label="Valor (R$)">
            <input type="number" step="0.01" min={0} required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="admin-input" />
          </AdminField>
          <AdminField label="Condição de pagamento">
            <input required value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} className="admin-input" placeholder="12x sem juros" />
          </AdminField>
          <AdminField label="Categoria">
            <CategorySelect
              catalog={catalog}
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
            />
          </AdminField>
          <AdminField label="Foto principal (URL)" className="sm:col-span-2">
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="admin-input" placeholder="https://..." />
          </AdminField>
          <AdminField label="Fotos adicionais (uma URL por linha)" className="sm:col-span-2">
            <textarea
              rows={4}
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
              className="admin-input"
              placeholder={"https://...foto-2.jpg\nhttps://...foto-3.jpg"}
            />
          </AdminField>
          <AdminField label="Descrição" className="sm:col-span-2">
            <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="admin-input" />
          </AdminField>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <span className="text-sm">Exibir na vitrine</span>
          </label>

          <div className="mt-2 flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-full border border-border px-5 py-2.5 text-xs uppercase tracking-widest">Cancelar</button>
            <button type="submit" disabled={save.isPending} className="rounded-full bg-primary px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50">
              {save.isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>

        <style>{`
          .admin-input { width: 100%; border: 1px solid var(--border); background: transparent; padding: 0.6rem 0.85rem; font-size: 0.875rem; border-radius: 4px; outline: none; }
          .admin-input:focus { border-color: var(--primary); }
        `}</style>
      </div>
    </div>
  );
}

function AdminField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
