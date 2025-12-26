import { useEffect, useState } from "react";
import api from "./services/api";

function App() {
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("admin_logged") === "true"
  );

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (!loggedIn) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Admin Login</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />

        <button
          onClick={() => {
            localStorage.setItem("admin_logged", "true");
            localStorage.setItem("admin_user", username);
            localStorage.setItem("admin_pass", password);
            setLoggedIn(true);
          }}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>KPL Auction – Admin Panel</h1>
      <p>You are logged in as Admin.</p>

      <button
        onClick={() => {
          localStorage.clear();
          setLoggedIn(false);
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default App;
