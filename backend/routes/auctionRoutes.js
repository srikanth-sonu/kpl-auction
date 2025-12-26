const adminAuth = require("../middleware/adminAuth");
const express = require("express");
const router = express.Router();
const db = require("../db");

router.post("/", adminAuth, createAuction);
router.post("/:auctionId/start", adminAuth, startAuction);
router.post("/:auctionId/set-player", adminAuth, setPlayer);
router.post("/:auctionId/bid", adminAuth, placeBid);
router.post("/:auctionId/sell", adminAuth, sellPlayer);

/**
 * Create a new auction
 */
router.post("/create", (req, res) => {
  const {
    name,
    base_price,
    budget_per_team,
    teams
  } = req.body;

  if (!name || !base_price || !budget_per_team || !teams || teams.length === 0) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  db.run(
    `INSERT INTO auctions (name, base_price, status)
     VALUES (?, ?, 'CREATED')`,
    [name, base_price],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const auctionId = this.lastID;

      // Insert teams
      const teamStmt = db.prepare(
        `INSERT INTO teams (auction_id, name, total_budget, remaining_budget)
         VALUES (?, ?, ?, ?)`
      );

      teams.forEach((teamName) => {
        teamStmt.run(
          auctionId,
          teamName,
          budget_per_team,
          budget_per_team
        );
      });

      teamStmt.finalize();

      // Initialize auction state
      db.run(
        `INSERT INTO auction_state (auction_id, current_player_name, current_price, is_live)
         VALUES (?, NULL, 0, 0)`,
        [auctionId]
      );

      res.json({
        message: "Auction created successfully",
        auction_id: auctionId
      });
    }
  );
});
/**
 * Get teams by auction
 */
router.get("/:auctionId/teams", (req, res) => {
  const { auctionId } = req.params;

  db.all(
    `SELECT id, name, remaining_budget FROM teams WHERE auction_id=?`,
    [auctionId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});
/**
 * Get current auction state (for rehydration)
 */
router.get("/:auctionId/state", (req, res) => {
  const { auctionId } = req.params;

  db.get(
    `
    SELECT 
      a.status,
      s.current_player_name,
      s.current_price
    FROM auctions a
    JOIN auction_state s ON a.id = s.auction_id
    WHERE a.id = ?
    `,
    [auctionId],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(404).json({ error: "Auction not found" });
      }

      res.json({
        status: row.status,
        currentPlayer: row.current_player_name,
        currentPrice: row.current_price,
      });
    }
  );
});
/**
 * Get all auctions
 */
router.get("/", (req, res) => {
  db.all(
    `SELECT id, name, status FROM auctions ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});
/**
 * Auction summary
 */
router.get("/:auctionId/summary", (req, res) => {
  const { auctionId } = req.params;

  db.all(
    `
    SELECT 
      t.id AS teamId,
      t.name AS teamName,
      t.remaining_budget,
      p.name AS playerName,
      p.sold_price
    FROM teams t
    LEFT JOIN players p ON p.team_id = t.id
    WHERE t.auction_id = ?
    ORDER BY t.id
    `,
    [auctionId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const summary = {};

      rows.forEach((row) => {
        if (!summary[row.teamId]) {
          summary[row.teamId] = {
            teamName: row.teamName,
            remainingBudget: row.remaining_budget,
            players: [],
            totalSpent: 0,
          };
        }

        if (row.playerName) {
          summary[row.teamId].players.push({
            name: row.playerName,
            price: row.sold_price,
          });
          summary[row.teamId].totalSpent += row.sold_price;
        }
      });

      res.json(Object.values(summary));
    }
  );
});
/**
 * Export auction summary as CSV
 */
router.get("/:auctionId/export", (req, res) => {
  const { auctionId } = req.params;

  db.all(
    `
    SELECT
      t.name AS teamName,
      p.name AS playerName,
      p.sold_price AS soldPrice
    FROM players p
    JOIN teams t ON p.team_id = t.id
    WHERE p.auction_id = ?
    ORDER BY t.name
    `,
    [auctionId],
    (err, rows) => {
      if (err) {
        return res.status(500).send("Failed to export");
      }

      let csv = "Team,Player,Sold Price\n";

      rows.forEach((row) => {
        csv += `${row.teamName},${row.playerName},${row.soldPrice}\n`;
      });

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=auction_${auctionId}_players.csv`
      );

      res.send(csv);
    }
  );
});


module.exports = router;
