const mongoose = require('mongoose');
const logger = require('./logger');


const connectDB = async () => {
const uri = process.env.MONGO_URI;
if (!uri) throw new Error('MONGO_URI not defined in .env');
await mongoose.connect(uri, {
// useNewUrlParser etc. are default in modern mongoose
});
logger.info('MongoDB connected');
};


module.exports = connectDB;