import { useEffect, useState } from "react";
import { getSocket } from "./services/socket";
import api from "./services/api";

function PublicView() {
  const params = new URLSearchParams(window.location.search);
  const auctionId = Number(params.get("auctionId"));

  const [currentPlayer, setCurrentPlayer] = useState("");
  const [currentPrice, setCurrentPrice] = useState(0);
  const [lastSold, setLastSold] = useState(null);

  useEffect(() => {
    if (!auctionId) return;

    const socket = getSocket();

    // Rehydrate auction state
    api.get(`/api/auction/${auctionId}/state`).then((res) => {
      const { currentPlayer, currentPrice } = res.data;
      if (currentPlayer) setCurrentPlayer(currentPlayer);
      if (currentPrice) setCurrentPrice(currentPrice);
    });

    const onPlayerUpdate = (data) => {
      setLastSold(null);
      if (data.playerName) setCurrentPlayer(data.playerName);
      if (data.currentPrice !== undefined)
        setCurrentPrice(data.currentPrice);
    };

    const onPlayerSold = (data) => {
      setLastSold({
        name: data.playerName,
        price: data.soldPrice,
      });
      setCurrentPlayer("");
      setCurrentPrice(0);
    };

    socket.on("player:update", onPlayerUpdate);
    socket.on("player:sold", onPlayerSold);

    return () => {
      socket.off("player:update", onPlayerUpdate);
      socket.off("player:sold", onPlayerSold);
    };
  }, [auctionId]);

  if (!auctionId) {
    return <h2>Invalid Auction</h2>;
  }

  return (
  <div
    style={{
      padding: 40,
      textAlign: "center",
      fontFamily: "Arial, sans-serif",
      background: "#f5f5f5",
      minHeight: "100vh",
    }}
  >
    <h1 style={{ fontSize: 40, marginBottom: 20 }}>
      KPL Auction – Live
    </h1>

    {/* BIDDING STATE */}
    {currentPlayer && (
      <div
        style={{
          background: "#fff",
          padding: 30,
          borderRadius: 10,
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: "#1976d2" }}>NOW BIDDING</h2>
        <p style={{ fontSize: 28 }}>
          <strong>Player:</strong> {currentPlayer}
        </p>
        <p style={{ fontSize: 36, color: "#2e7d32" }}>
          ₹{currentPrice}
        </p>
      </div>
    )}

    {/* SOLD STATE */}
    {!currentPlayer && lastSold && (
      <div
        style={{
          background: "#fff",
          padding: 30,
          borderRadius: 10,
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <h2 style={{ color: "#d32f2f" }}>SOLD</h2>
        <p style={{ fontSize: 28 }}>
          <strong>Player:</strong> {lastSold.name}
        </p>
        <p style={{ fontSize: 36, color: "#d32f2f" }}>
          ₹{lastSold.price}
        </p>
      </div>
    )}

    {/* IDLE */}
    {!currentPlayer && !lastSold && (
      <h2 style={{ marginTop: 40 }}>
        Waiting for next player…
      </h2>
    )}
  </div>
);

}

export default PublicView;
