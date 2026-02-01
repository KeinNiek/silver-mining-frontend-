# Silver Mining Protocol - Complete Frontend v3.1

## Deployed Contract
- **Program ID**: `CiKNKPpdC55EpnVD5nDF5kSHVUHu1Q3kiKUstdsHPmtV`
- **Network**: Solana Mainnet
- **RPC**: Helius Mainnet

## Fixes Applied (v3.1)

### CRITICAL: Round Data Parsing Bug
The `fetchRound()` function was missing two fields that exist in the deployed contract:
- `solo_seed` (u64) - after `solo_winner`
- `solo_best_score` (u64) - after `solo_seed`

This caused all subsequent fields (`totalPot`, `blockTotals`, `winnerPot`, `bump`) to be parsed from wrong byte offsets, resulting in garbage data for round display.

### IDL Corrections
- Added `paused` (bool) field to Config struct
- Added `solo_seed` (u64) and `solo_best_score` (u64) to Round struct
- Fixed Pool `members` array size from 10 → 100 (matching contract)
- Added `crank_autominer` instruction definition

### Dashboard Fixes
- Removed duplicate JSX block (round results was rendering twice)
- Added Motherlode trigger button with countdown to target round
- Added Redistribution Pool claim UI in Refine tab
- Added protocol paused banner
- Improved round timer to use actual `endTime` from round data

### Enhanced Auto-Crank
The browser-based auto-crank now includes:
- **Auto-Finalize**: Detects when round timer expires and auto-finalizes
- **Auto-Init-Round**: Automatically initializes the next round after finalization
- **Auto-Bet**: Places autominer bets for each new round
- Time remaining countdown in status display

## Features

### Mining
- Select 1-5 blocks to bet on
- Configurable SOL per block
- Large bet confirmation for bets > 1 SOL
- Real-time round timer and pot display

### Pools
- Browse and join existing pools
- Join by Pool ID
- Create new pools with custom fee and mine level
- Max 100 members per pool, max 5% fee

### Staking
- Stake SILVER tokens for APR rewards
- Unstake with claim
- Claim pending staking rewards

### Refine
- Convert UNREFINED → SILVER (90% to you, 10% to redistribution)
- Claim redistribution pool rewards

### AutoMiner
- Setup automated betting (always 5 blocks, 100% win rate)
- Deposit/withdraw SOL balance
- Enable/disable autominer
- Browser auto-crank with auto-finalize
- Manual crank button

### Motherlode
- View jackpot balance and target round countdown
- Trigger motherlode when target round reached
- Jackpot auto-pays to triggerer

## Deployment

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Wallet Configuration
- Admin Authority: `629HQAktPmCazs3Y8Q9a1j7hNha9Wmm4rJcyvxrd434v`
- Warchest: `2YaT2cNFDHTg8YcjGbjgyUFDLYSdKk4fh9qY9Q2YMkg3`
- Admin Fees: `G1MfDRETA6zuCSHV7vkB82HFL5XCz2Pb9rKy1JZ9PCmk`

## Tech Stack
- React 18 + TypeScript
- Vite build system
- Tailwind CSS (custom theme)
- Solana wallet-adapter
- Zustand state management
- Framer Motion animations
- react-hot-toast notifications
