import { useState, useEffect, useRef } from "react";

const API = "/api";

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem("admin_token") || "");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loginError, setLoginError] = useState("");
  const [role, setRole] = useState("");
  const [members, setMembers] = useState([]);
  const [newMember, setNewMember] = useState({ name: "", age: "", section: "Louveteaux", group_type: "Sizaine", group_name: "", current_status: "Patte tendre", notes: "", unit_id: "" });
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberHistory, setMemberHistory] = useState([]);
  const [newEvent, setNewEvent] = useState({ event_type: 'promesse', event_name: '', details: '' });
  const [editMemberObj, setEditMemberObj] = useState(null);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'chief', unit_id: '' });
  const sections = ["Louveteaux", "Éclaireurs", "Routiers"];
  const groupTypes = {
    Louveteaux: ["Sizaine", "Meute"],
    Éclaireurs: ["Patrouille", "Troupe"],
    Routiers: ["Équipe", "Clan"],
  };
  const statusOptions = {
    Louveteaux: ["Patte tendre", "Promesse", "Brevet de Capacité", "1ère Étoile", "2nde Étoile"],
    Éclaireurs: ["Aspirant", "Promesse", "Badges", "2nd Classe", "1ère Classe", "Raider"],
    Routiers: ["Promesse", "Jalon"],
  };
  const eventTypes = [
    { value: 'promesse', label: 'Promesse' },
    { value: 'rank', label: 'Rank / Badge' },
    { value: 'badge', label: 'Badge' },
    { value: 'jalon', label: 'Jalon' },
    { value: 'transfer', label: 'Transfer / Group change' },
  ];
  const [registrations, setRegistrations] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [tab, setTab] = useState("registrations");
  const [newPhoto, setNewPhoto] = useState({ url: "", caption: "", file: null });
  const [editPhoto, setEditPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef();

  const login = async () => {
    const body = username ? { username, password } : { password };
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    // fetch photos always
    const photosRes = await fetch(`${API}/photos`).then(r => r.json());
    setPhotos(Array.isArray(photosRes) ? photosRes : []);

    // fetch registrations only for superadmin
    if (role === 'superadmin') {
      const regs = await fetch(`${API}/registrations`, { headers }).then(r => r.json());
      setRegistrations(Array.isArray(regs) ? regs : []);
    } else {
      setRegistrations([]);
    }

    // fetch progression/members for chiefs or superadmin
    if (role === 'superadmin' || role === 'chief') {
      const mem = await fetch(`${API}/progression`, { headers }).then(r => r.json());
      setMembers(Array.isArray(mem) ? mem : []);
    } else {
      setMembers([]);
    }

    // fetch units and users for superadmin
    if (role === 'superadmin') {
      const u = await fetch(`${API}/units`, { headers }).then(r => r.json());
      setUnits(Array.isArray(u) ? u : []);
      const us = await fetch(`${API}/users`, { headers }).then(r => r.json());
      setUsers(Array.isArray(us) ? us : []);
    } else {
      setUnits([]);
      setUsers([]);
    }
  };

  const loadMemberHistory = async (member) => {
    setSelectedMember(member);
    const res = await fetch(`${API}/progression/${member.id}/history`, { headers });
    if (res.ok) {
      const history = await res.json();
      setMemberHistory(Array.isArray(history) ? history : []);
    } else {
      setMemberHistory([]);
    }
  };

  useEffect(() => { if (token) loadData(); }, [token, role]);

  useEffect(() => {
    // after token is set, fetch /api/me to learn role
    const fetchMe = async () => {
      if (!token) return;
      const res = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const info = await res.json();
        const newRole = info.role || '';
        setRole(newRole);
        if (newRole === 'chief' && tab !== 'progression') setTab('progression');
      }
    };
    fetchMe();
  }, [token]);

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
        <input style={{ ...s.input, marginBottom: 8 }} placeholder="Username (leave empty for admin)"
          value={username} onChange={e => setUsername(e.target.value)}
          onKeyDown={e => e.key === "Enter" && login()} />
        <input style={{ ...s.input, marginBottom: 12 }} type="password" placeholder="Enter password"
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
        {[["📋 Registrations", registrations.length], ["🧭 Members", members.length], ["🖼️ Photos", photos.length]].map(([label, count]) => (
          <div key={label} style={s.card}>
            <div style={{ fontSize: 13, opacity: 0.5, marginBottom: 4 }}>{label}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "2.5rem", color: "#f8f08e", fontWeight: 700 }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid rgba(16,113,102,0.2)", marginBottom: 24, display: "flex" }}>
        {(role === 'superadmin') && <button style={s.tab(tab === "registrations")} onClick={() => setTab("registrations")}>Registrations</button>}
        {(role === 'superadmin' || role === 'chief') && <button style={s.tab(tab === "progression")} onClick={() => setTab("progression")}>Progression</button>}
        {(role === 'superadmin') && <button style={s.tab(tab === "manage")} onClick={() => setTab("manage")}>Manage Users</button>}
        {(role === 'superadmin') && <button style={s.tab(tab === "photos")} onClick={() => setTab("photos")}>Photos</button>}
      </div>

      {/* Registrations Tab */}
      {tab === "registrations" && (
        <div style={s.card}>
          <h3 style={{ fontFamily: "Georgia, serif", marginBottom: 20, color: "#fff" }}>Parent Registrations</h3>
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

      {/* Progression Tab */}
      {tab === 'progression' && (role === 'superadmin' || role === 'chief') && (
        <div style={s.card}>
          <h3 style={{ fontFamily: "Georgia, serif", marginBottom: 20, color: "#fff" }}>Members — Progression</h3>

          {/* Add member form */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <input style={s.input} placeholder="Full name" value={newMember.name} onChange={e => setNewMember(n => ({ ...n, name: e.target.value }))} />
            <input style={s.input} placeholder="Age" type="number" value={newMember.age} onChange={e => setNewMember(n => ({ ...n, age: e.target.value }))} />
            <select style={s.input} value={newMember.section} onChange={e => setNewMember(n => ({ ...n, section: e.target.value, group_type: groupTypes[e.target.value][0], current_status: statusOptions[e.target.value][0] }))}>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select style={s.input} value={newMember.group_type} onChange={e => setNewMember(n => ({ ...n, group_type: e.target.value }))}>
              {groupTypes[newMember.section].map(gt => <option key={gt} value={gt}>{gt}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
            <input style={s.input} placeholder="Group name" value={newMember.group_name} onChange={e => setNewMember(n => ({ ...n, group_name: e.target.value }))} />
            <select style={s.input} value={newMember.current_status} onChange={e => setNewMember(n => ({ ...n, current_status: e.target.value }))}>
              {statusOptions[newMember.section].map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            <input style={s.input} placeholder="Notes" value={newMember.notes} onChange={e => setNewMember(n => ({ ...n, notes: e.target.value }))} />
            {role === 'superadmin' ? (
              <select style={s.input} value={newMember.unit_id || ''} onChange={e => setNewMember(n => ({ ...n, unit_id: e.target.value }))}>
                <option value="">Select unit</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            ) : (
              <div style={{ ...s.input, background: 'rgba(255,255,255,0.04)', opacity: 0.8, display: 'flex', alignItems: 'center' }}>Unit set by chief</div>
            )}
          </div>
          <div style={{ marginBottom: 20 }}>
            <button style={s.btn} onClick={async () => {
              if (!newMember.name) return;
              const body = {
                name: newMember.name,
                age: newMember.age,
                section: newMember.section,
                group_type: newMember.group_type,
                group_name: newMember.group_name,
                current_status: newMember.current_status,
                notes: newMember.notes,
                unit_id: newMember.unit_id,
              };
              const res = await fetch(`${API}/progression`, { method: 'POST', headers, body: JSON.stringify(body) });
              if (res.ok) {
                const m = await res.json();
                setMembers(ms => [m, ...ms]);
                setNewMember({ name: '', age: '', section: 'Louveteaux', group_type: 'Sizaine', group_name: '', current_status: 'Patte tendre', notes: '' });
              }
            }}>Add Member</button>
          </div>

          {/* Selected member history */}
          {selectedMember && (
            <div style={{ marginBottom: 20, padding: 16, background: '#0b2321', borderRadius: 6 }}>
              <div style={{ marginBottom: 14, fontWeight: 700, color: '#f8f08e' }}>Progression for {selectedMember.name}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
                <div><strong>Section</strong><div>{selectedMember.section || '—'}</div></div>
                <div><strong>Group</strong><div>{selectedMember.group_type || '—'} {selectedMember.group_name || ''}</div></div>
                <div><strong>Status</strong><div>{selectedMember.current_status || '—'}</div></div>
                <div><strong>Unit</strong><div>{selectedMember.unit_name || '—'}</div></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                <select style={s.input} value={newEvent.event_type} onChange={e => setNewEvent(ne => ({ ...ne, event_type: e.target.value }))}>
                  {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input style={s.input} placeholder="Event / badge name" value={newEvent.event_name} onChange={e => setNewEvent(ne => ({ ...ne, event_name: e.target.value }))} />
                <button style={s.btn} onClick={async () => {
                  if (!newEvent.event_name) return;
                  const res = await fetch(`${API}/progression/${selectedMember.id}/event`, { method: 'POST', headers, body: JSON.stringify(newEvent) });
                  if (res.ok) {
                    const ev = await res.json();
                    setMemberHistory(h => [ev, ...h]);
                    setNewEvent({ event_type: 'promesse', event_name: '', details: '' });
                    const updated = await fetch(`${API}/progression`, { headers }).then(r => r.json());
                    setMembers(Array.isArray(updated) ? updated : members);
                    await loadMemberHistory(selectedMember);
                  }
                }}>Record Event</button>
              </div>
              <textarea style={{ ...s.input, minHeight: 80 }} placeholder="Details" value={newEvent.details} onChange={e => setNewEvent(ne => ({ ...ne, details: e.target.value }))} />
              <div style={{ marginTop: 16 }}>
                <h4 style={{ marginBottom: 10, color: '#f8f08e' }}>Event history</h4>
                {memberHistory.length === 0 ? (
                  <p style={{ opacity: 0.5 }}>No events recorded yet.</p>
                ) : (
                  <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                    {memberHistory.map(ev => (
                      <div key={ev.id} style={{ padding: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ fontSize: 13, opacity: 0.7 }}>{new Date(ev.created_at).toLocaleString()}</div>
                        <div><strong>{ev.event_type}</strong>: {ev.event_name}</div>
                        <div style={{ opacity: 0.8, fontSize: 13 }}>{ev.details || 'No details'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Members list */}
          {members.length === 0 ? (
            <p style={{ opacity: 0.4, fontStyle: 'italic' }}>No members yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>{['Name', 'Age', 'Section', 'Group', 'Status', 'Unit', 'Actions'].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td style={s.td}><strong>{m.name}</strong></td>
                      <td style={s.td}>{m.age || '—'}</td>
                      <td style={s.td}>{m.section || '—'}</td>
                      <td style={s.td}>{(m.group_type ? `${m.group_type} ${m.group_name || ''}` : '—').trim()}</td>
                      <td style={s.td}>{m.current_status || '—'}</td>
                      <td style={s.td}>{m.unit_name || '—'}</td>
                      <td style={s.td}>
                        <button style={s.editBtn} onClick={() => loadMemberHistory(m)}>View</button>
                        <button style={s.dangerBtn} onClick={async () => { await fetch(`${API}/progression/${m.id}`, { method: 'DELETE', headers }); setMembers(ms => ms.filter(x => x.id !== m.id)); if (selectedMember?.id === m.id) { setSelectedMember(null); setMemberHistory([]); } }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Photos Tab */}
      {tab === "photos" && role === 'superadmin' && (
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

      {/* Manage Users & Units - superadmin only */}
      {tab === 'manage' && role === 'superadmin' && (
        <div style={s.card}>
          <h3 style={{ fontFamily: "Georgia, serif", marginBottom: 20, color: "#fff" }}>Manage Units & Chiefs</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 12 }}>
            <input style={s.input} placeholder="New unit name" value={newUnitName} onChange={e => setNewUnitName(e.target.value)} />
            <button style={s.btn} onClick={async () => {
              if (!newUnitName) return;
              const res = await fetch(`${API}/units`, { method: 'POST', headers, body: JSON.stringify({ name: newUnitName }) });
              if (res.ok) {
                const u = await res.json();
                setUnits(us => [u, ...us].filter(Boolean));
                setNewUnitName('');
              }
            }}>Add Unit</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, marginBottom: 16 }}>
            <input style={s.input} placeholder="Username" value={newUser.username} onChange={e => setNewUser(n => ({ ...n, username: e.target.value }))} />
            <input style={s.input} placeholder="Password" type="password" value={newUser.password} onChange={e => setNewUser(n => ({ ...n, password: e.target.value }))} />
            <select style={s.input} value={newUser.unit_id} onChange={e => setNewUser(n => ({ ...n, unit_id: e.target.value }))}>
              <option value="">-- Select unit --</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <button style={s.btn} onClick={async () => {
              if (!newUser.username || !newUser.password) return;
              const res = await fetch(`${API}/users`, { method: 'POST', headers, body: JSON.stringify({ username: newUser.username, password: newUser.password, role: newUser.role, unit_id: newUser.unit_id }) });
              if (res.ok) {
                const created = await res.json();
                if (created) setUsers(us => [created, ...us]);
                setNewUser({ username: '', password: '', role: 'chief', unit_id: '' });
              }
            }}>Create Chief</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div>
              <h4 style={{ marginBottom: 8, color: '#f8f08e' }}>Units</h4>
              {units.length === 0 ? <p style={{ opacity: 0.4 }}>No units yet.</p> : (
                <ul>
                  {units.map(u => (
                    <li key={u.id} style={{ marginBottom: 8 }}>
                      <strong>{u.name}</strong>
                      <button style={{ ...s.dangerBtn, marginLeft: 12 }} onClick={async () => { await fetch(`${API}/units/${u.id}`, { method: 'DELETE', headers }); setUnits(us => us.filter(x => x.id !== u.id)); }}>Delete</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 style={{ marginBottom: 8, color: '#f8f08e' }}>Users</h4>
              {users.length === 0 ? <p style={{ opacity: 0.4 }}>No users.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>{['Username','Role','Unit',''].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id}>
                        <td style={s.td}>{u.username}</td>
                        <td style={s.td}>{u.role}</td>
                        <td style={s.td}>{u.unit_name || '—'}</td>
                        <td style={s.td}><button style={s.dangerBtn} onClick={async () => { await fetch(`${API}/users/${u.id}`, { method: 'DELETE', headers }); setUsers(us => us.filter(x => x.id !== u.id)); }}>Delete</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}