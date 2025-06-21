# Clash of Regions

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="resources/images/OpenFrontLogoDark.svg">
    <source media="(prefers-color-scheme: light)" srcset="resources/images/OpenFrontLogo.svg">
    <img src="resources/images/OpenFrontLogo.svg" alt="OpenFrontIO Logo" width="300">
  </picture>
</p>

![Prettier Check](https://github.com/openfrontio/OpenFrontIO/actions/workflows/prettier.yml/badge.svg)
[![Crowdin](https://badges.crowdin.net/openfront-mls/localized.svg)](https://crowdin.com/project/openfront-mls)

**Clash of Regions** is a private fork of **OpenFrontIO (v23.12)**, reworked into a persistent MMO strategy game inspired by **Rival Regions**, **Call of War 3**, and **OpenFront.io**. This project retains OpenFront's fast-paced engine but expands it into a long-term, political-economic simulation with persistent states and player-driven gameplay.

---

## 🌟 Features (from base engine)

- Real-time strategic gameplay with WebSocket-driven interactions
- Multiple real-world maps (e.g., Europe, Asia)
- Full-stack TypeScript codebase
- Modular client/server/core structure
- Resource and territory management
- Alliance and diplomacy systems
- Cross-platform via browser

---

## 🎯 Project Vision (Clash of Regions)

Unlike OpenFront.io’s match-based system, this fork introduces:

- 🌍 A **persistent world** with thousands of territories
- 💰 **Economy**: production, trading, taxation
- 🏛️ **Politics**: player-run governments, voting, parties
- ⚔️ **Military**: armies, movement, battles, occupation
- 🔁 **Realtime ticks** and save/load mechanics
- 🖥️ **UI/UX overhaul** to support MMO-scale gameplay

---

## 📦 Development Backlog

### 🧱 Core Infrastructure
- [ ] Replace match reset system
- [ ] Persistent DB and reconnect support
- [ ] Long-session WebSocket stability

### 🌍 World Map
- [ ] Admin1/custom map loader
- [ ] Region hover/select + ownership coloring

### 💰 Economy
- [ ] Resource generation
- [ ] Territory-linked production
- [ ] Warehouses, trading, taxation

### ⚔️ Military
- [ ] Unit training and movement
- [ ] Battle system and region conquest

### 🏛️ Politics
- [ ] Elections, governance types
- [ ] Party systems, player-run countries

### 🖥️ UI / UX
- [ ] HUD with dynamic region/player data
- [ ] Construction, army, and diplomacy panels

---

## 🛠️ Development Tools

- Format:
  ```bash
  npm run format
  ```
- Lint:
  ```bash
  npm run lint
  ```
- Fix lint issues:
  ```bash
  npm run lint:fix
  ```

---

## 📋 Prerequisites

- [Node.js / npm](https://www.npmjs.com/) (v10.9.2+)
- Modern browser (Chrome, Firefox, Edge)

---

## 🚀 Getting Started

### Clone the repository

```bash
git clone https://github.com/your-username/clash-of-regions.git
cd clash-of-regions
npm install
```

### Run in development mode

```bash
npm run dev
```

This launches:
- Webpack dev server for the client
- Game server in dev mode
- Browser auto-launch (localhost)

### Run client or server independently:

```bash
npm run start:client      # client only
npm run start:server-dev  # server only
```

---

## 🏗️ Project Structure

```
src/
├── client/   → Game client (browser)
├── server/   → Node.js game server
├── core/     → Shared game logic
resources/    → Maps, images, and static assets
```

### Persistent World Setup

Set `PERSISTENT_WORLD=1` to enable the new persistent server mode. Configure
MySQL and Redis connections through the following environment variables:

```
MYSQL_HOST
MYSQL_USER
MYSQL_PASSWORD
MYSQL_DB
REDIS_URL
```

Run the SQL scripts under `resources/sql/` to initialize the database schema.

### Province Mini-Map Generation

The `new map project` folder contains a GeoJSON dataset of real-world provinces.
Run the build script to pre-generate mini-map textures for each province:

```bash
npm run build-province-maps [datasetPath] [outputDir]
```

By default it reads `new map project/provinces.geojson` and writes PNG files to
`resources/province_maps/`. These assets are served by the game server and can
be loaded at runtime using `loadProvinceMiniMap(name)` from the client.



---

## 📝 License

This project uses a dual-license inherited from OpenFrontIO:

- MIT for `server/` and `core/`
- GPLv3 for `client/`

See [LICENSE](LICENSE) for full details.

---

## 🙏 Credits

- Forked from [OpenFrontIO](https://github.com/openfrontio/OpenFrontIO)
- Originally a rewrite of [WarFront.io](https://github.com/WarFrontIO)
- Crowdin translation support: [Link](https://crowdin.com/project/openfront-mls)

---

## 🔒 Note on Contributions

This project is currently maintained privately. Outside contributions are not accepted at this stage. Feature requests or ideas are welcome via issues only.

Development Team:
- Lead Developer
- Systems Architect
