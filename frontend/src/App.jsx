import { useEffect, useState } from "react";
import { getSocket } from "./services/socket";
import api from "./services/api";

function App() {
  const [auctions, setAuctions] = useState([]);
  const [auctionId, setAuctionId] = useState(null);

  const [playerName, setPlayerName] = useState("");
  const [currentPlayer, setCurrentPlayer] = useState("");
  const [currentPrice, setCurrentPrice] = useState(0);

  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");

  useEffect(() => {
    // Load auctions
    api.get("/api/auction")
      .then(res => setAuctions(res.data))
      .catch(() => console.log("Failed to load auctions"));
  }, []);

  useEffect(() => {
    if (!auctionId) return;

    const socket = getSocket();

    // Rehydrate auction state
    api.get(`/api/auction/${auctionId}/state`).then(res => {
      const { currentPlayer, currentPrice } = res.data;
      if (currentPlayer) {
        setCurrentPlayer(currentPlayer);
        setPlayerName(currentPlayer);
      }
      if (currentPrice) setCurrentPrice(currentPrice);
    });

    // Load teams
    api.get(`/api/auction/${auctionId}/teams`)
      .then(res => setTeams(res.data));

    const onPlayerUpdate = (data) => {
      if (data.playerName) setCurrentPlayer(data.playerName);
      if (data.currentPrice !== undefined)
        setCurrentPrice(data.currentPrice);
    };

    const onPlayerSold = (data) => {
      setCurrentPlayer("");
      setCurrentPrice(0);
      setPlayerName("");
      setSelectedTeam("");

      setTeams(prev =>
        prev.map(t =>
          t.id === data.teamId
            ? { ...t, remaining_budget: data.remainingBudget }
            : t
        )
      );
    };

    socket.on("player:update", onPlayerUpdate);
    socket.on("player:sold", onPlayerSold);

    return () => {
      socket.off("player:update", onPlayerUpdate);
      socket.off("player:sold", onPlayerSold);
    };
  }, [auctionId]);

  if (!auctionId) {
    return (
      <div style={{ padding: 20 }}>
        <h1>Select Auction</h1>

        <select onChange={(e) => setAuctionId(Number(e.target.value))}>
          <option value="">-- Select Auction --</option>
          {auctions.map(a => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.status})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>KPL Auction – Admin Panel</h1>

      <button onClick={() =>
        getSocket().emit("auction:start", { auctionId })
      }>
        Start Auction
      </button>

      <hr />

      <input
        placeholder="Player Name"
        value={playerName}
        onChange={e => setPlayerName(e.target.value)}
      />
      <button onClick={() =>
        getSocket().emit("player:set", {
          auctionId,
          playerName,
          basePrice: 500
        })
      }>
        Set Player
      </button>

      <hr />

      <h2>Current Player: {currentPlayer || "None"}</h2>
      <h3>Current Price: ₹{currentPrice}</h3>

      <button onClick={() =>
        getSocket().emit("bid:increase", { auctionId })
      }>
        Increase Bid
      </button>

      <button onClick={() =>
        getSocket().emit("bid:decrease", { auctionId })
      } style={{ marginLeft: 10 }}>
        Decrease Bid
      </button>

      <hr />

      <h3>Sell Player</h3>

      <select
        value={selectedTeam}
        onChange={e => setSelectedTeam(e.target.value)}
      >
        <option value="">Select Team</option>
        {teams.map(team => (
          <option key={team.id} value={team.id}>
            {team.name} (₹{team.remaining_budget})
          </option>
        ))}
      </select>

      <button
        disabled={!selectedTeam}
        onClick={() =>
          getSocket().emit("player:sell", {
            auctionId,
            teamId: Number(selectedTeam)
          })
        }
        style={{ marginLeft: 10 }}
      >
        Sell Player
      </button>
    </div>
  );
}

export default App;
