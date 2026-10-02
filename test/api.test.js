const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const path = require('node:path');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.setTimeout(120000);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret';
process.env.ADMIN_EMAIL = 'test-admin@example.com';
process.env.ADMIN_PASSWORD = 'test-only-admin-password';
process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/ridepad-test-not-used';

const app = require('../app');
const { signToken } = require('../Utils/jwt');
const User = require('../Models/UserModel');
const Car = require('../Models/CarModel');
const Booking = require('../Models/BookingModel');

let mongoServer;
let admin;
let customer;
let otherCustomer;
let activeCar;
const mongoBinaryDirectory = path.resolve(__dirname, '.mongodb-binaries');

const day = 24 * 60 * 60 * 1000;

function rentalDates(startOffset = 3, duration = 3) {
  const pickupDate = new Date(Date.now() + startOffset * day);
  pickupDate.setUTCHours(12, 0, 0, 0);
  const returnDate = new Date(pickupDate.getTime() + duration * day);
  return { pickupDate, returnDate };
}

function tokenFor(user) {
  return signToken({ userId: user.id, email: user.email, role: user.role });
}

async function createTestCar(overrides = {}) {
  return Car.create({
    make: 'Toyota',
    model: 'Corolla',
    category: 'economy',
    year: 2022,
    licenceNumber: `TEST-${new mongoose.Types.ObjectId()}`,
    transmission: 'automatic',
    fuelType: 'petrol',
    pricePerDay: 100,
    seats: 5,
    location: 'Lagos',
    description: 'Test vehicle',
    ...overrides,
  });
}

async function createTestBooking(status, dates = rentalDates()) {
  return Booking.create({
    user: customer._id,
    car: activeCar._id,
    pickupDate: dates.pickupDate,
    returnDate: dates.returnDate,
    rentalDays: Math.ceil((dates.returnDate - dates.pickupDate) / day),
    pricePerDay: activeCar.pricePerDay,
    totalPrice: Math.ceil((dates.returnDate - dates.pickupDate) / day) * activeCar.pricePerDay,
    status,
  });
}

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '8.0.4',
      downloadDir: mongoBinaryDirectory,
    },
  });
  await mongoose.connect(mongoServer.getUri());
}, 120000);

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Car.deleteMany({}), Booking.deleteMany({})]);

  const passwordHash = await bcrypt.hash('password123', 10);
  [admin, customer, otherCustomer] = await User.create([
    { name: 'Test Admin', email: 'admin@test.local', phone: '08000000001', passwordHash, role: 'admin' },
    { name: 'Test Customer', email: 'customer@test.local', phone: '08000000002', passwordHash, role: 'user' },
    { name: 'Other Customer', email: 'other@test.local', phone: '08000000003', passwordHash, role: 'user' },
  ]);
  activeCar = await createTestCar();
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 120000);

describe('authentication and authorization', () => {
  test('registers a customer with valid data', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'New Customer',
      email: 'new@example.com',
      password: 'password123',
      phone: '08000000004',
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe('new@example.com');
  });

  test('logs in with valid credentials and rejects invalid credentials', async () => {
    const valid = await request(app).post('/api/auth/login').send({
      email: customer.email,
      password: 'password123',
    });
    const invalid = await request(app).post('/api/auth/login').send({
      email: customer.email,
      password: 'wrong-password',
    });

    expect(valid.status).toBe(200);
    expect(valid.body.token).toEqual(expect.any(String));
    expect(invalid.status).toBe(401);
  });

  test.each([
    ['/api/auth/register', 'post'],
    ['/api/auth/login', 'post'],
  ])('%s with no body returns 400', async (path, method) => {
    const response = await request(app)[method](path);
    expect(response.status).toBe(400);
  });

  test('rejects protected endpoints without a JWT', async () => {
    const response = await request(app).get('/api/bookings/mine');
    expect(response.status).toBe(401);
  });

  test('restricts admin inventory to admins', async () => {
    const customerResponse = await request(app)
      .get('/api/cars/admin/all')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);
    const adminResponse = await request(app)
      .get('/api/cars/admin/all')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);

    expect(customerResponse.status).toBe(403);
    expect(adminResponse.status).toBe(200);
  });
});

