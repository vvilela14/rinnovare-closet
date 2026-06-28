import { useEffect, useRef, useState } from "react";
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
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
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
  const isMobile = useIsMobile();
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

  useEffect(() => {
    if (isMobile) {
      document.body.classList.remove("has-side-menu-bar");
      return;
    }
    document.body.classList.add("has-side-menu-bar");
    return () => document.body.classList.remove("has-side-menu-bar");
  }, [isMobile]);

  const close = () => setOpen(false);

  // Swipe left-to-right to close the mobile drawer (it opens from the right,
  // so dragging toward the right edge mimics pushing it back out).
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  function handleTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (dx > 60 && Math.abs(dy) < 60) close();
  }

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
      {isMobile ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`fixed right-4 top-16 z-[60] flex items-center gap-2 rounded-full border border-border bg-background/95 p-2 shadow-lg backdrop-blur transition-all duration-200 hover:shadow-xl active:scale-90 ${open ? "scale-90 opacity-80" : "scale-100"}`}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
          <span className="relative">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={profile?.avatar_url ?? undefined} alt={name} />
              <AvatarFallback className="text-xs">{user ? initialsOf(name, email) : "?"}</AvatarFallback>
            </Avatar>
            {pendingCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-semibold text-white ring-2 ring-background">
                {pendingCount > 9 ? "9+" : pendingCount}
              </span>
            )}
          </span>
          <MenuIcon className={`h-5 w-5 text-foreground/80 transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="fixed inset-y-0 left-0 z-[60] flex w-14 flex-col items-center justify-start gap-3 border-r border-border bg-background/95 pt-5 shadow-lg backdrop-blur transition hover:shadow-xl"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
        >
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
          <MenuIcon className={`h-5 w-5 text-foreground/80 transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
        </button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side={isMobile ? "right" : "left"}
        className={cn("w-full max-w-sm p-0 flex flex-col", !isMobile && "pl-14")}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
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
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  to="/auth"
                  onClick={close}
                  className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs uppercase tracking-widest text-primary-foreground transition hover:opacity-90"
                >
                  Entrar
                </Link>
                <Link
                  to="/auth"
                  onClick={close}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-white px-4 py-2 text-xs uppercase tracking-widest text-foreground transition hover:bg-muted"
                >
                  Criar Conta
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
