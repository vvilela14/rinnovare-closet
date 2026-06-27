import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import logoUrl from "@/assets/rinnovare-logo-wordmark.png";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [{ title: "Esqueci minha senha — Rinnovare Closet" }],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      // Always show success, regardless of whether the e-mail exists,
      // to avoid leaking which addresses are registered.
      setSent(true);
    } catch {
      setError("Algo deu errado. Tente novamente em alguns instantes.");
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
            <img src={logoUrl} alt="Rinnovare" className="h-10" />
          </Link>

          {sent ? (
            <>
              <h1 className="text-3xl">Verifique seu e-mail</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Se <strong>{email}</strong> estiver cadastrado, você vai receber um link para redefinir sua senha em
                poucos minutos. Não esqueça de checar a caixa de spam.
              </p>
              <Link
                to="/auth"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-border py-3.5 text-xs uppercase tracking-[0.2em] transition hover:bg-muted"
              >
                Voltar para o login
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-3xl">Esqueci minha senha</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Digite o e-mail usado no cadastro. Vamos te enviar um link para criar uma nova senha.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    E-mail
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-full border border-border bg-transparent px-4 py-3 text-sm outline-none focus:border-primary"
                  />
                </label>

                {error && <p className="text-xs text-destructive">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-primary py-3.5 text-xs uppercase tracking-[0.2em] text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? "Enviando..." : "Enviar link de redefinição"}
                </button>
              </form>

              <Link to="/auth" className="mt-6 block w-full text-center text-xs text-muted-foreground hover:text-foreground">
                Voltar para o login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
