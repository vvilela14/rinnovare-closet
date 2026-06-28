import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Sparkles, Truck, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { COLOR_PALETTE, fmtISODate, parseISODate, rangesOverlap } from "@/lib/catalog-constants";
import heroImage from "@/assets/hero-dress.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rinnovare Closet — Aluguel de Vestidos para Festas, Casamentos e Madrinhas" },
      { name: "description", content: "Alugue vestidos exclusivos para casamentos, madrinhas, formaturas e festas. Curadoria de moda, entrega rápida e parcelamento em até 12x no cartão de crédito." },
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
  const [eventDate, setEventDate] = useState<string>("");
  const [periodDays, setPeriodDays] = useState<string>("4");
  const [color, setColor] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
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
      if (color && (p as any).color !== color) return false;
      if (minPrice && Number(p.price) < Number(minPrice)) return false;
      if (maxPrice && Number(p.price) > Number(maxPrice)) return false;
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
  }, [products, color, minPrice, maxPrice, eventDate, periodDays, checkedAvailability, confirmedRentals]);

  const hasFilters = color || minPrice || maxPrice || (checkedAvailability && eventDate);


  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60 min-h-[480px] lg:min-h-[620px]">
        <img
          src={heroImage}
          alt="Grupo de madrinhas com vestidos de festa Rinnovare"
          className="absolute inset-0 h-full w-full object-cover brightness-[1.3]"
        />
        <div className="absolute inset-0 bg-black/35" />

        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pt-28 sm:pt-36 lg:pt-48">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center text-white">
            <h1 className="max-w-[17rem] text-3xl leading-[1.15] sm:max-w-none sm:whitespace-nowrap sm:text-5xl sm:leading-[1.05] lg:text-7xl">
              O vestido certo para cada momento
            </h1>
            <p className="mt-5 max-w-[19rem] text-lg leading-snug text-white/85 sm:max-w-none sm:whitespace-nowrap sm:text-xl lg:text-2xl">
              Porque cada ocasião pede uma nova forma de expressar sua personalidade
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#vitrine"
                className="inline-flex items-center rounded-none bg-primary px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90"
              >
                Ver vitrine
              </a>
              <a
                href="#categorias"
                className="inline-flex items-center rounded-none border border-white px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-white transition hover:bg-white hover:text-foreground"
              >
                Categorias
              </a>
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
                <Icon className="h-5 w-5" style={{ color: "black" }} />
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

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Preço</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  placeholder="De"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-24 rounded-none border border-border bg-background px-3 py-2 text-sm"
                />
                <span className="text-muted-foreground">–</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Até"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-24 rounded-none border border-border bg-background px-3 py-2 text-sm"
                />
              </div>
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
                onClick={() => { setEventDate(""); setColor(""); setMinPrice(""); setMaxPrice(""); setCheckedAvailability(false); }}
                className="rounded-none border border-border px-4 py-2 text-[10px] uppercase tracking-widest hover:bg-background"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>

        <div id="categorias" className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-3">
          {filtered.map((p) => (
            <div key={p.id} className="mx-auto w-[83%] sm:w-[83%]">
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
