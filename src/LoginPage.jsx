import React, { useState } from "react";
import { apiFetch, setToken } from "./api.js";

/**
 * @param {{ onLoggedIn: () => void }} props
 */
export default function LoginPage({ onLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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
        throw new Error(data.error || data.code || res.statusText);
      }
      setToken(data.token);
      onLoggedIn();
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>AI Factory</h1>
        <p className="login-subtitle">Entre com o seu email e a senha mestra.</p>
        <label>
          Email
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="msg msg--error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
