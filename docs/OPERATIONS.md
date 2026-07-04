# VectorFlow Operations Guide ⚙️

This document describes the deployment checklists, environment configurations, and production operations for VectorFlow.

## ⛓️ Smart Contract Deployment

### Soroban Testnet Deployment
1. Compile the WASM contract binaries:
   ```bash
   cd contracts
   cargo build --target wasm32-unknown-unknown --release
   ```
2. Deploy to Stellar testnet using `stellar-cli`:
   ```bash
   stellar contract deploy \
     --wasm target/wasm32-unknown-unknown/release/vector_flow_contracts.wasm \
     --source-account my-secret \
     --network testnet
   ```
3. Update the `STREAM_ESCROW_CONTRACT_ID` value in `.env` with the returned Contract ID.

---

## 🏃‍♂️ Production Service Runner

VectorFlow uses the **Relayer** to continuously poll Soroban RPC for contract events and cash them into the SQLite database.

### Relayer Process
Start the relayer in production using PM2 or Docker:
```bash
pnpm --filter @vector-flow/relayer start
```

### Coordinator API
Start the coordinator to serve projected balances and stream logs to users:
```bash
pnpm --filter @vector-flow/coordinator start
```
Ensure your reverse proxy (e.g., NGINX) exposes the API port `4000` to the frontend dashboard.
