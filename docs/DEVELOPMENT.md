# VectorFlow Development Guide 🛠&zwj;♀️

This document outlines the local setup, compilation, and testing workflows for the VectorFlow monorepo.

## 🏗️ Requirements
- Node.js 22.5+
- pnpm 8+
- Rust stable + `wasm32-unknown-unknown` target (for Soroban compilation)
- Stellar CLI (optional, for local deployments)

---

## 🚀 Getting Started

### 1. Install Workspace Dependencies
At the root of the monorepo, run:
```bash
pnpm install
```

### 2. Configure Environment Variables
Copy the example environment template and configure your RPC nodes and private keys:
```bash
cp env.example .env
```

### 3. Build Shared Packages
The config validation and SDK packages must be compiled before running services:
```bash
pnpm build:config
pnpm build:sdk
```

---

## 📦 Package Workflows

### Soroban Smart Contracts (`/contracts`)
Test and build Soroban contracts:
```bash
cd contracts
cargo test
cargo build --target wasm32-unknown-unknown --release
```

### Coordinator REST Service (`/coordinator`)
Start the Order Book tracker with local SQLite database:
```bash
pnpm dev:coordinator
```

### Event Relayer (`/relayer`)
Start the event-polling ledger watcher:
```bash
pnpm dev:relayer
```

### React Frontend (`/frontend`)
Launch the client streaming interface locally:
```bash
pnpm dev:frontend
```
The client dApp will open at [http://localhost:5173/](http://localhost:5173/).
