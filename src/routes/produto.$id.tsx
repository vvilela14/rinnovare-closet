import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, ShoppingBag, ArrowLeft, Truck, Ruler, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/site/Header";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/produto/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Detalhes do vestido — Rinnovare Closet" },
      { name: "description", content: "Alugue este vestido de festa. Curadoria Rinnovare, parcelamento em até 12x sem juros." },
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

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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
      const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", id).maybeSingle();
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ user_id: user.id, product_id: id, quantity: 1 });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success("Adicionado ao carrinho");
    },
    onError: () => toast.error("Faça login para adicionar ao carrinho"),
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
            <div className="relative aspect-[3/4] overflow-hidden bg-muted">
              {product.image_url && (
                <img src={product.image_url} alt={`Alugar vestido ${product.name}`} className="h-full w-full object-cover" />
              )}
            </div>

            <div className="flex flex-col">
              {product.category && (
                <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">{product.category}</span>
              )}
              <h1 className="mt-3 text-4xl sm:text-5xl">{product.name}</h1>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">{product.description}</p>

              <div className="mt-8 flex items-baseline gap-3">
                <span className="text-3xl font-medium">R$ {Number(product.price).toFixed(2).replace(".", ",")}</span>
                <span className="text-sm text-muted-foreground">· {product.payment_terms}</span>
              </div>

              <ul className="mt-8 grid grid-cols-1 gap-3 border-y border-border py-6 text-sm sm:grid-cols-3">
                <li className="flex items-center gap-2"><Ruler className="h-4 w-4" style={{ color: "var(--lilac)" }} /> Tamanho {product.size}</li>
                <li className="flex items-center gap-2"><Truck className="h-4 w-4" style={{ color: "var(--lilac)" }} /> Entrega em {product.delivery_days} dias</li>
                <li className="flex items-center gap-2"><CreditCard className="h-4 w-4" style={{ color: "var(--lilac)" }} /> {product.payment_terms}</li>
              </ul>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  onClick={() => addToCart.mutate()}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90"
                >
                  <ShoppingBag className="h-4 w-4" /> Adicionar ao carrinho
                </button>
                <button
                  onClick={() => toggleFavorite.mutate()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-4 text-xs uppercase tracking-[0.2em] transition hover:bg-muted"
                  aria-label="Favoritar"
                >
                  <Heart className="h-4 w-4" style={{ color: "var(--lilac)" }} fill={isFavorite ? "var(--lilac)" : "transparent"} />
                  {isFavorite ? "Salvo" : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
