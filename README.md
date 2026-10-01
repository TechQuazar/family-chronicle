# Buds (Family Chronicle) 🌿

> A warm, organic, heirloom-inspired digital family tree and chronicle for preserving memories across generations.

**Buds** is an interactive web application that reimagines genealogy as a living botanical garden. Instead of rigid, clinical pedigree charts, family lineages grow as organic tree branches with "buds" connected by winding vines. Each member's bud serves as a living memory capsule holding personal bios, time-capsule letters to the future, and private diary entries.

---

## ✨ Key Features

- **Interactive Botanical Tree Canvas**:
  - Pan and zoom across an infinite family canvas (supports Figma-style spacebar panning and trackpad/mouse controls).
  - SVG vine connections distinguishing parent-child lineages and spouse unions.
  - Generational auto-layout algorithm for nodes.
- **Family Member ("Bud") Profiles**:
  - Birth/death tracking, biographical narratives, and avatars.
  - Support for multi-parent relationships, spouses, and siblings.
- **Messages to the Future**:
  - Write time-capsule letters and heartfelt messages addressed to future generations.
- **Personal & Family Diaries**:
  - Keep chronologically ordered memories, stories, and reflections tied directly to a family member's bud.
- **Pluggable Backend Architecture**:
  - Built with an adapter pattern (`BackendAdapter`), enabling seamless switching between local offline storage and cloud backends without touching UI code.
- **Warm Heirloom Aesthetic**:
  - Custom botanical design system styled with Tailwind CSS and Radix UI primitives (`shadcn/ui`).
  - Warm parchment tones, earthy greens, terracotta accents, with Crimson Pro serif typography and DM Sans.

---

## 🏗️ Architecture & Tech Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + CSS variables
- **Component Primitives**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router DOM v6](https://reactrouter.com/)
- **State & Data Fetching**: [TanStack Query v5](https://tanstack.com/query/latest)
- **Data Persistence**: Pluggable adapter interface (`src/adapters`) with current offline-first `localStorage` driver.

---

## 📂 Project Structure

```
family-chronicle/
├── src/
│   ├── adapters/          # Backend adapter layer (local storage, future Supabase/AWS)
│   │   ├── local/         # LocalStorage mock backend implementation
│   │   ├── index.ts       # Adapter factory and switcher
│   │   └── types.ts       # Adapter interfaces (Auth, Family, Bud, Message, Diary)
│   ├── components/
│   │   ├── tree/          # Tree visualization (TreeCanvas, BudNode, VineConnection)
│   │   └── ui/            # shadcn/ui accessible component library
│   ├── contexts/          # React contexts (AuthContext)
│   ├── hooks/             # Custom React hooks (toast, mobile detection)
│   ├── pages/             # Route views (Dashboard, TreeView, BudDetail, Auth)
│   ├── types/             # TypeScript models and domain entities
│   ├── App.tsx            # Main application router and providers
│   └── index.css          # Design system color tokens and typography
├── public/                # Static assets
└── vite.config.ts         # Vite bundler configuration (port 8080)
```

---

## 🚦 Current Status

| Area | Status | Notes |
|---|---|---|
| **Tree Visualizer** | 🟢 Operational | Canvas panning, zooming, node rendering, and vine connections are working. |
| **Family & Bud Management** | 🟢 Operational | Creation of families, buds, and relationship bindings supported. |
| **Messages to the Future** | 🟢 Operational | Basic message creation and viewing per bud. |
| **Diary Entries** | 🟢 Operational | Basic note/entry creation per bud. |
| **Local Adapter (Mock)** | 🟢 Operational | Offline development with mock authentication and persistent browser storage. |
| **Production Cloud Backend** | 🟡 Scaffolding | Adapter interfaces defined; Supabase/AWS adapters pending implementation. |
| **Encryption & Privacy** | 🟡 In Design | Data models designed for hashed access keys and encrypted diary content. |

---

## 📋 Roadmap & Work Remaining

### Phase 1: Cloud Backend & Multi-User Support
- [ ] **Supabase Integration**:
  - Implement `SupabaseAdapter` for real authentication, Postgres DB, and real-time syncing.
  - Setup database migrations and Row-Level Security (RLS) policies.
- [ ] **Family Collaboration & Invites**:
  - Shareable invite links and role-based permissions (Owner, Editor, Viewer).
  - Member presence indicators on the tree canvas.

### Phase 2: Privacy & Heirloom Security
- [ ] **End-to-End Encryption**:
  - Client-side encryption for private diary entries.
- [ ] **Digital Inheritance / Bequeathal**:
  - Time-locked letters that unlock on specific calendar dates or milestones.
  - Password/key-protected diary unlock mechanism (`DiaryAccessKey`).

### Phase 3: Visual & Tree Canvas Enhancements
- [ ] **Advanced Graph Layout**:
  - Improved collision avoidance and auto-layout handling for complex blended families and large multi-generational datasets.
  - Optional manual node positioning with coordinate saving.
- [ ] **Media & Artifact Preservation**:
  - Image galleries and document attachments per bud.
  - Voice memo audio recording for oral family history.
- [ ] **Export Options**:
  - High-resolution SVG / PDF poster export for printing family trees.
  - GEDCOM standard import/export support.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20 LTS or v22 LTS recommended)
- **npm** (comes with Node) or **bun**

*(If on Ubuntu/Debian, install Node via [nvm](https://github.com/nvm-sh/nvm): `nvm install --lts && nvm use --lts`)*

### Installation

1. **Clone the repository**:
   ```bash
   git clone <REPO_URL>
   cd family-chronicle
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```

---

## 🛠️ Development Scripts

- `npm run dev`: Starts the local Vite development server with Hot Module Replacement (HMR).
- `npm run build`: Compiles TypeScript and creates an optimized production bundle in `dist/`.
- `npm run preview`: Serves the production build locally for verification.
- `npm run lint`: Runs ESLint over all project source files.

---

## 📄 License

This project is licensed under the MIT License.
