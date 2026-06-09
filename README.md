# Decentralized Voting System

## 1. Project Overview

Decentralized Voting System is a web application for Ethereum-based voting workflows. It combines a Solidity smart contract, a React frontend, and a small metadata API so admins and voters can interact with polls through MetaMask.

Admins can create polls, whitelist voter addresses, and close polls. Voters can connect a wallet, view available polls, cast one vote per poll, and view poll results. The `Voting` smart contract stores the core voting state on-chain, while the backend and MongoDB store poll metadata such as titles, descriptions, options, deadlines, content hashes, and transaction hashes for frontend display.

## 2. Main Features

- Connect wallet with RainbowKit and Wagmi.
- View polls from the smart contract and metadata API.
- Create polls as the contract owner.
- Add voter addresses to a poll whitelist.
- Vote once per whitelisted wallet.
- View vote counts and poll results.
- Close active polls as the contract owner.
- Store and fetch poll metadata through the Express API.
- Display transaction status and retry metadata saves when needed.

## 3. Tech Stack

- Smart Contract: Solidity, Foundry, OpenZeppelin Contracts.
- Frontend: React, Vite, CSS, RainbowKit, Wagmi, Viem, TanStack Query, Lucide React.
- Backend: Node.js, Express, Mongoose.
- Database: MongoDB.
- Network: Sepolia is configured in the frontend. Local Foundry/Anvil workflows can be used for contract testing.
- Package Manager: npm.

## 4. Repository Structure

```text
.
|-- src/
|   |-- Voting.sol              # Solidity voting contract
|   |-- App.jsx                 # React application shell
|   |-- main.jsx                # React entry point
|   |-- pages/                  # Frontend views
|   |-- components/             # Frontend components
|   |-- services/               # API client helpers
|   |-- utils/                  # Poll hashing and integrity helpers
|   `-- web3/                   # Wagmi, contract ABI, and contract hooks
|-- script/
|   `-- DeployVoting.s.sol      # Foundry deployment script
|-- test/
|   `-- VotingTest.t.sol        # Foundry contract tests
|-- server/
|   |-- index.js                # Express API entry point
|   |-- package.json            # Backend scripts and dependencies
|   `-- src/                    # Backend routes, controllers, models, and DB config
|-- lib/                        # Foundry dependencies
|-- broadcast/                  # Foundry deployment output
|-- cache/                      # Foundry cache
|-- out/                        # Foundry build output
|-- dist/                       # Vite production build output
|-- docs/                       # Project documentation artifacts
|-- package.json                # Frontend scripts and dependencies
|-- foundry.toml                # Foundry configuration
|-- foundry.lock                # Foundry dependency lock file
|-- .env.example                # Environment variable template
`-- README.md
```

There is no `docker-compose.yml` in this repository.

## 5. Prerequisites

- Node.js and npm.
- Foundry (`forge`, `cast`, and optionally `anvil`).
- MongoDB running locally or through an external MongoDB service.
- MetaMask browser wallet.
- Sepolia ETH if deploying or transacting on Sepolia.
- A Sepolia RPC provider URL, for example from Alchemy or Infura.
- A WalletConnect project ID is recommended for RainbowKit.

## 6. Environment Variables

Create a local `.env` file from the template:

```bash
cp .env.example .env
```

The backend loads `server/.env` first and then the root `.env`. The frontend reads Vite variables from the root `.env`.

### Root / Smart Contract `.env`

These variables are useful when deploying the contract with Foundry:

```env
SEPOLIA_RPC_URL=your_sepolia_rpc_url
PRIVATE_KEY=your_testnet_wallet_private_key_without_quotes
ETHERSCAN_API_KEY=your_etherscan_api_key_optional
```

### Backend `.env`

The Express server uses these variables:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/decentralized-voting
SERVER_PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

### Frontend `.env`

The Vite frontend uses these variables:

```env
VITE_SEPOLIA_RPC_URL=your_sepolia_rpc_url
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_CONTRACT_ADDRESS=your_deployed_contract_address
VITE_DEPLOYMENT_BLOCK=your_contract_deployment_block_optional
VITE_LOG_BLOCK_RANGE=10
VITE_API_BASE_URL=http://localhost:5000
```

Do not commit real `.env` files, private keys, RPC URLs, or API secrets. Use a testnet wallet only.

## 7. Installation

Clone the repository and install frontend dependencies from the project root:

```bash
git clone <repository-url>
cd foundry-decentralized-voting-system
npm install
```

Install backend dependencies:

```bash
cd server
npm install
cd ..
```

Install or update Foundry dependencies if needed:

```bash
forge install
```

If `lib/` is already present, Foundry dependencies have already been checked out in the working tree.

## 8. Running the Project Locally

### 8.1 Start MongoDB

This repo does not include a Docker Compose file. Start MongoDB using your local installation or a MongoDB service, then set `MONGODB_URI` in `.env`.

Example local connection string:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/decentralized-voting
```

