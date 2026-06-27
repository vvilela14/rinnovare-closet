import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  UserCog,
  MessageSquareHeart,
  ChevronRight,
  CalendarHeart,
  ClipboardList,
  HelpCircle,
  LayoutGrid,
  BadgeCheck,
  LogOut,
  Menu as MenuIcon,
  Home,
  Info,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_OPTIONS } from "@/lib/catalog-constants";
import { cn } from "@/lib/utils";

const SUPPORT_WHATSAPP = "https://wa.me/5511999999999";
const SUPPORT_MAILTO = "mailto:contato@rinnovarecloset.com.br?subject=Opinião%20sobre%20a%20Rinnovare";

function initialsOf(name: string, email: string) {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

type RowProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to?: string;
  href?: string;
  hash?: string;
  badge?: number | null;
  onClick?: () => void;
  rightExtra?: React.ReactNode;
};

function Row({ icon: Icon, label, to, href, hash, badge, onClick, rightExtra }: RowProps) {
  const inner = (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition rounded-lg">
      <Icon className="h-5 w-5 text-foreground/80 shrink-0" />
      <span className="flex-1 text-sm">{label}</span>
      {rightExtra}
      {badge && badge > 0 ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </div>
  );
  if (to) return <Link to={to} hash={hash} onClick={onClick}>{inner}</Link>;
  if (href) return <a href={href} target="_blank" rel="noreferrer" onClick={onClick}>{inner}</a>;
  return <button type="button" onClick={onClick} className="w-full text-left">{inner}</button>;
}

export function UserDrawer() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["drawer-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["drawer-pending", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase
        .from("rental_requests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .in("status", ["pending", "awaiting_payment"]);
      return count ?? 0;
    },
  });

  const { data: credit } = useQuery({
    queryKey: ["drawer-credit", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("user_credit_balance")
        .select("available_balance")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data ?? { available_balance: 0 };
    },
  });

  const close = () => setOpen(false);

  async function handleSignOut() {
    close();
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  const name = profile?.full_name || (user ? `usuário-${user.id.slice(0, 4)}` : "");
  const email = user?.email ?? "";
  const verified = !!user?.email_confirmed_at;
  const saldoFmt = `R$ ${Number(credit?.available_balance ?? 0).toFixed(2).replace(".", ",")}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed left-4 top-1/2 z-[60] flex -translate-y-1/2 flex-col items-center gap-2 rounded-full border border-border bg-background/95 p-2.5 shadow-lg backdrop-blur transition hover:shadow-xl"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        aria-expanded={open}
      >
        <MenuIcon className={`h-5 w-5 text-foreground/80 transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
        <span className="relative">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
            <AvatarFallback className="text-xs">{user ? initialsOf(name, email) : "?"}</AvatarFallback>
          </Avatar>
          {pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white ring-2 ring-background">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </span>
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="left" className="w-full max-w-sm p-0 flex flex-col">
        <SheetHeader className="px-5 pt-6 pb-4 border-b">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          {user ? (
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border border-border">
                <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
                <AvatarFallback>{initialsOf(name, email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-medium">{name}</div>
                <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <span className="truncate">{email}</span>
                  {verified && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-base font-medium">Bem-vinda à Rinnovare</div>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/auth"
                  onClick={close}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-4 py-2 text-xs uppercase tracking-widest text-primary-foreground transition hover:opacity-90"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth"
                  onClick={close}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-border px-4 py-2 text-xs uppercase tracking-widest transition hover:bg-muted"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-2">
          <nav className="px-2">
            <Row icon={Home} label="Home" to="/" onClick={close} />
            <Row icon={Info} label="Sobre" to="/" hash="sobre" onClick={close} />
            {user && isAdmin && (
              <Row icon={LayoutGrid} label="Painel Admin" to="/admin" onClick={close} />
            )}
            {user && (
              <>
                <Row icon={Bell} label="Notificações" to="/perfil/locacoes" onClick={close} badge={pendingCount} />
                <Row icon={UserCog} label="Minha Conta" to="/perfil" onClick={close} />
              </>
            )}
            <Row icon={MessageSquareHeart} label="Dê sua opinião" href={SUPPORT_MAILTO} onClick={close} />
          </nav>

          <Separator className="my-2" />

          <div className="px-5 pt-2 pb-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
            Categorias em destaque
          </div>
          <nav className="px-2">
            {CATEGORY_OPTIONS.map((cat) => (
              <a
                key={cat}
                href={`/?cat=${encodeURIComponent(cat)}#categorias`}
                onClick={close}
                className="block"
              >
                <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition rounded-lg">
                  <span className="flex-1 text-sm">{cat}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </a>
            ))}
            <Link to="/" hash="categorias" onClick={close} className="block">
              <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition rounded-lg">
                <span className="flex-1 text-sm font-medium text-primary">Todas as Categorias</span>
                <ChevronRight className="h-4 w-4 text-primary" />
              </div>
            </Link>
          </nav>

          <Separator className="my-2" />

          <nav className="px-2 pb-4">
            {user && (
              <>
                <Row
                  icon={ClipboardList}
                  label="Minhas Locações"
                  to="/perfil/locacoes"
                  onClick={close}
                  rightExtra={
                    <span className="text-[11px] text-muted-foreground mr-1">Saldo: {saldoFmt}</span>
                  }
                />
                <Row icon={CalendarHeart} label="Meus Eventos" to="/perfil/eventos" onClick={close} />
              </>
            )}
            <Row icon={HelpCircle} label="Ajuda" href={SUPPORT_WHATSAPP} onClick={close} />
          </nav>
        </div>

        {user && (
          <div className="border-t p-3">
            <button
              type="button"
              onClick={handleSignOut}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm",
                "border border-border hover:bg-muted transition"
              )}
            >
              <LogOut className="h-4 w-4" /> Sair
            </button>
          </div>
        )}
      </SheetContent>
      </Sheet>
    </>
  );
}
