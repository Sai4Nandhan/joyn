# JOYN — Activity & Social Discovery Platform

JOYN is a production-ready real-time activity matching and social discovery web application built with React, Node.js, Express, Socket.io, and MongoDB.

---

## 🌟 Core Features

- **Real Email OTP Authentication**: Secure registration and login via Nodemailer Gmail SMTP OTP.
- **Fair Bayesian Trust Score System**: Bounded [0, 100] reputation score calculated using Bayesian priors (`PRIOR_RATING_AVG = 4`, `PRIOR_RATING_COUNT = 3`) to prevent single-review score destruction.
- **Risk-Based Account Linkage & Anti-Abuse**: Detects strong phone/identity linkage to confirmed abusive accounts without poisoning normal users. Enforces objective independent-rater recovery criteria to block alt-account gaming loops.
- **Server-Authoritative Challenges & Badges**: 13 onboarding, hosting, and reliability challenges with 8 achievement badges evaluated dynamically from database lifecycle events.
- **Activity Lifecycle & Real-Time Rooms**: Complete creation, discovery, join request approval, exact location unlocking, real-time Socket.io chat, and mutual peer review feedback loops.
- **Admin Moderation & Compliance Queue**: Review reports, manage suspensions, and void abusive ratings upon dispute resolution.

---

## 📁 Repository Structure

```
activity-platform/
├── backend/          Node.js + Express + MongoDB + Socket.io Server
├── frontend/         React 18 + Vite + TailwindCSS + Lucide Icons Client
├── .gitignore        Root Git exclusion rules protecting secrets & user uploads
└── README.md         Project overview & deployment documentation
```

---

## 🚀 Quick Start & Local Setup

### 1. Backend Setup

```bash
cd backend
cp .env.example .env     # Configure SMTP_USER, SMTP_PASS, MONGO_URI, JWT secrets
npm install
npm run dev               # Starts backend on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.example .env     # Configure VITE_API_URL=http://localhost:5000/api
npm install
npm run dev               # Starts frontend dev server on http://localhost:5173
```

---

## 🔒 Security & Git Safety

- `.env` files, `node_modules/`, `dist/`, `uploads/`, and temporary logs are strictly ignored via `.gitignore`.
- Production builds are verified via `npx vite build`.
