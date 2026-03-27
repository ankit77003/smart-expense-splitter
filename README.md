# Smart Expense Splitter

A full-stack web application to manage and split group expenses efficiently, minimizing the number of transactions required for settlement.

## Live Demo

🌐 Frontend: https://smart-expense-splitter-pi.vercel.app
⚙️ Backend API: https://smart-expense-splitter-1-2qpp.onrender.com


## Tech Stack

- Frontend: React (Vite)
- Backend: Node.js, Express.js
- Database: MongoDB (Mongoose)
- Authentication: JWT (Bearer Token)


## Features

- 🔐 User authentication (Register/Login with JWT)
- 👥 Create groups and manage members
- 💸 Add expenses with equal/custom splits
- 📊 Real-time balance calculation
- ⚡ Optimized debt settlement (minimum transactions)
- 📦 RESTful API architecture

## The optimization algorithm (Core Algorithm)

This project uses a greedy algorithm to minimize the number of transactions.

### Step 1: Convert Expenses → Net Balances

- Payer gets +amount
- Participants get -share

After processing all expenses:

- Positive → should receive
- Negative → should pay

### Step 2: Greedy matching (min transactions)

- Separate into creditors and debtors
- Match largest debtor with largest creditor
- Transfer minimum amount
- Repeat until settled

Ensures at most (N - 1) transactions

## API (high level)

Base URL: `https://smart-expense-splitter-1-2qpp.onrender.com/api`

METHOD   ENDPOINTS
- POST	/auth/register
- POST	/auth/login
- GET	/groups
- POST	/groups
- GET	/groups/:groupId
- POST	/groups/:groupId/members
- GET	/groups/:groupId/expenses
- POST	/groups/:groupId/expenses
- GET	/groups/:groupId/settlement

##Screenshots
- Login page
  <img width="815" height="469" alt="Screenshot 2026-03-27 at 5 27 54 PM" src="https://github.com/user-attachments/assets/ce3d22df-e8b8-4dd6-a46a-f99cabfec98a" />
 
- Dashboard
  <img width="1256" height="511" alt="Screenshot 2026-03-27 at 5 28 58 PM" src="https://github.com/user-attachments/assets/1bf731d8-a96f-4448-a2bf-10e7e791b926" />

- Group view
  <img width="1279" height="680" alt="Screenshot 2026-03-27 at 5 29 25 PM" src="https://github.com/user-attachments/assets/aa8c23b6-f070-44b8-ad4b-33bd98b3a759" />

- Settlement result
  <img width="1002" height="210" alt="Screenshot 2026-03-27 at 5 29 47 PM" src="https://github.com/user-attachments/assets/2addc146-ee36-41c0-be36-4a19c8669b1d" />


## Run locally

### 1) Backend

cd backend
npm install
cp .env.example .env
npm run dev

### 2) Frontend

cd frontend
npm install
cp .env.example .env
npm run dev


## Notes / assumptions

- **Adding members** is done by email and requires those users to already be registered.
- The UI uses **equal-split** for simplicity; backend supports `CUSTOM` shares too.
- Amounts are rounded to 2 decimals; tiny floating “dust” is neutralized.

