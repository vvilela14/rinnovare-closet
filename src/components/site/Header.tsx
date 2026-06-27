import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { UserDrawer } from "@/components/site/UserDrawer";
import logoUrl from "@/assets/rinnovare-logo-wordmark.png";

export function Header() {
  const { user } = useAuth();

  const { data: cartCount = 0 } = useQuery({
    queryKey: ["cart-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id);
      return count ?? 0;
    },
  });

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoUrl} alt="Rinnovare Closet — Aluguel de vestidos" className="h-10 w-auto" />
        </Link>

        <div className="flex items-center gap-1">
          {user && (
            <Link to="/favoritos" className="rounded-full p-2.5 hover:bg-muted transition" aria-label="Favoritos">
              <Heart className="h-5 w-5" style={{ color: "var(--lilac)" }} />
            </Link>
          )}
          {user && (
            <Link to="/carrinho" className="relative rounded-full p-2.5 hover:bg-muted transition" aria-label="Carrinho">
              <ShoppingBag className="h-5 w-5" style={{ color: "var(--lilac)" }} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          )}
          <div className="ml-1">
            <UserDrawer />
          </div>
        </div>
      </div>
    </header>
  );
}
