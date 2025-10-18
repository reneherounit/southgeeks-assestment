import { useEffect, useState } from "react";
import { db, ref, onValue, remove } from "./firebase";

const API_BASE = "http://localhost:8080";

export default function App() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: "", zip: "", country: "US" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(Object.values(data));
      } else {
        setUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (!form.name || !form.zip) {
        throw new Error("Name and ZIP are required");
      }
      const res = await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Create failed");
      setForm(f => ({ ...f, name: "", zip: "" }));
    } catch (err) {
      setError(err.message || "Error creating user");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateZip(id, zip, country = "US") {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zip, country }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Update failed");
      return;
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this user?")) return;
    try {
      await remove(ref(db, `users/${id}`));
    } catch (err) {
      alert("Failed to delete user");
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, Segoe UI, Arial" }}>
      <h1 style={{ marginBottom: 8 }}>Firebase User Management</h1>
      <p style={{ marginTop: 0, color: "#666" }}>Create users (name + zip). The API enriches latitude/longitude/timezone.</p>

      <form onSubmit={handleCreate} style={{ display: "grid", gap: 8, maxWidth: 520, marginBottom: 24 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Name</label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Alice"
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>ZIP</label>
          <input
            value={form.zip}
            onChange={e => setForm({ ...form, zip: e.target.value })}
            placeholder="e.g. 10001"
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Country (optional, default US)</label>
          <input
            value={form.country}
            onChange={e => setForm({ ...form, country: e.target.value })}
            placeholder="US"
          />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button disabled={loading} type="submit">
            {loading ? "Creating..." : "Create user"}
          </button>
          {error && <span style={{ color: "crimson" }}>{error}</span>}
        </div>
      </form>

      <UsersTable users={users} onUpdateZip={handleUpdateZip} onDelete={handleDelete} />
    </div>
  );
}

function UsersTable({ users, onUpdateZip, onDelete }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table cellPadding="8" style={{ borderCollapse: "collapse", width: "100%", minWidth: 700 }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #eaeaea" }}>
            <th style={{ fontWeight: 600 }}>Name</th>
            <th style={{ fontWeight: 600 }}>ZIP</th>
            <th style={{ fontWeight: 600 }}>Latitude</th>
            <th style={{ fontWeight: 600 }}>Longitude</th>
            <th style={{ fontWeight: 600 }}>Timezone</th>
            <th style={{ fontWeight: 600 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr>
              <td colSpan="6" style={{ padding: 16, color: "#777" }}>No users yet</td>
            </tr>
          )}
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: "1px solid #f3f3f3" }}>
              <td>{u.name}</td>
              <td>
                <InlineZipEditor
                  value={u.zip}
                  onSave={(newZip) => onUpdateZip(u.id, newZip)}
                />
              </td>
              <td>{u.latitude ?? "-"}</td>
              <td>{u.longitude ?? "-"}</td>
              <td>{u.timezone ?? "-"}</td>
              <td>
                <button onClick={() => onDelete(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InlineZipEditor({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [zip, setZip] = useState(value || "");
  useEffect(() => setZip(value || ""), [value]);

  if (!editing) {
    return (
      <span
        onClick={() => setEditing(true)}
        title="Click to edit"
        style={{ cursor: "pointer", textDecoration: "underline" }}
      >
        {value}
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", gap: 6 }}>
      <input value={zip} onChange={(e) => setZip(e.target.value)} style={{ width: 100 }} />
      <button onClick={() => { onSave(zip); setEditing(false); }}>Save</button>
      <button onClick={() => setEditing(false)}>Cancel</button>
    </span>
  );
}
