// index.js
const express = require("express");
const cors = require("cors");
const adsRoutes = require("./routes/adsRoutes");
const usersRoutes = require("./routes/usersRoutes"); // Updated users routes

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use("/", adsRoutes);
app.use("/", usersRoutes);

// Start the server
app.listen(port, () => {
  console.log(`OUTER LAYER Server is running on http://localhost:${port}`);
});
