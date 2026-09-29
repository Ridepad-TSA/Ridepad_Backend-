# Car Rental API

Node.js, Express, JavaScript, and MongoDB/Mongoose backend for a car rental application.

## Structure

```text
src/
  config/         Environment and database setup
  controllers/    Request handlers
  middleware/     Shared Express middleware
  models/         Mongoose models
  routes/         API route definitions
  services/       Business logic
  utils/          Shared utilities
  seedAdmin.js    Creates the first admin account
  app.js          Express application setup
  server.js       Database connection and server startup
uploads/          Local vehicle image storage (ignored by Git)
```

## Getting started

```bash
npm install
copy .env.example .env
npm run dev
```

The server seeds an admin account from `ADMIN_EMAIL` and `ADMIN_PASSWORD` on startup. Change both values before using a shared environment.

The health endpoint is available at `GET http://localhost:5000/api/health`.

## API overview

- `POST /api/auth/register` and `POST /api/auth/login` handle user authentication.
- `GET /api/cars` supports `make`, `model`, `minPrice`, `maxPrice`, `availableFrom`, and `availableTo` filters.
- Admins create or update cars with `multipart/form-data`; image files use the `images` field and are served from `/uploads/...`.
- Admin-only car endpoints manage inventory and active/inactive state.
- Authenticated users create bookings with `carId`, `pickupDate`, and `returnDate`, then view history at `GET /api/bookings/mine`.
- Admins can list all bookings, list overdue rentals, and update booking status.

## Booking lifecycle

Bookings follow explicit transitions:

```text
requested -> picked_up -> returned
requested -> cancelled
picked_up -> overdue -> returned
```

The pickup and return actions are represented by the admin status endpoint: `PATCH /api/bookings/:id/status` with `{ "status": "picked_up" }` or `{ "status": "returned" }`. Overdue bookings are automatically detected when user/admin booking lists are read and can also be reviewed at `GET /api/bookings/overdue`.

Booking creation checks overlapping active bookings inside a MongoDB transaction, calculates rental days, and calculates the total price from the car's `pricePerDay`.