import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLOR_PALETTE: { name: string; hex: string; border?: boolean }[] = [
  { name: "Amarelo", hex: "#FFF24D" },
  { name: "Azul", hex: "#2A1FE0" },
  { name: "Azul claro", hex: "#7EC8E3" },
  { name: "Azul marinho", hex: "#0B1F4D" },
  { name: "Bege", hex: "#D2B48C" },
  { name: "Branco", hex: "#FFFFFF", border: true },
  { name: "Cinza", hex: "#8A8A8A" },
  { name: "Dourado", hex: "#D4AF37" },
  { name: "Laranja", hex: "#F97316" },
  { name: "Lilás", hex: "#C8A2C8" },
  { name: "Marrom", hex: "#7B3F00" },
  { name: "Multicor", hex: "conic-gradient(from 0deg, #ec4899, #3b82f6, #f59e0b, #10b981, #ec4899)" },
  { name: "Nude", hex: "#E6BFA5" },
  { name: "Off white", hex: "#F5F1E6", border: true },
  { name: "Prata", hex: "#C0C0C0" },
  { name: "Preto", hex: "#000000" },
  { name: "Rosa", hex: "#F4A6C0" },
  { name: "Rosa choque", hex: "#E91E63" },
  { name: "Roxo", hex: "#6B21A8" },
  { name: "Verde", hex: "#16A34A" },
  { name: "Verde esmeralda", hex: "#047857" },
  { name: "Verde menta", hex: "#A8E6CF" },
  { name: "Vermelho", hex: "#DC2626" },
  { name: "Vinho", hex: "#7B1E2B" },
];

const SIZE_OPTIONS = ["34-36", "36-38", "38-40", "40-42", "42-44", "44-46", "46-48"];

export const Route = createFileRoute("/_authenticated/perfil/")({
  head: () => ({ meta: [{ title: "Dados cadastrais — Rinnovare" }] }),
  component: DadosCadastraisPage,
});

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function DadosCadastraisPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, whatsapp, address, address_number, address_complement, postal_code, favorite_colors, size, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState({
    full_name: "",
    whatsapp: "",
    address: "",
    address_number: "",
    address_complement: "",
    postal_code: "",
    size: "",
    favorite_colors: [] as string[],
    avatar_url: "" as string | null,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        whatsapp: (profile as any).whatsapp ?? "",
        address: (profile as any).address ?? "",
        address_number: (profile as any).address_number ?? "",
        address_complement: (profile as any).address_complement ?? "",
        postal_code: (profile as any).postal_code ?? "",
        size: (profile as any).size ?? "",
        favorite_colors: (profile as any).favorite_colors ?? [],
        avatar_url: (profile as any).avatar_url ?? "",
      });
    }
  }, [profile]);

  // Generate a signed URL for the avatar (private bucket)
  useEffect(() => {
    let active = true;
    async function loadAvatar() {
      if (!form.avatar_url) { setAvatarPreview(null); return; }
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(form.avatar_url, 60 * 60);
      if (!active) return;
      if (error) { setAvatarPreview(null); return; }
      setAvatarPreview(data.signedUrl);
    }
    loadAvatar();
    return () => { active = false; };
  }, [form.avatar_url]);

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user!.id, ...form });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado!");
      qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao salvar"),
  });

  function toggleColor(name: string) {
    setForm((f) => ({
      ...f,
      favorite_colors: f.favorite_colors.includes(name)
        ? f.favorite_colors.filter((x) => x !== name)
        : [...f.favorite_colors, name],
    }));
  }

  async function handleAvatarFile(file: File) {
    if (!user) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx. 5MB).");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      // Remove old file if any
      if (form.avatar_url && form.avatar_url !== path) {
        await supabase.storage.from("avatars").remove([form.avatar_url]);
      }

      const { error: dbErr } = await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_url: path });
      if (dbErr) throw dbErr;

      setForm((f) => ({ ...f, avatar_url: path }));
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Foto de perfil atualizada!");
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveAvatar() {
    if (!user || !form.avatar_url) return;
    setUploading(true);
    try {
      await supabase.storage.from("avatars").remove([form.avatar_url]);
      const { error } = await supabase.from("profiles").upsert({ id: user.id, avatar_url: null });
      if (error) throw error;
      setForm((f) => ({ ...f, avatar_url: "" }));
      setAvatarPreview(null);
      qc.invalidateQueries({ queryKey: ["profile", user.id] });
      toast.success("Foto removida.");
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao remover");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <h1 className="text-4xl">Dados Cadastrais</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Quanto mais sabemos sobre você, melhores as recomendações de vestidos.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); saveProfile.mutate(); }}
        className="mt-8 grid gap-6 rounded-2xl border border-border bg-white p-6"
      >
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 border border-border">
              {avatarPreview && <AvatarImage src={avatarPreview} alt="Foto de perfil" />}
              <AvatarFallback className="text-xl">
                {initials(form.full_name || user?.email || "?")}
              </AvatarFallback>
            </Avatar>
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label>Foto de perfil</Label>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarFile(f);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                {form.avatar_url ? "Trocar foto" : "Carregar foto"}
              </Button>
              {form.avatar_url && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={uploading}
                  onClick={handleRemoveAvatar}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Remover
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">PNG ou JPG até 5MB.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input id="full_name" value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" placeholder="(11) 99999-9999" value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" placeholder="Rua" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address_number">Número</Label>
            <Input id="address_number" inputMode="numeric" pattern="[0-9]*" placeholder="Ex.: 123" value={form.address_number}
              onChange={(e) => setForm({ ...form, address_number: e.target.value.replace(/\D/g, "") })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address_complement">Complemento</Label>
            <Input id="address_complement" placeholder="Apto, bloco, referência" value={form.address_complement}
              onChange={(e) => setForm({ ...form, address_complement: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="postal_code">CEP</Label>
            <Input id="postal_code" inputMode="numeric" pattern="[0-9]*" maxLength={8} placeholder="00000000" value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value.replace(/\D/g, "").slice(0, 8) })} />
          </div>
          <div className="grid gap-2">
            <Label>Tamanho <span className="text-xs text-muted-foreground">(opcional)</span></Label>
            <Select value={form.size} onValueChange={(v) => setForm({ ...form, size: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione o tamanho" /></SelectTrigger>
              <SelectContent>
                {SIZE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label>Cores favoritas <span className="text-xs text-muted-foreground">(opcional — clique para selecionar)</span></Label>
            <div className="flex flex-wrap gap-4 pt-1">
              {COLOR_PALETTE.map((c) => {
                const selected = form.favorite_colors.includes(c.name);
                const isGradient = c.hex.startsWith("conic") || c.hex.startsWith("linear");
                return (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => toggleColor(c.name)}
                    className="flex flex-col items-center gap-1 group"
                    aria-pressed={selected}
                  >
                    <span
                      className={cn(
                        "h-10 w-10 rounded-full border-2 transition",
                        selected ? "border-primary ring-2 ring-primary/30" : "border-border group-hover:border-foreground/40",
                        c.border && !selected && "border-border"
                      )}
                      style={isGradient ? { backgroundImage: c.hex } : { backgroundColor: c.hex }}
                    />
                    <span className={cn("text-xs", selected ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? "Salvando..." : "Salvar perfil"}
          </Button>
        </div>
      </form>
    </>
  );
}
