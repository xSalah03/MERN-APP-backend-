const express = require('express');
const { connectToDb } = require('./config/connectToDb');
const { errorHandler, notFound } = require('./middlewares/error');
const cors = require('cors');
const rateLimeting = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
require('dotenv').config();
const xss = require('xss-clean');
// Connection to database
connectToDb();

// Init app
const app = express();


// Middlewares
app.use(express.json());

// Security headers (helmet)
app.use(helmet());

// Prevent Http Param Pollution 
app.use(hpp());

// Prevente XSS Attacks
app.use(xss());

// Rate limeting
app.use(rateLimeting({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10000
}));

// Cors policy
app.use(cors({
    origin: `${process.env.CLIENT_DOMAIN}`
}));

// Routes
app.use('/api/auth', require('./routes/authRoute'));
app.use('/api/users', require('./routes/userRoute'));
app.use('/api/posts', require('./routes/postRoute'));
app.use('/api/comments', require('./routes/commentRoute'));
app.use('/api/categories', require('./routes/categoryRoute'));
app.use('/api/password', require('./routes/passwordRoute'));

// Error handler middlewares
app.use(notFound);
app.use(errorHandler);

// Running the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`));