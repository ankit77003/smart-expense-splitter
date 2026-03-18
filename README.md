# Smart Expense Splitter

Full-stack app to **split group expenses** and produce a **minimal set of settlement transactions**.

## Tech

- **Frontend**: React (Vite), minimal UI
- **Backend**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (Bearer token)

## Features

- **Authentication**: register/login, JWT stored in browser `localStorage`
- **Groups**: create groups, add members (by email)
- **Expenses**: add expenses with payer + participants (equal split; backend also supports custom shares)
- **Balances**: computes each member’s net amount
- **Debt optimization**: reduces to a minimal number of transactions
- **Final settlement**: “A pays B ₹500” style output

## The optimization algorithm (core DSA)

The backend converts all expenses into a **net balance per user** and then “nets” them out.

### Step 1: Convert expenses to net balances

For each expense of amount \(A\):

- Payer gets **credited** by \(+A\)
- Each participant gets **debited** by \(-share\)

After processing all expenses:

- **net \(> 0\)** → user should **receive**
- **net \(< 0\)** → user should **pay**

This transformation removes all the small per-expense edges and turns the problem into a flow-netting problem.

### Step 2: Greedy matching (min transactions)

We build:

- **creditors**: users with net \(> 0\)
- **debtors**: users with net \(< 0\) (store as positive “amount to pay”)

Then we repeatedly match the **largest debtor** with the **largest creditor**:

1. pay = min(debtor.amount, creditor.amount)
2. record a transfer: debtor → creditor for `pay`
3. reduce both amounts; whichever hits zero is removed

This greedy approach produces **at most \(N-1\)** transfers and is the standard optimal way to **minimize the number of transactions** once you’re working with net balances (every transfer eliminates at least one non-zero balance).

Implementation lives in:

- `backend/src/services/settlementService.js` (`computeNetByUser`, `optimizeSettlement`)

## API (high level)

Base URL: `http://localhost:5000/api`

- `POST /auth/register`
- `POST /auth/login`
- `GET /groups` (auth)
- `POST /groups` (auth)
- `GET /groups/:groupId` (auth)
- `POST /groups/:groupId/members` (auth)
- `GET /groups/:groupId/expenses` (auth)
- `POST /groups/:groupId/expenses` (auth)
- `GET /groups/:groupId/settlement` (auth) → optimized transfers + balances

## Run locally

### 1) Start MongoDB

Use your local install or Docker. Example DB name in `.env.example` is `smart-expense-splitter`.

### 2) Backend

From `SmartExpenseSplitter/backend`:

```bash
npm install
cp .env.example .env
npm run dev
```

Backend runs on `http://localhost:5000`.

### 3) Frontend

From `SmartExpenseSplitter/frontend`:

```bash
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Notes / assumptions

- **Adding members** is done by email and requires those users to already be registered.
- The UI uses **equal-split** for simplicity; backend supports `CUSTOM` shares too.
- Amounts are rounded to 2 decimals; tiny floating “dust” is neutralized.

