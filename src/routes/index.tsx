import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, Truck, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { CATEGORY_OPTIONS, COLOR_PALETTE, fmtISODate, parseISODate, rangesOverlap } from "@/lib/catalog-constants";
import heroImage from "@/assets/hero-dress.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rinnovare Closet — Aluguel de Vestidos para Festas, Casamentos e Madrinhas" },
      { name: "description", content: "Alugue vestidos exclusivos para casamentos, madrinhas, formaturas e festas. Curadoria de moda, entrega rápida e parcelamento em até 12x sem juros." },
      { property: "og:title", content: "Rinnovare Closet — Aluguel de Vestidos" },
      { property: "og:description", content: "Vestidos de festa para alugar com curadoria, entrega rápida e parcelamento facilitado." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const [category, setCategory] = useState<string>("");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const cat = new URLSearchParams(window.location.search).get("cat");
    if (cat) setCategory(cat);
  }, []);
  const [eventDate, setEventDate] = useState<string>("");
  const [periodDays, setPeriodDays] = useState<string>("4");
  const [color, setColor] = useState<string>("");
  const [checkedAvailability, setCheckedAvailability] = useState(false);

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  const { data: confirmedRentals = [] } = useQuery({
    queryKey: ["confirmed-rentals"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rental_requests")
        .select("product_id, start_date, end_date, status")
        .in("status", ["confirmed", "reserved", "awaiting_payment", "pending"]);
      return data ?? [];
    },
  });

  const reservedSet = useMemo(() => {
    return new Set(confirmedRentals.map((r: any) => r.product_id));
  }, [confirmedRentals]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (category && p.category !== category) return false;
      if (color && (p as any).color !== color) return false;
      if (checkedAvailability && eventDate) {
        const start = parseISODate(eventDate);
        const end = new Date(start);
        end.setDate(end.getDate() + Number(periodDays) - 1);
        const taken = confirmedRentals.some((r: any) => {
          if (r.product_id !== p.id) return false;
          if (r.status === "cancelled") return false;
          return rangesOverlap(start, end, parseISODate(r.start_date), parseISODate(r.end_date));
        });
        if (taken) return false;
      }
      return true;
    });
  }, [products, category, color, eventDate, periodDays, checkedAvailability, confirmedRentals]);

  const hasFilters = category || color || (checkedAvailability && eventDate);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="mx-auto grid max-w-7xl items-stretch gap-12 px-6 pb-16 pt-6 lg:grid-cols-2 lg:gap-20 lg:px-10 lg:pb-24 lg:pt-10">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              <Sparkles className="h-3 w-3" style={{ color: "var(--lilac)" }} />
              Para todas as ocasiões
            </div>

            <h1 className="mt-8 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Seu <em className="font-script not-italic" style={{ color: "var(--lilac)" }}>look exclusivo</em> para cada ocasião
            </h1>


            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#vitrine"
                className="inline-flex items-center rounded-none bg-primary px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90"
              >
                Ver vitrine
              </a>
              <a
                href="#categorias"
                className="inline-flex items-center rounded-none border border-foreground px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-foreground transition hover:bg-foreground hover:text-background"
              >
                Categorias
              </a>
            </div>

            <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-border pt-8 text-xs">
              <div>
                <dt className="text-muted-foreground uppercase tracking-widest">Curadoria</dt>
                <dd className="mt-1 text-sm">+200 peças</dd>
              </div>
              <div>
                <dt className="text-muted-foreground uppercase tracking-widest">Entrega</dt>
                <dd className="mt-1 text-sm">Em até 3 dias</dd>
              </div>
              <div>
                <dt className="text-muted-foreground uppercase tracking-widest">Pagamento</dt>
                <dd className="mt-1 text-sm">12x sem juros</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-10 hidden h-32 w-32 rounded-full lg:block" style={{ backgroundColor: "var(--lilac)", opacity: 0.35, filter: "blur(40px)" }} />
            <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
              <img
                src={heroImage}
                alt="Mulher com vestido longo lilás — aluguel de vestidos Rinnovare"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="border-b border-border/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:grid-cols-3 lg:px-10">
          {[
            { icon: Sparkles, title: "Curadoria de moda", text: "Peças selecionadas para cada tipo de ocasião." },
            { icon: Truck, title: "Entrega rápida", text: "Receba seu vestido em até 3 dias úteis." },
            { icon: ShieldCheck, title: "Higienização", text: "Todas as peças higienizadas e prontas para usar." },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="rounded-full border border-border p-3">
                <Icon className="h-5 w-5" style={{ color: "var(--lilac)" }} />
              </div>
              <div>
                <h3 className="text-lg">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VITRINE */}
      <section id="vitrine" className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="flex flex-col items-end justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Vitrine</span>
            <h2 className="mt-2 text-4xl sm:text-5xl">Vestidos em destaque</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">
            Os vestidos mais desejados da temporada — para alugar, encantar e devolver.
          </p>
        </div>

        {/* FILTROS */}
        <div className="mt-10 rounded-2xl border border-border bg-muted/20 p-5">
          <div className="flex flex-wrap items-end gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-w-[180px] rounded-none border border-border bg-background px-4 py-2 text-sm"
              >
                <option value="">Todas</option>
                {CATEGORY_OPTIONS.filter((c) => c !== "Outro").map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Data do evento</label>
              <input
                type="date"
                value={eventDate}
                min={fmtISODate(new Date())}
                onChange={(e) => { setEventDate(e.target.value); setCheckedAvailability(false); }}
                className="rounded-none border border-border bg-background px-4 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Período <span className="text-destructive">*</span></label>
              <select
                value={periodDays}
                onChange={(e) => { setPeriodDays(e.target.value); setCheckedAvailability(false); }}
                className="min-w-[140px] rounded-none border border-border bg-background px-4 py-2 text-sm"
              >
                <option value="4">4 dias</option>
                <option value="7">7 dias</option>
                <option value="12">12 dias</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cor</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="min-w-[180px] rounded-none border border-border bg-background px-4 py-2 text-sm"
              >
                <option value="">Todas</option>
                {COLOR_PALETTE.map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={!eventDate || !periodDays}
              onClick={() => setCheckedAvailability(true)}
              className="rounded-none bg-primary px-5 py-2 text-[10px] uppercase tracking-widest text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Verificar Disponibilidade
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={() => { setCategory(""); setEventDate(""); setColor(""); setCheckedAvailability(false); }}
                className="rounded-none border border-border px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-background"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div id="categorias" className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2">
          {filtered.map((p) => (
            <div key={p.id} className="mx-auto w-[64%]">
              <ProductCard product={p} isReserved={reservedSet.has(p.id)} />
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground">
              {hasFilters ? "Nenhum vestido disponível com esses filtros." : "Nenhum vestido disponível no momento."}
            </p>
          )}
        </div>
      </section>


      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-xs text-muted-foreground sm:flex-row lg:px-10">
          <p className="wordmark text-sm text-foreground">RINNOVARE</p>
          <p>© {new Date().getFullYear()} Rinnovare Closet — Aluguel de vestidos para todas as ocasiões.</p>
        </div>
      </footer>
    </div>
  );
}
