import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingBag, User as UserIcon, LogOut, LayoutGrid, UserCog } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import logoAsset from "@/assets/rinnovare-logo.png.asset.json";

export function Header() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

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

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" className="flex items-center gap-2">
          <img src={logoAsset.url} alt="Rinnovare Closet — Aluguel de vestidos" className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-10 text-sm tracking-wide text-foreground/80 md:flex">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <Link to="/" hash="categorias" className="hover:text-foreground transition-colors">Categorias</Link>
          <Link to="/" hash="sobre" className="hover:text-foreground transition-colors">Sobre</Link>
        </nav>

        <div className="flex items-center gap-1">
          {user && (
            <Link to="/perfil" className="rounded-full p-2.5 hover:bg-muted transition" aria-label="Meu perfil">
              <UserCog className="h-5 w-5" style={{ color: "var(--lilac)" }} />
            </Link>
          )}
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
          {isAdmin && (
            <Link to="/admin" className="ml-1 hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs uppercase tracking-widest hover:bg-muted md:inline-flex">
              <LayoutGrid className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          {user ? (
            <button onClick={handleSignOut} className="ml-1 rounded-full p-2.5 hover:bg-muted transition" aria-label="Sair">
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link to="/auth" className="ml-1 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-xs uppercase tracking-widest text-primary-foreground transition hover:opacity-90">
              <UserIcon className="h-4 w-4" /> Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
