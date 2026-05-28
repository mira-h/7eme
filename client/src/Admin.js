import { useState, useEffect } from "react";

const API = "http://localhost:4000";

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [tab, setTab] = useState("registrations");
  const [newPhoto, setNewPhoto] = useState({ url: "", caption: "" });
  const [editPhoto, setEditPhoto] = useState(null);

  const login = async () => {
    const res = await fetch(`${API}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem("admin_token", token);
      setToken(token);
      setLoginError("");
    } else {
      setLoginError("Wrong password");
    }
  };

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadData = async () => {
    const [r, p] = await Promise.all([
      fetch(`${API}/api/registrations`, { headers }).then(r => r.json()),
      fetch(`${API}/api/photos`).then(r => r.json()),
    ]);
    setRegistrations(Array.isArray(r) ? r : []);
    setPhotos(Array.isArray(p) ? p : []);
  };

  useEffect(() => { if (token) loadData(); }, [token]);

  const deleteReg = async (id) => {
    await fetch(`${API}/api/registrations/${id}`, { method: "DELETE", headers });
    setRegistrations(r => r.filter(x => x.id !== id));
  };

  const addPhoto = async () => {
    if (!newPhoto.url) return;
    const res = await fetch(`${API}/api/photos`, {
      method: "POST", headers,
      body: JSON.stringify(newPhoto),
    });
    const p = await res.json();
    setPhotos(ph => [...ph, p]);
    setNewPhoto({ url: "", caption: "" });
  };

  const saveEdit = async () => {
    const res = await fetch(`${API}/api/photos/${editPhoto.id}`, {
      method: "PUT", headers,
      body: JSON.stringify({ url: editPhoto.url, caption: editPhoto.caption }),
    });
    const updated = await res.json();
    setPhotos(ph => ph.map(p => p.id === updated.id ? updated : p));
    setEditPhoto(null);
  };

  const deletePhoto = async (id) => {
    await fetch(`${API}/api/photos/${id}`, { method: "DELETE", headers });
    setPhotos(ph => ph.filter(p => p.id !== id));
  };

  const s = {
    page: { fontFamily: "system-ui, sans-serif", background: "#0f1410", minHeight: "100vh", color: "#e8dcc8", padding: 32 },
    card: { background: "#1a201b", border: "1px solid rgba(212,160,23,0.2)", borderRadius: 8, padding: 24, marginBottom: 24 },
    input: { background: "#0f1410", border: "1px solid rgba(212,160,23,0.3)", color: "#e8dcc8", padding: "10px 14px", borderRadius: 4, fontSize: 14, outline: "none", width: "100%" },
    btn: { background: "#D4A017", color: "#0a0f0a", border: "none", padding: "10px 20px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 14 },
    dangerBtn: { background: "transparent", color: "#e05555", border: "1px solid #e05555", padding: "6px 14px", borderRadius: 4, cursor: "pointer", fontSize: 13 },
    editBtn: { background: "transparent", color: "#D4A017", border: "1px solid rgba(212,160,23,0.5)", padding: "6px 14px", borderRadius: 4, cursor: "pointer", fontSize: 13, marginRight: 8 },
    tab: (active) => ({ padding: "10px 24px", cursor: "pointer", borderBottom: active ? "2px solid #D4A017" : "2px solid transparent", color: active ? "#D4A017" : "#e8dcc8", background: "transparent", border: "none", fontSize: 15, fontWeight: active ? 700 : 400 }),
    th: { textAlign: "left", padding: "10px 16px", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D4A017", borderBottom: "1px solid rgba(212,160,23,0.2)" },
    td: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.05)", verticalAlign: "middle" },
  };

  if (!token) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...s.card, width: 360, textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: 16 }}>⚜️</div>
        <h2 style={{ fontFamily: "Georgia, serif", color: "#D4A017", marginBottom: 8 }}>Admin Login</h2>
        <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 24 }}>Troop 47 Control Panel</p>
        <input style={{ ...s.input, marginBottom: 12 }} type="password" placeholder="Enter admin password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()} />
        {loginError && <p style={{ color: "#e05555", fontSize: 13, marginBottom: 8 }}>{loginError}</p>}
        <button style={{ ...s.btn, width: "100%" }} onClick={login}>Login</button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: "1.8rem" }}>⚜️</span>
          <div>
            <div style={{ fontFamily: "Georgia, serif", color: "#D4A017", fontWeight: 700, fontSize: "1.2rem" }}>Troop 47 Admin</div>
            <div style={{ fontSize: 12, opacity: 0.45 }}>Control Panel</div>
          </div>
        </div>
        <button style={{ ...s.dangerBtn }} onClick={() => { localStorage.removeItem("admin_token"); setToken(""); }}>Logout</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        {[["📋 Registrations", registrations.length], ["🖼️ Photos", photos.length]].map(([label, count]) => (
          <div key={label} style={s.card}>
            <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "2.5rem", color: "#D4A017", fontWeight: 700 }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid rgba(212,160,23,0.15)", marginBottom: 24 }}>
        <button style={s.tab(tab === "registrations")} onClick={() => setTab("registrations")}>Registrations</button>
        <button style={s.tab(tab === "photos")} onClick={() => setTab("photos")}>Photos</button>
      </div>

      {/* Registrations Tab */}
      {tab === "registrations" && (
        <div style={s.card}>
          <h3 style={{ fontFamily: "Georgia, serif", marginBottom: 20, color: "#fff" }}>All Registrations</h3>
          {registrations.length === 0 ? (
            <p style={{ opacity: 0.4, fontStyle: "italic" }}>No registrations yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Name", "Age", "Parent", "Email", "Phone", "Date", ""].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(r => (
                    <tr key={r.id}>
                      <td style={s.td}><strong>{r.name}</strong></td>
                      <td style={s.td}>{r.age}</td>
                      <td style={s.td}>{r.parent || "—"}</td>
                      <td style={s.td}>{r.email}</td>
                      <td style={s.td}>{r.phone || "—"}</td>
                      <td style={s.td}>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td style={s.td}><button style={s.dangerBtn} onClick={() => deleteReg(r.id)}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Photos Tab */}
      {tab === "photos" && (
        <>
          <div style={s.card}>
            <h3 style={{ fontFamily: "Georgia, serif", marginBottom: 20, color: "#fff" }}>Add New Photo</h3>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 12, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 12, opacity: 0.5, display: "block", marginBottom: 6 }}>Image URL</label>
                <input style={s.input} placeholder="https://..." value={newPhoto.url} onChange={e => setNewPhoto({ ...newPhoto, url: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, opacity: 0.5, display: "block", marginBottom: 6 }}>Caption</label>
                <input style={s.input} placeholder="Caption" value={newPhoto.caption} onChange={e => setNewPhoto({ ...newPhoto, caption: e.target.value })} />
              </div>
              <button style={s.btn} onClick={addPhoto}>Add</button>
            </div>
          </div>

          <div style={s.card}>
            <h3 style={{ fontFamily: "Georgia, serif", marginBottom: 20, color: "#fff" }}>Manage Photos</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
              {photos.map(p => (
                <div key={p.id} style={{ background: "#0f1410", border: "1px solid rgba(212,160,23,0.15)", borderRadius: 6, overflow: "hidden" }}>
                  <img src={p.url} alt={p.caption} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                  <div style={{ padding: 12 }}>
                    {editPhoto?.id === p.id ? (
                      <>
                        <input style={{ ...s.input, marginBottom: 8, fontSize: 13 }} value={editPhoto.url} onChange={e => setEditPhoto({ ...editPhoto, url: e.target.value })} />
                        <input style={{ ...s.input, marginBottom: 8, fontSize: 13 }} value={editPhoto.caption} onChange={e => setEditPhoto({ ...editPhoto, caption: e.target.value })} />
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={{ ...s.btn, padding: "6px 14px", fontSize: 13 }} onClick={saveEdit}>Save</button>
                          <button style={{ ...s.dangerBtn }} onClick={() => setEditPhoto(null)}>Cancel</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{p.caption || "No caption"}</div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={s.editBtn} onClick={() => setEditPhoto({ ...p })}>Edit</button>
                          <button style={s.dangerBtn} onClick={() => deletePhoto(p.id)}>Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
