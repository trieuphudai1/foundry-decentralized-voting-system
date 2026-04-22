# 📌 Decentralized Voting System (Smart Contract)

A decentralized voting system built on Ethereum using Solidity and Foundry.  
This project ensures transparency, immutability, and prevents double voting using blockchain technology.

---

## 🚀 Features

- Create polls (Admin only)
- Whitelist voters (batch)
- One wallet = one vote
- Deadline-based voting
- End poll manually or automatically
- On-chain vote counting
- Hybrid architecture (On-chain + Off-chain hash verification)

---

## 🧱 Smart Contract Overview

### Core Concepts

Each poll includes:

- `id`
- `contentHash` (keccak256 of off-chain data)
- `deadline`
- `isActive`

### Security Highlights

- Prevents double voting using `hasVoted`
- Uses whitelist to prevent Sybil attacks
- Enforces deadline to ensure valid voting period
- No external calls → resistant to reentrancy
- Uses OpenZeppelin `ReentrancyGuard` (future-proof)
- Follows Check-Effects pattern
- Strong access control with `Ownable`

## ⚙️ Tech Stack

- Solidity `^0.8.18`
- Foundry
- OpenZeppelin Contracts
- Ethereum (Sepolia Testnet)

---

## 📦 Installation (Foundry)

### 1. Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### 2. Clone project

```bash
git clone https://github.com/trieuphudai1/decentralized-voting.git
cd decentralized-voting
```

### 3. Install dependencies

Cài đặt các thư viện cần thiết (OpenZeppelin, etc.):

```bash
forge install
```

## 🚀 Deploy Smart Contract

### 1. Setup environment variables

Thiết lập biến môi trường:
```
export SEPOLIA_RPC_URL=your_rpc_url
export PRIVATE_KEY=your_private_key
```

### 2. Deploy contract
```
forge script script/DeployVoting.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## ✅ Verify Contract on Etherscan

```
forge verify-contract \
  --chain sepolia \
  --compiler-version v0.8.33 \
  $CONTRACT_ADDRESS \
  src/Voting.sol:Voting \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## 🧪 Example Interactions (cast)

### Create Poll

```
cast send $CONTRACT_ADDRESS \
"createPoll(bytes32,uint256,uint256)" \
<CONTENT_HASH> <DEADLINE> <OPTION_COUNT> \
--private-key $PRIVATE_KEY \
--rpc-url $SEPOLIA_RPC_URL
```

```
cast send $CONTRACT_ADDRESS \
"createPoll(bytes32,uint256,uint256)" \
$(cast keccak "Favorite Language|Choose your favorite programming language") \
$(date -d "+1 day" +%s) \
3 \
--private-key $PRIVATE_KEY \
--rpc-url $SEPOLIA_RPC_URL
```

### Add Whitelist

```
cast send $CONTRACT_ADDRESS \
"addToWhitelist(uint256,address[])" \
0 "[0xAddress1,0xAddress2]" \
--private-key $PRIVATE_KEY \
--rpc-url $SEPOLIA_RPC_URL
```

### Vote

```
cast send $CONTRACT_ADDRESS \
"vote(uint256,uint256)" \
0 1 \
--private-key $PRIVATE_KEY \
--rpc-url $SEPOLIA_RPC_URL
```

### End Poll

```
cast send $CONTRACT_ADDRESS \
"endPoll(uint256)" \
0 \
--private-key $PRIVATE_KEY \
--rpc-url $SEPOLIA_RPC_URL
```

### Get Poll
```
cast call $CONTRACT_ADDRESS \
"getPoll(uint256)" \
0 \
--rpc-url $SEPOLIA_RPC_URL
```

### Poll name, Description
```
cast keccak "Favorite Language|Choose your favorite programming language"
```