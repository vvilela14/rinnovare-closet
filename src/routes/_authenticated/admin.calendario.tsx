import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/calendario")({
  head: () => ({ meta: [{ title: "Calendário — Admin Rinnovare" }] }),
  component: AdminCalendario,
});

type EventRow = {
  id: string;
  title: string;
  event_date: string;
  category: string | null;
  user_id: string;
  profile?: { full_name: string | null; whatsapp: string | null } | null;
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function AdminCalendario() {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));

  const { data: events = [] } = useQuery({
    queryKey: ["admin-calendar-events", cursor.toISOString().slice(0, 7)],
    queryFn: async () => {
      const from = format(startOfMonth(cursor), "yyyy-MM-dd");
      const to = format(endOfMonth(cursor), "yyyy-MM-dd");
      const { data: rows } = await supabase
        .from("profile_events")
        .select("id, title, event_date, category, user_id")
        .gte("event_date", from)
        .lte("event_date", to);
      const list = (rows ?? []) as EventRow[];
      const ids = Array.from(new Set(list.map((e) => e.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, whatsapp")
          .in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        list.forEach((e) => { e.profile = map.get(e.user_id) ?? null; });
      }
      return list;
    },
  });

  const { data: rentalsAll = [] } = useQuery({
    queryKey: ["admin-calendar-rentals", cursor.toISOString().slice(0, 7)],
    queryFn: async () => {
      const from = format(startOfMonth(cursor), "yyyy-MM-dd");
      const to = format(endOfMonth(cursor), "yyyy-MM-dd");
      const { data } = await supabase
        .from("rental_requests")
        .select("id, start_date, end_date, user_id, status, product:products(name)")
        .in("status", ["pending", "confirmed"])
        .lte("start_date", to)
        .gte("end_date", from);
      const list = (data ?? []) as any[];
      const ids = Array.from(new Set(list.map((r) => r.user_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        list.forEach((r) => { r.profile = map.get(r.user_id) ?? null; });
      }
      return list;
    },
  });

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventRow[]>();
    for (const e of events) {
      const key = e.event_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const [statusFilter, setStatusFilter] = useState<"all" | "saved" | "reserved" | "confirmed">("all");

  const filteredRentals = useMemo(() => {
    return (rentalsAll as any[]).filter((r) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "reserved") return r.status === "pending";
      if (statusFilter === "confirmed") return r.status === "confirmed";
      return false;
    });
  }, [rentalsAll, statusFilter]);

  const rentalsByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const r of filteredRentals) {
      const start = new Date(r.start_date + "T00:00:00");
      const end = new Date(r.end_date + "T00:00:00");
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = format(d, "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(r);
      }
    }
    return map;
  }, [filteredRentals]);

  const showEvents = statusFilter === "all" || statusFilter === "saved";


  // Build month grid (weeks of 7)
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - monthStart.getDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(monthEnd.getDate() + (6 - monthEnd.getDay()));
  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const today = new Date();
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="px-6 py-10 lg:px-12">
      <div className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">Calendário</div>
      <h1 className="mt-2 text-4xl">Eventos das clientes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Veja em quais dias as clientes marcaram ocasiões importantes.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground mr-2">Status:</span>
        {([
          { id: "all", label: "Todos", cls: "bg-foreground text-white" },
          { id: "saved", label: "Evento Salvo", cls: "bg-[#be9ffc] text-[#260d58]" },
          { id: "reserved", label: "Vestido Reservado", cls: "bg-amber-400 text-amber-950" },
          { id: "confirmed", label: "Locação Confirmada", cls: "bg-[#260d58] text-white" },
        ] as const).map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id as any)}
            className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-widest transition ${
              statusFilter === s.id ? s.cls : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-white p-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-medium capitalize">
            {format(cursor, "MMMM 'de' yyyy", { locale: ptBR })}
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-px rounded-lg overflow-hidden border border-border bg-border">
          {weekdays.map((w) => (
            <div key={w} className="bg-muted/40 px-2 py-2 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
              {w}
            </div>
          ))}
          {days.map((d) => {
            const key = format(d, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) ?? [];
            const dayRentals = rentalsByDay.get(key) ?? [];
            const inMonth = d.getMonth() === cursor.getMonth();
            const isToday = isSameDay(d, today);
            return (
              <div
                key={key}
                className={`min-h-24 bg-white p-2 ${inMonth ? "" : "bg-muted/20 text-muted-foreground"}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`text-xs ${isToday ? "rounded-full bg-[#260d58] px-2 py-0.5 text-white" : ""}`}>
                    {d.getDate()}
                  </div>
                </div>
                {dayRentals.length > 0 && (
                  <div className="mt-2 space-y-0.5">
                    {dayRentals.map((r: any) => (
                      <div key={r.id} className="truncate rounded bg-[#260d58] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-white" title={`${r.product?.name ?? ""} — ${r.profile?.full_name ?? ""}`}>
                        Vestido Alugado
                      </div>
                    ))}
                  </div>
                )}
                {dayEvents.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {dayEvents.map((ev) => (
                      <Popover key={ev.id}>
                        <PopoverTrigger asChild>
                          <button className="transition hover:scale-110" aria-label={ev.profile?.full_name ?? "Cliente"}>
                            <Avatar className="h-7 w-7 ring-2 ring-[#be9ffc]">
                              <AvatarFallback className="bg-[#260d58] text-[10px] text-white">
                                {initials(ev.profile?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64" align="start">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-[#260d58] text-white">
                                {initials(ev.profile?.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {ev.profile?.full_name ?? "Cliente"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(ev.event_date + "T00:00:00"), "PPP", { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Categoria</div>
                            <div className="rounded-md bg-muted px-2 py-1 text-sm">
                              {ev.category || <span className="text-muted-foreground">Sem categoria</span>}
                            </div>
                          </div>
                          <div className="mt-3 space-y-1">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Evento</div>
                            <div className="text-sm">{ev.title}</div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {events.length === 0 && (
          <div className="mt-6 flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <CalendarDays className="h-6 w-6 opacity-40" />
            <div className="text-sm">Nenhum evento marcado neste mês.</div>
          </div>
        )}
      </div>
    </div>
  );
}
