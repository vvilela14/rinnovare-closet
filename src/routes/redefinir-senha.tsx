import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Eye, EyeOff, Check, X } from "lucide-react";
import logoUrl from "@/assets/rinnovare-logo-wordmark.png";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [{ title: "Redefinir senha — Rinnovare Closet" }],
  }),
  component: ResetPasswordPage,
});

const REQUIREMENTS = [
  { key: "length", label: "Mínimo de 8 caracteres", test: (v: string) => v.length >= 8 },
  { key: "upper", label: "Uma letra maiúscula", test: (v: string) => /[A-Z]/.test(v) },
  { key: "lower", label: "Uma letra minúscula", test: (v: string) => /[a-z]/.test(v) },
  { key: "special", label: "Um caractere especial (ex: !@#$%)", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const readyRef = useRef(false);

  useEffect(() => {
    // supabase-js parses the recovery tokens from the URL hash on load and
    // emits PASSWORD_RECOVERY once the session from the e-mail link is set.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        readyRef.current = true;
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        readyRef.current = true;
        setReady(true);
      }
    });

    const timeout = setTimeout(() => {
      if (!readyRef.current) setInvalidLink(true);
    }, 4000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const unmetRequirements = REQUIREMENTS.filter((r) => !r.test(password));
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = unmetRequirements.length === 0 && passwordsMatch && !busy;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha redefinida com sucesso!");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message ?? "Não foi possível redefinir a senha. Tente solicitar um novo link.");
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
        </div>
        <p className="text-xs uppercase tracking-[0.25em] text-white/50">Para todas as ocasiões</p>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-10 inline-block lg:hidden">
            <img src={logoUrl} alt="Rinnovare" className="h-10" />
          </Link>

          {invalidLink && !ready ? (
            <>
              <h1 className="text-3xl">Link inválido ou expirado</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Esse link de redefinição não é mais válido. Solicite um novo.
              </p>
              <Link
                to="/esqueci-senha"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90"
              >
                Solicitar novo link
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-3xl">Criar nova senha</h1>
              <p className="mt-2 text-sm text-muted-foreground">Escolha uma senha forte para sua conta.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Nova senha
                  </span>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-full border border-border bg-transparent px-4 py-3 pr-11 text-sm outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Confirmar senha
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <span className="mt-1.5 block text-[11px] text-destructive">As senhas não coincidem.</span>
                  )}
                </label>

                <ul className="space-y-1.5 rounded-2xl border border-border p-4">
                  {REQUIREMENTS.map((r) => {
                    const met = r.test(password);
                    return (
                      <li key={r.key} className={`flex items-center gap-2 text-xs ${met ? "text-emerald-600" : "text-muted-foreground"}`}>
                        {met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        {r.label}
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full rounded-full bg-primary py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Salvando..." : "Salvar nova senha"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
