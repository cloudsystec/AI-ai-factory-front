import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import { clearToken, isLoggedIn } from "./api.js";

function Root() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  if (!loggedIn) {
    return <LoginPage onLoggedIn={() => setLoggedIn(true)} />;
  }

  return (
    <App
      onLogout={() => {
        clearToken();
        setLoggedIn(false);
      }}
    />
  );
}

createRoot(document.getElementById("root")).render(<Root />);
