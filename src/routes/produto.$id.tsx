import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, ArrowLeft, Truck, Ruler, CreditCard, X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { RENTAL_PERIODS, addDays, fmtISODate, parseISODate } from "@/lib/catalog-constants";

function priceForPeriod(product: any, period: number): number {
  if (period === 7 && product.price_7_days != null) return Number(product.price_7_days);
  if (period === 12 && product.price_12_days != null) return Number(product.price_12_days);
  if (period === 4 && product.price_4_days != null) return Number(product.price_4_days);
  return Number(product.price);
}

export const Route = createFileRoute("/produto/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Detalhes do vestido — Rinnovare Closet" },
      { name: "description", content: "Alugue este vestido de festa. Curadoria Rinnovare, parcelamento em até 12x no cartão de crédito." },
      { property: "og:url", content: `/produto/${params.id}` },
    ],
    links: [{ rel: "canonical", href: `/produto/${params.id}` }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = useParams({ from: "/produto/$id" });
  const { user } = useAuth();
  const qc = useQueryClient();
  const [active, setActive] = useState(0);
  const [zoomIndex, setZoomIndex] = useState<number | null>(null);
  const [period, setPeriod] = useState<number>(4);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);




  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const gallery = useMemo<string[]>(() => {
    if (!product) return [];
    const extra = ((product as any).images as string[] | null) ?? [];
    const all = [product.image_url, ...extra].filter((v): v is string => !!v && v.trim().length > 0);
    return Array.from(new Set(all));
  }, [product]);

  useEffect(() => { setActive(0); }, [id]);

  const [hoverSide, setHoverSide] = useState<"left" | "right" | null>(null);

  function handleHoverMove(e: React.MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoverSide(x < rect.width / 2 ? "left" : "right");
  }

  // Swipe left/right to switch photos (mirrors the mobile menu drawer's swipe gesture).
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  function handleSwipeStart(e: React.TouchEvent) {
    const t = e.touches[0];
    swipeStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function makeSwipeEnd(onPrev: () => void, onNext: () => void) {
    return (e: React.TouchEvent) => {
      const start = swipeStartRef.current;
      swipeStartRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (Math.abs(dx) > 60 && Math.abs(dy) < 60) {
        if (dx > 0) onPrev();
        else onNext();
      }
    };
  }

  useEffect(() => {
    if (zoomIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomIndex(null);
      if (e.key === "ArrowRight") setZoomIndex((i) => (i === null ? null : (i + 1) % gallery.length));
      if (e.key === "ArrowLeft") setZoomIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomIndex, gallery.length]);

  const { data: isFavorite = false } = useQuery({
    queryKey: ["favorite", user?.id, id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("id").eq("user_id", user!.id).eq("product_id", id).maybeSingle();
      return !!data;
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (isFavorite) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, product_id: id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorite", user?.id, id] });
      toast.success(isFavorite ? "Removido dos favoritos" : "Salvo nos favoritos");
    },
    onError: () => toast.error("Faça login para salvar favoritos"),
  });

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (!selectedDate) throw new Error("date");
      const payload = { start_date: selectedDate, period_days: period };
      const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", id).maybeSingle();
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + 1, ...payload }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ user_id: user.id, product_id: id, quantity: 1, ...payload });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("Adicionado ao carrinho");
    },
    onError: (e: any) => {
      if (e?.message === "date") toast.error("Selecione uma data de início no calendário");
      else toast.error("Faça login para adicionar ao carrinho");
    },
  });


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar à vitrine
        </Link>

        {isLoading || !product ? (
          <div className="py-32 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <div className="mt-8 grid gap-12 lg:grid-cols-2">
            <div className="lg:max-w-[80%]">
              <div
                className="group relative aspect-[3/4] w-full overflow-hidden bg-muted"
                onMouseMove={gallery.length > 1 ? handleHoverMove : undefined}
                onMouseLeave={() => setHoverSide(null)}
              >
                <button
                  type="button"
                  onClick={() => gallery.length > 0 && setZoomIndex(active)}
                  onTouchStart={gallery.length > 1 ? handleSwipeStart : undefined}
                  onTouchEnd={
                    gallery.length > 1
                      ? makeSwipeEnd(
                          () => setActive((i) => (i - 1 + gallery.length) % gallery.length),
                          () => setActive((i) => (i + 1) % gallery.length)
                        )
                      : undefined
                  }
                  className="block h-full w-full cursor-zoom-in"
                  aria-label="Ampliar foto"
                >
                  {gallery[active] && (
                    <img src={gallery[active]} alt={`Alugar vestido ${product.name}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                  )}
                  <span className="absolute bottom-3 right-3 rounded-full bg-background/85 px-3 py-1 text-[10px] uppercase tracking-widest text-foreground opacity-0 transition group-hover:opacity-100">
                    Clique para ampliar
                  </span>
                </button>
                {gallery.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActive((i) => (i - 1 + gallery.length) % gallery.length); }}
                      className={`absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 text-foreground backdrop-blur transition-opacity duration-300 hover:bg-background ${hoverSide === "left" ? "opacity-100" : "opacity-0"}`}
                      aria-label="Foto anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setActive((i) => (i + 1) % gallery.length); }}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/85 p-2 text-foreground backdrop-blur transition-opacity duration-300 hover:bg-background ${hoverSide === "right" ? "opacity-100" : "opacity-0"}`}
                      aria-label="Próxima foto"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>

              {gallery.length > 1 && (
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {gallery.map((src, i) => (
                    <button
                      key={src + i}
                      type="button"
                      onClick={() => setActive(i)}
                      className={`relative aspect-square overflow-hidden border transition ${i === active ? "border-primary" : "border-border hover:border-foreground/40"}`}
                      aria-label={`Foto ${i + 1}`}
                    >
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <h1 className="mt-3 text-4xl sm:text-5xl">{product.name}</h1>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">{product.description}</p>

              <div className="mt-8 flex items-baseline gap-3">
                <span className="text-3xl font-medium">R$ {priceForPeriod(product, period).toFixed(2).replace(".", ",")}</span>
                <span className="text-sm text-muted-foreground">· {product.payment_terms}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Valor para {period} dias de locação</p>

              <ul className="mt-8 grid grid-cols-1 gap-3 border-y border-border py-6 text-sm sm:grid-cols-3">
                <li className="flex items-center gap-2"><Ruler className="h-4 w-4" style={{ color: "black" }} /> Tamanho {product.size}</li>
                <li className="flex items-center gap-2"><Truck className="h-4 w-4" style={{ color: "black" }} /> Entrega em {product.delivery_days} dias</li>
                <li className="flex items-center gap-2"><CreditCard className="h-4 w-4" style={{ color: "black" }} /> {product.payment_terms}</li>
              </ul>

              <PeriodAvailability
                productId={id}
                period={period}
                setPeriod={setPeriod}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
              />




              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => addToCart.mutate()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-primary-foreground transition-all duration-150 ease-out hover:opacity-90"
                >
                  Adicionar
                </button>
                <button
                  onClick={() => toggleFavorite.mutate()}
                  className="inline-flex items-center justify-center gap-2 rounded-none border border-border px-5 py-3 text-[10px] uppercase tracking-[0.2em] transition hover:bg-muted"
                  aria-label="Favoritar"
                >
                  <Heart className="h-4 w-4" style={{ color: "black" }} fill={isFavorite ? "black" : "transparent"} />
                  {isFavorite ? "Salvo" : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {zoomIndex !== null && gallery[zoomIndex] && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 animate-fade-in"
          onClick={() => setZoomIndex(null)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setZoomIndex(null); }}
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setZoomIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length)); }}
                className="absolute left-5 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setZoomIndex((i) => (i === null ? null : (i + 1) % gallery.length)); }}
                className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2.5 text-white hover:bg-white/20"
                aria-label="Próxima foto"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <ZoomImage
            src={gallery[zoomIndex]}
            onPrev={gallery.length > 1 ? () => setZoomIndex((i) => (i === null ? null : (i - 1 + gallery.length) % gallery.length)) : undefined}
            onNext={gallery.length > 1 ? () => setZoomIndex((i) => (i === null ? null : (i + 1) % gallery.length)) : undefined}
          />
        </div>
      )}
    </div>
  );
}

function ZoomImage({ src, onPrev, onNext }: { src: string; onPrev?: () => void; onNext?: () => void }) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });

  const touchRef = useRef<{ t1x: number; t1y: number; startTx: number; startTy: number; } | null>(null);

  useEffect(() => { setScale(1); setTx(0); setTy(0); }, [src]);

  function handleTouchStart(e: React.TouchEvent) {
    e.stopPropagation();
    if (e.touches.length === 1) {
      touchRef.current = {
        t1x: e.touches[0].clientX, t1y: e.touches[0].clientY,
        startTx: tx, startTy: ty,
      };
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.stopPropagation();
    if (!touchRef.current || e.touches.length !== 1 || scale <= 1) return;
    e.preventDefault();
    const r = touchRef.current;
    setTx(r.startTx + (e.touches[0].clientX - r.t1x));
    setTy(r.startTy + (e.touches[0].clientY - r.t1y));
  }

  function handleTouchEnd(e: React.TouchEvent) {
    e.stopPropagation();
    const r = touchRef.current;
    touchRef.current = null;
    if (!r || e.changedTouches.length !== 1) return;
    if (scale <= 1) {
      const dx = e.changedTouches[0].clientX - r.t1x;
      const dy = e.changedTouches[0].clientY - r.t1y;
      if (Math.abs(dx) > 60 && Math.abs(dy) < 60) {
        if (dx > 0) onPrev?.();
        else onNext?.();
      }
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (scale <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    });
  }

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (scale > 1) { setScale(1); setTx(0); setTy(0); }
    else setScale(3.5);
  }

  const isZoomed = scale > 1;
  const imgStyle: React.CSSProperties = isZoomed
    ? { transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: "center", transition: "none" }
    : { transform: "scale(1)", transformOrigin: `${origin.x}% ${origin.y}%`, transition: "transform 0.2s ease-out" };

  return (
    <div
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOrigin({ x: 50, y: 50 })}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative flex max-h-[92vh] max-w-[92vw] items-center justify-center overflow-hidden ${isZoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
      style={{ touchAction: "none" }}
    >
      <img
        src={src}
        alt="Vestido ampliado"
        draggable={false}
        className="max-h-[92vh] max-w-[92vw] object-contain animate-scale-in select-none"
        style={imgStyle}
      />
    </div>
  );
}

