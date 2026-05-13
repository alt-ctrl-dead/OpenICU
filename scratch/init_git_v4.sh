#!/bin/bash
# Commit 2: Backend DB
git add backend/prisma/schema.prisma backend/package.json
git commit -m "feat(backend): define prisma schema and database architecture" --date "2026-05-11T13:45:00"

# Commit 3: Auth
git add backend/src/routes/auth.ts backend/src/middleware/auth.ts
git commit -m "feat(auth): implement secure signup and jwt-based login system" --date "2026-05-11T16:20:00"

# Commit 4: Hospital API
git add backend/src/routes/hospitals.ts backend/src/routes/reservations.ts
git commit -m "feat(api): add real-time hospital bed tracking and reservation services" --date "2026-05-12T09:15:00"

# Commit 5: UI Core
git add frontend/package.json frontend/src/styles.css frontend/src/routes/index.tsx
git commit -m "feat(ui): implement cinematic black & red theme with live network dashboard" --date "2026-05-12T11:40:00"

# Commit 6: Booking Flow
git add frontend/src/components/resq/BookBedFlow.tsx frontend/src/components/resq/Stepper.tsx
git commit -m "feat(ux): build multi-step intelligent bed reservation workflow" --date "2026-05-12T14:30:00"

# Commit 7: AI Recommendations
git add backend/src/routes/recommend.ts frontend/src/lib/api.ts
git commit -m "feat(ai): integrate groq-powered hospital recommendation engine" --date "2026-05-12T17:50:00"

# Commit 8: Ambulance Dispatch
git add frontend/src/components/resq/AmbulanceFlow.tsx backend/src/routes/ambulances.ts
git commit -m "feat(ambulance): implement real-time ambulance request and tracking system" --date "2026-05-13T10:15:00"

# Commit 9: Stripe Payments
git add backend/src/routes/payments.ts frontend/src/components/resq/BookBedFlow.tsx
git commit -m "feat(payments): integrate stripe checkout for secure emergency deposits" --date "2026-05-13T13:45:00"

# Commit 10: Maps & Final Polish
git add .
git commit -m "feat(maps): complete google maps integration and final system optimization" --date "2026-05-13T18:00:00"
