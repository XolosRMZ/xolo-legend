# XOLOLEGEND — NFT + RMZ Marketplace (MVP)

XOLOLEGEND is a dark, premium marketplace UI for **xolosArmy NFTs** and **RMZ (Xolos RMZ) token offers**, designed to work with **Tonalli Wallet** via deep links and a real connect callback flow.

## Features (current)
- Marketplace UI (NFTs + RMZ offers) driven by local JSON data
- Offer ID shown under each card + Copy Offer ID
- **Open in Tonalli**:
  - deep link: `tonalli://offer/<offerId>`
  - fallback: `https://app.tonalli.cash/?offerId=<offerId>`
- Wallet connect flow (real callback):
  - Connect button opens Tonalli connect
  - Tonalli returns to `/connected?address=...&chain=ecash&wallet=tonalli`
  - Session stored in `localStorage` (`xololegend_wallet_session`)
- Favorites + TXID modal + clipboard helper with fallback

## Requirements
- Node.js 18+ (recommended)

## Install & Run
```bash
npm install
npm run dev
