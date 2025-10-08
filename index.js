import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import pkg from "pg";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection (for states/districts/taluks/villages)
const { Pool } = pkg;
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

// -----------------------------
// Location APIs
// -----------------------------
app.get("/api/states", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT DISTINCT state FROM locations ORDER BY state ASC");
    res.json({ states: rows.map(r => r.state) });
  } catch (err) {
    console.error("Error fetching states:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/districts", async (req, res) => {
  const { state } = req.query;
  if (!state) return res.status(400).json({ error: "state required" });

  try {
    const { rows } = await pool.query(
      "SELECT DISTINCT district FROM locations WHERE state = $1 ORDER BY district ASC",
      [state]
    );
    res.json({ districts: rows.map(r => r.district) });
  } catch (err) {
    console.error("Error fetching districts:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/taluks", async (req, res) => {
  const { district } = req.query;
  if (!district) return res.status(400).json({ error: "district required" });

  try {
    const { rows } = await pool.query(
      "SELECT DISTINCT taluk FROM locations WHERE district = $1 ORDER BY taluk ASC",
      [district]
    );
    res.json({ taluks: rows.map(r => r.taluk) });
  } catch (err) {
    console.error("Error fetching taluks:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/villages", async (req, res) => {
  const { taluk } = req.query;
  if (!taluk) return res.status(400).json({ error: "taluk required" });

  try {
    const { rows } = await pool.query(
      "SELECT DISTINCT village FROM locations WHERE taluk = $1 ORDER BY village ASC",
      [taluk]
    );
    res.json({ villages: rows.map(r => r.village) });
  } catch (err) {
    console.error("Error fetching villages:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// -----------------------------
// Submit Location to Chatrace + Google Sheet
// -----------------------------
app.post("/api/submit-location", async (req, res) => {
  const { wa_id, name, state, district, taluk, village } = req.body;

  if (!state || !district || !taluk || !village) {
    return res.status(400).json({ error: "All location fields are required" });
  }

  try {
    const token = process.env.CHATRACE_TOKEN;
    const flowId = process.env.CHATRACE_FLOW_ID; // optional, if triggering a flow

    // -----------------------------
    // Send to Chatrace Flow (preferred)
    // -----------------------------
    if (token && flowId) {
      await fetch(`https://api.chatrace.com/v1/flows/${flowId}/trigger`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ wa_id, name, state, district, taluk, village }),
      });
    }

    // -----------------------------
    // Optional: Send to Google Sheet
    // -----------------------------
    // if (process.env.SHEET_WEBHOOK) {
    //   await fetch(process.env.SHEET_WEBHOOK, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ wa_id, name, state, district, taluk, village }),
    //   });
    // }

    res.json({ success: true, message: "Location sent successfully!" });
  } catch (err) {
    console.error("Error sending location:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// -----------------------------
// Health check
// -----------------------------
app.get("/", (req, res) => {
  res.send("🌐 Location API is running fine!");
});

app.listen(process.env.PORT || 5000, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
});
