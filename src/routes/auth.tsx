import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import logoAsset from "@/assets/rinnovare-logo.png.asset.json";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Rinnovare Closet" },
      { name: "description", content: "Acesse sua conta Rinnovare Closet para alugar vestidos, salvar favoritos e acompanhar seus pedidos." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleGoogle() {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result.error) { toast.error("Não foi possível entrar com Google"); setBusy(false); return; }
      if (result.redirected) return;
      navigate({ to: "/" });
    } catch {
      toast.error("Erro ao entrar com Google");
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Bem-vinda à Rinnovare.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vinda de volta!");
      }
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Algo deu errado");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between p-12 lg:flex" style={{ backgroundColor: "var(--deep-purple)" }}>
        <Link to="/" className="wordmark text-xl text-white">RINNOVARE</Link>
        <div className="text-white">
          <p className="font-script text-6xl" style={{ color: "var(--lilac)" }}>Closet</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Aluguel de vestidos para todas as ocasiões. Curadoria, elegância e renovação a cada festa.
          </p>
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-white/50">Para todas as ocasiões</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 inline-block lg:hidden">
            <img src={logoAsset.url} alt="Rinnovare" className="h-10" />
          </Link>
          <h1 className="text-3xl">{mode === "login" ? "Entrar" : "Criar conta"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login" ? "Acesse para favoritar e alugar." : "Cadastre-se e renove seu closet."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "signup" && (
              <Field label="Nome completo">
                <input required value={name} onChange={(e) => setName(e.target.value)} className="input" />
              </Field>
            )}
            <Field label="E-mail">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
            </Field>
            <Field label="Senha">
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
            </Field>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-primary py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "..." : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            {mode === "login" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
          </button>
        </div>
      </div>
      <style>{`
        .input {
          width: 100%;
          border: 1px solid var(--border);
          background: transparent;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          border-radius: 9999px;
          outline: none;
        }
        .input:focus { border-color: var(--primary); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
