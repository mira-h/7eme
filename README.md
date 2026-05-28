# ⚜️ Eagle Scout Troop 47 — Website

A single-page React website for Eagle Scout Troop 47, featuring a photo gallery, group introduction, and a registration form.

---

## 📁 Project Structure

```
vii/
├── public/
│   └── index.html        # HTML entry point
├── src/
│   ├── App.js            # Main website component (all code lives here)
│   └── index.js          # React root renderer
└── package.json          # Project dependencies and scripts
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have **Node.js** installed on your machine.

- Download from: https://nodejs.org (choose the **LTS** version)
- Verify installation:

```bash
node -v
npm -v
```

### Installation

1. Clone or download this project folder
2. Open a terminal inside the project folder
3. Install dependencies:

```bash
npm install
```

### Running Locally

```bash
npm start
```

The site will open automatically at **http://localhost:3000**

### Building for Production

```bash
npm run build
```

This creates an optimized `build/` folder ready to deploy to any static host.

---

## ✨ Features

| Section | Description |
|---|---|
| **Hero** | Full-screen banner with auto-cycling background photos and animated title |
| **About** | Troop story, stats (alumni, years active, Eagle Scouts), and 4 core values cards |
| **Gallery** | Large featured image with smooth transitions and a clickable thumbnail strip |
| **Registration Form** | Collects scout name, age, parent info, phone, email, and notes — shows confirmation on submit |
| **Footer** | Contact info and troop motto |

---

## 🎨 Design

- **Theme:** Dark adventure-lodge aesthetic with gold (`#D4A017`) accents
- **Fonts:** Playfair Display (headings) + Libre Baskerville (body) via Google Fonts
- **Images:** Sourced from Unsplash (no account required)
- **Animations:** CSS keyframe animations for hero entrance, hover effects on cards and thumbnails

---

## 🛠️ Customization

### Change Troop Name or Info
Edit the text directly in `src/App.js`. Search for `"TROOP 47"` or `"Eagle Scout"` to find the relevant lines.

### Change Photos
Find the `photos` array near the top of `src/App.js` and replace the Unsplash URLs with your own image URLs:

```js
const photos = [
  { url: "https://your-image-url.com/photo1.jpg", caption: "Your Caption" },
  ...
];
```

### Change Contact Info
Search for the footer section at the bottom of `src/App.js` and update the address, phone, and email.

### Change Core Values
Find the `values` array near the top of `src/App.js`:

```js
const values = [
  { icon: "🧭", title: "Adventure", desc: "Your description here" },
  ...
];
```

---

## 📦 Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | ^18.2.0 | UI framework |
| `react-dom` | ^18.2.0 | DOM rendering |
| `react-scripts` | 5.0.1 | Dev server and build tooling |

No additional libraries required — all styling is done with inline CSS and a `<style>` tag.

---

## 🌐 Deploying Online

Once you've run `npm run build`, you can host the `build/` folder on:

- **Netlify** — drag and drop the `build/` folder at netlify.com
- **Vercel** — run `npx vercel` in the project root
- **GitHub Pages** — use the `gh-pages` package

---

## 📄 License

Free to use and modify for your scout group. No attribution required.

---

*"On my honor, I will do my best."*
