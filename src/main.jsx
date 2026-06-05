import React, { useLayoutEffect } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import LandingPage from "./landing/LandingPage.jsx";
import { SessionProvider } from "./SessionContext.jsx";
import { SocketProvider } from "./useSocket.jsx";
import { clearToken, isLoggedIn, setToken } from "./api.js";

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

function AppRoute() {
  if (!isLoggedIn()) {
    return <Redirect to="/login" />;
  }

  function handleLogout() {
    clearToken();
    window.location.replace("/login");
  }

  return (
    <SocketProvider>
      <SessionProvider onLogout={handleLogout}>
        <App onLogout={handleLogout} />
      </SessionProvider>
    </SocketProvider>
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

  if (path === "/app") {
    return <AppRoute />;
  }

  return <Redirect to="/" />;
}

createRoot(document.getElementById("root")).render(<Root />);
