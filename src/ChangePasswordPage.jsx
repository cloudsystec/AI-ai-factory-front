import React, { useState } from "react";
import { apiFetch, setToken } from "./api.js";
import BrandLogo from "./components/BrandLogo.jsx";
import AppGlassLayout from "./components/AppGlassLayout.jsx";

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

/**
 * @param {{ onPasswordChanged: (data: object) => void, onLogout?: () => void }} props
 */
export default function ChangePasswordPage({ onPasswordChanged, onLogout }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || data.code || res.statusText);
      }
      if (data.token) {
        setToken(data.token);
      }
      onPasswordChanged(data);
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
                <h2 className="login-form__heading">Defina a sua nova senha</h2>
                <p className="login-form__subtitle">
                  Informe a senha temporária que recebeu por e-mail e escolha uma
                  nova senha (mínimo 8 caracteres).
                </p>
              </header>

              <div className="login-form__fields">
                <label className="login-input">
                  <span className="login-input__label">Senha atual (temporária)</span>
                  <span className="login-input__wrap login-input__wrap--password">
                    <span className="login-input__icon">
                      <IconLock />
                    </span>
                    <input
                      className="login-input__control"
                      type={showCurrent ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Senha recebida por e-mail"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      className="login-input__toggle"
                      onClick={() => setShowCurrent((v) => !v)}
                      aria-label={showCurrent ? "Ocultar senha" : "Mostrar senha"}
                    >
                      <IconEye open={showCurrent} />
                    </button>
                  </span>
                </label>

                <label className="login-input">
                  <span className="login-input__label">Nova senha</span>
                  <span className="login-input__wrap login-input__wrap--password">
                    <span className="login-input__icon">
                      <IconLock />
                    </span>
                    <input
                      className="login-input__control"
                      type={showNew ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="login-input__toggle"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? "Ocultar senha" : "Mostrar senha"}
                    >
                      <IconEye open={showNew} />
                    </button>
                  </span>
                </label>

                <label className="login-input">
                  <span className="login-input__label">Confirmar nova senha</span>
                  <span className="login-input__wrap">
                    <span className="login-input__icon">
                      <IconLock />
                    </span>
                    <input
                      className="login-input__control"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Repita a nova senha"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                  </span>
                </label>
              </div>

              {error && <p className="msg msg--error login-form__error">{error}</p>}

              <button type="submit" className="login-submit" disabled={loading}>
                <span>{loading ? "A guardar…" : "Guardar nova senha"}</span>
              </button>

              {onLogout && (
                <footer className="login-form__footer">
                  <p className="login-form__signup">
                    <button
                      type="button"
                      className="login-form__link-btn"
                      onClick={onLogout}
                    >
                      Sair e voltar ao login
                    </button>
                  </p>
                </footer>
              )}
            </form>
          </div>
        </div>
      </div>
    </AppGlassLayout>
  );
}
