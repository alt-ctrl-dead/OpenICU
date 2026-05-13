# 🏥 OpenICU — Emergency Care Access Network

**OpenICU** is an emergency healthcare access platform focused on helping users quickly find and request ICU beds or ambulance support. The MVP is built for Bengaluru, with hospital bed availability, hospital details, emergency bed reservation requests, ambulance dispatch flows, payments, and audit logs.

Users can book a bed by entering urgency, medical situation, patient location, optional reports, and completing a payment to reserve the bed. They can also request an ambulance by choosing the emergency type, pickup location, destination, and ambulance type. The long-term vision is a pan-India real-time critical-care access network. 

Here's the OpenICU User Workflow (8 steps):

1. Land on the Platform User visits OpenICU and sees the live emergency network dashboard — real-time ICU bed counts, ambulance status, and recent activity across Bengaluru.

2. Create an Account User clicks "Sign In" → switches to "Sign Up" → enters name, email, phone, and password. Platform immediately requests location permission to enable proximity-based services.

3. Browse the Live Network User scrolls to see available hospitals on the interactive map, with real-time ICU bed counts, ratings, and emergency status badges (Live / Verified / Stale).

4. Select a Hospital User clicks on any hospital card to open the full profile — departments, facilities, bed availability, location map, and contact options.

5. Start a Bed Reservation User clicks "Reserve Bed" → enters medical situation, urgency level, and type of bed needed (ICU, ventilator, etc.).

6. Get AI Recommendations The platform's AI engine analyzes the patient's condition and location to recommend the top matching hospitals ranked by fit, availability, and distance.

7. Confirm Location User confirms their pickup location via live GPS or manual address entry, with an interactive map pin for precision.

8. Complete Payment User pays the ₹10,000 emergency deposit via Stripe (card/UPI). On success, a 4-hour reservation is locked in with a unique booking code — hospital is instantly notified.

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
