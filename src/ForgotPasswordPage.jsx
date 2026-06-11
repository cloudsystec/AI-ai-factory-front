import React, { useState } from "react";
import { apiFetch } from "./api.js";
import BrandLogo from "./components/BrandLogo.jsx";
import AppGlassLayout from "./components/AppGlassLayout.jsx";

function IconMail() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="m5 8 7 5.5L19 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || res.statusText);
      }
      setSent(true);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppGlassLayout>
      <div className="login-page">
        <div className="login-shell login-shell--narrow">
          <div className="login-shell__glow" aria-hidden />
          <div className="login-shell__pane">
            <div className="login-shell__pane-glow" aria-hidden />
            <form className="login-form" onSubmit={handleSubmit}>
              <header className="login-form__header">
                <a href="/" className="login-form__brand">
                  <BrandLogo variant="lockup" className="login-form__logo" />
                </a>
                <h2 className="login-form__heading">Esqueci minha senha</h2>
                <p className="login-form__subtitle">
                  Informe o email da sua conta. Se existir na nossa base, enviaremos
                  instruções com uma senha temporária.
                </p>
              </header>

              {sent ? (
                <div className="login-form__fields">
                  <p className="msg msg--ok">
                    Se o email existir na nossa base, receberá instruções em breve.
                    Verifique a caixa de entrada e o spam.
                  </p>
                  <p className="login-form__subtitle">
                    Contas bloqueadas devem contactar o auditor da empresa para
                    desbloqueio.
                  </p>
                  <a href="/login" className="login-submit login-submit--link">
                    Voltar ao login
                  </a>
                </div>
              ) : (
                <>
                  <div className="login-form__fields">
                    <label className="login-input">
                      <span className="login-input__label">Email</span>
                      <span className="login-input__wrap">
                        <span className="login-input__icon">
                          <IconMail />
                        </span>
                        <input
                          className="login-input__control"
                          type="email"
                          autoComplete="username"
                          placeholder="voce@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoFocus
                        />
                      </span>
                    </label>
                  </div>

                  {error && (
                    <p className="msg msg--error login-form__error">{error}</p>
                  )}

                  <button type="submit" className="login-submit" disabled={loading}>
                    <span>{loading ? "A enviar…" : "Enviar instruções"}</span>
                  </button>

                  <footer className="login-form__footer">
                    <p className="login-form__signup">
                      <a href="/login">Voltar ao login</a>
                    </p>
                  </footer>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </AppGlassLayout>
  );
}
