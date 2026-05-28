# ⚜️ Groupe Sacre Coeur Gemmayzeh — Website

A full-stack web application for Groupe Sacre Coeur Gemmayzeh, featuring a public-facing site with photo gallery, group introduction, and registration form — plus a password-protected admin panel to manage registrations and photos.

---

## 📁 Project Structure

```
vii/
├── client/                        # React frontend
│   ├── public/
│   │   └── index.html             # HTML entry point
│   ├── src/
│   │   ├── App.js                 # Public website
│   │   ├── Admin.js               # Admin panel
│   │   └── index.js               # React root renderer
│   ├── nginx.conf                 # Nginx config (used in Docker)
│   ├── Dockerfile
│   └── package.json
├── server/                        # Node.js + Express API
│   ├── index.js                   # API routes
│   ├── db.js                      # PostgreSQL connection & schema
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml             # Orchestrates all 3 services
├── .env                           # Secrets & config (never commit this)
└── README.md
```

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 |
| Backend | Node.js + Express |
| Database | PostgreSQL 15 |
| Reverse Proxy | Nginx |
| Containerization | Docker + Docker Compose |

---

## 🐳 Running with Docker (Recommended)

This is the easiest way — one command starts everything.

### Prerequisites

- Install **Docker Desktop** from [docker.com](https://docker.com)

### Steps

1. Clone or download this repository
2. Create a `.env` file in the root folder:

```env
POSTGRES_DB=scoutdb
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin123
JWT_SECRET=some_long_random_secret_string
ADMIN_PASSWORD=admin123
```

3. Start everything:

```bash
docker compose up --build
```

4. Open your browser:
   - **Public site** → http://localhost
   - **Admin panel** → http://localhost/admin

### Useful Docker Commands

```bash
# Run in background
docker compose up -d --build

# Stop everything
docker compose down

# View live logs
docker compose logs -f

# Wipe database and start fresh
docker compose down -v

# Rebuild a single service
docker compose up --build server
```

---

## 💻 Running Locally (Without Docker)

### Prerequisites

- **Node.js** v18+ → [nodejs.org](https://nodejs.org)
- **PostgreSQL** 15+ → [postgresql.org/download](https://postgresql.org/download)

### 1. Create the database

```bash
psql -U postgres -c "CREATE DATABASE scoutdb;"
```

### 2. Configure the server

Create `server/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scoutdb
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=some_long_random_secret_string
ADMIN_PASSWORD=admin123
PORT=4000
```

### 3. Start the server

```bash
cd server
npm install
npm run dev
```

### 4. Start the client

In a second terminal:

```bash
cd client
npm install
npm start
```

- **Public site** → http://localhost:3000
- **Admin panel** → http://localhost:3000/admin

> When running locally (without Docker), set `const API = "http://localhost:4000"` at the top of `App.js` and `Admin.js`.

---

## ☁️ GitHub Codespaces

PostgreSQL is not pre-installed in Codespaces. Add this file to auto-configure the environment:

**`.devcontainer/devcontainer.json`**
```json
{
  "name": "Scout App",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18",
  "features": {
    "ghcr.io/itsmechlark/features/postgresql:1": { "version": "14" }
  },
  "postStartCommand": "sudo service postgresql start && cd server && npm install && cd ../client && npm install",
  "forwardPorts": [3000, 4000]
}
```

Then set port **4000** to **Public** in the Ports tab and update `client/.env`:

```env
REACT_APP_API_URL=https://your-codespace-name-4000.app.github.dev
```

---

## ✨ Features

| Section | Description |
|---|---|
| **Hero** | Full-screen banner with auto-cycling photos and animated title |
| **About** | Troop story, stats, and 4 core values cards |
| **Gallery** | Featured image with transitions and clickable thumbnail strip |
| **Registration Form** | Saves to PostgreSQL, shows confirmation on submit |
| **Admin — Registrations** | View, browse, and delete all registrations in a table |
| **Admin — Photos** | Add, edit, and delete gallery photos with live preview |

---

## 🔐 Admin Panel

Navigate to `/admin` on the site. Login with the password set in `ADMIN_PASSWORD` in your `.env` file.

The default password is `admin123` — **change this before deploying publicly.**

---

## 🎨 Design

- **Theme:** Dark adventure-lodge aesthetic with gold (`#D4A017`) accents
- **Fonts:** Playfair Display (headings) + Libre Baskerville (body) via Google Fonts
- **Images:** Sourced from Unsplash — replace with your own in the Admin panel
- **Animations:** CSS keyframe animations on hero entrance, cards, and thumbnails

---

## 🛠️ Customization

### Change Troop Name or Info
Edit `client/src/App.js` — search for `"TROOP 47"` to find all relevant lines.

### Change Photos
Use the **Admin panel** at `/admin` → Photos tab to add, edit, or delete photos without touching any code.

### Change Contact Info
Edit the footer section at the bottom of `client/src/App.js`.

### Change Core Values
Find the `values` array near the top of `client/src/App.js`:

```js
const values = [
  { icon: "🧭", title: "Adventure", desc: "Your description here" },
  ...
];
```

---

## 📦 Dependencies

### Client
| Package | Purpose |
|---|---|
| `react` ^18.2.0 | UI framework |
| `react-dom` ^18.2.0 | DOM rendering |
| `react-scripts` 5.0.1 | Dev server and build tooling |

### Server
| Package | Purpose |
|---|---|
| `express` ^4.18.2 | HTTP server and routing |
| `pg` ^8.11.0 | PostgreSQL client |
| `jsonwebtoken` ^9.0.0 | Admin authentication |
| `bcryptjs` ^2.4.3 | Password hashing |
| `cors` ^2.8.5 | Cross-origin requests |
| `dotenv` ^16.0.3 | Environment variables |

---

## 🚀 Deploying to a Server

Since everything is Dockerized, deploying to any Linux server is just:

```bash
# On your remote server (VPS, AWS, DigitalOcean, etc.)
git clone your-repo
cd vii
cp .env.example .env   # fill in your values
docker compose up -d --build
```

The site will be live on port 80. Point your domain's DNS A record to the server IP and it's done.

---

## 📄 License

Free to use and modify for your scout group. No attribution required.

---

*"On my honor, I will do my best."*
