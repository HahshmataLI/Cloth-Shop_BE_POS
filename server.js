const http = require('http');
const app = require('./app');
const logger = require('./config/logger');
const connectDB = require('./config/db');


const PORT = process.env.PORT || 5000;


// connect to DB
connectDB()
.then(() => {
const server = http.createServer(app);
server.listen(PORT, () => {
logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
})
.catch((err) => {
logger.error('Failed to connect DB', err);
process.exit(1);
});