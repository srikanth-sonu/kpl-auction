const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const db = require("./db");

const auctionRoutes = require("./routes/auctionRoutes");
const auctionSocket = require("./socket/auctionSocket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
console.log("Socket.IO initialized");


app.use(cors());
app.use(express.json());

app.use("/api/auction", auctionRoutes);

app.get("/", (req, res) => {
  res.send("Auction Backend Running");
});

io.on("connection", (socket) => {
  console.log("🔥 SOCKET CONNECTED 🔥", socket.id);
  auctionSocket(io, socket);
});

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