describe('car management', () => {
  test('public catalogue exposes active cars but not inactive cars', async () => {
    const inactiveCar = await createTestCar({ isActive: false, model: 'Inactive' });

    const response = await request(app).get('/api/cars');
    const ids = response.body.map((car) => car._id);

    expect(response.status).toBe(200);
    expect(ids).toContain(activeCar.id);
    expect(ids).not.toContain(inactiveCar.id);
  });

  test('admin inventory includes inactive cars', async () => {
    const inactiveCar = await createTestCar({ isActive: false, model: 'Inactive' });

    const response = await request(app)
      .get('/api/cars/admin/all')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const ids = response.body.map((car) => car._id);

    expect(response.status).toBe(200);
    expect(ids).toEqual(expect.arrayContaining([activeCar.id, inactiveCar.id]));
  });

  test('rejects empty car creation and update bodies with 400', async () => {
    const createResponse = await request(app)
      .post('/api/cars')
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({});
    const updateResponse = await request(app)
      .patch(`/api/cars/${activeCar.id}`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({});

    expect(createResponse.status).toBe(400);
    expect(updateResponse.status).toBe(400);
  });
});

describe('booking creation and customer actions', () => {
  test('creates a booking with server-side rentalDays and totalPrice', async () => {
    const dates = rentalDates(3, 3);
    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ carId: activeCar.id, pickupDate: dates.pickupDate.toISOString(), returnDate: dates.returnDate.toISOString() });

    expect(response.status).toBe(201);
    expect(response.body.rentalDays).toBe(3);
    expect(response.body.totalPrice).toBe(300);
    expect(response.body.status).toBe('requested');
  });

  test('rejects overlapping blocking bookings', async () => {
    const dates = rentalDates(3, 3);
    await createTestBooking('requested', dates);

    const response = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ carId: activeCar.id, pickupDate: dates.pickupDate.toISOString(), returnDate: dates.returnDate.toISOString() });

    expect(response.status).toBe(409);
  });

  test('allows a customer to retrieve only their own booking', async () => {
    const booking = await createTestBooking('requested');
    const ownResponse = await request(app)
      .get(`/api/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);
    const otherResponse = await request(app)
      .get(`/api/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${tokenFor(otherCustomer)}`);

    expect(ownResponse.status).toBe(200);
    expect(ownResponse.body.car.make).toBe('Toyota');
    expect(otherResponse.status).toBe(404);
  });

  test('allows a customer to cancel an eligible booking', async () => {
    const booking = await createTestBooking('requested');
    const response = await request(app)
      .patch(`/api/bookings/${booking.id}/cancel`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('cancelled');
  });
});

describe('booking lifecycle and availability', () => {
  test('allows requested to confirmed to picked_up to returned', async () => {
    const booking = await createTestBooking('requested');
    const auth = { Authorization: `Bearer ${tokenFor(admin)}` };

    const confirmed = await request(app).patch(`/api/bookings/${booking.id}/status`).set(auth).send({ status: 'confirmed' });
    const pickedUp = await request(app).patch(`/api/bookings/${booking.id}/status`).set(auth).send({ status: 'picked_up' });
    const returned = await request(app).patch(`/api/bookings/${booking.id}/status`).set(auth).send({ status: 'returned' });

    expect(confirmed.status).toBe(200);
    expect(pickedUp.status).toBe(200);
    expect(returned.status).toBe(200);
    expect(returned.body.status).toBe('returned');
  });

  test('rejects requested to picked_up', async () => {
    const booking = await createTestBooking('requested');
    const response = await request(app)
      .patch(`/api/bookings/${booking.id}/status`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ status: 'picked_up' });

    expect(response.status).toBe(400);
  });

  test('allows rejection and releases the dates for a new booking', async () => {
    const dates = rentalDates(3, 3);
    const first = await createTestBooking('requested', dates);
    const rejected = await request(app)
      .patch(`/api/bookings/${first.id}/status`)
      .set('Authorization', `Bearer ${tokenFor(admin)}`)
      .send({ status: 'rejected' });
    const replacement = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokenFor(customer)}`)
      .send({ carId: activeCar.id, pickupDate: dates.pickupDate.toISOString(), returnDate: dates.returnDate.toISOString() });

    expect(rejected.status).toBe(200);
    expect(rejected.body.status).toBe('rejected');
    expect(replacement.status).toBe(201);
  });

  test.each(['requested', 'confirmed', 'picked_up', 'overdue'])('%s blocks date availability', async (status) => {
    const dates = rentalDates(3, 3);
    await createTestBooking(status, dates);
    const response = await request(app).get('/api/cars').query({
      availableFrom: dates.pickupDate.toISOString(),
      availableTo: dates.returnDate.toISOString(),
    });

    expect(response.status).toBe(200);
    expect(response.body.map((car) => car.id)).not.toContain(activeCar.id);
  });

  test.each(['rejected', 'cancelled', 'returned'])('%s does not block date availability', async (status) => {
    const dates = rentalDates(3, 3);
    await createTestBooking(status, dates);
    const response = await request(app).get('/api/cars').query({
      availableFrom: dates.pickupDate.toISOString(),
      availableTo: dates.returnDate.toISOString(),
    });

    expect(response.status).toBe(200);
    expect(response.body.map((car) => car.id)).toContain(activeCar.id);
  });
});

describe('admin rentals and error handling', () => {
  test('active rentals returns only picked_up and overdue bookings', async () => {
    await createTestBooking('picked_up');
    await createTestBooking('overdue');
    await createTestBooking('requested');
    await createTestBooking('returned');

    const adminResponse = await request(app)
      .get('/api/bookings/active')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    const customerResponse = await request(app)
      .get('/api/bookings/active')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.map((booking) => booking.status).sort()).toEqual(['overdue', 'picked_up']);
    expect(customerResponse.status).toBe(403);
  });

  test('returns 400 for malformed and 404 for nonexistent booking IDs', async () => {
    const malformed = await request(app)
      .get('/api/bookings/not-an-id')
      .set('Authorization', `Bearer ${tokenFor(customer)}`);
    const nonexistent = await request(app)
      .get(`/api/bookings/${new mongoose.Types.ObjectId()}`)
      .set('Authorization', `Bearer ${tokenFor(customer)}`);

    expect(malformed.status).toBe(400);
    expect(nonexistent.status).toBe(404);
  });
});
