const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { once } = require('events');
const { verifySmtpConnection } = require('./services/emailService');

const app = express();

// Middleware
app.use(cors({ 
  origin: function(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedLocalOrigins = [
      /^http:\/\/localhost(?::\d{1,5})?$/,
      /^http:\/\/127\.0\.0\.1(?::\d{1,5})?$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d{1,5})?$/,
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}(?::\d{1,5})?$/
    ];

    const isAllowed = allowedLocalOrigins.some((pattern) => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Verify the email transporter before the HTTP server begins accepting traffic.
  await verifySmtpConnection();

  const server = app.listen(PORT);
  await once(server, 'listening');
  console.log(`Server is running on port ${PORT}`);
};

startServer().catch((error) => {
  console.error('Failed to start backend server:', error);
  process.exit(1);
});
