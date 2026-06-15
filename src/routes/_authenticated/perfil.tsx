import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EVENT_CATEGORIES = [
  "Casamento à noite",
  "Casamento na praia",
  "Casamento no campo",
  "Festa de formatura",
  "Aniversário",
  "Outro",
];

const COLOR_PALETTE: { name: string; hex: string; border?: boolean }[] = [
  { name: "Amarelo", hex: "#FFF24D" },
  { name: "Azul", hex: "#2A1FE0" },
  { name: "Bege", hex: "#D2B48C" },
  { name: "Branco", hex: "#FFFFFF", border: true },
  { name: "Cinza", hex: "#8A8A8A" },
  { name: "Marrom", hex: "#7B3F00" },
  { name: "Multicor", hex: "conic-gradient(from 0deg, #ec4899, #3b82f6, #f59e0b, #10b981, #ec4899)" },
  { name: "Preto", hex: "#000000" },
];

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Meu perfil — Rinnovare" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, whatsapp, address, favorite_colors, size")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["profile-events", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_events")
        .select("id, title, event_date, category, product_id, products:product_id(id, name, image_url, images)")
        .eq("user_id", user!.id)
        .order("event_date", { ascending: true });
      return data ?? [];
    },
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites-for-events", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("product_id, products:product_id(id, name, image_url, images)")
        .eq("user_id", user!.id);
      return (data ?? []).filter((f: any) => f.products);
    },
  });

  const [form, setForm] = useState({
    full_name: "",
    whatsapp: "",
    address: "",
    size: "",
    favorite_colors: [] as string[],
  });
  const [colorInput, setColorInput] = useState("");

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        whatsapp: (profile as any).whatsapp ?? "",
        address: (profile as any).address ?? "",
        size: (profile as any).size ?? "",
        favorite_colors: (profile as any).favorite_colors ?? [],
      });
    }
  }, [profile]);

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

  // Events
  const [eventTitle, setEventTitle] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [eventProductId, setEventProductId] = useState<string>("");

  const addEvent = useMutation({
    mutationFn: async () => {
      if (!eventTitle.trim() || !eventDate) throw new Error("Preencha título e data");
      const { error } = await supabase.from("profile_events").insert({
        user_id: user!.id,
        title: eventTitle.trim(),
        category: eventCategory.trim() || null,
        event_date: format(eventDate, "yyyy-MM-dd"),
        product_id: eventProductId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setEventTitle("");
      setEventCategory("");
      setEventDate(undefined);
      setEventProductId("");
      qc.invalidateQueries({ queryKey: ["profile-events", user?.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("profile_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile-events", user?.id] }),
  });

  function addColor() {
    const v = colorInput.trim();
    if (!v) return;
    if (form.favorite_colors.includes(v)) return;
    setForm({ ...form, favorite_colors: [...form.favorite_colors, v] });
    setColorInput("");
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Meu perfil</div>
      <h1 className="mt-2 text-4xl">Complete seu perfil</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Quanto mais sabemos sobre você, melhores as recomendações de vestidos.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); saveProfile.mutate(); }}
        className="mt-8 grid gap-6 rounded-2xl border border-border bg-white p-6"
      >
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
            <Input id="address" placeholder="Rua, número, bairro, cidade" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="size">Tamanho <span className="text-xs text-muted-foreground">(opcional)</span></Label>
            <Input id="size" placeholder="P, M, G, 38, 40..." value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label>Cores favoritas <span className="text-xs text-muted-foreground">(opcional)</span></Label>
            <div className="flex gap-2">
              <Input placeholder="Ex.: Rosa" value={colorInput}
                onChange={(e) => setColorInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addColor(); } }} />
              <Button type="button" variant="outline" onClick={addColor}>Adicionar</Button>
            </div>
            {form.favorite_colors.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {form.favorite_colors.map((c) => (
                  <Badge key={c} variant="secondary" className="gap-1">
                    {c}
                    <button type="button"
                      onClick={() => setForm({ ...form, favorite_colors: form.favorite_colors.filter((x) => x !== c) })}
                      className="ml-1 rounded-full hover:bg-muted-foreground/20">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? "Salvando..." : "Salvar perfil"}
          </Button>
        </div>
      </form>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr,1fr]">
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-xl">Próximos eventos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Marque ocasiões para receber sugestões na medida.
          </p>

          <div className="mt-4 grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="event-title">Nome do evento</Label>
              <Input id="event-title" placeholder="Ex.: Casamento da Ana" value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-category">Categoria</Label>
              <Input id="event-category" placeholder="Ex.: Casamento, Formatura, Aniversário" value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !eventDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {eventDate ? format(eventDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={eventDate} onSelect={setEventDate}
                    initialFocus className={cn("p-3 pointer-events-auto")} locale={ptBR} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>Vestido escolhido <span className="text-xs text-muted-foreground">(opcional — dos seus favoritos)</span></Label>
              {favorites.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Você ainda não tem favoritos. Salve vestidos no catálogo para poder escolher aqui.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEventProductId("")}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      eventProductId === "" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                    )}
                  >
                    Nenhum
                  </button>
                  {favorites.map((f: any) => {
                    const p = f.products;
                    const img = p.image_url || p.images?.[0];
                    const selected = eventProductId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setEventProductId(p.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-2 py-1 text-xs transition",
                          selected ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                        )}
                        title={p.name}
                      >
                        {img && <img src={img} alt="" className="h-6 w-6 rounded-full object-cover" />}
                        <span className="max-w-[140px] truncate">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Button type="button" onClick={() => addEvent.mutate()} disabled={addEvent.isPending}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar evento
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-xl">Eventos marcados</h2>
          {events.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum evento marcado ainda.</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {events.map((ev: any) => {
                const p = ev.products;
                const img = p?.image_url || p?.images?.[0];
                return (
                  <li key={ev.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {img && <img src={img} alt="" className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{ev.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {ev.category ? <span className="mr-2 rounded-full bg-muted px-2 py-0.5">{ev.category}</span> : null}
                          {format(new Date(ev.event_date + "T00:00:00"), "PPP", { locale: ptBR })}
                        </div>
                        {p && <div className="text-xs text-muted-foreground mt-0.5 truncate">Vestido: {p.name}</div>}
                      </div>
                    </div>
                    <button onClick={() => removeEvent.mutate(ev.id)}
                      className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground flex-shrink-0"
                      aria-label="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