function PeriodAvailability({
  productId,
  period,
  setPeriod,
  selectedDate,
  setSelectedDate,
}: {
  productId: string;
  period: number;
  setPeriod: (n: number) => void;
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;
}) {
  const [month, setMonth] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const { data: rentals = [] } = useQuery({
    queryKey: ["product-rentals", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("rental_requests")
        .select("start_date, end_date, status")
        .eq("product_id", productId)
        .in("status", ["pending", "confirmed"]);
      return data ?? [];
    },
  });

  const bookedSet = useMemo(() => {
    const set = new Set<string>();
    rentals.forEach((r: any) => {
      const s = parseISODate(r.start_date);
      const e = parseISODate(r.end_date);
      for (let d = new Date(s); d <= e; d = addDays(d, 1)) {
        set.add(fmtISODate(d));
      }
    });
    return set;
  }, [rentals]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const monthLabel = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const firstWeekday = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  // Check whether the whole [start, start+period-1] window is free
  function rangeAvailable(start: Date) {
    for (let i = 0; i < period; i++) {
      if (bookedSet.has(fmtISODate(addDays(start, i)))) return false;
    }
    return true;
  }

  const selectedEnd = selectedDate
    ? fmtISODate(addDays(parseISODate(selectedDate), period - 1))
    : null;

  return (
    <div className="mt-6 w-full max-w-xs rounded-xl border border-border bg-background p-3">
      <div className="flex flex-col gap-1">
        <label className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Período de Locação</label>
        <select
          value={period}
          onChange={(e) => { setPeriod(Number(e.target.value)); setSelectedDate(null); }}
          className="w-fit rounded-none border border-border bg-background px-2 py-1 text-[11px]"
        >
          {RENTAL_PERIODS.map((d) => <option key={d} value={d}>{d} dias</option>)}
        </select>
      </div>

      <div className="mt-2.5">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
            className="rounded-full p-1 hover:bg-muted"
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <div className="text-xs font-medium capitalize">{monthLabel}</div>
          <button
            type="button"
            onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
            className="rounded-full p-1 hover:bg-muted"
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[9px] uppercase tracking-widest text-muted-foreground">
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <div key={i}>{d}</div>)}
        </div>
        <div className="mt-0.5 grid grid-cols-7 gap-0.5">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const iso = fmtISODate(d);
            const isPast = d < today;
            const isBooked = bookedSet.has(iso);
            const canStart = !isPast && !isBooked && rangeAvailable(d);
            const isSelected = selectedDate === iso;
            const isInSelectedRange =
              selectedDate && selectedEnd && iso >= selectedDate && iso <= selectedEnd;
            const unavailable = isPast || isBooked;
            return (
              <button
                type="button"
                key={i}
                disabled={!canStart}
                onClick={() => setSelectedDate(iso)}
                className={`flex aspect-square items-center justify-center rounded-md text-[11px] transition ${
                  isSelected
                    ? "bg-primary text-primary-foreground font-semibold"
                    : isInSelectedRange
                    ? "bg-primary/20 text-foreground"
                    : unavailable
                    ? "text-muted-foreground/50 line-through cursor-not-allowed"
                    : canStart
                    ? "font-medium text-foreground hover:bg-muted"
                    : "text-muted-foreground/50 cursor-not-allowed"
                }`}
                title={
                  unavailable
                    ? "Data indisponível"
                    : !canStart
                    ? "Sem janela livre para o período escolhido"
                    : "Disponível"
                }
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <p className="mt-2 text-[10px] text-muted-foreground">
          {selectedDate
            ? `Retirada em ${parseISODate(selectedDate).toLocaleDateString("pt-BR")} · devolução em ${parseISODate(selectedEnd!).toLocaleDateString("pt-BR")}`
            : "Selecione uma data de retirada disponível."}
        </p>
      </div>
    </div>
  );
}




