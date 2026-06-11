import React, { useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import "./styles/app-glass-theme.css";
import "./styles/tutorial.css";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import ForgotPasswordPage from "./ForgotPasswordPage.jsx";
import ChangePasswordPage from "./ChangePasswordPage.jsx";
import LandingPage from "./landing/LandingPage.jsx";
import TutorialExperience from "./tutorial/TutorialExperience.jsx";
import { SessionProvider, useSession } from "./SessionContext.jsx";
import { SocketProvider } from "./useSocket.jsx";
import { clearToken, isLoggedIn, setToken } from "./api.js";
import { clearAllDashboardProjectStorage } from "./lib/dashboardProjectSelection.js";

function normalizePath() {
  return window.location.pathname.replace(/\/$/, "") || "/";
}

function Redirect({ to }) {
  useLayoutEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}

function LoginRoute() {
  if (isLoggedIn()) {
    return <Redirect to="/app" />;
  }

  return (
    <LoginPage
      onLoggedIn={(data) => {
        setToken(data.token);
        window.location.replace("/app");
      }}
    />
  );
}

function AppGate({ onLogout }) {
  const { session, loading, completeTutorial, setFromLogin, refresh } = useSession();

  if (loading) {
    return (
      <div
        className="ux-dashboard min-h-screen flex items-center justify-center"
        style={{ color: "#94a3b8", background: "#04071a" }}
      >
        A carregar…
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className="ux-dashboard min-h-screen flex flex-col items-center justify-center gap-3 px-6"
        style={{ color: "#94a3b8", background: "#04071a" }}
      >
        <p>Não foi possível carregar a sessão.</p>
        <button
          type="button"
          className="tutorial-btn tutorial-btn--primary"
          onClick={onLogout}
        >
          Voltar ao login
        </button>
      </div>
    );
  }

  if (session.mustChangePassword) {
    return (
      <ChangePasswordPage
        onLogout={onLogout}
        onPasswordChanged={(data) => {
          setFromLogin({ ...session, ...data, mustChangePassword: false });
          refresh();
        }}
      />
    );
  }

  const showTutorial =
    session?.role === "executor" && session?.tutorialPending === true;

  if (showTutorial) {
    return (
      <TutorialExperience
        onFinish={completeTutorial}
        onLogout={onLogout}
      />
    );
  }

  return (
    <SocketProvider>
      <App onLogout={onLogout} />
    </SocketProvider>
  );
}

function AppRoute() {
  if (!isLoggedIn()) {
    return <Redirect to="/login" />;
  }

  function handleLogout() {
    clearAllDashboardProjectStorage();
    clearToken();
    window.location.replace("/login");
  }

  return (
    <SessionProvider onLogout={handleLogout}>
      <AppGate onLogout={handleLogout} />
    </SessionProvider>
  );
}

function Root() {
  const path = normalizePath();

  if (path === "/landingpage") {
    return <Redirect to="/" />;
  }

  if (path === "/") {
    return <LandingPage />;
  }

  if (path === "/login") {
    return <LoginRoute />;
  }

  if (path === "/forgot-password") {
    if (isLoggedIn()) {
      return <Redirect to="/app" />;
    }
    return <ForgotPasswordPage />;
  }

  if (path === "/app") {
    document.body.classList.add("app-body");
    return <AppRoute />;
  }

  return <Redirect to="/" />;
}

createRoot(document.getElementById("root")).render(<Root />);
