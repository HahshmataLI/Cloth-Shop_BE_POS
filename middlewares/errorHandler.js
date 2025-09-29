const logger = require('../config/logger');

module.exports = (err, req, res, next) => {
  logger.error(err.stack || err.message);

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle MongoDB duplicate key error
  if (err.code && err.code === 11000) {
  const field = Object.keys(err.keyPattern)[0];
  if (field === 'phone') {
    message = 'A supplier with this phone number already exists';
  } else {
    message = `Duplicate value entered for ${field}`;
  }
  statusCode = 400;
}


  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(val => val.message).join(', ');
    statusCode = 400;
  }

  // Handle invalid ObjectId (CastError)
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`;
    statusCode = 400;
  }

  const payload = {
    success: false,
    message,
  };

  // Show stack & details only in development
  if (process.env.NODE_ENV === 'development') {
    payload.stack = err.stack;
    payload.errors = err.errors || undefined;
  }

  res.status(statusCode).json(payload);
};
