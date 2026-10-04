# Ridepad Backend

Ridepad is a Node.js/Express REST API for a car-rental application. It provides customer authentication, vehicle catalogue and inventory management, booking creation, availability checks, and admin rental operations.

## Technology stack

- Node.js and Express 5
- MongoDB with Mongoose
- JWT authentication
- bcryptjs password hashing
- Multer for vehicle image uploads
- Jest and Supertest for API tests
- mongodb-memory-server for isolated tests

## Installation

\`\`\`bash
npm install
copy .env.example .env
\`\`\`

Set real local values in \`.env\` before starting the API. Never commit \`.env\` or production secrets.

## Environment variables

| Variable | Purpose |
| --- | --- |
| \`PORT\` | API port; defaults to \`5050\` |
| \`MONGO_URI\` | MongoDB connection string |
| \`NODE_ENV\` | Runtime environment |
| \`JWT_SECRET\` | Secret used to sign and verify JWTs |
| \`ADMIN_EMAIL\` | Email for the seeded admin account |
| \`ADMIN_PASSWORD\` | Password for the seeded admin account |

The server connects to MongoDB and seeds an admin account on startup if no admin exists.

## Running the API

\`\`\`bash
npm run dev
\`\`\`

or:

\`\`\`bash
npm start
\`\`\`

The default local API URL is \`http://localhost:5050\`.

Run the automated tests with:

\`\`\`bash
npm test
\`\`\`

Automated API tests use `mongodb-memory-server` with an isolated temporary MongoDB instance; they never use the normal development database or its records. The first test run may need to download a MongoDB binary. Environments that block that download can prevent the automated tests from starting, even when the application itself is otherwise available.

## Authentication and roles

Register or log in through the authentication endpoints. Successful responses contain a JWT:

\`\`\`http
Authorization: Bearer <token>
\`\`\`

There are two roles:

- \`user\`: customer actions and access to the customer's own bookings
- \`admin\`: inventory management and all booking/rental management actions

## API endpoints

### Health

\`\`\`http
GET /api/health
\`\`\`

### Authentication

\`\`\`http
POST /api/auth/register
POST /api/auth/login
\`\`\`

Registration requires \`name\`, \`email\`, \`password\`, and \`phone\`. Passwords are hashed before storage.

### Public vehicles

\`\`\`http
GET /api/cars
GET /api/cars/:id
\`\`\`

The public catalogue returns active vehicles only. \`GET /api/cars\` supports these optional filters:

\`\`\`text
make, model, category, location, transmission, fuelType,
seats, minPrice, maxPrice, search, availableFrom, availableTo
\`\`\`

When both availability dates are supplied, cars with overlapping blocking bookings are excluded.

### Admin vehicles

All admin vehicle endpoints require an admin JWT.

\`\`\`http
GET /api/cars/admin/all
POST /api/cars
PATCH /api/cars/:id
PATCH /api/cars/:id/active
\`\`\`

\`GET /api/cars/admin/all\` returns active and inactive inventory and accepts the same catalogue filters. Vehicle creation and updates use \`multipart/form-data\`; image files use the \`images\` field.

The activation endpoint accepts \`{ "isActive": true }\` or \`{ "isActive": false }\`.

### Customer bookings

Authenticated users can use:

\`\`\`http
POST /api/bookings
GET /api/bookings/mine
GET /api/bookings/:id
PATCH /api/bookings/:id/cancel
\`\`\`

Booking creation requires \`carId\`, \`pickupDate\`, and \`returnDate\`. The server verifies the active car, validates the date range, calculates \`rentalDays\`, reads the current vehicle price, and calculates \`totalPrice\`. Client-supplied pricing is not trusted.

Customers can retrieve and cancel only their own bookings. Admins can retrieve any booking.

### Admin bookings and rentals

All of these endpoints require an admin JWT:

\`\`\`http
GET /api/bookings
GET /api/bookings/overdue
GET /api/bookings/active
PATCH /api/bookings/:id/status
\`\`\`

The status endpoint accepts one of the valid lifecycle transitions described below. The active-rentals endpoint returns only bookings with status \`picked_up\` or \`overdue\`.

## Booking lifecycle

Available statuses:

\`\`\`text
requested
confirmed
rejected
picked_up
overdue
returned
cancelled
\`\`\`

Allowed transitions:

\`\`\`text
requested -> confirmed
requested -> rejected
requested -> cancelled

confirmed -> picked_up
confirmed -> cancelled

picked_up -> returned
picked_up -> overdue

overdue -> returned
\`\`\`

\`rejected\`, \`returned\`, and \`cancelled\` are terminal statuses. Overdue bookings are detected when relevant booking or rental lists are read.

## Availability rules

These statuses block overlapping availability:

\`\`\`text
requested
confirmed
picked_up
overdue
\`\`\`

These statuses release the vehicle for those dates:

\`\`\`text
rejected
cancelled
returned
\`\`\`

Date overlap uses the interval rule:

\`\`\`text
existing.pickupDate < requested.returnDate
existing.returnDate > requested.pickupDate
\`\`\`

## Image uploads

Images are currently stored on the local filesystem under \`uploads/\` and served through \`/uploads/<filename>\`. API responses contain relative image paths such as \`/uploads/123-image.jpg\`; a frontend hosted on another origin should prepend the backend origin.

The local upload directory is ignored by Git. Persistent object storage should be used for production deployments because local files may not survive redeployments or may not be shared across instances.

## Error responses

Errors use a JSON response with a \`message\` field:

\`\`\`json
{ "message": "Booking not found" }
\`\`\`

Common status codes include:

- \`400\` for invalid input, dates, IDs, transitions, or request bodies
- \`401\` for missing or invalid authentication tokens
- \`403\` for insufficient role or ownership permissions
- \`404\` for missing resources or routes
- \`409\` for duplicate values or overlapping bookings
- \`500\` for unexpected server errors

The API does not return stack traces or MongoDB internals to clients.

## Project structure

\`\`\`text
Config/          Environment and database configuration
Controller/      Request handlers
Models/          Mongoose schemas
Route/           Express route definitions
middleware/      Authentication, validation, uploads, and errors
services/        Booking lifecycle services
Utils/           JWT, dates, and application errors
test/            Isolated Jest/Supertest API tests
uploads/         Local vehicle image storage, ignored by Git
app.js           Express application
index.js         Database connection, admin seeding, and server startup
seedAdmin.js     Initial admin account creation
\`\`\`

## Development and deployment notes

- Do not commit \`.env\`, credentials, uploaded files, or \`node_modules\`.
- The API currently enables CORS for all origins through the default CORS middleware; configure an allowlist before a security-sensitive production deployment.
- Local filesystem image storage is suitable for development and demos, but persistent object storage is preferable for production.
- The health endpoint reports API availability; it is not a full database readiness check.
- Booking overlap checking is application-level and should be made atomic before operating at high concurrency.
