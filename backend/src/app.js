const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

// Route files
const authRoutes = require('./routes/auth');
const businessRoutes = require('./routes/businesses');
const serviceRoutes = require('./routes/services');
const employeeRoutes = require('./routes/employees');
const customerRoutes = require('./routes/customers');
const appointmentRoutes = require('./routes/appointments');
const gamificationRoutes = require('./routes/gamification');

const app = express();

// Security & Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

// Routes
// Public routes (Monitoring, etc)
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin/businesses', businessRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/gamification', gamificationRoutes);

// Error Handler
app.use(errorHandler);

module.exports = app;
