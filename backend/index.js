import express from "express";
import cors from "cors";
import "dotenv/config";
import { geocodeByZip } from "./services/openWeather.js";
import { createUser, updateUser } from "./firebase.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => res.send("API ok"));

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
