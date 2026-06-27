import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/site/Header";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/_authenticated/favoritos")({
  head: () => ({ meta: [{ title: "Meus favoritos — Rinnovare Closet" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user } = useAuth();
  const { data: favorites = [], isLoading } = useQuery<Product[]>({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("product:products(*)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r: any) => r.product).filter(Boolean) as Product[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="flex items-center gap-3">
          <Heart className="h-5 w-5" style={{ color: "black" }} fill="black" />
          <span className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Seu closet</span>
        </div>
        <h1 className="mt-3 text-4xl sm:text-5xl">Vestidos favoritos</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          Suas peças salvas em um só lugar — prontas para alugar quando chegar a ocasião.
        </p>

        {isLoading ? (
          <p className="mt-16 text-center text-muted-foreground">Carregando...</p>
        ) : favorites.length === 0 ? (
          <p className="mt-16 text-center text-muted-foreground">Você ainda não favoritou nenhum vestido.</p>
        ) : (
          <div className="mt-12 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
