import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  size: string;
  delivery_days: number;
  price: number;
  price_4_days?: number | null;
  payment_terms: string;
  image_url: string | null;
  images?: string[] | null;
  color?: string | null;
};

export function ProductCard({ product, isReserved = false }: { product: Product; isReserved?: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const gallery = useMemo<string[]>(() => {
    const extra = product.images ?? [];
    const all = [product.image_url, ...extra].filter((v): v is string => !!v && v.trim().length > 0);
    return Array.from(new Set(all));
  }, [product.image_url, product.images]);

  const [active, setActive] = useState(0);

  // Swipe left/right to switch photos (mirrors the mobile menu drawer's swipe gesture).
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  function handleSwipeStart(e: React.TouchEvent) {
    const t = e.touches[0];
    swipeStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleSwipeEnd(e: React.TouchEvent) {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dy) < 60) {
      e.preventDefault();
      if (dx > 0) setActive((i) => (i - 1 + gallery.length) % gallery.length);
      else setActive((i) => (i + 1) % gallery.length);
    }
  }

  const { data: isFavorite = false } = useQuery({
    queryKey: ["favorite", user?.id, product.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user!.id)
        .eq("product_id", product.id)
        .maybeSingle();
      return !!data;
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      if (isFavorite) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, product_id: product.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorite", user?.id, product.id] });
      qc.invalidateQueries({ queryKey: ["favorites", user?.id] });
      toast.success(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos");
    },
    onError: () => toast.error("Faça login para salvar favoritos"),
  });

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("auth");
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: 1 });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart-count"] });
      qc.invalidateQueries({ queryKey: ["cart", user?.id] });
      toast.success("Adicionado ao carrinho");
    },
    onError: () => toast.error("Faça login para adicionar ao carrinho"),
  });

  return (
    <article className="group relative flex flex-col">
      <Link
        to="/produto/$id"
        params={{ id: product.id }}
        className="relative block overflow-hidden bg-muted aspect-[2/3]"
        onTouchStart={gallery.length > 1 ? handleSwipeStart : undefined}
        onTouchEnd={gallery.length > 1 ? handleSwipeEnd : undefined}
      >
        {gallery[active] ? (
          <img
            src={gallery[active]}
            alt={`Alugar ${product.name} — vestido de festa`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full" />
        )}
        {gallery.length > 1 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
            {gallery.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition ${i === active ? "bg-white" : "bg-white/40"}`}
              />
            ))}
          </div>
        )}
        {isReserved && (
          <span className="absolute left-3 top-3 rounded-full bg-[#260d58] px-3 py-1 text-[10px] uppercase tracking-widest text-white">
            Reservado
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); toggleFavorite.mutate(); }}
          className="absolute right-3 top-3 rounded-full bg-background/90 p-2 backdrop-blur transition hover:bg-background"
          aria-label="Favoritar"
        >
          <Heart
            className="h-4 w-4 transition"
            style={{ color: "black" }}
            fill={isFavorite ? "black" : "transparent"}
          />
        </button>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        <Link to="/produto/$id" params={{ id: product.id }} className="mt-1">
          <h3 className="text-lg leading-tight">{product.name}</h3>
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-medium">R$ {Number(product.price_4_days ?? product.price).toFixed(2).replace(".", ",")}</span>
          <span className="text-xs text-muted-foreground">· {product.payment_terms}</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Tam. {product.size} · entrega em até {product.delivery_days} dias
        </div>
        <button
          type="button"
          onClick={() => addToCart.mutate()}
          className="mt-4 inline-flex items-center justify-center rounded-none bg-primary px-4 py-2.5 text-[10px] uppercase tracking-[0.2em] text-primary-foreground transition-all duration-150 ease-out hover:opacity-90 active:scale-[0.98]"
        >
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  );
}
