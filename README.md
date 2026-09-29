# TripEase (YATRA360)

TripEase is a smart travel and tourism platform designed for modern travelers, local businesses, and travel administrators. The project brings together trip planning, destination discovery, hotel and experience booking, transport coordination, food recommendations, safety tools, budget management, and business dashboards into a unified experience.

This workspace includes:
- A React + Vite frontend in `client/`
- An Express backend in `server/`
- Docker-based local infrastructure in `docker-compose.yml`
- Database assets and migrations in `database/`
- A separate TypeScript backend in `backend/` that appears to be a parallel or earlier implementation

## Project vision

The platform is built around the idea of helping users:
- discover destinations and experiences across India
- generate AI-style travel itineraries
- compare hotels, guides, and transport options
- access local food and emergency safety information
- manage travel budgets and digital wallet features
- support local tourism businesses through dashboards and verified listings
- review trip outcomes and operational insights

---

## Features

### Traveler experience
- Destination explorer with category and state filters
- Beyond-the-crowd recommendations
- AI trip planner with itinerary generation
- Smart map and route-related travel discovery
- Hotel, experience, and guide marketplace
- Local food recommendations
- Transportation hub
- Budget planning assistant
- Safety center with emergency support information
- Travel wallet and digital payment-like features
- Tourist reviews and local rate insights

### Business and admin modules
- Local business dashboard
- Verified local listings
- Revenue and booking insight panels
- Admin dashboard for operational oversight
- Notification and onboarding flows

### Backend capabilities
- Health check endpoint
- Destination and itinerary APIs
- Travel and booking data simulation
- CORS-enabled Express server
- JSON API responses for frontend consumption

---

## Tech stack

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Leaflet (maps)
- Lucide icons
- Canvas confetti for UI moments

### Backend
- Node.js
- Express
- CORS
- dotenv

### Infrastructure
- Docker Compose
- PostgreSQL
- MongoDB
- Redis

### Additional project components
- Prisma schema in `backend/prisma/schema.prisma`
- SQL seed/migration scripts in `database/`

---

## Repository structure

```text
p1a/
├── README.md
├── docker-compose.yml
├── package.json
├── backend/
│   ├── package.json
│   ├── prisma/
│   └── src/
├── client/
│   ├── package.json
│   ├── public/
│   ├── src/
│   ├── vite.config.ts
│   └── README.md
├── database/
│   ├── migrations/
│   └── seed.sql
├── server/
│   ├── package.json
│   └── src/
└── .gitignore
```

---

## Prerequisites

Before running the project, make sure you have:
- Node.js 18+ or a compatible version
- npm
- Docker Desktop (optional, for database services)

---

## Installation

From the project root:

```bash
cd c:\p1a
npm install --prefix client
npm install --prefix server
```

If you want the database services from Docker:

```bash
docker compose up -d
```

---

## Running the project

### Start the backend

```bash
cd c:\p1a
npm run server
```

The backend runs on:
- `http://localhost:5000`

Health check:
```bash
curl http://localhost:5000/api/health
```

### Start the frontend

Open a second terminal and run:

```bash
cd c:\p1a
npm run client
```

The frontend runs on:
- `http://localhost:5173`

### Root scripts

The root `package.json` exposes useful commands:

```json
{
  "scripts": {
    "server": "npm --prefix server start",
    "client": "npm --prefix client run dev -- --host 0.0.0.0 --port 5173",
    "build:client": "npm --prefix client run build",
    "start": "npm run server"
  }
}
```

---

## Docker services

The project includes a Docker Compose configuration for local infrastructure:

- PostgreSQL on port `5432`
- MongoDB on port `27017`
- Redis on port `6379`

Command:

```bash
cd c:\p1a
docker compose up -d
```

To stop services:

```bash
docker compose down
```

---

## API overview

The backend server in `server/src/server.js` includes demo endpoints such as:

- `GET /api/health` — service status and project metadata
- `GET /api/destinations` — fetch destination listings with filters
- `GET /api/destinations/:id` — destination details plus related hotels, experiences, food, and weather
- `POST /api/itineraries/generate` — generate itinerary payloads based on user input

---

## Notes

- The current active app is driven by the `client/` frontend and `server/` backend.
- The `backend/` folder appears to be an alternate or earlier implementation and is not the main app entry used by the root scripts.
- The backend currently uses in-memory demo data rather than a live database connection, which makes the project easy to run locally for demonstrations.

---

## Future improvements

Possible next steps for the project:
- connect the backend to PostgreSQL/MongoDB services
- add authentication and role-based access control
- integrate real payment, booking, and mapping APIs
- deploy the frontend and backend separately
- add automated tests and CI/CD pipelines

---

## License

No explicit license file is currently present in the repository. If this project is being prepared for sharing or deployment, add an appropriate license such as MIT before publication.
