import { useEffect, useState } from "react";
import api from "./services/api";
import { getSocket } from "./services/socket";

function App() {
  /* =====================
     AUTH
  ===================== */
  const [loggedIn, setLoggedIn] = useState(
    localStorage.getItem("admin_logged") === "true"
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  /* =====================
     CREATE AUCTION
  ===================== */
  const [newAuctionName, setNewAuctionName] = useState("");
  const [newTeams, setNewTeams] = useState("");
  const [newBudget, setNewBudget] = useState(0);

  /* =====================
     AUCTION DATA
  ===================== */
  const [auctions, setAuctions] = useState([]);
  const [auctionId, setAuctionId] = useState("");

  /* =====================
     PLAYER & BID
  ===================== */
  const [playerName, setPlayerName] = useState("");
  const [basePrice, setBasePrice] = useState(500);
  const [currentPrice, setCurrentPrice] = useState(0);

  /* =====================
     TEAMS
  ===================== */
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  /* =====================
     LOGIN SCREEN
  ===================== */
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
    window.location.reload();
  }}
>
  Login
</button>

      </div>
    );
  }

  /* =====================
     LOAD AUCTIONS
  ===================== */
  useEffect(() => {
    api.get("/api/auction")
      .then((res) => setAuctions(res.data))
      .catch(() => setAuctions([]));
  }, []);

  /* =====================
     SOCKET
  ===================== */
  useEffect(() => {
    const socket = getSocket();

    socket.on("player:update", (data) => {
      setCurrentPrice(data.currentPrice);
    });

    return () => socket.disconnect();
  }, []);

  /* =====================
     LOAD TEAMS
  ===================== */
  useEffect(() => {
    if (!auctionId) return;
    api.get(`/api/auction/${auctionId}/teams`)
      .then((res) => setTeams(res.data));
  }, [auctionId]);

  /* =====================
     UI
  ===================== */
  return (
    <div style={{ padding: 40 }}>
      <h1>KPL Auction – Admin Panel</h1>

      <button
  onClick={() => {
    localStorage.clear();
    window.location.reload();
  }}
>
  Logout
</button>


      <hr />

      {/* CREATE AUCTION */}
      <h3>Create Auction</h3>
      <input
        placeholder="Auction Name"
        value={newAuctionName}
        onChange={(e) => setNewAuctionName(e.target.value)}
      />
      <br /><br />

      <input
        placeholder="Teams (comma separated)"
        value={newTeams}
        onChange={(e) => setNewTeams(e.target.value)}
      />
      <br /><br />

      <input
        type="number"
        placeholder="Budget per team"
        value={newBudget}
        onChange={(e) => setNewBudget(Number(e.target.value))}
      />
      <br /><br />

      <button
        onClick={() =>
          api.post("/api/auction", {
            name: newAuctionName,
            teams: newTeams.split(",").map(t => t.trim()),
            budget: newBudget,
          }).then(() => window.location.reload())
        }
      >
        Create Auction
      </button>

      <hr />

      {/* SELECT AUCTION */}
      <h3>Select Auction</h3>
      <select value={auctionId} onChange={(e) => setAuctionId(e.target.value)}>
        <option value="">-- Select --</option>
        {auctions.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} ({a.status})
          </option>
        ))}
      </select>

      <hr />

      {/* SET PLAYER */}
      <h3>Set Player</h3>
      <input
        placeholder="Player Name"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <input
        type="number"
        value={basePrice}
        onChange={(e) => setBasePrice(Number(e.target.value))}
      />
      <button
        onClick={() =>
          api.post(`/api/auction/${auctionId}/set-player`, {
            playerName,
            basePrice,
          })
        }
      >
        Set Player
      </button>

      <hr />

      {/* BID CONTROLS */}
      <h3>Bid Controls</h3>
      <p>Current Price: ₹{currentPrice}</p>

      <button onClick={() =>
        api.post(`/api/auction/${auctionId}/bid`, { amount: currentPrice + 100 })
      }>
        +100
      </button>

      <button onClick={() =>
        api.post(`/api/auction/${auctionId}/bid`, { amount: currentPrice + 200 })
      }>
        +200
      </button>

      <button onClick={() =>
        api.post(`/api/auction/${auctionId}/bid`, {
          amount: Math.max(basePrice, currentPrice - 100),
        })
      }>
        -100
      </button>

      <hr />

      {/* SELL PLAYER */}
      <h3>Sell Player</h3>
      <select
        value={selectedTeam}
        onChange={(e) => setSelectedTeam(e.target.value)}
      >
        <option value="">-- Select Team --</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} (₹{t.remaining_budget})
          </option>
        ))}
      </select>

      <button
        onClick={() =>
          api.post(`/api/auction/${auctionId}/sell`, {
            teamId: selectedTeam,
            playerName,
            soldPrice: currentPrice,
          }).then(() => {
            setPlayerName("");
            setCurrentPrice(0);
            setSelectedTeam("");
          })
        }
      >
        Sell Player
      </button>
    </div>
  );
}

export default App;
