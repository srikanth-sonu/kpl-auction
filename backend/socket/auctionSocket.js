console.log("auctionSocket loaded");

const db = require("../db");

module.exports = (io, socket) => {
  console.log("auctionSocket initialized for", socket.id);

  // START AUCTION
  socket.on("auction:start", ({ auctionId }) => {
    console.log("auction:start", auctionId);

    db.run(`UPDATE auctions SET status='LIVE' WHERE id=?`, [auctionId]);
    db.run(`UPDATE auction_state SET is_live=1 WHERE auction_id=?`, [auctionId]);

    io.emit("auction:update", { status: "LIVE" });
  });

  // SET PLAYER
  socket.on("player:set", ({ auctionId, playerName, basePrice }) => {
    console.log("player:set", playerName, basePrice);

    db.run(
      `UPDATE auction_state
       SET current_player_name=?, current_price=?
       WHERE auction_id=?`,
      [playerName, basePrice, auctionId]
    );

    io.emit("player:update", {
      playerName,
      currentPrice: basePrice,
    });
  });

  // INCREASE BID
  socket.on("bid:increase", ({ auctionId }) => {
    db.get(
      `SELECT current_price FROM auction_state WHERE auction_id=?`,
      [auctionId],
      (err, row) => {
        if (!row) return;

        const increment = row.current_price < 1000 ? 100 : 200;
        const newPrice = row.current_price + increment;

        db.run(
          `UPDATE auction_state SET current_price=? WHERE auction_id=?`,
          [newPrice, auctionId]
        );

        io.emit("player:update", { currentPrice: newPrice });
      }
    );
  });

  // DECREASE BID ✅ (FIXED LOCATION)
  socket.on("bid:decrease", ({ auctionId }) => {
    db.get(
      `SELECT current_price FROM auction_state WHERE auction_id=?`,
      [auctionId],
      (err, row) => {
        if (!row || row.current_price <= 500) return;

        const decrement = row.current_price > 1000 ? 200 : 100;
        const newPrice = Math.max(500, row.current_price - decrement);

        db.run(
          `UPDATE auction_state SET current_price=? WHERE auction_id=?`,
          [newPrice, auctionId]
        );

        io.emit("player:update", { currentPrice: newPrice });
      }
    );
  });

  // SELL PLAYER
  socket.on("player:sell", ({ auctionId, teamId }) => {
    db.get(
      `SELECT current_player_name, current_price
       FROM auction_state WHERE auction_id=?`,
      [auctionId],
      (err, state) => {
        if (!state || !state.current_player_name) return;

        db.get(
          `SELECT remaining_budget FROM teams WHERE id=?`,
          [teamId],
          (err, team) => {
            if (!team) return;

            if (team.remaining_budget < state.current_price) {
              socket.emit("error", {
                message: "Insufficient budget",
              });
              return;
            }

            const newRemaining =
              team.remaining_budget - state.current_price;

            db.run(
              `UPDATE teams SET remaining_budget=? WHERE id=?`,
              [newRemaining, teamId]
            );

            db.run(
              `INSERT INTO players
               (auction_id, name, sold_price, team_id, status)
               VALUES (?, ?, ?, ?, 'SOLD')`,
              [
                auctionId,
                state.current_player_name,
                state.current_price,
                teamId,
              ]
            );

            db.run(
              `UPDATE auction_state
               SET current_player_name=NULL, current_price=0
               WHERE auction_id=?`,
              [auctionId]
            );

            io.emit("player:sold", {
              playerName: state.current_player_name,
              soldPrice: state.current_price,
              teamId,
              remainingBudget: newRemaining,
            });
          }
        );
      }
    );
  });
};