### 8.2 Start Backend

Use the real scripts from `server/package.json`:

```bash
cd server
npm run dev
```

The backend defaults to:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

Poll metadata API:

```text
GET  http://localhost:5000/api/polls
GET  http://localhost:5000/api/polls/:pollId
POST http://localhost:5000/api/polls
PUT  http://localhost:5000/api/polls/:pollId
```

For a non-watch production-style start:

```bash
cd server
npm start
```

### 8.3 Start Frontend

Use the real scripts from the root `package.json`:

```bash
npm run dev
```

Vite usually serves the frontend at:

```text
http://localhost:5173
```

Other frontend scripts:

```bash
npm run build
npm run preview
```

### 8.4 Run Smart Contract Tests

Run the Foundry test suite:

```bash
forge test
```

Verbose test output:

```bash
forge test -vvv
```

### 8.5 Deploy Smart Contract

The repository includes `script/DeployVoting.s.sol`, which deploys `Voting` and sets the deployer as the contract owner.

Deploy to Sepolia:

```bash
forge script script/DeployVoting.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

Optional verification if `ETHERSCAN_API_KEY` is configured:

```bash
forge script script/DeployVoting.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

After deployment, copy the deployed contract address into the frontend environment:

```env
VITE_CONTRACT_ADDRESS=deployed_contract_address
```

If the deployment output includes a starting block number, set it too:

```env
VITE_DEPLOYMENT_BLOCK=deployment_block_number
```

Restart the frontend dev server after changing Vite environment variables.

## 9. Usage Flow

1. Start MongoDB and confirm `MONGODB_URI` is valid.
2. Start the backend API with `cd server && npm run dev`.
3. Start the frontend with `npm run dev`.
4. Open the frontend in the browser.
5. Connect MetaMask.
6. Switch MetaMask to Sepolia.
7. Use the contract owner wallet to create a poll.
8. Add voter wallet addresses to the poll whitelist.
9. Voters connect their wallets and cast votes.
10. Users view poll results.
11. The contract owner closes a poll when needed.

## 10. Troubleshooting

### MongoDB connection string error

Error:

```text
Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"
```

Fix:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/decentralized-voting
```

### Backend cannot connect to MongoDB

Check that MongoDB is running and that `MONGODB_URI` is set. This repository does not provide `docker-compose.yml`, so `docker compose up -d` is not a project command here unless you add your own Compose file.

### Frontend cannot load poll metadata

Check:

- Backend is running.
- MongoDB is running.
- `VITE_API_BASE_URL` matches the backend URL.
- `CLIENT_ORIGIN` allows the frontend origin.
- The browser console has no CORS or network errors.

### MetaMask is on the wrong network

Fix:

- Switch MetaMask to Sepolia.
- Confirm `VITE_CONTRACT_ADDRESS` points to a contract deployed on Sepolia.
- Confirm `VITE_SEPOLIA_RPC_URL` is valid.

### Contract address is incorrect

Fix:

- Check the contract address from the Foundry deployment output in `broadcast/DeployVoting.s.sol/`.
- Update `VITE_CONTRACT_ADDRESS`.
- Restart the frontend dev server after changing `.env`.

### RPC log range error

If whitelist reads fail because the RPC provider rejects large `getLogs` ranges, lower the block range:

```env
VITE_LOG_BLOCK_RANGE=10
```

If possible, also set:

```env
VITE_DEPLOYMENT_BLOCK=deployment_block_number
```

### Port already in use

The backend defaults to `5000` and Vite usually uses `5173`. If a port is busy, stop the process using that port or change `SERVER_PORT` for the backend.

## 11. Security Notes

- Do not commit `.env` files.
- Do not commit private keys.
- Use only testnet wallets for deployment and testing.
- Do not use wallets that hold real funds.
- Admin-only contract functions must be called by the contract owner wallet.
- Treat RPC URLs, API keys, and WalletConnect project IDs as environment-specific configuration.

## 12. Academic Context

This project was developed as part of an academic software engineering project. The main goal is to demonstrate how smart contracts can be used to build a transparent and tamper-resistant voting workflow.

## 13. License

This project is currently for academic purposes.
