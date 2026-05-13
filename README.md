# 🏥 OpenICU — Emergency Care Access Network

**OpenICU** is a cinematic, high-impact emergency healthcare platform designed to solve the critical "last-mile" problem in ICU bed availability. Built for speed, privacy, and reliability, it connects patients to the nearest available ICU beds and ambulances in seconds.

![OpenICU Hero](https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&q=80)

## 🚀 Key Features

- **Live ICU Network**: Real-time tracking of ICU beds, ventilators, and emergency status across the city.
- **AI Recommendation Engine**: Powered by Groq (LLM), the platform analyzes patient symptoms and hospital capabilities to suggest the best match.
- **One-Click Ambulance Dispatch**: Request specialized ambulances (BLS/ALS/Cardiac) with live GPS tracking.
- **Secure Stripe Deposits**: Integrated ₹10,000 emergency deposit system to secure a bed instantly for 4 hours.
- **Interactive Maps**: Full Google Maps integration for hospital visualization and live patient location tracking.
- **Privacy First**: Explicit consent-based data sharing; hospital-side patient records are never copied or stored.

## 🛠️ Technology Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion, TanStack Router.
- **Backend**: Node.js (Express), Prisma ORM, SQLite.
- **Payments**: Stripe API.
- **Intelligence**: Groq LLM API.
- **Maps**: Google Maps JavaScript API, Places API, Geolocation API.

## 📦 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Google Maps API Key
- Stripe Test Keys
- Groq API Key

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/alt-ctrl-dead/OpenICU.git
cd OpenICU

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 3. Environment Setup
Create a `.env` file in the `backend/` directory:
```env
DATABASE_URL="file:./dev.db"
GROQ_API_KEY="your_key"
STRIPE_SECRET_KEY="your_key"
STRIPE_PUBLISHABLE_KEY="your_key"
JWT_SECRET="your_secret"
PORT=5001
```

### 4. Running the App
```bash
# Start Backend
cd backend && npm run dev

# Start Frontend
cd frontend && npm run dev
```

## 🛡️ Security & Privacy
OpenICU follows a strict data minimization policy. Patient data is encrypted in transit and at rest, and audit logs track every critical action within the network.

## 🏆 Hackathon MVP
This project was developed as a rapid-response MVP for a healthcare innovation hackathon, focusing on cinematic UI/UX and robust full-stack integration.

---
Built with ❤️ by [alt-ctrl-dead](https://github.com/alt-ctrl-dead)
