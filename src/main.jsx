import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./App.css";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import { SessionProvider } from "./SessionContext.jsx";
import { SocketProvider } from "./useSocket.jsx";
import { clearToken, isLoggedIn, setToken } from "./api.js";

function Root() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [loginPayload, setLoginPayload] = useState(null);

  if (!loggedIn) {
    return (
      <LoginPage
        onLoggedIn={(data) => {
          setToken(data.token);
          setLoginPayload(data);
          setLoggedIn(true);
        }}
      />
    );
  }

  return (
    <SocketProvider>
      <SessionProvider
        initialLogin={loginPayload}
        onLogout={() => {
          clearToken();
          setLoginPayload(null);
          setLoggedIn(false);
        }}
      >
        <App
          onLogout={() => {
            clearToken();
            setLoginPayload(null);
            setLoggedIn(false);
          }}
        />
      </SessionProvider>
    </SocketProvider>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
