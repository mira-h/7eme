import { useState, useEffect, useRef } from "react";

const API = "/api";

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [tab, setTab] = useState("registrations");
  const [newPhoto, setNewPhoto] = useState({ url: "", caption: "", file: null });
  const [editPhoto, setEditPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef();

  const login = async () => {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      const { token } = await res.json();
      localStorage.setItem("admin_token", token);
      setToken(token);
      setLoginError("");
      if (window.location.pathname !== '/admin') {
        window.location.pathname = '/admin';
      }
    } else {
      setLoginError("Wrong password");
    }
  };

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const loadData = async () => {
    const [r, p] = await Promise.all([
      fetch(`${API}/registrations`, { headers }).then(r => r.json()),
      fetch(`${API}/photos`).then(r => r.json()),
    ]);
    setRegistrations(Array.isArray(r) ? r : []);
    setPhotos(Array.isArray(p) ? p : []);
  };

  useEffect(() => { if (token) loadData(); }, [token]);

  const deleteReg = async (id) => {
    await fetch(`${API}/registrations/${id}`, { method: "DELETE", headers });
    setRegistrations(r => r.filter(x => x.id !== id));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setNewPhoto(p => ({ ...p, file, url: "" }));
    setPreview(URL.createObjectURL(file));
  };

  const handleUrlChange = (e) => {
    setNewPhoto(p => ({ ...p, url: e.target.value, file: null }));
    setPreview(e.target.value || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const addPhoto = async () => {
    if (!newPhoto.file && !newPhoto.url) return;
    setUploading(true);
    try {
      let finalUrl = newPhoto.url;

      if (newPhoto.file) {
        const formData = new FormData();
        formData.append("photo", newPhoto.file);
        const uploadRes = await fetch(`${API}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        finalUrl = uploadData.url;
      }

      const res = await fetch(`${API}/photos`, {
        method: "POST",
        headers,
        body: JSON.stringify({ url: finalUrl, caption: newPhoto.caption }),
      });
      const p = await res.json();
      setPhotos(ph => [...ph, p]);
      setNewPhoto({ url: "", caption: "", file: null });
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setUploading(false);
    }
  };

  const saveEdit = async () => {
    let finalUrl = editPhoto.url;

    if (editPhoto.file) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("photo", editPhoto.file);
        const uploadRes = await fetch(`${API}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        finalUrl = uploadData.url;
      } finally {
        setUploading(false);
      }
    }

    const res = await fetch(`${API}/photos/${editPhoto.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ url: finalUrl, caption: editPhoto.caption }),
    });
    const updated = await res.json();
    setPhotos(ph => ph.map(p => p.id === updated.id ? updated : p));
    setEditPhoto(null);
  };

  const deletePhoto = async (id) => {
    await fetch(`${API}/photos/${id}`, { method: "DELETE", headers });
    setPhotos(ph => ph.filter(p => p.id !== id));
  };

  const s = {
    page: { fontFamily: "system-ui, sans-serif", background: "#0d1f1e", minHeight: "100vh", color: "#e8f5e4", padding: 32 },
    card: { background: "#142e2c", border: "1px solid rgba(16,113,102,0.3)", borderRadius: 8, padding: 24, marginBottom: 24 },
    input: { background: "#0d1f1e", border: "1px solid rgba(16,113,102,0.4)", color: "#e8f5e4", padding: "10px 14px", borderRadius: 4, fontSize: 14, outline: "none", width: "100%", transition: "border-color 0.2s" },
    btn: { background: "#107166", color: "#f8f08e", border: "2px solid #107166", padding: "10px 20px", borderRadius: 4, fontWeight: 700, cursor: "pointer", fontSize: 14, transition: "all 0.2s" },
    dangerBtn: { background: "transparent", color: "#e05555", border: "1px solid #e05555", padding: "6px 14px", borderRadius: 4, cursor: "pointer", fontSize: 13 },
    editBtn: { background: "transparent", color: "#f8f08e", border: "1px solid rgba(248,240,142,0.4)", padding: "6px 14px", borderRadius: 4, cursor: "pointer", fontSize: 13, marginRight: 8 },
    tab: (active) => ({ padding: "10px 24px", cursor: "pointer", borderBottom: active ? "2px solid #f8f08e" : "2px solid transparent", color: active ? "#f8f08e" : "#e8f5e4", background: "transparent", border: "none", fontSize: 15, fontWeight: active ? 700 : 400 }),
    th: { textAlign: "left", padding: "10px 16px", fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#f8f08e", borderBottom: "1px solid rgba(16,113,102,0.3)" },
    td: { padding: "12px 16px", fontSize: 14, borderBottom: "1px solid rgba(255,255,255,0.05)", verticalAlign: "middle" },
    divider: { display: "flex", alignItems: "center", gap: 12, margin: "16px 0", color: "rgba(232,245,228,0.3)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" },
    dividerLine: { flex: 1, height: 1, background: "rgba(16,113,102,0.25)" },
    uploadBox: { border: "2px dashed rgba(16,113,102,0.4)", borderRadius: 6, padding: "24px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", background: "rgba(16,113,102,0.05)" },
  };

  if (!token) return (
    <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ ...s.card, width: 360, textAlign: "center" }}>
        <div style={{ marginBottom: 16 }}><img src="/logo.png" alt="logo" style={{ width: 56, height: 56, objectFit: "contain" }} /></div>
        <h2 style={{ fontFamily: "Georgia, serif", color: "#f8f08e", marginBottom: 8 }}>Admin Login</h2>
        <p style={{ fontSize: 13, opacity: 0.5, marginBottom: 24 }}>Groupe Sacre Coeur Control Panel</p>
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
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="logo" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <div>
            <div style={{ fontFamily: "Georgia, serif", color: "#f8f08e", fontWeight: 700, fontSize: "1.2rem" }}>Groupe Sacre Coeur Admin</div>
            <div style={{ fontSize: 12, opacity: 0.45 }}>Control Panel</div>
          </div>
        </div>
        <button style={s.dangerBtn} onClick={() => { localStorage.removeItem("admin_token"); setToken(""); }}>Logout</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        {[["📋 Registrations", registrations.length], ["🖼️ Photos", photos.length]].map(([label, count]) => (
          <div key={label} style={s.card}>
            <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "2.5rem", color: "#f8f08e", fontWeight: 700 }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid rgba(16,113,102,0.2)", marginBottom: 24, display: "flex" }}>
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
                  <tr>{["Name", "Age", "Parent", "Email", "Phone", "Date", ""].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
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
          {/* Add Photo */}
          <div style={s.card}>
            <h3 style={{ fontFamily: "Georgia, serif", marginBottom: 20, color: "#fff" }}>Add New Photo</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

              {/* Left: Upload + URL */}
              <div>
                <label style={{ fontSize: 12, opacity: 0.5, display: "block", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Upload from computer</label>
                <div style={s.uploadBox}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f) { setNewPhoto(p => ({ ...p, file: f, url: "" })); setPreview(URL.createObjectURL(f)); }
                  }}>
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                  {newPhoto.file ? (
                    <div style={{ color: "#f8f08e", fontSize: 14 }}>✅ {newPhoto.file.name}</div>
                  ) : (
                    <>
                      <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>📁</div>
                      <div style={{ fontSize: 13, opacity: 0.6 }}>Click or drag & drop an image here</div>
                      <div style={{ fontSize: 11, opacity: 0.35, marginTop: 4 }}>JPG, PNG, WEBP — max 10MB</div>
                    </>
                  )}
                </div>

                <div style={s.divider}>
                  <div style={s.dividerLine} /><span>or use a URL</span><div style={s.dividerLine} />
                </div>

                <label style={{ fontSize: 12, opacity: 0.5, display: "block", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>Image URL</label>
                <input style={s.input} placeholder="https://example.com/photo.jpg" value={newPhoto.url} onChange={handleUrlChange} />
              </div>

              {/* Right: Caption + Preview + Button */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, opacity: 0.5, display: "block", marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>Caption</label>
                  <input style={s.input} placeholder="Summer Camp 2024"
                    value={newPhoto.caption}
                    onChange={e => setNewPhoto(p => ({ ...p, caption: e.target.value }))} />
                </div>
                {preview && (
                  <div style={{ flex: 1, borderRadius: 6, overflow: "hidden", border: "1px solid rgba(16,113,102,0.3)", minHeight: 120, maxHeight: 200 }}>
                    <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      onError={() => setPreview(null)} />
                  </div>
                )}
                <button style={{ ...s.btn, opacity: uploading ? 0.6 : 1 }} onClick={addPhoto} disabled={uploading}>
                  {uploading ? "Uploading..." : "➕ Add Photo"}
                </button>
              </div>
            </div>
          </div>

          {/* Manage Photos */}
          <div style={s.card}>
            <h3 style={{ fontFamily: "Georgia, serif", marginBottom: 20, color: "#fff" }}>Manage Photos</h3>
            {photos.length === 0 ? (
              <p style={{ opacity: 0.4, fontStyle: "italic" }}>No photos yet.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {photos.map(p => (
                  <div key={p.id} style={{ background: "#0d1f1e", border: "1px solid rgba(16,113,102,0.2)", borderRadius: 6, overflow: "hidden" }}>
                    <img src={p.url} alt={p.caption} style={{ width: "100%", height: 140, objectFit: "cover" }} />
                    <div style={{ padding: 12 }}>
                      {editPhoto?.id === p.id ? (
                        <>
                          <div style={{ ...s.uploadBox, padding: 12, marginBottom: 8, fontSize: 12 }}
                            onClick={() => document.getElementById(`edit-file-${p.id}`)?.click()}>
                            <input id={`edit-file-${p.id}`} type="file" accept="image/*" style={{ display: "none" }}
                              onChange={e => { const f = e.target.files[0]; if (f) setEditPhoto(ep => ({ ...ep, file: f, url: "" })); }} />
                            {editPhoto.file
                              ? <span style={{ color: "#f8f08e" }}>✅ {editPhoto.file.name}</span>
                              : <span style={{ opacity: 0.5 }}>📁 Upload new image</span>}
                          </div>
                          <div style={s.divider}><div style={s.dividerLine} /><span style={{ fontSize: 10 }}>or URL</span><div style={s.dividerLine} /></div>
                          <input style={{ ...s.input, marginBottom: 8, fontSize: 13 }} value={editPhoto.url}
                            onChange={e => setEditPhoto(ep => ({ ...ep, url: e.target.value, file: null }))} placeholder="https://..." />
                          <input style={{ ...s.input, marginBottom: 8, fontSize: 13 }} value={editPhoto.caption}
                            onChange={e => setEditPhoto(ep => ({ ...ep, caption: e.target.value }))} placeholder="Caption" />
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={{ ...s.btn, padding: "6px 14px", fontSize: 13, opacity: uploading ? 0.6 : 1 }} onClick={saveEdit} disabled={uploading}>
                              {uploading ? "Saving..." : "Save"}
                            </button>
                            <button style={s.dangerBtn} onClick={() => setEditPhoto(null)}>Cancel</button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#e8f5e4" }}>{p.caption || "No caption"}</div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button style={s.editBtn} onClick={() => setEditPhoto({ ...p, file: null })}>Edit</button>
                            <button style={s.dangerBtn} onClick={() => deletePhoto(p.id)}>Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}