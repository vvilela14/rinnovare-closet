import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

const EVENT_CATEGORIES = [
  "Casamento à noite",
  "Casamento na praia",
  "Casamento no campo",
  "Festa de formatura",
  "Aniversário",
  "Outro",
];

export const Route = createFileRoute("/_authenticated/perfil/eventos")({
  head: () => ({ meta: [{ title: "Meus eventos — Rinnovare" }] }),
  component: EventosPage,
});

type EventFormValues = {
  title: string;
  category: string;
  date: Date | undefined;
  productId: string;
};

type EventFormProps = {
  values: EventFormValues;
  onChange: (v: EventFormValues) => void;
  favorites: any[];
  onSubmit: () => void;
  submitting: boolean;
  submitLabel: string;
  submitIcon: React.ReactNode;
  showCalendar?: boolean;
};

function EventForm({ values, onChange, favorites, onSubmit, submitting, submitLabel, submitIcon, showCalendar }: EventFormProps) {
  const customCategoryOpen = !!values.category && !EVENT_CATEGORIES.includes(values.category);
  const set = (patch: Partial<EventFormValues>) => onChange({ ...values, ...patch });

  return (
    <div className="grid gap-2.5">
      {showCalendar ? (
        <div className="grid gap-1">
          <Label className="text-xs">Data do evento</Label>
          <div className="rounded-lg border border-border">
            <Calendar
              mode="single"
              selected={values.date}
              onSelect={(d) => set({ date: d })}
              locale={ptBR}
              className="p-2 pointer-events-auto"
            />
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {values.date
            ? `Data selecionada: ${format(values.date, "PPP", { locale: ptBR })}`
            : "Selecione uma data no calendário."}
        </p>
      )}

      <div className="grid gap-1">
        <Label htmlFor="event-title" className="text-xs">Nome do evento</Label>
        <Input id="event-title" className="h-8 text-sm" placeholder="Ex.: Casamento da Ana" value={values.title}
          onChange={(e) => set({ title: e.target.value })} />
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Categoria</Label>
        <Select
          value={customCategoryOpen ? "Outro" : (EVENT_CATEGORIES.includes(values.category) ? values.category : "")}
          onValueChange={(v) => {
            if (v === "Outro") set({ category: " " });
            else set({ category: v });
          }}
        >
          <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {EVENT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {customCategoryOpen && (
          <Input
            className="h-8 text-sm"
            placeholder="Descreva a categoria"
            value={values.category.trim()}
            onChange={(e) => set({ category: e.target.value || " " })}
          />
        )}
      </div>

      <div className="grid gap-1">
        <Label className="text-xs">Vestido escolhido <span className="text-[10px] text-muted-foreground">(opcional)</span></Label>
        {favorites.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">Você ainda não tem favoritos.</p>
        ) : (
          <Carousel opts={{ align: "start", dragFree: true }} className="relative">
            <div className="mb-1 flex justify-end gap-1">
              <CarouselPrevious type="button" className="static translate-x-0 translate-y-0 h-6 w-6" />
              <CarouselNext type="button" className="static translate-x-0 translate-y-0 h-6 w-6" />
            </div>
            <CarouselContent className="-ml-2">
              <CarouselItem className="pl-2 basis-auto">
                <button
                  type="button"
                  onClick={() => set({ productId: "" })}
                  className={cn(
                    "flex h-[80px] w-[68px] items-center justify-center rounded-xl border text-[11px] transition",
                    values.productId === "" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"
                  )}
                >
                  Nenhum
                </button>
              </CarouselItem>
              {favorites.map((f: any) => {
                const p = f.products;
                const img = p.image_url || p.images?.[0];
                const selected = values.productId === p.id;
                return (
                  <CarouselItem key={p.id} className="pl-2 basis-auto">
                    <button
                      type="button"
                      onClick={() => set({ productId: p.id })}
                      className="group flex w-[68px] flex-col gap-1 text-left transition"
                      title={p.name}
                    >
                      <div className={cn(
                        "relative h-[68px] w-[68px] overflow-hidden rounded-xl border",
                        selected ? "border-primary ring-2 ring-primary/40" : "border-border group-hover:border-foreground/40"
                      )}>
                        {img ? (
                          <img src={img} alt={p.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] text-muted-foreground px-1 text-center">
                            {p.name}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-medium truncate">{p.name}</span>
                    </button>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        )}
      </div>
      <Button type="button" size="sm" onClick={onSubmit} disabled={submitting}>
        {submitIcon}
        {submitLabel}
      </Button>
    </div>
  );
}

const emptyForm: EventFormValues = { title: "", category: "", date: undefined, productId: "" };

function EventosPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

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

  const [createForm, setCreateForm] = useState<EventFormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EventFormValues>(emptyForm);

  const startEdit = (ev: any) => {
    setEditingId(ev.id);
    setEditForm({
      title: ev.title ?? "",
      category: ev.category ?? "",
      date: new Date(ev.event_date + "T00:00:00"),
      productId: ev.product_id ?? "",
    });
  };

  const addEvent = useMutation({
    mutationFn: async () => {
      if (!createForm.title.trim() || !createForm.date) throw new Error("Preencha título e data");
      const { error } = await supabase.from("profile_events").insert({
        user_id: user!.id,
        title: createForm.title.trim(),
        category: createForm.category.trim() || null,
        event_date: format(createForm.date, "yyyy-MM-dd"),
        product_id: createForm.productId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setCreateForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["profile-events", user?.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateEvent = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error("Sem evento selecionado");
      if (!editForm.title.trim() || !editForm.date) throw new Error("Preencha título e data");
      const { error } = await supabase.from("profile_events").update({
        title: editForm.title.trim(),
        category: editForm.category.trim() || null,
        event_date: format(editForm.date, "yyyy-MM-dd"),
        product_id: editForm.productId || null,
      }).eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["profile-events", user?.id] });
      toast.success("Evento atualizado");
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

  const eventDates = events.map((e: any) => new Date(e.event_date + "T00:00:00"));
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const selectedDayEvents = events.filter((e: any) => {
    const d = new Date(e.event_date + "T00:00:00");
    return (
      d.getFullYear() === calendarMonth.getFullYear() &&
      d.getMonth() === calendarMonth.getMonth()
    );
  });

  return (
    <>
      <h1 className="text-4xl">Meus Eventos</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Marque ocasiões para receber sugestões na medida.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_380px] md:items-stretch">
        <div className="rounded-2xl border border-border bg-white p-6">
          <h2 className="text-xl">Calendário</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Clique em uma data para selecioná-la. Datas destacadas indicam um evento.
          </p>
          <div className="mt-4 overflow-x-auto">
            <Calendar
              mode="single"
              numberOfMonths={2}
              selected={createForm.date}
              onSelect={(d) => setCreateForm((f) => ({ ...f, date: d }))}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              modifiers={{ hasEvent: eventDates }}
              modifiersClassNames={{ hasEvent: "bg-primary/10 text-primary rounded-full font-semibold" }}
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </div>
          {selectedDayEvents.length > 0 && (
            <ul className="mt-4 space-y-2">
              {selectedDayEvents.map((ev: any) => (
                <li key={ev.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {format(new Date(ev.event_date + "T00:00:00"), "dd/MM", { locale: ptBR })}
                  </span>
                  <span className="truncate">{ev.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex h-full flex-col rounded-2xl border border-border bg-white p-4">
          <h2 className="text-lg">Cadastrar evento</h2>
          <div className="mt-3">
            <EventForm
              values={createForm}
              onChange={setCreateForm}
              favorites={favorites}
              onSubmit={() => addEvent.mutate()}
              submitting={addEvent.isPending}
              submitLabel="Adicionar evento"
              submitIcon={<Plus className="mr-2 h-4 w-4" />}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white p-6">
        <h2 className="text-xl">Próximos eventos</h2>
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(ev)}
                      className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => removeEvent.mutate(ev.id)}
                      className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!editingId} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Cadastrar evento</DialogTitle>
          </DialogHeader>
          <EventForm
            values={editForm}
            onChange={setEditForm}
            favorites={favorites}
            onSubmit={() => updateEvent.mutate()}
            submitting={updateEvent.isPending}
            submitLabel="Salvar alterações"
            showCalendar
            submitIcon={<Pencil className="mr-2 h-4 w-4" />}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
