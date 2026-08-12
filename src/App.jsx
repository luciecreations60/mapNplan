import React, { useState } from "react";
import { useAuth } from "./auth/AuthContext";

export default function App() {
  const { user, isAuthenticated, login, logout } = useAuth();
  const [email, setEmail] = useState("");

  if (!isAuthenticated) {
    return (
      <div style={{ padding: 24 }}>
        <h1>Login</h1>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button
          onClick={() => {
            if (!email.trim()) return alert("Email requis");
            login(email.trim());
          }}
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>mapNplan</h1>
      <p>Connecté : {user?.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
