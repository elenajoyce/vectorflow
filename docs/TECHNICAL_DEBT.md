# VectorFlow Technical Debt Register 📋

This document outlines the architectural limitations, roadmap, and planned improvements for VectorFlow.

## 🎯 High Priority Tasks

### 1. Freighter Wallet On-Chain Signing
- **Status**: Wallet integration mockup active on the frontend.
- **Goal**: Integrate Freighter wallet SDK to sign and submit `create_stream`, `withdraw_from_stream`, and `cancel_stream` transactions directly on-chain.

### 2. Stream Rates with Decimals
- **Status**: Streams assume absolute integer units of tokens.
- **Goal**: Refactor the on-chain division in `get_claimable_amount` to handle 7-decimal token decimals (USDC standard) without precision loss or integer overflow.

---

## 📈 Planned Improvements

### 🧪 Test Coverage Roadmap
- Add 4 integration tests using `soroban-sdk::testutils` simulating multiple streams running concurrently.
- Implement REST routing tests in the coordinator to assert projection mathematical accuracy.

### ⚡ Gas & Storage Optimization
- Utilize Soroban temporary storage for short-term streams (< 30 days) to lower storage fees.
