const express = require("express");
const router = express.Router();
const db = require("../db");
const adminAuth = require("../middleware/adminAuth");

/* =========================
   CREATE AUCTION (ADMIN)
========================= */
router.post("/", adminAuth, (req, res) => {
  const { name, teams, budget } = req.body;

  db.run(
    "INSERT INTO auctions (name, status) VALUES (?, ?)",
    [name, "CREATED"],
    function (err) {
      if (err) return res.status(500).json(err);

      const auctionId = this.lastID;

      teams.forEach((team) => {
        db.run(
          "INSERT INTO teams (name, auction_id, remaining_budget) VALUES (?, ?, ?)",
          [team, auctionId, budget]
        );
      });

      res.json({ auctionId });
    }
  );
});

/* =========================
   START AUCTION (ADMIN)
========================= */
router.post("/:auctionId/start", adminAuth, (req, res) => {
  db.run(
    "UPDATE auctions SET status='LIVE' WHERE id=?",
    [req.params.auctionId],
    () => res.json({ success: true })
  );
});

/* =========================
   SET PLAYER (ADMIN)
========================= */
router.post("/:auctionId/set-player", adminAuth, (req, res) => {
  const { playerName, basePrice } = req.body;

  db.run(
    "UPDATE auctions SET current_player=?, current_price=? WHERE id=?",
    [playerName, basePrice, req.params.auctionId],
    () => res.json({ success: true })
  );
});

/* =========================
   PLACE BID (ADMIN)
========================= */
router.post("/:auctionId/bid", adminAuth, (req, res) => {
  const { amount } = req.body;

  db.run(
    "UPDATE auctions SET current_price=? WHERE id=?",
    [amount, req.params.auctionId],
    () => res.json({ success: true })
  );
});

/* =========================
   SELL PLAYER (ADMIN)
========================= */
router.post("/:auctionId/sell", adminAuth, (req, res) => {
  const { teamId, playerName, soldPrice } = req.body;

  db.run(
    "INSERT INTO players (name, sold_price, team_id, auction_id) VALUES (?, ?, ?, ?)",
    [playerName, soldPrice, teamId, req.params.auctionId],
    () => {
      db.run(
        "UPDATE teams SET remaining_budget = remaining_budget - ? WHERE id=?",
        [soldPrice, teamId],
        () => res.json({ success: true })
      );
    }
  );
});

/* =========================
   PUBLIC ROUTES (NO AUTH)
========================= */
router.get("/:auctionId/state", (req, res) => {
  db.get(
    "SELECT current_player, current_price FROM auctions WHERE id=?",
    [req.params.auctionId],
    (err, row) => res.json(row || {})
  );
});

router.get("/:auctionId/teams", (req, res) => {
  db.all(
    "SELECT * FROM teams WHERE auction_id=?",
    [req.params.auctionId],
    (err, rows) => res.json(rows)
  );
});

router.get("/:auctionId/summary", (req, res) => {
  db.all(
    `
    SELECT t.name AS teamName, p.name AS playerName, p.sold_price
    FROM players p
    JOIN teams t ON p.team_id = t.id
    WHERE p.auction_id = ?
    `,
    [req.params.auctionId],
    (err, rows) => res.json(rows)
  );
});

module.exports = router;
