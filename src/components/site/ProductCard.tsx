import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
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
  payment_terms: string;
  image_url: string | null;
  category: string | null;
  color?: string | null;
};

export function ProductCard({ product, isReserved = false }: { product: Product; isReserved?: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();

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
      <Link to="/produto/$id" params={{ id: product.id }} className="relative block overflow-hidden bg-muted aspect-[3/4]">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={`Alugar ${product.name} — vestido para ${product.category ?? "festa"}`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full" />
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
            style={{ color: "var(--lilac)" }}
            fill={isFavorite ? "var(--lilac)" : "transparent"}
          />
        </button>
      </Link>

      <div className="mt-4 flex flex-1 flex-col">
        {product.category && (
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{product.category}</span>
        )}
        <Link to="/produto/$id" params={{ id: product.id }} className="mt-1">
          <h3 className="text-lg leading-tight">{product.name}</h3>
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-medium">R$ {Number(product.price).toFixed(2).replace(".", ",")}</span>
          <span className="text-xs text-muted-foreground">· {product.payment_terms}</span>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Tam. {product.size} · entrega em até {product.delivery_days} dias
        </div>
        <button
          type="button"
          onClick={() => addToCart.mutate()}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-primary-foreground transition-all duration-150 ease-out hover:opacity-90 active:scale-[0.94] active:shadow-inner active:opacity-80"
        >
          <ShoppingBag className="h-4 w-4" /> Adicionar ao carrinho
        </button>
      </div>
    </article>
  );
}
