import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, LayoutGrid, Upload, Star, StarOff } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/catalogo")({
  head: () => ({ meta: [{ title: "Catálogo — Admin Rinnovare" }] }),
  component: AdminCatalogo,
});

const SIZE_OPTIONS = ["34-36", "36-38", "38-40", "40-42", "42-44", "44-46", "46-48"];
const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6];
const MAX_PHOTOS = 6;

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
  price_4_days: number | null;
  price_7_days: number | null;
  price_12_days: number | null;
  installments: number | null;
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
                <th className="px-4 py-3">Valores</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (<tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Carregando...</td></tr>)}
              {!isLoading && products.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">Nenhum vestido cadastrado.</td></tr>
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
                  <td className="px-4 py-3 text-xs">
                    <div>4d: {fmtBRL(p.price_4_days)}</div>
                    <div>7d: {fmtBRL(p.price_7_days)}</div>
                    <div>12d: {fmtBRL(p.price_12_days)}</div>
                  </td>
                  <td className="px-4 py-3">{p.installments ? `${p.installments}x` : p.payment_terms}</td>
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

function fmtBRL(v: number | null | undefined) {
  if (v == null) return "—";
  return `R$ ${Number(v).toFixed(2).replace(".", ",")}`;
}

function ProductFormModal({ initial, onClose }: { initial: ProductRow | null; onClose: () => void }) {
  const qc = useQueryClient();

  // Build initial photo list: main first, then additional
  const initialPhotos: string[] = (() => {
    const list: string[] = [];
    if (initial?.image_url) list.push(initial.image_url);
    (initial?.images ?? []).forEach((u) => { if (u && !list.includes(u)) list.push(u); });
    return list.slice(0, MAX_PHOTOS);
  })();

  const [form, setForm] = useState({
    name: initial?.name ?? "",
    size: initial?.size && SIZE_OPTIONS.includes(initial.size) ? initial.size : "",
    price_4_days: initial?.price_4_days ?? ("" as number | ""),
    price_7_days: initial?.price_7_days ?? ("" as number | ""),
    price_12_days: initial?.price_12_days ?? ("" as number | ""),
    installments: initial?.installments ?? 1,
    description: initial?.description ?? "",
    category: initial?.category ?? "",
    color: initial?.color ?? "",
    parent_product_id: initial?.parent_product_id ?? "",
    is_active: initial?.is_active ?? true,
  });

  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [mainIndex, setMainIndex] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const { data: catalog = [] } = useQuery<ProductRow[]>({
    queryKey: ["admin-products-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProductRow[];
    },
  });

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
      price_4_days: parent.price_4_days ?? "",
      price_7_days: parent.price_7_days ?? "",
      price_12_days: parent.price_12_days ?? "",
      installments: parent.installments ?? 1,
    }));
    const parentPhotos: string[] = [];
    if (parent.image_url) parentPhotos.push(parent.image_url);
    (parent.images ?? []).forEach((u) => { if (u && !parentPhotos.includes(u)) parentPhotos.push(u); });
    setPhotos(parentPhotos.slice(0, MAX_PHOTOS));
    setMainIndex(0);
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast.error(`Máximo de ${MAX_PHOTOS} fotos.`);
      return;
    }
    const toUpload = arr.slice(0, remaining);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("products").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: signed, error: sErr } = await supabase.storage
          .from("products")
          .createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years
        if (sErr) throw sErr;
        uploaded.push(signed.signedUrl);
      }
      setPhotos((prev) => [...prev, ...uploaded].slice(0, MAX_PHOTOS));
      if (arr.length > remaining) toast.warning(`Apenas ${remaining} foto(s) adicionadas (limite ${MAX_PHOTOS}).`);
    } catch (e: any) {
      toast.error("Erro ao enviar imagem: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    if (mainIndex === idx) setMainIndex(0);
    else if (idx < mainIndex) setMainIndex((m) => m - 1);
  }

  const save = useMutation({
    mutationFn: async () => {
      if (!photos.length) throw new Error("Adicione ao menos uma foto.");
      if (!form.size) throw new Error("Selecione o tamanho.");
      if (form.price_4_days === "" && form.price_7_days === "" && form.price_12_days === "") {
        throw new Error("Informe ao menos um valor de aluguel.");
      }
      const mainUrl = photos[mainIndex] ?? photos[0];
      const additional = photos.filter((_, i) => i !== mainIndex);

      const p4 = form.price_4_days === "" ? null : Number(form.price_4_days);
      const p7 = form.price_7_days === "" ? null : Number(form.price_7_days);
      const p12 = form.price_12_days === "" ? null : Number(form.price_12_days);
      const defaultPrice = p7 ?? p4 ?? p12 ?? 0;
      const defaultDays = p7 != null ? 7 : p4 != null ? 4 : 12;

      const payload = {
        name: form.name,
        size: form.size,
        delivery_days: defaultDays,
        price: defaultPrice,
        payment_terms: `${form.installments}x sem juros`,
        installments: Number(form.installments),
        price_4_days: p4,
        price_7_days: p7,
        price_12_days: p12,
        description: form.description || null,
        category: form.category || null,
        image_url: mainUrl,
        images: additional,
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
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-background p-8 shadow-[var(--shadow-elevated)]">
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
          </AdminField>

          <AdminField label="Nome" className="sm:col-span-2">
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="admin-input" />
          </AdminField>
          <AdminField label="Cor">
            <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="admin-input" placeholder="Lilás, Preto, Vinho..." />
          </AdminField>
          <AdminField label="Tamanho">
            <select
              required
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              className="admin-input"
            >
              <option value="">— Selecione —</option>
              {SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </AdminField>

          <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <PriceField
              label="Valor 4 dias (R$)"
              value={form.price_4_days}
              onChange={(v) => setForm({ ...form, price_4_days: v })}
            />
            <PriceField
              label="Valor 7 dias (R$)"
              value={form.price_7_days}
              onChange={(v) => setForm({ ...form, price_7_days: v })}
            />
            <PriceField
              label="Valor 12 dias (R$)"
              value={form.price_12_days}
              onChange={(v) => setForm({ ...form, price_12_days: v })}
            />
          </div>

          <AdminField label="Condição de pagamento">
            <select
              required
              value={form.installments}
              onChange={(e) => setForm({ ...form, installments: Number(e.target.value) })}
              className="admin-input"
            >
              {INSTALLMENT_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}x</option>
              ))}
            </select>
          </AdminField>
          <AdminField label="Categoria">
            <CategorySelect
              catalog={catalog}
              value={form.category}
              onChange={(v) => setForm({ ...form, category: v })}
            />
          </AdminField>

          <AdminField label={`Fotos (até ${MAX_PHOTOS}) — clique na estrela para definir como principal`} className="sm:col-span-2">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed rounded-md p-6 text-center transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"} ${photos.length >= MAX_PHOTOS ? "opacity-50 pointer-events-none" : ""}`}
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              <div className="text-sm">
                {uploading ? "Enviando..." : photos.length >= MAX_PHOTOS ? "Limite atingido" : "Arraste imagens ou clique para selecionar"}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {photos.length}/{MAX_PHOTOS} foto(s)
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => { if (e.target.files) handleFiles(e.target.files); e.currentTarget.value = ""; }}
              />
            </div>

            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
                {photos.map((url, i) => (
                  <div key={url + i} className={`relative aspect-[3/4] overflow-hidden rounded border ${i === mainIndex ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setMainIndex(i)}
                      title={i === mainIndex ? "Foto principal" : "Definir como principal"}
                      className="absolute top-1 left-1 rounded-full bg-background/80 p-1 hover:bg-background"
                    >
                      {i === mainIndex ? <Star className="h-3 w-3 fill-primary text-primary" /> : <StarOff className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      title="Remover"
                      className="absolute top-1 right-1 rounded-full bg-background/80 p-1 hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    {i === mainIndex && (
                      <span className="absolute bottom-1 left-1 right-1 text-center text-[9px] uppercase tracking-widest bg-primary text-primary-foreground rounded py-0.5">
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
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
            <button type="submit" disabled={save.isPending || uploading} className="rounded-full bg-primary px-6 py-2.5 text-xs uppercase tracking-[0.2em] text-primary-foreground disabled:opacity-50">
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

function PriceField({ label, value, onChange }: { label: string; value: number | ""; onChange: (v: number | "") => void }) {
  return (
    <AdminField label={label}>
      <input
        type="number"
        step="0.01"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="admin-input"
        placeholder="0,00"
      />
    </AdminField>
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

function CategorySelect({
  catalog,
  value,
  onChange,
}: {
  catalog: ProductRow[];
  value: string;
  onChange: (v: string) => void;
}) {
  const options = Array.from(
    new Set(catalog.map((p) => (p.category ?? "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  const isNew = value !== "" && !options.includes(value);
  const [mode, setMode] = useState<"select" | "new">(isNew ? "new" : "select");

  if (mode === "new") {
    return (
      <div className="flex gap-2">
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="admin-input"
          placeholder="Nome da nova categoria"
        />
        <button
          type="button"
          onClick={() => { onChange(""); setMode("select"); }}
          className="rounded-full border border-border px-3 text-[11px] uppercase tracking-widest hover:bg-muted"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <select
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "__new__") { onChange(""); setMode("new"); return; }
        onChange(v);
      }}
      className="admin-input"
    >
      <option value="">— Selecione uma categoria —</option>
      {options.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
      <option value="__new__">+ Criar nova categoria…</option>
    </select>
  );
}
