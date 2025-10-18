import express from "express";
import cors from "cors";
import "dotenv/config";
import { geocodeByZip } from "./services/openWeather.js";

import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from "./firebase.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("API ok"));

app.get("/users", async (_req, res) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to list users" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const u = await getUser(req.params.id);
    if (!u) return res.status(404).json({ error: "Not found" });
    res.json(u);
  } catch (e) {
    res.status(500).json({ error: e.message || "Failed to get user" });
  }
});

app.post("/users", async (req, res) => {
  try {
    const { name, zip, country = "US" } = req.body || {};
    if (!name || !zip) {
      return res.status(400).json({ error: "name and zip are required" });
    }

    const geo = await geocodeByZip(zip, country);
    const created = await createUser({ name, zip, ...geo });
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: e.message || "Failed to create user" });
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const { name, zip, country = "US" } = req.body || {};
    if (!name && !zip) {
      return res.status(400).json({ error: "nothing to update" });
    }

    let patch = {};
    if (name) patch.name = name;
    if (zip) {
      patch.zip = zip;
      const geo = await geocodeByZip(zip, country);
      patch = { ...patch, ...geo };
    }

    const updated = await updateUser(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message || "Failed to update user" });
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    await deleteUser(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message || "Failed to delete user" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
