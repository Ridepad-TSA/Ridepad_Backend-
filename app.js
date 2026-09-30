const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('node:path');

const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');
const authRoutes = require('./Route/auth.route');
const bookingRoutes = require('./Route/booking.route');
const carRoutes = require('./Route/car.route');
const healthRoutes = require('./Route/healthRoute');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', 
         express.static(path.resolve(process.cwd(), 'uploads'))
        );

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
