import React, { useEffect, useState } from "react";
import { apiFetch } from "./api.js";
import BrandLogo from "./components/BrandLogo.jsx";
import AppGlassLayout from "./components/AppGlassLayout.jsx";
import { BRAND_TAGLINE } from "./brand.js";

const HIGHLIGHTS = [
  {
    title: "Backlog inteligente",
    desc: "Escopo macro, micros e tasks prontas para a equipe avançar.",
  },
  {
    title: "Execução visível",
    desc: "Kanban, bots e log em tempo real — sempre por dentro do progresso.",
  },
  {
    title: "Do plano ao deploy",
    desc: "Git, PRs e entrega integrados no mesmo fluxo de trabalho.",
  },
];

const PIPELINE = ["Escopo", "Tasks", "Dev", "Deploy"];

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

function IconLock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 11V8.5a4 4 0 1 1 8 0V11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEye({ open }) {
  if (open) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 12s3.5-6 9-6c2.2 0 4.1.9 5.5 2M21 12s-3.5 6-9 6c-2.2 0-4.1-.9-5.5-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M9.5 9.5 14.5 14.5M14.5 9.5 9.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * @param {{ onLoggedIn: (data: object) => void }} props
 */
export default function LoginPage({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefill = new URLSearchParams(window.location.search).get("email")?.trim();
    if (prefill) setEmail(prefill);
    if (new URLSearchParams(window.location.search).get("blocked") === "1") {
      setError("Empresa bloqueada. Contate o suporte da plataforma.");
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "account_locked") {
          throw new Error(
            "Conta bloqueada após várias tentativas. Contate o auditor da sua empresa."
          );
        }
        if (data.code === "tenant_blocked") {
          throw new Error(
            data.error || "Empresa bloqueada. Contate o suporte da plataforma."
          );
        }
        if (data.code === "invalid_credentials" || res.status === 401) {
          throw new Error("Email ou senha incorrectos.");
        }
        throw new Error(data.error || data.code || res.statusText);
      }
      onLoggedIn(data);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppGlassLayout>
      <div className="login-page">
        <div className="login-shell">
          <div className="login-shell__glow" aria-hidden />

          <aside className="login-shell__story">
            <p className="login-shell__eyebrow">{BRAND_TAGLINE}</p>
            <h1 className="login-shell__title">
              IA que <span>entrega</span>.
            </h1>
            <p className="login-shell__copy">
              Planejamento, execução e deploy em um único painel — sua fábrica de
              software, sempre sob controle.
            </p>

            <div className="login-pipeline" aria-hidden>
              {PIPELINE.map((step, i) => (
                <React.Fragment key={step}>
                  <div className="login-pipeline__step" style={{ animationDelay: `${i * 0.35}s` }}>
                    <span className="login-pipeline__dot" />
                    <span className="login-pipeline__label">{step}</span>
                  </div>
                  {i < PIPELINE.length - 1 && (
                    <span className="login-pipeline__line" style={{ animationDelay: `${i * 0.35}s` }} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <ul className="login-shell__highlights">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title} className="login-shell__highlight">
                  <span className="login-shell__highlight-icon">✓</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          <div className="login-shell__pane">
            <div className="login-shell__pane-glow" aria-hidden />
            <form className="login-form" onSubmit={handleSubmit}>
              <header className="login-form__header">
                <a href="/" className="login-form__brand">
                  <BrandLogo variant="lockup" className="login-form__logo" />
                </a>
                <h2 className="login-form__heading">Acesse sua fábrica</h2>
                <p className="login-form__subtitle">
                  Entre com seu email e senha para continuar construindo.
                </p>
              </header>

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
                    />
                  </span>
                </label>

                <label className="login-input">
                  <span className="login-input__label">Senha</span>
                  <span className="login-input__wrap login-input__wrap--password">
                    <span className="login-input__icon">
                      <IconLock />
                    </span>
                    <input
                      className="login-input__control"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="login-input__toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      <IconEye open={showPassword} />
                    </button>
                  </span>
                </label>

                <p className="login-form__forgot">
                  <a href="/forgot-password">Esqueci minha senha</a>
                </p>
              </div>

              {error && <p className="msg msg--error login-form__error">{error}</p>}

              <button type="submit" className="login-submit" disabled={loading}>
                <span>{loading ? "Entrando…" : "Entrar na plataforma"}</span>
                {!loading && <IconArrow />}
              </button>

              <footer className="login-form__footer">
                <p className="login-form__signup">
                  Ainda não tem conta?{" "}
                  <a href="/#precos">Ver planos e começar</a>
                </p>
                <div className="login-form__chips" aria-hidden>
                  <span>Backlog</span>
                  <span>Execução</span>
                  <span>Deploy</span>
                </div>
              </footer>
            </form>
          </div>
        </div>
      </div>
    </AppGlassLayout>
  );
}
