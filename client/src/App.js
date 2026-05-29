import { useState, useEffect } from "react";

const values = [
  { icon: "🧭", title: "Adventure", desc: "Exploring the unknown with courage and curiosity" },
  { icon: "🤝", title: "Brotherhood", desc: "Building bonds that last a lifetime" },
  { icon: "🌿", title: "Nature", desc: "Respecting and protecting our natural world" },
  { icon: "⭐", title: "Leadership", desc: "Growing into the leaders of tomorrow" },
];

export default function ScoutWebsite() {
  const [photos, setPhotos] = useState([]);
  const [activePhoto, setActivePhoto] = useState(0);
  const [form, setForm] = useState({ name: "", age: "", email: "", phone: "", parent: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [navVisible, setNavVisible] = useState(false);

  useEffect(() => {
    fetch('/api/photos')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setPhotos(data); })
      .catch(err => console.error('Failed to load photos:', err));
  }, []);

  useEffect(() => {
    setTimeout(() => setNavVisible(true), 100);
    if (photos.length === 0) return;
    const interval = setInterval(() => setActivePhoto(p => (p + 1) % photos.length), 4000);
    return () => clearInterval(interval);
  }, [photos]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.age) return;
    await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitted(true);
  };

  if (photos.length === 0) return (
    <div style={{ background: "#0d1f1e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#f8f08e", fontFamily: "Georgia, serif", fontSize: "1.2rem" }}>
      <img src="/logo.png" alt="logo" style={{ width: 48, height: 48, objectFit: "contain" }} /> Loading...
    </div>
  );

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", background: "#0d1f1e", color: "#e8f5e4", minHeight: "100vh", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0d1f1e; }
        ::-webkit-scrollbar-thumb { background: #107166; border-radius: 3px; }
        .nav-link { color: #e8f5e4; text-decoration: none; font-family: 'Libre Baskerville', serif; font-size: 0.8rem; letter-spacing: 0.15em; text-transform: uppercase; transition: color 0.3s; cursor: pointer; }
        .nav-link:hover { color: #f8f08e; }
        .badge { display: inline-block; width: 10px; height: 10px; background: #f8f08e; border-radius: 50%; margin-right: 8px; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .hero-text { animation: fadeUp 1s ease forwards; }
        .hero-sub { animation: fadeUp 1s 0.3s ease both; }
        .hero-btn { animation: fadeUp 1s 0.6s ease both; }
        .value-card { transition: transform 0.3s, box-shadow 0.3s; }
        .value-card:hover { transform: translateY(-6px); box-shadow: 0 20px 60px rgba(248,240,142,0.12); }
        .photo-thumb { transition: all 0.3s; cursor: pointer; border: 2px solid transparent; }
        .photo-thumb:hover { border-color: #f8f08e; transform: scale(1.05); }
        .photo-thumb.active { border-color: #f8f08e; }
        .form-input { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(16,113,102,0.5); color: #e8f5e4; padding: 14px 18px; font-family: 'Libre Baskerville', serif; font-size: 0.95rem; border-radius: 2px; outline: none; transition: border-color 0.3s; }
        .form-input:focus { border-color: #f8f08e; background: rgba(248,240,142,0.04); }
        .form-input::placeholder { color: rgba(232,245,228,0.3); }
        .submit-btn { background: #107166; color: #f8f08e; border: 2px solid #107166; padding: 16px 48px; font-family: 'Playfair Display', serif; font-size: 1rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 2px; transition: all 0.3s; }
        .submit-btn:hover { background: #0d8a7d; border-color: #f8f08e; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(16,113,102,0.5); }
        .ornament { color: #f8f08e; font-size: 1.5rem; margin: 0 12px; }
        section { animation: fadeIn 0.8s ease; }
      `}</style>

      {/* Navigation */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(to bottom, rgba(13,31,30,0.97), transparent)", backdropFilter: "blur(10px)", opacity: navVisible ? 1 : 0, transition: "opacity 0.8s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="logo" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.05em", color: "#f8f08e" }}>Groupe Sacre Coeur Gemmayzeh</div>
            <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6 }}>Scout Group</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 36 }}>
          {["About", "Gallery", "Join Us"].map(item => (
            <a key={item} className="nav-link" onClick={() => document.getElementById(item.toLowerCase().replace(" ", ""))?.scrollIntoView({ behavior: "smooth" })}>{item}</a>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${photos[activePhoto]?.url})`, backgroundSize: "cover", backgroundPosition: "center", transition: "all 1.5s ease", filter: "brightness(0.25)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(13,31,30,0.8) 0%, transparent 60%, rgba(13,31,30,0.6) 100%)" }} />
        <div style={{ position: "absolute", inset: "24px", border: "1px solid rgba(248,240,142,0.2)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: "28px", border: "1px solid rgba(16,113,102,0.2)", pointerEvents: "none" }} />

        <div style={{ position: "relative", textAlign: "center", maxWidth: 780, padding: "0 32px" }}>
          <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "0.75rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "#f8f08e", marginBottom: 24 }} className="hero-sub">
            <span className="badge" />Est. 1955 · Gemmayzeh
          </div>
          <h1 className="hero-text" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "clamp(3.5rem, 8vw, 7rem)", lineHeight: 0.9, color: "#fff", marginBottom: 24, textShadow: "0 4px 40px rgba(0,0,0,0.8)" }}>
            GROUPE<br /><span style={{ color: "#f8f08e", fontStyle: "italic" }}>Sacre Coeur</span><br />GEMMAYZEH
          </h1>
          <p className="hero-sub" style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: "italic", fontSize: "1.15rem", opacity: 0.85, marginBottom: 40, lineHeight: 1.7 }}>
            Where young adventurers discover their strength, build character, and forge friendships that endure a lifetime.
          </p>
          <div className="hero-btn" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => document.getElementById("joinus")?.scrollIntoView({ behavior: "smooth" })} className="submit-btn">Join Our Group</button>
            <button onClick={() => document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", border: "1px solid rgba(248,240,142,0.6)", color: "#f8f08e", padding: "16px 40px", fontFamily: "'Playfair Display', serif", fontSize: "0.95rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", borderRadius: "2px", transition: "all 0.3s" }}
              onMouseEnter={e => { e.target.style.background = "rgba(248,240,142,0.08)"; }}
              onMouseLeave={e => { e.target.style.background = "transparent"; }}>
              Learn More
            </button>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.5 }}>
          <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase" }}>Scroll</div>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, #107166, transparent)" }} />
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ padding: "120px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#f8f08e", marginBottom: 20 }}>
              <span className="ornament">✦</span>Our Story<span className="ornament">✦</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 900, lineHeight: 1.05, marginBottom: 32, color: "#fff" }}>
              Shaping Youth<br />Into <span style={{ color: "#f8f08e", fontStyle: "italic" }}>Leaders</span>
            </h2>
            <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "1rem", lineHeight: 1.9, opacity: 0.75, marginBottom: 24 }}>
              Founded in 1955 in the heart of Gemmayzeh, Groupe Sacre Coeur has guided over 800 young people through the wilderness and into adulthood. Our program is built on the timeless values of the Scout Oath — duty, honor, and service.
            </p>
            <p style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "1rem", lineHeight: 1.9, opacity: 0.75, marginBottom: 40 }}>
              From weekend camping trips to backcountry expeditions, our scouts learn navigation, survival skills, first aid, and the irreplaceable art of living in community. We meet every Saturday and embark on monthly adventures.
            </p>
            <div style={{ display: "flex", gap: 48 }}>
              {[["800+", "Alumni"], ["70", "Years Active"], ["12", "Scouts/yr"]].map(([num, label]) => (
                <div key={label}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.5rem", fontWeight: 900, color: "#f8f08e", lineHeight: 1 }}>{num}</div>
                  <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.55, marginTop: 6 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {values.map(v => (
              <div key={v.title} className="value-card" style={{ background: "rgba(16,113,102,0.1)", border: "1px solid rgba(16,113,102,0.35)", padding: "28px 24px", borderRadius: 4 }}>
                <div style={{ fontSize: "2rem", marginBottom: 12 }}>{v.icon}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.1rem", color: "#f8f08e", marginBottom: 8 }}>{v.title}</div>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "0.85rem", opacity: 0.65, lineHeight: 1.6 }}>{v.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ display: "flex", alignItems: "center", maxWidth: 1200, margin: "0 auto", padding: "0 48px" }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, rgba(16,113,102,0.5))" }} />
        <img src="/logo.png" alt="logo" style={{ width: 40, height: 40, objectFit: "contain", margin: "0 24px" }} />
        <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, rgba(16,113,102,0.5))" }} />
      </div>

      {/* Gallery */}
      <section id="gallery" style={{ padding: "120px 48px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#f8f08e", marginBottom: 20 }}>
            <span className="ornament">✦</span>Adventures<span className="ornament">✦</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 900, color: "#fff" }}>
            Life in the <span style={{ color: "#f8f08e", fontStyle: "italic" }}>Field</span>
          </h2>
        </div>

        <div style={{ position: "relative", marginBottom: 24, borderRadius: 4, overflow: "hidden", aspectRatio: "16/7", border: "1px solid rgba(16,113,102,0.4)" }}>
          <img src={photos[activePhoto]?.url} alt={photos[activePhoto]?.caption} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "all 0.8s ease" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,31,30,0.8) 0%, transparent 40%)" }} />
          <div style={{ position: "absolute", bottom: 28, left: 32, fontFamily: "'Playfair Display', serif", fontStyle: "italic", fontSize: "1.3rem", color: "#fff" }}>
            {photos[activePhoto]?.caption}
          </div>
          <div style={{ position: "absolute", top: 16, right: 16, display: "flex", gap: 6 }}>
            {photos.map((_, i) => (
              <div key={i} style={{ width: i === activePhoto ? 24 : 6, height: 6, background: i === activePhoto ? "#f8f08e" : "rgba(255,255,255,0.3)", borderRadius: 3, transition: "all 0.4s", cursor: "pointer" }} onClick={() => setActivePhoto(i)} />
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {photos.map((p, i) => (
            <div key={i} className={`photo-thumb ${i === activePhoto ? "active" : ""}`} style={{ aspectRatio: "1", borderRadius: 2, overflow: "hidden" }} onClick={() => setActivePhoto(i)}>
              <img src={p.url} alt={p.caption} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: i === activePhoto ? 1 : 0.5, transition: "opacity 0.3s" }} />
            </div>
          ))}
        </div>
      </section>

      {/* Registration */}
      <section id="joinus" style={{ padding: "120px 48px", background: "rgba(16,113,102,0.06)", borderTop: "1px solid rgba(16,113,102,0.2)", borderBottom: "1px solid rgba(16,113,102,0.2)" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "0.75rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#f8f08e", marginBottom: 20 }}>
              <span className="ornament">✦</span>Enlist<span className="ornament">✦</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.5rem, 4vw, 3.5rem)", fontWeight: 900, color: "#fff", marginBottom: 16 }}>
              Begin Your <span style={{ color: "#f8f08e", fontStyle: "italic" }}>Journey</span>
            </h2>
              <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: "italic", opacity: 0.65, lineHeight: 1.8 }}>
                We welcome young scouts ages 7–17. Parents or guardians: fill out the form below and our Scoutmaster will contact you within 48 hours.
              </p>
          </div>

          {submitted ? (
            <div style={{ textAlign: "center", padding: "64px 32px", border: "1px solid rgba(16,113,102,0.4)", borderRadius: 4, animation: "scaleIn 0.6s ease" }}>
              <div style={{ marginBottom: 24 }}><img src="/logo.png" alt="logo" style={{ width: 80, height: 80, objectFit: "contain" }} /></div>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#f8f08e", marginBottom: 16 }}>Welcome, Scout!</h3>
              <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: "italic", opacity: 0.7, lineHeight: 1.8 }}>
                Your application for <strong style={{ color: "#e8f5e4" }}>{form.name}</strong> has been received.<br />CG Mira Harik will reach out to <strong style={{ color: "#e8f5e4" }}>{form.email}</strong> shortly.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontFamily: "'Libre Baskerville', serif", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>Scout's Full Name *</label>
                  <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Jana Khalil" />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "'Libre Baskerville', serif", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>Age *</label>
                  <input className="form-input" name="age" value={form.age} onChange={handleChange} placeholder="12" type="number" min="7" max="17" />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontFamily: "'Libre Baskerville', serif", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>Parent / Guardian *</label>
                  <input className="form-input" name="parent" value={form.parent} onChange={handleChange} placeholder="Rami Khalil" />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "'Libre Baskerville', serif", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>Phone Number</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+961 76 000 000" />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'Libre Baskerville', serif", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>Email Address *</label>
                <input className="form-input" name="email" value={form.email} onChange={handleChange} placeholder="rami.khalil@email.com" type="email" />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "'Libre Baskerville', serif", fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.6, marginBottom: 8 }}>Any questions or notes?</label>
                <textarea className="form-input" name="message" value={form.message} onChange={handleChange} placeholder="Tell us a bit about your scout and any questions you have..." rows={4} style={{ resize: "vertical" }} />
              </div>
              <div style={{ textAlign: "center", paddingTop: 8 }}>
                <button className="submit-btn" onClick={handleSubmit}>Submit Application</button>
                {(!form.name || !form.email || !form.age) && (
                  <p style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: "italic", fontSize: "0.8rem", opacity: 0.45, marginTop: 12 }}>* Required fields must be completed</p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "48px", textAlign: "center", borderTop: "1px solid rgba(16,113,102,0.3)" }}>
        <div style={{ marginBottom: 16 }}><img src="/logo.png" alt="logo" style={{ width: 56, height: 56, objectFit: "contain" }} /></div>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "1.2rem", color: "#f8f08e", marginBottom: 4 }}>Groupe Sacre Coeur Gemmayzeh</div>
        <div style={{ fontFamily: "'Libre Baskerville', serif", fontStyle: "italic", fontSize: "0.85rem", opacity: 0.4, marginBottom: 24 }}>Gemmayzeh · Est. 1955</div>
        <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: "0.8rem", opacity: 0.35, letterSpacing: "0.05em" }}>
          📍 College du Sacre Coeur, Rue Gouraud, Gemmayzeh · 📞 (76) 016-380 · ✉️ viiemegemmayzeh@scouts.org
        </div>
        <div style={{ marginTop: 32, fontFamily: "'Libre Baskerville', serif", fontStyle: "italic", fontSize: "0.75rem", opacity: 0.25 }}>
          "On my honor, I will do my best."
        </div>
      </footer>
    </div>
  );
}