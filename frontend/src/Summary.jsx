import { useEffect, useState } from "react";
import api from "./services/api";

function Summary() {
  const params = new URLSearchParams(window.location.search);
  const auctionId = Number(params.get("auctionId"));

  const [summary, setSummary] = useState([]);

  useEffect(() => {
    if (!auctionId) return;

    api
      .get(`/api/auction/${auctionId}/summary`)
      .then((res) => setSummary(res.data))
      .catch(() => console.log("Failed to load summary"));
  }, [auctionId]);

  if (!auctionId) {
    return <h2>Invalid Auction</h2>;
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>Auction Summary</h1>
      <a
  href={`http://localhost:4000/api/auction/${auctionId}/export`}
  style={{
    display: "inline-block",
    marginBottom: 20,
    padding: "10px 15px",
    background: "#4CAF50",
    color: "#fff",
    textDecoration: "none",
    borderRadius: 5,
  }}
>
  Download CSV
</a>


      {summary.map((team) => (
        <div
          key={team.teamName}
          style={{
            border: "1px solid #ccc",
            marginBottom: 20,
            padding: 15,
          }}
        >
          <h2>{team.teamName}</h2>
          <p><strong>Total Spent:</strong> ₹{team.totalSpent}</p>
          <p><strong>Remaining Budget:</strong> ₹{team.remainingBudget}</p>

          <h4>Players</h4>

          {team.players.length === 0 ? (
            <p>No players bought</p>
          ) : (
            <ul>
              {team.players.map((p, index) => (
                <li key={index}>
                  {p.name} – ₹{p.price}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

export default Summary;
